# นำเข้าโมเดลทั้งหมดที่นี่
from .permission import Permission
from .resource import Resource
from .role import Role
from .user_role import UserRole
from .user import User
from .token import Token
from .title import Title
from .association_tables import *
from .department_groups import DepartmentGroup
from .departments import Department
from .notification import Notification
from .position import Position
from .resource_groups import ResourceGroup
from .time_setting import TimeSetting
from .user_positions import UserPosition
from .venues import Venue
from .verification_token import VerificationToken
from .comp_geographies import Geography
from .comp_provinces import Province
from .comp_amphures import Amphure
from .comp_districts import District
from .project_api_key import ProjectApiKey
from .signature_authorities import SignatureAuthority


# ระบุโมเดลที่สามารถนำเข้าเมื่อใช้ from models import *
__all__ = [
    'Permission', 'Resource', 'Role', 'UserRole', 'User', 'Token', 'Title',
    'DepartmentGroup', 'Department', 'Notification', 'Position', 
    'ResourceGroup', 'TimeSetting', 'UserPosition', 'Venue', 'VerificationToken',
    'Geography', 'Province', 'Amphure', 'District', 'ProjectApiKey',
    'SignatureAuthority'
]