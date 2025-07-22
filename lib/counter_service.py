import asyncio
import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from config.database import get_db
from app.api.v1.controllers.api_log_controller import get_user_counter_from_chatbot_logs

logger = logging.getLogger(__name__)


class CounterUpdateService:
    """Service สำหรับอัปเดต user counter ในพื้นหลัง"""
    
    def __init__(self):
        self.task: Optional[asyncio.Task] = None
        self.running = False
        self.update_interval = 60  # อัปเดตทุก 1 นาที
    
    async def start_background_update(self):
        """เริ่ม background task สำหรับอัปเดต counter"""
        if self.running:
            logger.warning("Counter update service is already running")
            return
        
        self.running = True
        logger.info("Starting counter update background service")
        
        async def update_loop():
            while self.running:
                try:
                    await asyncio.sleep(self.update_interval)
                    if not self.running:
                        break
                    
                    # อัปเดต counter
                    await self.update_counter()
                    
                except asyncio.CancelledError:
                    logger.info("Counter update service cancelled")
                    break
                except Exception as e:
                    logger.error(f"Error in counter update loop: {e}")
                    # หยุดครู่หนึ่งแล้วลองใหม่
                    await asyncio.sleep(30)
        
        self.task = asyncio.create_task(update_loop())
    
    async def update_counter(self):
        """อัปเดต counter ใน database"""
        try:
            # สร้าง database session
            db_gen = get_db()
            db: Session = next(db_gen)
            
            try:
                # อัปเดต counter (force refresh เพื่อให้ cache ใหม่)
                counter_data = get_user_counter_from_chatbot_logs(db, use_cache=False)
                
                logger.debug(f"Counter updated: {counter_data['total_unique_users']} total users, "
                           f"{counter_data['today_unique_users']} today")
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Failed to update counter: {e}")
    
    def stop_background_update(self):
        """หยุด background task"""
        self.running = False
        if self.task and not self.task.done():
            self.task.cancel()
        logger.info("Counter update service stopped")
    
    def set_update_interval(self, seconds: int):
        """กำหนด interval การอัปเดต (วินาที)"""
        if seconds < 10:
            logger.warning("Update interval too short, minimum is 10 seconds")
            return False
        
        self.update_interval = seconds
        logger.info(f"Update interval set to {seconds} seconds")
        return True
    
    def get_status(self) -> dict:
        """ดึงสถานะของ service"""
        return {
            "running": self.running,
            "update_interval": self.update_interval,
            "task_status": "running" if self.task and not self.task.done() else "stopped",
            "last_check": datetime.now().isoformat()
        }


# สร้าง instance global
counter_service = CounterUpdateService()
