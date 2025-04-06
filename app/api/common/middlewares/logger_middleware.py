import time
import uuid
import json
from fastapi import Request, FastAPI
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.datastructures import Headers
from lib.logger import get_logger

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
    """Safely extract body content, with size limit"""
    body = await request.body()
    
    # ถ้าไม่มี body ให้ระบุว่าไม่มี
    if not body:
        return "No Body"
    
    # ถ้าเป็น JSON ให้แปลงเป็น dict แล้วแปลงกลับเป็น JSON สวยงาม
    if request.headers.get("content-type", "").startswith("application/json"):
        try:
            body_dict = json.loads(body)
            # ตัดเนื้อหาที่ยาวเกินไป
            for key, value in body_dict.items():
                if isinstance(value, str) and len(value) > 500:
                    body_dict[key] = value[:500] + "... [truncated]"
            return json.dumps(body_dict, ensure_ascii=False)
        except:
            pass
    
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

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        start_time = time.time()
        client_ip = get_client_ip(request)
        
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
            path = request.url.path
            query_params = str(request.query_params) if request.query_params else "No Query Params"
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
            
            # บันทึก log เมื่อได้รับ response แล้ว (เก็บแค่ครั้งเดียว)
            log_entry = {
                "request_id": request_id,
                "status": response.status_code,
                "method": method,
                "path": path,
                "client_ip": client_ip,
                "process_time_ms": round(process_time * 1000, 2)
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
            
            # เลือกระดับ log ตาม status code
            if 400 <= response.status_code < 500:
                logger.warning(f"API Request: {json.dumps(log_entry, ensure_ascii=False)}")
            elif response.status_code >= 500:
                logger.error(f"API Request: {json.dumps(log_entry, ensure_ascii=False)}")
            else:
                logger.info(f"API Request: {json.dumps(log_entry, ensure_ascii=False)}")
            
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
                "error": str(e)
            }
            
            # เพิ่ม body เมื่อไม่ใช่ GET request หรือเป็น No Body
            if method != "GET" and body_data != "No Body":
                log_entry["body"] = body_data
            
            # เพิ่ม query_params เมื่อมี query parameters
            if query_params != "No Query Params":
                log_entry["query_params"] = query_params
            
            logger.error(f"API Request Failed: {json.dumps(log_entry, ensure_ascii=False)}", exc_info=True)
            raise

def setup_logging_middleware(app: FastAPI):
    app.add_middleware(LoggingMiddleware)