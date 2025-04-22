from typing import Optional
from pydantic import BaseModel

class ThaiIDAddress(BaseModel):
    formatted: str

class ThaiIDTokenResponse(BaseModel):
    expires_in: int
    access_token: str
    refresh_token: str
    token_type: str
    scope: str
    pid: str
    address: ThaiIDAddress
    address_other: Optional[str] = ThaiIDAddress
    given_name: str
    family_name: str
    gender: str
    titleTh: str

class ThaiIDLoginResponse(BaseModel):
    is_new_user: bool
    access_token: str
    refresh_token: str

# เพิ่ม Schema ใหม่
class ThaiIDAuthCode(BaseModel):
    auth_code: str