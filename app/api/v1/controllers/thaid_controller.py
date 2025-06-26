from sqlalchemy.orm import Session
import requests
import base64
from requests.exceptions import RequestException

import app.api.v1.controllers.user_controller as user_controller
import app.api.v1.controllers.auth_controller as auth_controller
# เพิ่มการนำเข้า notification_controller
import app.api.v1.controllers.notification_controller as notification_controller
from app.api.v1.schemas.thaid import ThaiIDTokenResponse
from app.api.v1.schemas.user import UserCreate
from config.dotenv import THAID_CLIENT_ID, THAID_CLIENT_SECRET, THAID_REQUEST_URI, THAID_REDIRECT_URI

def validate_thaid_token(auth_code: str, redirect_uri: str):
    """
    ตรวจสอบ Thai Digital ID token โดยส่งคำขอไปยัง DOPA API
    
    Args:
        auth_code: รหัสจาก Thai Digital ID
        redirect_uri: URI ที่ใช้สำหรับการ redirect
        
    Returns:
        dict: ข้อมูลผู้ใช้จาก Thai Digital ID หรือ None ถ้าไม่สำเร็จ
    """
    try:
        # ข้อมูลการรับรองตัวตนของแอปพลิเคชัน
        client_id = THAID_CLIENT_ID
        client_secret = THAID_CLIENT_SECRET

        # สร้าง Basic Authentication header
        credentials = f"{client_id}:{client_secret}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        auth_header = f"Basic {encoded_credentials}"

        # ข้อมูลที่ส่งในคำขอ
        payload = {
            'grant_type': 'authorization_code',
            'code': auth_code,
            'redirect_uri': redirect_uri
        }
        
        # ส่งคำขอไปยัง DOPA API
        response = requests.post(
            THAID_REQUEST_URI,
            headers={
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': auth_header
            },
            data=payload
        )
        
        # ตรวจสอบผลลัพธ์
        if response.status_code == 200:
            token_data = response.json()
            print(f"Token validation successful: {token_data}")
            return token_data
        else:
            print(f"Token validation failed: {response.status_code} - {response.text}")
            return None
            
    except RequestException as e:
        print(f"Error validating Thai Digital ID token: {str(e)}")
        return None
    except Exception as e:
        print(f"Unexpected error during token validation: {str(e)}")
        return None

def get_or_create_user_from_thaid(db: Session, thaid_data: ThaiIDTokenResponse):
    """
    ค้นหาผู้ใช้จาก citizen_id หรือสร้างผู้ใช้ใหม่ถ้าไม่พบ
    """
    # ค้นหาผู้ใช้จาก citizen_id
    existing_user = user_controller.get_user_by_pid(db, thaid_data.pid)
    
    # กำหนดค่า is_new_user เริ่มต้นเป็น False
    is_new_user = False
    
    if not existing_user:
        # ถ้าไม่พบผู้ใช้ สร้างผู้ใช้ใหม่
        is_new_user = True
        # แปลงข้อมูลจาก Thai ID เป็น UserCreate model
        import secrets
        random_password = secrets.token_urlsafe(12)
        title_id = get_title_id_from_name(db, thaid_data.titleTh)
        new_user = UserCreate(
            citizen_id=thaid_data.pid,
            email=f"{thaid_data.pid}@example.com",
            first_name=thaid_data.given_name,
            last_name=thaid_data.family_name,
            password=random_password,
            title_id=title_id,
            address=thaid_data.address.formatted if thaid_data.address else "",
            address_other=thaid_data.address_other.formatted if hasattr(thaid_data, 'address_other') and thaid_data.address_other else "",
            prefix_other=None if title_id != 1 else thaid_data.titleTh,
        )
        # สร้างผู้ใช้ใหม่ (is_active จะเป็น False ถ้าเป็น people)
        existing_user = user_controller.create_user(db, new_user)
        # อัปเดต is_active=True หลังสร้าง (เฉพาะ ThaiD)
        try:
            # รองรับทั้ง dict และ object
            user_id = existing_user['id'] if isinstance(existing_user, dict) else existing_user.id
            user_obj = user_controller.get_user(db, user_id)
            if user_obj and not user_obj.is_active:
                user_obj.is_active = True
                db.commit()
        except Exception as e:
            print(f"Error updating is_active for ThaiD user: {str(e)}")
        # เพิ่มการส่ง notification เมื่อมีการลงทะเบียนใหม่ผ่าน ThaiID
        try:
            notification_controller.create_notification(
                db=db,
                title="มีการลงทะเบียนผู้ใช้ใหม่ผ่าน ThaiID",
                message=f"ผู้ใช้ {thaid_data.given_name} {thaid_data.family_name} ได้ลงทะเบียนผ่าน ThaiID",
                role_seeking_group="admin",
                redirect_url=f"/users/{user_id}"
            )
        except Exception as e:
            print(f"Error sending notification: {str(e)}")
    
    # ดึงข้อมูล roles ของผู้ใช้
    roles = []
    if hasattr(existing_user, 'roles'):
        roles = [role.get('role_name') for role in existing_user['roles']] if isinstance(existing_user, dict) else []
    
    # สร้าง token payload ที่มีข้อมูลเพิ่มเติม
    token_data = {
        "sub": str(existing_user['id'] if isinstance(existing_user, dict) else existing_user.id),
        "first_name": existing_user['first_name'] if isinstance(existing_user, dict) else existing_user.first_name,
        "last_name": existing_user['last_name'] if isinstance(existing_user, dict) else existing_user.last_name,
        "roles": roles
    }
    
    # สร้าง JWT token สำหรับผู้ใช้
    access_token = auth_controller.create_access_token(data=token_data)
    refresh_token = auth_controller.create_refresh_token(data=token_data)
    
    # บันทึก token ลงฐานข้อมูล
    auth_controller.refresh_access_token_mapping(
        db, 
        existing_user['id'] if isinstance(existing_user, dict) else existing_user.id, 
        access_token, 
        refresh_token
    )
    
    return {
        "user": existing_user,
        "is_new_user": is_new_user,
        "access_token": access_token,
        "refresh_token": refresh_token
    }

