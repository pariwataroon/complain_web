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
from .group_signature_authorities import GroupSignatureAuthority
from .comp_complaint import Complaint, ComplaintAttachment, ComplaintStatusHistory
from .comp_complaint_types import ComplaintType, ComplaintSubType, ComplaintChannel
from .outgoing_reports import OutgoingReport, OutgoingReportAttachment
from .outgoing_reports2 import OutgoingReport2, OutgoingReportAttachment2
from .outgoing_reports3 import OutgoingReport3, OutgoingReportAttachment3
from .outgoing_reports4 import OutgoingReport4, OutgoingReportAttachment4
from .outgoing_reports5 import OutgoingReport5, OutgoingReportAttachment5
from .chat_bot import ChatBot
from .news import News


# ระบุโมเดลที่สามารถนำเข้าเมื่อใช้ from models import *
__all__ = [
    'Permission', 'Resource', 'Role', 'UserRole', 'User', 'Token', 'Title',
    'DepartmentGroup', 'Department', 'Notification', 'Position', 
    'ResourceGroup', 'TimeSetting', 'UserPosition', 'Venue', 'VerificationToken',
    'Geography', 'Province', 'Amphure', 'District', 'ProjectApiKey',
    'SignatureAuthority', 'GroupSignatureAuthority', 'Complaint', 'ComplaintAttachment',
    'ComplaintStatusHistory', 'ComplaintType', 'ComplaintSubType', 'ComplaintChannel',
    'OutgoingReport', 'OutgoingReportAttachment', 'OutgoingReport2', 'OutgoingReportAttachment2',
    'OutgoingReport3', 'OutgoingReportAttachment3', 'OutgoingReport4', 'OutgoingReportAttachment4',
    'OutgoingReport5', 'OutgoingReportAttachment5',
    'ChatBot', 'News'
]