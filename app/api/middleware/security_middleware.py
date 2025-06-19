import os
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
        response.headers["X-Download-Options"] = "noopen"
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"
        
        # Force HSTS for all responses (แก้ปัญหา OWASP)
        is_https = request.url.scheme == "https"
        is_production = os.getenv("ENVIRONMENT", "development").lower() in ["production", "staging"]
        force_hsts = os.getenv("FORCE_HSTS", "false").lower() == "true"
        
        if is_https or is_production or force_hsts or True:  # Force HSTS ทุกครั้ง
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        
        # เพิ่ม Cache Control สำหรับ sensitive responses
        if request.url.path.startswith("/api/v1/auth"):
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        
        # CSP สำหรับ API endpoints
        if request.url.path in ["/docs", "/redoc", "/openapi.json"]:
            response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
        else:
            response.headers["Content-Security-Policy"] = "default-src 'none'; script-src 'none'; object-src 'none'; base-uri 'none';"
        
        return response