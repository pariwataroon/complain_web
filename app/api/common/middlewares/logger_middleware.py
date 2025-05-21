import time
import uuid
import json
import jwt
from fastapi import Request, FastAPI
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.datastructures import Headers
from sqlalchemy.orm import Session
from lib.logger import get_logger
from models.api_log import ApiLog
from config.database import SessionLocal
from config.dotenv import JWT_SECRET_KEY

logger = get_logger("api", console_output=False)


def get_client_ip(request: Request) -> str:
    """Extract the real client IP, considering common proxy headers"""
    headers = request.headers

    # ลำดับความสำคัญของ headers ที่อาจมี client IP จริง
    ip_headers = [
        'X-Forwarded-For',
        'X-Real-IP',
        'CF-Connecting-IP',  # Cloudflare
        'True-Client-IP'
    ]

    for header in ip_headers:
        if header.lower() in headers:
            # X-Forwarded-For อาจมีหลาย IP คั่นด้วย comma
            ips = headers[header].split(',')
            if ips:
                return ips[0].strip()

    # หากไม่มี headers ที่กำหนด ใช้ client.host
    return request.client.host if request.client else 'Unknown'


async def get_body_data(request: Request) -> str:
    """Safely extract body content, with size limit and sensitive data filtering"""
    # ตรวจสอบ content-type ก่อน
    content_type = request.headers.get("content-type", "").lower()
    
    # กรณีเป็น multipart/form-data (อัพโหลดไฟล์)
    if content_type.startswith("multipart/form-data"):
        try:
            # ดึงข้อมูลไฟล์เฉพาะส่วน metadata เท่านั้น
            body = await request.body()
            
            # ดึงชื่อไฟล์จาก header ถ้าเป็นไปได้
            filename = "unknown"
            if "content-disposition" in request.headers:
                disposition = request.headers["content-disposition"]
                if "filename=" in disposition:
                    filename = disposition.split("filename=")[1].strip('"\'')
            
            # แสดงเฉพาะขนาดไฟล์และ content-type
            file_size = len(body)
            content_length = request.headers.get("content-length", "unknown")
            
            return f"[MULTIPART_FORM_DATA] File upload: {filename}, Size: {content_length} bytes (Binary data omitted for logging)"
        except Exception as e:
            return f"[MULTIPART_FORM_DATA] Unable to process file upload data: {str(e)}"
    
    # กรณีอื่นๆ ที่ไม่ใช่การอัพโหลดไฟล์
    body = await request.body()
    
    # ถ้าไม่มี body ให้ระบุว่าไม่มี
    if not body:
        return "No Body"

    # ถ้าเป็น JSON ให้แปลงเป็น dict แล้วแปลงกลับเป็น JSON สวยงาม
    if content_type.startswith("application/json"):
        try:
            body_dict = json.loads(body)
            
            # กรองข้อมูลที่ sensitive
            sensitive_fields = ['password', 'pin', 'secret', 'token', 'key', 'รหัสผ่าน']
            
            # ฟังก์ชันช่วยกรองข้อมูล sensitive แบบ recursive
            def filter_sensitive_data(data):
                if isinstance(data, dict):
                    for key in list(data.keys()):
                        # กรองตาม key
                        if any(sensitive in key.lower() for sensitive in sensitive_fields):
                            data[key] = "[FILTERED]"
                        elif isinstance(data[key], (dict, list)):
                            data[key] = filter_sensitive_data(data[key])
                        # ตัดข้อความที่ยาวเกินไป
                        elif isinstance(data[key], str) and len(data[key]) > 500:
                            data[key] = data[key][:500] + "... [truncated]"
                elif isinstance(data, list):
                    for i, item in enumerate(data):
                        data[i] = filter_sensitive_data(item)
                return data
                
            # กรองข้อมูลที่ sensitive
            body_dict = filter_sensitive_data(body_dict)
            
            # แปลงกลับเป็น JSON string โดยใช้ ensure_ascii=False เพื่อรองรับภาษาไทย
            return json.dumps(body_dict, ensure_ascii=False)
        except Exception as e:
            # ถ้าแปลง JSON ไม่ได้ ให้แสดงข้อความ error
            return f"Error parsing JSON body: {str(e)}"

    # ถ้าไม่ใช่ JSON หรือแปลงไม่ได้ ให้แสดงเป็น bytes และจำกัดความยาว
    if len(body) > 1000:
        return f"{body[:1000]}... [truncated, total {len(body)} bytes]"
    return str(body)


