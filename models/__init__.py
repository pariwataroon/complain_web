# นำเข้าโมเดลทั้งหมดที่นี่
from .permission import Permission
from .resource import Resource
from .role import Role
from .user_role import UserRole
from .user import User
from .token import Token
from .title import Title

# ระบุโมเดลที่สามารถนำเข้าเมื่อใช้ from models import *
__all__ = ['Permission', 'Resource', 'Role', 'UserRole', 'User', 'Token', 'Title']