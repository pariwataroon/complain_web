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
    address: Optional[ThaiIDAddress] = None
    address_other: Optional[ThaiIDAddress] = None
    given_name: str
    family_name: str
    gender: str
    titleTh: str

class ThaiIDLoginResponse(BaseModel):
    is_new_user: bool
    access_token: str
    refresh_token: str

class ThaiIDAuthCode(BaseModel):
    auth_code: str