def filter_important_headers(headers: Headers) -> dict:
    """เก็บเฉพาะ headers ที่สำคัญ"""
    # รายการ headers ที่ต้องการเก็บ
    important_headers = [
        'host',
        'user-agent',
        'authorization',  # ควรกรองค่า
        'content-type',
        'content-length',
        'origin',
        'referer',
        'x-forwarded-for',
        'x-real-ip',
        'accept',
        'accept-language',
        'x-request-id',
        'x-api-key',     # ควรกรองค่า
        'x-correlation-id',
        'x-auth-token'   # ควรกรองค่า
    ]

    # สร้าง dict ใหม่เก็บเฉพาะ headers ที่สำคัญ
    filtered = {}
    for header in important_headers:
        if header.lower() in headers:
            # กรองข้อมูลที่ละเอียดอ่อน
            if header.lower() in ['authorization', 'x-api-key', 'x-auth-token']:
                value = "[FILTERED]"
            else:
                value = headers[header]
            filtered[header.lower()] = value

    return filtered


def extract_user_id_from_token(authorization_header: str) -> str:
    """Extract user ID from JWT token"""
    if not authorization_header or not authorization_header.startswith("Bearer "):
        return None
    
    try:
        # ตัด "Bearer " ออกแล้วดึงเฉพาะ token
        token = authorization_header.replace("Bearer ", "", 1)
        
        # ถอดรหัส JWT token
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
        
        # ดึง user_id จาก payload (ตามโครงสร้าง JWT ที่ใช้)
        return payload.get("sub")  # sub คือ subject ใน JWT ที่เก็บ user_id
        
    except Exception as e:
        logger.error(f"Error extracting user ID from token: {str(e)}")
        return None


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        start_time = time.time()
        client_ip = get_client_ip(request)
        user_id = None

        # เตรียมข้อมูล request สำหรับ log
        try:
            # ดึง body ข้อมูลก่อน call_next เพราะ body จะถูกอ่านแล้ว
            if request.method in ['POST', 'PUT', 'PATCH']:
                body_data = await get_body_data(request)
                # ต้อง reset body position หลังจากที่อ่าน
                await request.body()
            else:
                body_data = "No Body"

            # เก็บเฉพาะ headers ที่สำคัญ
            headers = filter_important_headers(request.headers)
            
            # ดึง user_id จาก token (ถ้ามี)
            auth_header = request.headers.get("authorization")
            if auth_header:
                user_id = extract_user_id_from_token(auth_header)
            
            path = request.url.path
            query_params = str(
                request.query_params) if request.query_params else "No Query Params"
            method = request.method

        except Exception as e:
            # ถ้ามีปัญหาในการดึงข้อมูล request ให้บันทึกว่าไม่สามารถดึงได้
            body_data = f"Error reading body: {str(e)}"
            headers = {"error": "Error reading headers"}
            path = str(request.url)
            query_params = "Error reading query params"
            method = str(request.method)

        try:
            # เรียก middleware ถัดไปและรอ response
            response = await call_next(request)

            # คำนวณเวลาที่ใช้
            process_time = time.time() - start_time

            # สร้าง log entry
            log_entry = {
                "request_id": request_id,
                "status": response.status_code,
                "method": method,
                "path": path,
                "client_ip": client_ip,
                "process_time_ms": round(process_time * 1000, 2),
                "user_id": user_id
            }

            # เพิ่ม headers, body และ query_params เมื่อจำเป็น
            if headers:
                log_entry["headers"] = headers

            # เพิ่ม body เมื่อไม่ใช่ GET request หรือเป็น No Body
            if method != "GET" and body_data != "No Body":
                log_entry["body"] = body_data

            # เพิ่ม query_params เมื่อมี query parameters
            if query_params != "No Query Params":
                log_entry["query_params"] = query_params

            # บันทึก log ลงไฟล์
            if 400 <= response.status_code < 500:
                logger.warning(f"API Request: {json.dumps(log_entry, ensure_ascii=False)}")
            elif response.status_code >= 500:
                logger.error(f"API Request: {json.dumps(log_entry, ensure_ascii=False)}")
            else:
                logger.info(f"API Request: {json.dumps(log_entry, ensure_ascii=False)}")

            # บันทึก log ลงฐานข้อมูล (แยกเป็น thread หรือ task)
            await self.save_log_to_database(
                request_id=request_id,
                method=method,
                path=path,
                query_params=query_params if query_params != "No Query Params" else None,
                client_ip=client_ip,
                status_code=response.status_code,
                process_time_ms=round(process_time * 1000, 2),
                request_body=body_data if body_data != "No Body" else None,
                request_headers=json.dumps(headers) if headers else None,
                user_id=user_id
            )

            return response

        except Exception as e:
            # ถ้ามี exception ที่ไม่ได้จัดการ
            process_time = time.time() - start_time

            log_entry = {
                "request_id": request_id,
                "status": 500,
                "method": method,
                "path": path,
                "client_ip": client_ip,
                "process_time_ms": round(process_time * 1000, 2),
                "headers": headers,
                "error": str(e),
                "user_id": user_id
            }

            # เพิ่ม body เมื่อไม่ใช่ GET request หรือเป็น No Body
            if method != "GET" and body_data != "No Body":
                log_entry["body"] = body_data

            # เพิ่ม query_params เมื่อมี query parameters
            if query_params != "No Query Params":
                log_entry["query_params"] = query_params

            logger.error(
                f"API Request Failed: {json.dumps(log_entry, ensure_ascii=False)}", exc_info=True)
            
            # พยายามบันทึก log ลงฐานข้อมูลแม้จะมี error
            try:
                await self.save_log_to_database(
                    request_id=request_id,
                    method=method,
                    path=path,
                    query_params=query_params if query_params != "No Query Params" else None,
                    client_ip=client_ip,
                    status_code=500,
                    process_time_ms=round(process_time * 1000, 2),
                    request_body=body_data if body_data != "No Body" else None,
                    request_headers=json.dumps(headers) if headers else None,
                    user_id=user_id
                )
            except Exception as db_error:
                logger.error(f"Failed to save error log to database: {str(db_error)}")
                
            raise

    async def save_log_to_database(self, **log_data):
        """Save log entry to database in a non-blocking way"""
        try:
            # ใช้ context manager เพื่อจัดการ session
            with SessionLocal() as db:
                # สร้าง ApiLog record ใหม่
                api_log = ApiLog(
                    request_id=log_data["request_id"],
                    method=log_data["method"],
                    path=log_data["path"],
                    query_params=log_data["query_params"],
                    client_ip=log_data["client_ip"],
                    status_code=log_data["status_code"],
                    process_time_ms=log_data["process_time_ms"],
                    request_body=log_data["request_body"] if log_data["request_body"] else None,
                    request_headers=log_data["request_headers"],
                    user_id=log_data["user_id"] if log_data["user_id"] else None
                )
                
                # บันทึก record ลงฐานข้อมูล
                db.add(api_log)
                db.commit()
                
        except Exception as e:
            # บันทึก error แต่ไม่ throw exception เพื่อไม่ให้กระทบ request หลัก
            logger.error(f"Failed to save API log to database: {str(e)}")


def setup_logging_middleware(app: FastAPI):
    app.add_middleware(LoggingMiddleware)
