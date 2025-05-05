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
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
RESET_PASSWORD_URL = f"{FRONTEND_URL}/reset-password"

def generate_verification_token(db: Session, user_id: uuid.UUID, expires_minutes: int = 15):
    """
    สร้าง token สำหรับการยืนยันอีเมล
    
    Args:
        db: Database session
        user_id: ID ของผู้ใช้
        expires_minutes: จำนวนนาทีที่ token มีอายุ (เริ่มต้น 15 นาที)
        
    Returns:
        token: Token สำหรับการยืนยันอีเมล
    """
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(minutes=expires_minutes)
    
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
        from lib.email_service import send_email
        
        subject = "ยืนยันการลงทะเบียนสมาชิก"
        message = f"""
        เรียน {user_name},
        
        ขอบคุณสำหรับการลงทะเบียนเป็นสมาชิก กรุณาคลิกที่ลิงก์ด้านล่างเพื่อยืนยันอีเมลของคุณ:
        
        {verification_url}
        
        ลิงก์นี้จะมีอายุ 15 นาทีเท่านั้น กรุณาดำเนินการโดยเร็ว
        
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
    
def generate_password_reset_token(db: Session, user_id: uuid.UUID, expires_minutes: int = 15):
    """
    สร้าง token สำหรับการรีเซ็ตรหัสผ่าน
    
    Args:
        db: Database session
        user_id: ID ของผู้ใช้
        expires_minutes: จำนวนนาทีที่ token มีอายุ (เริ่มต้น 15 นาที)
        
    Returns:
        token: Token สำหรับการรีเซ็ตรหัสผ่าน
    """
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(minutes=expires_minutes)
    
    # สร้าง record ใหม่ใน verification_token table
    verification = VerificationToken(
        user_id=user_id,
        token=token,
        token_type="password_reset",
        expires_at=expires_at,
        is_used=False
    )
    
    db.add(verification)
    db.commit()
    db.refresh(verification)
    
    return token

def send_password_reset_email(db: Session, email: str):
    """
    ส่งอีเมลรีเซ็ตรหัสผ่านให้กับผู้ใช้
    
    Args:
        db: Database session
        email: อีเมลของผู้ใช้ที่ต้องการรีเซ็ตรหัสผ่าน
        
    Returns:
        tuple: (success, message)
    """
    try:
        # ตรวจสอบว่ามีผู้ใช้ตามอีเมลนี้หรือไม่
        from models.user import User
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # ไม่พบผู้ใช้ แต่เราจะไม่เปิดเผยข้อมูลนี้ (เพื่อความปลอดภัย)
            logger.info(f"Password reset requested for non-existent email: {email}")
            return True, "หากอีเมลนี้ลงทะเบียนในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลดังกล่าวแล้ว"
        
        # สร้าง token สำหรับการรีเซ็ตรหัสผ่าน (อายุ 15 นาที)
        token = generate_password_reset_token(db, user.id)
        
        # สร้าง URL สำหรับการรีเซ็ตรหัสผ่าน
        reset_url = f"{RESET_PASSWORD_URL}?token={token}"
        
        # ส่งอีเมล
        from lib.email_service import send_email
        
        subject = "รีเซ็ตรหัสผ่าน"
        message = f"""
        เรียน {user.first_name} {user.last_name},
        
        เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ กรุณาคลิกที่ลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่:
        
        {reset_url}
        
        ลิงก์นี้จะมีอายุ 15 นาทีเท่านั้นและใช้งานได้เพียงครั้งเดียว กรุณาดำเนินการโดยเร็ว
        
        หากคุณไม่ได้เป็นผู้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยอีเมลนี้
        
        ขอแสดงความนับถือ,
        ทีมงานระบบ
        """
        
        send_email(user.email, subject, message)
        logger.info(f"Password reset email sent to {user.email}")
        
        return True, "หากอีเมลนี้ลงทะเบียนในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลดังกล่าวแล้ว"
    except Exception as e:
        logger.error(f"Error sending password reset email: {str(e)}")
        return False, "เกิดข้อผิดพลาดในการส่งอีเมล กรุณาลองอีกครั้งในภายหลัง"

def verify_reset_token(db: Session, token: str):
    """
    ตรวจสอบความถูกต้องของ token รีเซ็ตรหัสผ่าน
    
    Args:
        db: Database session
        token: Token ที่ต้องการตรวจสอบ
        
    Returns:
        user_id: ID ของผู้ใช้ถ้า token ถูกต้อง, None ถ้าไม่ถูกต้อง
    """
    verification = db.query(VerificationToken).filter(
        VerificationToken.token == token,
        VerificationToken.token_type == "password_reset",
        VerificationToken.is_used == False,
        VerificationToken.expires_at > datetime.utcnow()
    ).first()
    
    if not verification:
        logger.warning(f"Invalid or expired password reset token: {token}")
        return None
    
    return verification.user_id

def reset_password_with_token(db: Session, token: str, new_password: str):
    """
    รีเซ็ตรหัสผ่านโดยใช้ token
    
    Args:
        db: Database session
        token: Token สำหรับการรีเซ็ตรหัสผ่าน
        new_password: รหัสผ่านใหม่
        
    Returns:
        tuple: (success, message)
    """
    try:
        # ตรวจสอบว่า token ถูกต้องและยังไม่หมดอายุ
        user_id = verify_reset_token(db, token)
        
        if not user_id:
            return False, "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว (มีอายุ 15 นาที) กรุณาขอลิงก์ใหม่"
        
        # ดึงข้อมูลผู้ใช้
        from models.user import User
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            return False, "ไม่พบบัญชีผู้ใช้"
        
        # อัปเดตรหัสผ่านใหม่
        from app.api.v1.controllers.user_controller import get_password_hash
        user.hashed_password = get_password_hash(new_password)  # แก้จาก password เป็น hashed_password
        
        # อัปเดตสถานะ token เป็นใช้งานแล้ว
        verification = db.query(VerificationToken).filter(
            VerificationToken.token == token,
            VerificationToken.token_type == "password_reset"
        ).first()
        
        verification.is_used = True
        verification.used_at = datetime.utcnow()
        
        # บันทึกการเปลี่ยนแปลง
        db.commit()
        
        return True, "รีเซ็ตรหัสผ่านสำเร็จ คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที"
    except Exception as e:
        db.rollback()
        logger.error(f"Error resetting password: {str(e)}")
        return False, "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน กรุณาลองอีกครั้งในภายหลัง"