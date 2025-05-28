import sys
import os

# เพิ่ม path ของ project root
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pika
import json
from config.dotenv import RABBITMQ_URL

def check_worker_status():
    """ตรวจสอบสถานะ worker และ queue"""
    try:
        connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
        channel = connection.channel()
        
        # Check queue status
        method = channel.queue_declare(queue='complaint_processing', passive=True)
        
        print(f"📊 Queue Status")
        print(f"   Queue Name: complaint_processing")
        print(f"   Messages in queue: {method.method.message_count}")
        print(f"   Consumer count: {method.method.consumer_count}")
        print()
        
        if method.method.consumer_count == 0:
            print("⚠️  No workers connected to queue!")
        else:
            print(f"✅ {method.method.consumer_count} worker(s) connected")
            
        connection.close()
        
    except Exception as e:
        print(f"❌ Error checking worker status: {str(e)}")

if __name__ == "__main__":
    check_worker_status()