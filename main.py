from Integrate.integrate_app import create_application
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from router.root import rootRouter 
from router import test_errors

app = create_application()

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