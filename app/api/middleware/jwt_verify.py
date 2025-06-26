import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from uuid import UUID
from functools import lru_cache
import time

from config.dotenv import ALGORITHM, JWT_SECRET_KEY
from config.database import get_db
from models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ✅ แก้ไข cache structure
_user_cache = {}

def _get_cache_time():
    """Get current time in 5-minute intervals for caching"""
    return int(time.time() // 300)  # 5 minutes = 300 seconds

def _is_user_cached(user_id: str) -> bool:
    """Check if user is cached and valid"""
    cache_time = _get_cache_time()
    cache_key = f"{user_id}_{cache_time}"
    return cache_key in _user_cache

def _cache_user(user_id: str):
    """Cache user validation"""
    cache_time = _get_cache_time()
    cache_key = f"{user_id}_{cache_time}"
    _user_cache[cache_key] = True
    
    # ✅ Clean old cache entries
    current_keys = [k for k in _user_cache.keys() if k.startswith(f"{user_id}_")]
    for key in current_keys:
        if key != cache_key:
            _user_cache.pop(key, None)

def verify_token(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """✅ แก้ไข JWT verification logic"""
    try:
        if token.startswith("Bearer "):
            token = token[7:]
        
        algorithm_to_use = ALGORITHM if ALGORITHM else "RS256"
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[algorithm_to_use])
        
        username = payload.get("sub")
        token_type = payload.get("type")
        
        if token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # ✅ ตรวจสอบ UUID format
        try:
            user_id = UUID(username)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user ID format",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # ✅ ตรวจสอบ cache ก่อน
        if _is_user_cached(str(user_id)):
            return str(user_id)
        
        # ✅ Query database เฉพาะเมื่อไม่มี cache
        user = db.query(User).filter(
            User.id == user_id, 
            User.is_active == True
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # ✅ Cache ผลลัพธ์
        _cache_user(str(user_id))
        
        return str(user_id)
            
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        # ✅ เพิ่ม rollback สำหรับ unexpected errors
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during authentication"
        )
    
def verify_token_simple(token: str) -> str:
    """
    ตรวจสอบ JWT token แบบง่าย (ไม่ raise exception)
    
    Args:
        token: JWT token string
        
    Returns:
        user_id ถ้า valid, None ถ้า invalid
    """
    try:
        # ✅ ใช้ import เดียวกันกับส่วนอื่น
        import jwt
        from config.dotenv import JWT_SECRET_KEY, ALGORITHM
        
        # ✅ ใช้ config เดียวกัน
        algorithm_to_use = ALGORITHM if ALGORITHM else "RS256"
        
        # ✅ ลบ Bearer prefix ถ้ามี
        if token.startswith("Bearer "):
            token = token[7:]
        
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[algorithm_to_use])
        user_id = payload.get("sub")
        token_type = payload.get("type")
        
        # ✅ ตรวจสอบ token type เหมือนฟังก์ชันหลัก
        if token_type != "access":
            return None
        
        if user_id is None:
            return None
            
        return user_id
        
    except jwt.ExpiredSignatureError:
        return None
    except jwt.PyJWTError:
        return None
    except Exception:
        return None