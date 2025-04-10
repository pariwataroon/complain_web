from Integrate.integrate_app import create_application
from fastapi.middleware.cors import CORSMiddleware
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
