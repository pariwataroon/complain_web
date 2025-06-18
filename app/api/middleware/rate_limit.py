from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from collections import defaultdict, deque
from datetime import datetime, timedelta
from typing import Dict, Deque
import asyncio
import logging
import re

logger = logging.getLogger(__name__)

class SimpleRateLimiter:
    def __init__(self):
        self.requests: Dict[str, Deque[datetime]] = defaultdict(lambda: deque())
        self.cleanup_task = None
        self._running = True
        self.start_cleanup_task()
    
    def start_cleanup_task(self):
        """เริ่ม background task สำหรับทำความสะอาดข้อมูลเก่า"""
        async def cleanup():
            while self._running:
                try:
                    await asyncio.sleep(300)  # ทำความสะอาดทุก 5 นาที
                    self.cleanup_old_requests()
                    logger.debug("Rate limiter cleanup completed")
                except asyncio.CancelledError:
                    logger.info("Rate limiter cleanup task cancelled")
                    break
                except Exception as e:
                    logger.error(f"Error in rate limiter cleanup: {e}")
        
        self.cleanup_task = asyncio.create_task(cleanup())
    
    def cleanup_old_requests(self):
        """ลบข้อมูลคำขอที่เก่าเกิน 1 ชั่วโมง"""
        try:
            cutoff_time = datetime.now() - timedelta(hours=1)
            cleanup_count = 0
            
            for ip in list(self.requests.keys()):
                while self.requests[ip] and self.requests[ip][0] < cutoff_time:
                    self.requests[ip].popleft()
                
                if not self.requests[ip]:
                    del self.requests[ip]
                    cleanup_count += 1
                
            if cleanup_count > 0:
                logger.debug(f"Cleaned up {cleanup_count} inactive IPs")
                
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
    
    def is_allowed(self, ip: str, limit: int, window_minutes: int = 1) -> bool:
        """ตรวจสอบว่า IP นี้สามารถส่งคำขอได้หรือไม่"""
        try:
            now = datetime.now()
            window_start = now - timedelta(minutes=window_minutes)
            
            # ลบคำขอที่เก่าเกินช่วงเวลาที่กำหนด
            while self.requests[ip] and self.requests[ip][0] < window_start:
                self.requests[ip].popleft()
            
            # ตรวจสอบว่าเกินขีดจำกัดหรือไม่
            current_requests = len(self.requests[ip])
            if current_requests >= limit:
                logger.warning(f"Rate limit exceeded for {ip}: {current_requests}/{limit}")
                return False
            
            # บันทึกคำขอใหม่
            self.requests[ip].append(now)
            return True
            
        except Exception as e:
            logger.error(f"Error checking rate limit for {ip}: {e}")
            return True  # fail-open
    
    def get_remaining_requests(self, ip: str, limit: int, window_minutes: int = 1) -> int:
        """คำนวณจำนวนคำขอที่เหลือ"""
        try:
            now = datetime.now()
            window_start = now - timedelta(minutes=window_minutes)
            
            recent_requests = sum(1 for req_time in self.requests[ip] if req_time >= window_start)
            return max(0, limit - recent_requests)
            
        except Exception as e:
            logger.error(f"Error calculating remaining requests for {ip}: {e}")
            return limit
    
    def get_stats(self) -> dict:
        """ดึงสถิติการใช้งาน rate limiter"""
        try:
            active_ips = len(self.requests)
            total_requests = sum(len(req_deque) for req_deque in self.requests.values())
            
            return {
                "active_ips": active_ips,
                "total_tracked_requests": total_requests,
                "cleanup_running": self.cleanup_task and not self.cleanup_task.done()
            }
        except Exception as e:
            logger.error(f"Error getting rate limiter stats: {e}")
            return {"error": "Unable to get stats"}
    
    def shutdown(self):
        """หยุดการทำงาน"""
        self._running = False
        if self.cleanup_task and not self.cleanup_task.done():
            self.cleanup_task.cancel()

