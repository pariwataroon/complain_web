from fastapi import APIRouter

# นำเข้า router เวอร์ชัน v1
from app.api.v1.routers.dashboard_router import router as dashboard_router_v1
from app.api.v1.routers.health_router import router as health_router_v1
from app.api.v1.routers.auth_router import router as auth_router_v1
from app.api.v1.routers.api_log_router import router as api_log_router_v1
from app.api.v1.routers.user_router import router as user_router_v1
from app.api.v1.routers.thaid_router import router as thaid_router_v1
from app.api.v1.routers.permission_router import router as permission_router_v1
from app.api.v1.routers.time_setting_router import router as time_setting_router_v1
from app.api.v1.routers.venue_router import router as venue_router_v1
from app.api.v1.routers.position_router import router as position_router
from app.api.v1.routers.department_group_router import router as department_group_router_v1
from app.api.v1.routers.department_router import router as department_router_v1
from app.api.v1.routers.notification_router import router as notification_router_v1
from app.api.v1.routers.geography_router import router as geography_router_v1
from app.api.v1.routers.project_api_key_router import router as project_api_key_router_v1
from app.api.v1.routers.signature_authority_router import router as signature_authority_router
from app.api.v1.routers.complaint_router import router as complaint_router_v1
from app.api.v1.routers.complaint_metadata_router import router as complaint_metadata_router_v1
from app.api.v1.routers.complaint_registration_router import router as complaint_registration_router_v1
# from app.api.v1.routers.file_management_router import router as file_management_router_v1
from config.dotenv import PREFIX

# สร้างตัวแปรสำหรับ prefixes แต่ละเวอร์ชัน
API_V1_PREFIX = f"{PREFIX}"  # เช่น /api/v1
API_V2_PREFIX = f"{PREFIX.replace('v1', 'v2')}"  # เช่น /api/v2

# สร้าง router หลักสำหรับแต่ละเวอร์ชัน
v1_router = APIRouter(prefix=API_V1_PREFIX)
v2_router = APIRouter(prefix=API_V2_PREFIX)

# รวม router เวอร์ชัน 1
v1_router.include_router(dashboard_router_v1)
v1_router.include_router(health_router_v1)
v1_router.include_router(auth_router_v1)
v1_router.include_router(api_log_router_v1)
v1_router.include_router(user_router_v1)
v1_router.include_router(thaid_router_v1)
v1_router.include_router(permission_router_v1)
v1_router.include_router(time_setting_router_v1)
v1_router.include_router(venue_router_v1)
v1_router.include_router(position_router)
v1_router.include_router(department_group_router_v1)
v1_router.include_router(department_router_v1)
v1_router.include_router(notification_router_v1)
v1_router.include_router(geography_router_v1)
v1_router.include_router(project_api_key_router_v1)
v1_router.include_router(signature_authority_router)
v1_router.include_router(complaint_router_v1)
v1_router.include_router(complaint_metadata_router_v1)
v1_router.include_router(complaint_registration_router_v1)
# v1_router.include_router(file_management_router_v1)

# เมื่อมี router เวอร์ชัน 2 ในอนาคต จะเพิ่มได้ง่ายๆ
# from router.v2.user import router as user_router_v2
# v2_router.include_router(user_router_v2)

# สร้าง root router ที่รวมทุกเวอร์ชัน
rootRouter = APIRouter()
rootRouter.include_router(v1_router)
rootRouter.include_router(v2_router)  # รองรับ v2 ไว้ล่วงหน้า