import pika
import json
import uuid
from typing import Dict, Any
from datetime import datetime
from config.dotenv import RABBITMQ_URL

class ComplaintQueueService:
    def __init__(self, rabbitmq_url: str = None):
        self.rabbitmq_url = rabbitmq_url or RABBITMQ_URL or "amqp://localhost"
        self.connection = pika.BlockingConnection(pika.URLParameters(self.rabbitmq_url))
        self.channel = self.connection.channel()
        
        # สร้าง queue สำหรับการประมวลผลคำร้องเรียน
        self.channel.queue_declare(queue='complaint_processing', durable=True)
    
    def close_connection(self):
        """ปิดการเชื่อมต่อ"""
        if self.connection and not self.connection.is_closed:
            self.connection.close()
    
    def queue_complaint_creation(self, complaint_data: Dict[str, Any], user_id: str = None) -> str:
        """เพิ่มคำร้องเรียนเข้า queue เพื่อประมวลผล"""
        task_id = str(uuid.uuid4())
        
        message = {
            "task_id": task_id,
            "task_type": "create_complaint",
            "complaint_data": complaint_data,
            "user_id": user_id,
            "created_at": datetime.now().isoformat()
        }
        
        self.channel.basic_publish(
            exchange='',
            routing_key='complaint_processing',
            body=json.dumps(message, default=str),
            properties=pika.BasicProperties(
                delivery_mode=2,  # Make message persistent
                message_id=task_id
            )
        )
        
        return task_id
    
    def process_complaint_queue(self, callback_function):
        """ประมวลผล queue (สำหรับ worker process)"""
        def wrapper(ch, method, properties, body):
            try:
                message = json.loads(body)
                result = callback_function(message)
                
                # Acknowledge message if processed successfully
                ch.basic_ack(delivery_tag=method.delivery_tag)
                return result
                
            except Exception as e:
                print(f"Error processing message: {str(e)}")
                # Reject message and requeue
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
        
        self.channel.basic_qos(prefetch_count=1)
        self.channel.basic_consume(queue='complaint_processing', on_message_callback=wrapper)
        
        print("Waiting for messages. To exit press CTRL+C")
        self.channel.start_consuming()
    
    def __del__(self):
        """ปิดการเชื่อมต่อเมื่อ object ถูกลบ"""
        self.close_connection()
    
    def __enter__(self):
        """สำหรับใช้กับ context manager"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """ปิดการเชื่อมต่อเมื่อออกจาก context"""
        self.close_connection()