# สร้าง instance global
rate_limiter = SimpleRateLimiter()

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        # กำหนด rate limit rules สำหรับแต่ละ endpoint
        self.rate_rules = {
            # Authentication endpoints (เข้มงวดที่สุด)
            r'^/api/v1/auth/login$': {'limit': 5, 'window': 1, 'methods': ['POST']},
            r'^/api/v1/auth/resend-verification$': {'limit': 3, 'window': 5, 'methods': ['POST']},  # 5 นาที
            r'^/api/v1/auth/forgot-password$': {'limit': 3, 'window': 5, 'methods': ['POST']},      # 5 นาที
            r'^/api/v1/auth/reset-password$': {'limit': 5, 'window': 5, 'methods': ['POST']},       # 5 นาที
            r'^/api/v1/auth/verify-reset-token$': {'limit': 10, 'window': 1, 'methods': ['GET']},
            r'^/api/v1/auth/verify-employee$': {'limit': 10, 'window': 1, 'methods': ['POST']},
            
            # Public data endpoints (หลวมกว่า)
            r'^/api/v1/users/title/details$': {'limit': 100, 'window': 1, 'methods': ['GET']},
            r'^/health$': {'limit': 120, 'window': 1, 'methods': ['GET']},
            r'^/docs.*$': {'limit': 50, 'window': 1, 'methods': ['GET']},
            r'^/redoc.*$': {'limit': 50, 'window': 1, 'methods': ['GET']},
            r'^/openapi.json$': {'limit': 30, 'window': 1, 'methods': ['GET']},
            
            # General category limits (ถ้าไม่ตรง specific rules ข้างบน)
            r'^/api/v1/auth/.*$': {'limit': 20, 'window': 1, 'methods': ['GET', 'POST']},
            r'^/api/v1/users/.*$': {'limit': 60, 'window': 1, 'methods': ['GET', 'POST', 'PUT', 'DELETE']},
            
            # Global catch-all (สุดท้าย)
            r'^/api/.*$': {'limit': 200, 'window': 1, 'methods': ['GET', 'POST', 'PUT', 'DELETE']},
        }
    
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        method = request.method
        client_ip = self.get_client_ip(request)
        
        # หา rule ที่ตรงกับ path และ method
        matching_rule = None
        for pattern, rule in self.rate_rules.items():
            if re.match(pattern, path) and method in rule['methods']:
                matching_rule = rule
                break
        
        if matching_rule:
            # ตรวจสอบ rate limit
            if not rate_limiter.is_allowed(
                client_ip, 
                matching_rule['limit'], 
                matching_rule['window']
            ):
                remaining = rate_limiter.get_remaining_requests(
                    client_ip, 
                    matching_rule['limit'], 
                    matching_rule['window']
                )
                
                # เพิ่ม Security Alert Logging
                logger.warning(f"SECURITY ALERT: Rate limit exceeded for {client_ip} on {method} {path}")
                logger.warning(f"Request limit: {matching_rule['limit']}/{matching_rule['window']}min, Remaining: {remaining}")
                
                # เพิ่ม User-Agent logging เพื่อตรวจสอบ bot
                user_agent = request.headers.get("User-Agent", "Unknown")
                logger.warning(f"Client details - IP: {client_ip}, User-Agent: {user_agent}")
                
                response_data = {
                    "res_code": "4290",
                    "res_message": "RATE_LIMIT_EXCEEDED",
                    "res_data": {
                        "error": "Rate limit exceeded",
                        "message": f"คำขอเกินขีดจำกัด {matching_rule['limit']} ครั้งต่อ {matching_rule['window']} นาที",
                        "remaining_requests": remaining,
                        "retry_after": matching_rule['window'] * 60
                    }
                }
                
                return JSONResponse(
                    status_code=429,
                    content=response_data,
                    headers={
                        "Retry-After": str(matching_rule['window'] * 60),
                        "X-RateLimit-Limit": str(matching_rule['limit']),
                        "X-RateLimit-Remaining": str(remaining),
                        "X-RateLimit-Reset": str(matching_rule['window'] * 60)
                    }
                )
        
        response = await call_next(request)
        return response
    
    def get_client_ip(self, request: Request) -> str:
        """ดึง IP address ที่แท้จริงของ client"""
        try:
            forwarded_for = request.headers.get("X-Forwarded-For")
            if forwarded_for:
                ip = forwarded_for.split(",")[0].strip()
                return ip
            
            real_ip = request.headers.get("X-Real-IP")
            if real_ip:
                return real_ip.strip()
            
            if request.client and request.client.host:
                return request.client.host
            
            return "unknown"
            
        except Exception as e:
            logger.error(f"Error getting client IP: {e}")
            return "unknown"

def get_client_ip(request: Request) -> str:
    """ฟังก์ชันสำหรับใช้ใน debug หรือ stats"""
    try:
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        
        if request.client and request.client.host:
            return request.client.host
        
        return "unknown"
        
    except Exception as e:
        logger.error(f"Error getting client IP: {e}")
        return "unknown"