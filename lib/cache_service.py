import asyncio
import time
from typing import Dict, Any, Optional
from datetime import datetime, timedelta


class SimpleCache:
    """Simple in-memory cache with TTL support"""
    
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._cleanup_task = None
        self._running = True
        self.start_cleanup_task()
    
    def start_cleanup_task(self):
        """เริ่ม background task สำหรับทำความสะอาดข้อมูลเก่า"""
        async def cleanup():
            while self._running:
                try:
                    await asyncio.sleep(60)  # ทำความสะอาดทุก 1 นาที
                    self.cleanup_expired()
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    print(f"Cache cleanup error: {e}")
        
        # ตรวจสอบว่ามี event loop หรือไม่
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                self._cleanup_task = asyncio.create_task(cleanup())
        except RuntimeError:
            # ไม่มี event loop ให้ skip การสร้าง task
            pass
    
    async def start_cleanup_manually(self):
        """เริ่ม cleanup task แบบ manual (เรียกจาก startup event)"""
        if self._cleanup_task and not self._cleanup_task.done():
            return  # มี task อยู่แล้ว
        
        async def cleanup():
            while self._running:
                try:
                    await asyncio.sleep(60)
                    self.cleanup_expired()
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    print(f"Cache cleanup error: {e}")
        
        self._cleanup_task = asyncio.create_task(cleanup())
    
    def set(self, key: str, value: Any, ttl_seconds: int = 300) -> None:
        """เก็บข้อมูลใน cache พร้อม TTL (default 5 นาที)"""
        expires_at = time.time() + ttl_seconds
        self._cache[key] = {
            'value': value,
            'expires_at': expires_at,
            'created_at': datetime.now()
        }
    
    def get(self, key: str) -> Optional[Any]:
        """ดึงข้อมูลจาก cache"""
        if key not in self._cache:
            return None
        
        cache_item = self._cache[key]
        
        # ตรวจสอบว่าหมดอายุหรือไม่
        if time.time() > cache_item['expires_at']:
            del self._cache[key]
            return None
        
        return cache_item['value']
    
    def has(self, key: str) -> bool:
        """ตรวจสอบว่ามี key ใน cache หรือไม่"""
        return self.get(key) is not None
    
    def delete(self, key: str) -> bool:
        """ลบข้อมูลจาก cache"""
        if key in self._cache:
            del self._cache[key]
            return True
        return False
    
    def clear(self) -> None:
        """ลบข้อมูลทั้งหมดใน cache"""
        self._cache.clear()
    
    def cleanup_expired(self) -> None:
        """ลบข้อมูลที่หมดอายุ"""
        current_time = time.time()
        expired_keys = [
            key for key, value in self._cache.items()
            if current_time > value['expires_at']
        ]
        
        for key in expired_keys:
            del self._cache[key]
        
        if expired_keys:
            print(f"Cleaned up {len(expired_keys)} expired cache items")
    
    def get_stats(self) -> Dict[str, Any]:
        """ดึงสถิติการใช้งาน cache"""
        total_items = len(self._cache)
        current_time = time.time()
        
        expired_count = sum(
            1 for value in self._cache.values()
            if current_time > value['expires_at']
        )
        
        return {
            'total_items': total_items,
            'expired_items': expired_count,
            'active_items': total_items - expired_count,
            'cleanup_running': self._cleanup_task and not self._cleanup_task.done()
        }
    
    def shutdown(self):
        """หยุดการทำงาน"""
        self._running = False
        if self._cleanup_task and not self._cleanup_task.done():
            self._cleanup_task.cancel()


# สร้าง instance global
cache = SimpleCache()
