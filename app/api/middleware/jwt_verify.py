import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from config.dotenv import ALGORITHM, JWT_SECRET_KEY

# กำหนดว่า token จะถูกส่งมาใน "Authorization" header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        # ตรวจสอบและตัดคำว่า "Bearer " ออกถ้ามี
        if token.startswith("Bearer "):
            token = token[7:]  # ตัด "Bearer " ออก
        
        # กำหนดค่า algorithm เอง ถ้า ALGORITHM เป็น None
        algorithm_to_use = ALGORITHM if ALGORITHM else "HS256"
        
        # ลองถอดรหัส header เพื่อตรวจสอบว่า token มีรูปแบบที่ถูกต้อง
        header = jwt.get_unverified_header(token)
        
        # ใช้ algorithm_to_use แทน ALGORITHM
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[algorithm_to_use])
        
        username = payload.get("sub")
        token_type = payload.get("type")
        
        if (token_type != "access"):
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
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