def get_title_id_from_name(db: Session, title_name: str):
    """
    แปลงชื่อคำนำหน้าเป็น title_id
    """
    # ดึงข้อมูลคำนำหน้าทั้งหมด
    titles = user_controller.get_titles(db)
    
    # ค้นหา title_id จากชื่อคำนำหน้า
    for title in titles:
        if title.title_name == title_name:
            return title.title_id
    
    # ถ้าไม่พบ ใช้ "อื่นๆ" (title_id = 1)
    return 1

# เพิ่มฟังก์ชันใหม่เพื่อรองรับการส่ง auth_code
def process_thaid_auth_code(db: Session, auth_code: str):
    """
    ดำเนินการตรวจสอบ auth_code กับ DOPA API และสร้างหรือค้นหาผู้ใช้
    """
    # ตรวจสอบ auth_code โดยส่งคำขอไปยัง DOPA API
    thaid_data = validate_thaid_token(auth_code, THAID_REDIRECT_URI)
    
    if not thaid_data:
        return None
    
    # แปลงข้อมูลให้เป็นรูปแบบที่เข้ากับ ThaiIDTokenResponse
    from app.api.v1.schemas.thaid import ThaiIDTokenResponse, ThaiIDAddress
    
    # สร้าง address objects อย่างปลอดภัย
    address = None
    if "address" in thaid_data and isinstance(thaid_data["address"], dict) and "formatted" in thaid_data["address"]:
        address = ThaiIDAddress(formatted=thaid_data["address"]["formatted"])
    else:
        address = ThaiIDAddress(formatted="")
        
    address_other = None
    if "address_other" in thaid_data and isinstance(thaid_data["address_other"], dict) and "formatted" in thaid_data["address_other"]:
        address_other = ThaiIDAddress(formatted=thaid_data["address_other"]["formatted"])
    
    # สร้าง ThaiIDTokenResponse จากข้อมูลที่ได้รับ
    token_response = ThaiIDTokenResponse(
        expires_in=thaid_data.get("expires_in"),
        access_token=thaid_data.get("access_token"),
        refresh_token=thaid_data.get("refresh_token"),
        token_type=thaid_data.get("token_type"),
        scope=thaid_data.get("scope"),
        pid=thaid_data.get("pid", ""),
        address=address,
        address_other=address_other,
        given_name=thaid_data.get("given_name", ""),
        family_name=thaid_data.get("family_name", ""),
        gender=thaid_data.get("gender", ""),
        titleTh=thaid_data.get("titleTh", "")
    )
    
    # ค้นหาหรือสร้างผู้ใช้ใหม่
    return get_or_create_user_from_thaid(db, token_response)