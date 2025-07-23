from Integrate.integrate_app import create_application
from fastapi.middleware.cors import CORSMiddleware
from router.root import rootRouter 
from router import test_errors
from fastapi import Request, FastAPI
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

# เพิ่ม imports
from app.api.middleware.security_middleware import SecurityHeadersMiddleware
from app.api.middleware.rate_limit import RateLimitMiddleware, rate_limiter, get_client_ip
from app.api.middleware.secure_static import StaticFiles  # 👉 ใช้ SecureStatic แทน
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
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Type"],
)

# 👉 Global Security Middleware สำหรับ OWASP Top 10
@app.middleware("http")
async def global_security_middleware(request: Request, call_next):
    path = request.url.path

    # ✅ ดัก path ที่ลงท้ายด้วย /
    if path != "/" and path.endswith("/"):
        # ถ้าเป็น /users/ หรืออื่น ๆ → redirect ไป path ที่ไม่มี /
        stripped_path = path.rstrip("/")
        return JSONResponse(
            status_code=404,
            content={
                "res_code": "4040",
                "res_message": "NOT_FOUND",
                "res_data": {
                    "error": "Endpoint not found",
                    "message": f"กรุณาใช้ {stripped_path} แทน {path}"
                }
            },
            headers=_security_headers()
        )

    # 🔐 ตรวจ auth ถ้ามี (สำหรับ protected endpoints)
    protected_endpoints = ["/api/v1/users"]
    if any(path.startswith(ep) for ep in protected_endpoints):
        auth_header = request.headers.get("authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={
                    "res_code": "4010",
                    "res_message": "UNAUTHORIZED_ACCESS",
                    "res_data": {
                        "error": "Authentication required",
                        "message": "ต้องเข้าสู่ระบบก่อนเข้าถึง endpoint นี้"
                    }
                },
                headers=_security_headers()
            )

    # ✅ ดำเนินการตามปกติ
    response = await call_next(request)

    # ✅ แนบ security headers ทุกกรณี (OWASP)
    for key, value in _security_headers().items():
        response.headers[key] = value

    # ✅ Charset
    if "application/json" in response.headers.get("content-type", ""):
        response.headers["Content-Type"] = "application/json; charset=utf-8"

    return response

# 👉 Security Headers Generator (OWASP Top 10 compliance)
def _security_headers() -> dict:
    return {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
        "Content-Security-Policy": "default-src 'none'; script-src 'none'; object-src 'none'; base-uri 'none';",
        "X-Download-Options": "noopen",
        "X-Permitted-Cross-Domain-Policies": "none",
        "Referrer-Policy": "strict-origin-when-cross-origin"
    }

# ทำให้แน่ใจว่าทุก response มี Content-Type ที่ถูกต้อง (เก็บไว้เป็น fallback)
@app.middleware("http")
async def add_charset_middleware(request, call_next):
    response = await call_next(request)
    # เช็คว่าเป็น response JSON หรือไม่ ก่อนกำหนด Content-Type
    content_type = response.headers.get("content-type", "")
    if "application/json" in content_type and "charset" not in content_type:
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

# 👉 Global Exception Handler for 500 (OWASP Security)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import logging
    logging.error(f"Global exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "code": "5000"
        },
        headers=_security_headers()
    )

# 👉 Exception Handler for HTTP 404, 403, etc. (OWASP Security)
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "code": f"{exc.status_code}0"
        },
        headers=_security_headers()
    )

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