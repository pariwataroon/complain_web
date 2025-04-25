import secrets
import uuid
import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models.verification_token import VerificationToken
from lib.logger import get_logger
from app.api.v1.controllers.notification_controller import notify_admin_new_user

logger = get_logger("email_controller", console_output=False)

VERIFY_PATH = os.environ.get("VERIFY_PATH", "http://localhost:8000/api/v1/auth")

def generate_verification_token(db: Session, user_id: uuid.UUID, expires_hours: int = 24):
    """
    สร้าง token สำหรับการยืนยันอีเมล
    
    Args:
        db: Database session
        user_id: ID ของผู้ใช้
        expires_hours: จำนวนชั่วโมงที่ token มีอายุ
        
    Returns:
        token: Token สำหรับการยืนยันอีเมล
    """
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=expires_hours)
    
    # สร้าง record ใหม่ใน verification_token table
    verification = VerificationToken(
        user_id=user_id,
        token=token,
        token_type="email_verification",
        expires_at=expires_at,
        is_used=False
    )
    
    db.add(verification)
    db.commit()
    db.refresh(verification)
    
    return token

def send_verification_email(user_email: str, user_name: str, verification_url: str):
    """
    ส่งอีเมลยืนยันไปยังผู้ใช้
    
    Args:
        user_email: อีเมลของผู้ใช้
        user_name: ชื่อของผู้ใช้
        verification_url: URL สำหรับการยืนยัน
    """
    try:
        # ใช้ service สำหรับการส่งอีเมล (ตัวอย่างใช้ dummy function)
        # ในสภาพแวดล้อมจริง คุณอาจใช้ SMTP หรือ service อื่นๆ
        from lib.email_service import send_email
        
        subject = "ยืนยันการลงทะเบียนสมาชิก"
        message = f"""
        เรียน {user_name},
        
        ขอบคุณสำหรับการลงทะเบียนเป็นสมาชิก กรุณาคลิกที่ลิงก์ด้านล่างเพื่อยืนยันอีเมลของคุณ:
        
        {verification_url}
        
        ลิงก์นี้จะมีอายุ 24 ชั่วโมง
        
        ขอแสดงความนับถือ,
        ทีมงานระบบ
        """
        
        send_email(user_email, subject, message)
        logger.info(f"Verification email sent to {user_email}")
        return True
    except Exception as e:
        logger.error(f"Error sending verification email: {str(e)}")
        return False

def verify_email(db: Session, token: str):
    """
    ยืนยันอีเมลโดยใช้ token
    
    Args:
        db: Database session
        token: Token ที่ใช้ในการยืนยัน
        
    Returns:
        user_id: ID ของผู้ใช้ถ้ายืนยันสำเร็จ, None ถ้าไม่สำเร็จ
    """
    # ค้นหา token ในฐานข้อมูล
    verification = db.query(VerificationToken).filter(
        VerificationToken.token == token,
        VerificationToken.token_type == "email_verification",
        VerificationToken.is_used == False,
        VerificationToken.expires_at > datetime.utcnow()
    ).first()
    
    if not verification:
        logger.warning(f"Invalid or expired verification token: {token}")
        return None
    
    # อัปเดตสถานะ token
    verification.is_used = True
    verification.used_at = datetime.utcnow()
    
    # อัปเดตสถานะผู้ใช้เป็น active
    from models.user import User
    user = db.query(User).filter(User.id == verification.user_id).first()
    
    if user:
        user.is_active = True
        # ส่งการแจ้งเตือนถึง admin เมื่อมีผู้ใช้ยืนยันอีเมลสำเร็จ
        notify_admin_new_user(db, user)
        
    db.commit()
    
    return verification.user_id

def resend_verification_email(db: Session, email: str):
    """
    ส่งอีเมลยืนยันใหม่สำหรับผู้ใช้ที่ยังไม่ได้ยืนยันอีเมล
    
    Args:
        db: Database session
        email: อีเมลของผู้ใช้ที่ต้องการส่งลิงก์ยืนยันใหม่
        verify_path: Base URL สำหรับการยืนยันอีเมล (เช่น http://localhost:8000/api/v1/auth)
        
    Returns:
        tuple: (success, message, error_code) 
            - success: True หากสำเร็จ, False หากมีข้อผิดพลาด
            - message: ข้อความแสดงสถานะหรือข้อผิดพลาด
            - error_code: รหัสข้อผิดพลาด (ถ้ามี)
    """
    try:
        # ตรวจสอบว่ามีผู้ใช้ตามอีเมลนี้หรือไม่
        from models.user import User
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # ไม่พบผู้ใช้ แต่ไม่ควรบอกผู้ใช้ตรงๆ (เพื่อความปลอดภัย)
            return True, "If your email is registered, a verification link has been sent.", None
            
        # ตรวจสอบว่าผู้ใช้ยืนยันอีเมลแล้วหรือยัง
        if user.is_active:
            return False, "Your email has already been verified. You can log in now.", "4000"
            
        # สร้าง token ใหม่
        token = generate_verification_token(db, user.id)
        
        # สร้าง verification URL
        verification_url = f"{VERIFY_PATH}/verify-email?token={token}"
        
        # ส่งอีเมลยืนยัน
        user_full_name = f"{user.first_name} {user.last_name}"
        email_sent = send_verification_email(user.email, user_full_name, verification_url)
        
        if not email_sent:
            logger.error(f"Failed to send verification email to {email}")
            return False, "Failed to send verification email. Please try again later.", "5000"
        
        return True, "Verification email has been sent. Please check your inbox.", None
    except Exception as e:
        logger.error(f"Error resending verification email: {str(e)}")
        # เราไม่ต้องการให้ผู้ไม่หวังดีทราบว่าเกิดข้อผิดพลาด
        return True, "If your email is registered, a verification link has been sent.", None