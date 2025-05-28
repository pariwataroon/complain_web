import requests
import time
import json
import subprocess
import sys
from datetime import datetime

def check_health():
    """ตรวจสอบสถานะระบบ"""
    try:
        response = requests.get("http://localhost:8000/api/v1/health", timeout=10)
        return response.json()
    except Exception as e:
        return {"status": "unreachable", "error": str(e)}

def restart_worker():
    """Restart worker process"""
    try:
        # Kill existing worker
        subprocess.run(["pkill", "-f", "complaint_worker.py"], check=False)
        time.sleep(2)
        
        # Start new worker
        subprocess.Popen([
            "nohup", "python", "workers/complaint_worker.py"
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        return True
    except Exception as e:
        print(f"❌ Failed to restart worker: {e}")
        return False

def main():
    """Monitor และ auto-restart"""
    consecutive_failures = 0
    
    while True:
        try:
            health = check_health()
            status = health.get("status", "unknown")
            
            if status == "healthy":
                consecutive_failures = 0
                # Log เฉพาะเมื่อกลับมาเป็น healthy หลังจาก failure
                print(f"✅ [{datetime.now().strftime('%H:%M:%S')}] System healthy")
                
            elif status in ["degraded", "unhealthy"]:
                consecutive_failures += 1
                print(f"⚠️ [{datetime.now().strftime('%H:%M:%S')}] System {status} (failure #{consecutive_failures})")
                
                # แสดงรายละเอียดปัญหา
                services = health.get("services", {})
                for service, info in services.items():
                    if info.get("status") != "up":
                        print(f"   - {service}: {info}")
                
                # Auto-restart worker หลังจาก 3 ครั้งที่ worker มีปัญหา
                if consecutive_failures >= 3:
                    worker_status = services.get("worker", {}).get("status")
                    if worker_status in ["down", "stale"]:
                        print(f"🔄 [{datetime.now().strftime('%H:%M:%S')}] Auto-restarting worker...")
                        restart_worker()
                        consecutive_failures = 0
                        time.sleep(10)  # รอให้ worker เริ่มต้น
                        
            else:
                print(f"❌ [{datetime.now().strftime('%H:%M:%S')}] System unreachable")
                
        except Exception as e:
            print(f"❌ [{datetime.now().strftime('%H:%M:%S')}] Monitor error: {e}")
        
        time.sleep(30)  # ตรวจสอบทุก 30 วินาที

if __name__ == "__main__":
    main()