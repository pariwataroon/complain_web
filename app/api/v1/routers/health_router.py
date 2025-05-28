from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import pika
import json
from datetime import datetime, timedelta
import os

from config.database import get_db
from config.dotenv import RABBITMQ_URL

router = APIRouter()

@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """ตรวจสอบสถานะระบบทั้งหมด"""
    status = {
        "timestamp": datetime.now().isoformat(),
        "status": "healthy",
        "services": {}
    }
    
    # ตรวจสอบ Database
    try:
        db.execute(text("SELECT 1"))
        status["services"]["database"] = {"status": "up", "response_time_ms": 0}
    except Exception as e:
        status["services"]["database"] = {"status": "down", "error": str(e)}
        status["status"] = "unhealthy"
    
    # ตรวจสอบ RabbitMQ
    try:
        connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
        channel = connection.channel()
        
        # ตรวจสอบ queue
        method = channel.queue_declare(queue='complaint_processing', passive=True)
        queue_info = {
            "status": "up",
            "messages_pending": method.method.message_count,
            "consumers": method.method.consumer_count
        }
        
        connection.close()
        status["services"]["rabbitmq"] = queue_info
        
    except Exception as e:
        status["services"]["rabbitmq"] = {"status": "down", "error": str(e)}
        status["status"] = "unhealthy"
    
    # ตรวจสอบ Worker (ดูจาก heartbeat file)
    worker_heartbeat_file = "worker_heartbeat.json"
    try:
        if os.path.exists(worker_heartbeat_file):
            with open(worker_heartbeat_file, 'r') as f:
                heartbeat = json.load(f)
            
            last_beat = datetime.fromisoformat(heartbeat["timestamp"])
            time_diff = datetime.now() - last_beat
            
            if time_diff < timedelta(minutes=2):  # Worker should update every 60s
                status["services"]["worker"] = {
                    "status": "up",
                    "last_heartbeat": heartbeat["timestamp"],
                    "processed_today": heartbeat.get("processed_today", 0)
                }
            else:
                status["services"]["worker"] = {
                    "status": "stale",
                    "last_heartbeat": heartbeat["timestamp"],
                    "minutes_ago": int(time_diff.total_seconds() / 60)
                }
                status["status"] = "degraded"
        else:
            status["services"]["worker"] = {"status": "unknown", "error": "No heartbeat file"}
            status["status"] = "degraded"
            
    except Exception as e:
        status["services"]["worker"] = {"status": "down", "error": str(e)}
        status["status"] = "unhealthy"
    
    if status["status"] == "unhealthy":
        raise HTTPException(status_code=503, detail=status)
    
    return status

@router.get("/health/simple")
async def simple_health():
    """Simple health check for load balancer"""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}