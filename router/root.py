from fastapi import APIRouter

from app.api.v1.routers.auth_router import router as auth_router_v1
# นำเข้า router เวอร์ชัน v1
from app.api.v1.routers.user_router import router as user_router_v1
from config.dotenv import PREFIX

# สร้างตัวแปรสำหรับ prefixes แต่ละเวอร์ชัน
API_V1_PREFIX = f"{PREFIX}"  # เช่น /api/v1
API_V2_PREFIX = f"{PREFIX.replace('v1', 'v2')}"  # เช่น /api/v2

# สร้าง router หลักสำหรับแต่ละเวอร์ชัน
v1_router = APIRouter(prefix=API_V1_PREFIX)
v2_router = APIRouter(prefix=API_V2_PREFIX)

# รวม router เวอร์ชัน 1
v1_router.include_router(user_router_v1)
v1_router.include_router(auth_router_v1)
# เมื่อมี router เวอร์ชัน 2 ในอนาคต จะเพิ่มได้ง่ายๆ
# from router.v2.user import router as user_router_v2
# v2_router.include_router(user_router_v2)

# สร้าง root router ที่รวมทุกเวอร์ชัน
rootRouter = APIRouter()
rootRouter.include_router(v1_router)
rootRouter.include_router(v2_router)  # รองรับ v2 ไว้ล่วงหน้า
