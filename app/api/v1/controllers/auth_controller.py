from datetime import datetime, timedelta

import bcrypt
import jwt
from sqlalchemy.orm import Session

import app.api.v1.controllers.user_controller as user_controller
import config.dotenv as env
from models.token import Token


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())


def authenticate_user(db: Session, citizen_id: str, password: str):
    """ตรวจสอบการเข้าสู่ระบบด้วย citizen_id และ password"""
    user = user_controller.get_user_by_pid(db, citizen_id)
    
    # กรณีไม่พบผู้ใช้
    if not user:
        return None, "invalid_credentials"
    
    # กรณีรหัสผ่านไม่ถูกต้อง
    if not verify_password(password, user.hashed_password):
        return None, "invalid_credentials"
    
    # กรณีผู้ใช้ยังไม่ได้ยืนยันอีเมล
    if not user.is_active:
        return None, "email_not_verified"
    
    # กรณีเข้าสู่ระบบสำเร็จ
    return user, None


def create_access_token(data: dict, expires_delta: timedelta = timedelta(minutes=90)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, env.JWT_SECRET_KEY, algorithm=env.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, env.JWT_SECRET_KEY, algorithm=env.ALGORITHM)
    return encoded_jwt


def refresh_access_token_mapping(db: Session, user_id: str,  access_token: str, refresh_token: str):
    db_token = Token(user_id=user_id, access_token=access_token, refresh_token=refresh_token, revoked=False)
    db.merge(db_token)
    db.commit()
    return
