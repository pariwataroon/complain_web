from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # เพิ่ม security headers ทุก response
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # เพิ่ม headers อื่นๆ ที่ช่วยเพิ่มความปลอดภัย
        response.headers["X-Download-Options"] = "noopen"
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"
        
        # ถ้าเป็น HTTPS ให้เพิ่ม HSTS
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # CSP สำหรับ API - อนุญาตให้เฉพาะ same-origin
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'none'; object-src 'none';"
        
        # ปรับแต่งสำหรับ Swagger UI (ถ้าต้องการ)
        if request.url.path in ["/docs", "/redoc"]:
            # ให้ CSP หลวมขึ้นสำหรับหน้า documentation
            response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
        
        return response