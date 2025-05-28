import pika
import json
import sys
import os
import traceback
import time
import signal
import threading
from datetime import datetime

# เพิ่ม path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Global variables
connection = None
channel = None
should_stop = False
processed_today = 0
last_error = None

def send_heartbeat():
    """ส่ง heartbeat ทุก 60 วินาที"""
    global processed_today, last_error
    
    while not should_stop:
        try:
            heartbeat_data = {
                "timestamp": datetime.now().isoformat(),
                "status": "running",
                "processed_today": processed_today,
                "last_error": last_error,
                "pid": os.getpid()
            }
            
            with open("worker_heartbeat.json", "w") as f:
                json.dump(heartbeat_data, f)
                
        except Exception as e:
            print(f"❌ Heartbeat error: {e}")
            
        time.sleep(60)  # ส่งทุก 60 วินาที

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    global should_stop, connection, channel
    print(f"🛑 Worker shutting down...")
    should_stop = True
    if channel:
        channel.stop_consuming()
    if connection:
        connection.close()

def process_complaint_creation(ch, method, properties, body):
    """ประมวลผลการสร้างข้อร้องเรียนจาก queue"""
    global should_stop, processed_today, last_error
    
    if should_stop:
        return
    
    try:
        # Parse message
        message = json.loads(body)
        task_id = message.get("task_id")
        complaint_data = message.get("complaint_data")
        user_id = message.get("user_id")
        
        # Import modules (อยู่ใน try เพื่อไม่ให้ล่าช้าการเริ่มต้น)
        from sqlalchemy import text
        from config.database import create_db_session
        from uuid import UUID
        
        import models.api_log        
        import models.user           
        import models.comp_complaint
        import models.comp_provinces  
        import models.comp_amphures
        import models.comp_districts
        import models.comp_complaint_types
        
        from app.api.v1.controllers.complaint_controller import create_complaint
        
        # Process complaint
        db = create_db_session()
        db.execute(text("SELECT 1"))  # Test connection
        
        new_complaint = create_complaint(
            db, 
            complaint_data, 
            UUID(user_id) if user_id else None
        )
        
        db.close()
        
        # Acknowledge message
        ch.basic_ack(delivery_tag=method.delivery_tag)
        
        # Update counters
        processed_today += 1
        last_error = None
        
        # Log เฉพาะผลสำเร็จ (บันทึกแค่บรรทัดเดียว)
        print(f"✅ [{datetime.now().strftime('%H:%M:%S')}] Processed: {new_complaint.complaint_number} (Total: {processed_today})")
        
    except json.JSONDecodeError as e:
        last_error = f"JSON Error: {str(e)}"
        print(f"❌ [{datetime.now().strftime('%H:%M:%S')}] {last_error}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
        
    except Exception as e:
        last_error = f"Processing Error: {str(e)}"
        print(f"❌ [{datetime.now().strftime('%H:%M:%S')}] {last_error}")
        
        try:
            if 'db' in locals():
                db.close()
        except:
            pass
        
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

def start_worker():
    """เริ่มต้น worker with auto-reconnect"""
    global connection, channel, should_stop
    
    retry_count = 0
    max_retries = 5
    
    while not should_stop and retry_count < max_retries:
        try:
            from config.dotenv import RABBITMQ_URL
            from config.database import create_db_session
            from sqlalchemy import text
            
            # Test database
            test_db = create_db_session()
            test_db.execute(text("SELECT 1"))
            test_db.close()
            
            # Connect to RabbitMQ
            connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
            channel = connection.channel()
            channel.queue_declare(queue='complaint_processing', durable=True)
            
            # Check queue status
            method = channel.queue_declare(queue='complaint_processing', passive=True)
            message_count = method.method.message_count
            
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(
                queue='complaint_processing',
                on_message_callback=process_complaint_creation
            )
            
            # Log เฉพาะการเริ่มต้น
            print(f"🚀 [{datetime.now().strftime('%H:%M:%S')}] Worker started (PID: {os.getpid()}, Queue: {message_count} msgs)")
            
            retry_count = 0
            channel.start_consuming()
            
        except KeyboardInterrupt:
            should_stop = True
            break
            
        except Exception as e:
            retry_count += 1
            if retry_count < max_retries:
                wait_time = min(retry_count * 5, 30)
                print(f"❌ [{datetime.now().strftime('%H:%M:%S')}] Connection failed, retrying in {wait_time}s (attempt {retry_count}/{max_retries})")
                time.sleep(wait_time)
            else:
                print(f"💀 [{datetime.now().strftime('%H:%M:%S')}] Max retries reached. Exiting.")
                break
                
        finally:
            try:
                if channel:
                    channel.close()
                if connection:
                    connection.close()
            except:
                pass

def main():
    """เริ่มต้น worker"""
    global processed_today
    
    # Reset daily counter at startup
    processed_today = 0
    
    # Set up signal handlers
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    
    # Start heartbeat thread
    heartbeat_thread = threading.Thread(target=send_heartbeat, daemon=True)
    heartbeat_thread.start()
    
    # Start worker
    start_worker()
    
    # Cleanup heartbeat file on exit
    try:
        os.remove("worker_heartbeat.json")
    except:
        pass
    
    print(f"🛑 [{datetime.now().strftime('%H:%M:%S')}] Worker stopped")

if __name__ == '__main__':
    main()