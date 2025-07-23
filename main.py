from Integrate.integrate_app import create_application
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from router.root import rootRouter 
from router import test_errors
from fastapi import Request
from fastapi.responses import JSONResponse

# เพิ่ม imports
from app.api.middleware.security_middleware import SecurityHeadersMiddleware
from app.api.middleware.rate_limit import RateLimitMiddleware, rate_limiter, get_client_ip
from lib.cache_service import cache
from lib.counter_service import counter_service

app = create_application()

# เพิ่ม Rate Limit Middleware (ต้องไว้ก่อน Security Headers)
app.add_middleware(RateLimitMiddleware)

# เพิ่ม Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# Include routers
app.include_router(rootRouter)

# Include test errors router for testing purposes
app.include_router(test_errors.router)

# เพิ่ม middleware สำหรับ CORS และ headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Type"],
)

# ทำให้แน่ใจว่าทุก response มี Content-Type ที่ถูกต้อง
@app.middleware("http")
async def add_charset_middleware(request, call_next):
    response = await call_next(request)
    # เช็คว่าเป็น response JSON หรือไม่ ก่อนกำหนด Content-Type
    content_type = response.headers.get("content-type", "")
    if "application/json" in content_type:
        response.headers["Content-Type"] = "application/json; charset=utf-8"
    return response

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# จัดการเรื่องการอัปโหลดไฟล์ scheduler
# # Add scheduling for file maintenance
# from jobs.file_maintenance import setup_file_maintenance_jobs

# # Setup file maintenance jobs
# scheduler = setup_file_maintenance_jobs()

# # Add event to stop scheduler when app shuts down
# @app.on_event("shutdown")
# def shutdown_scheduler():
#     scheduler.shutdown()
# เพิ่ม shutdown handler

@app.on_event("startup")
async def startup_event():
    """เริ่มต้น services เมื่อ app เริ่มทำงาน"""
    # เริ่ม cache cleanup task
    await cache.start_cleanup_manually()
    # เริ่ม counter update service
    await counter_service.start_background_update()

@app.on_event("shutdown")
async def shutdown_event():
    rate_limiter.shutdown()
    cache.shutdown()
    counter_service.stop_background_update()