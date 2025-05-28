import requests
import json
import time
import os
from datetime import datetime

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def main():
    """แสดง real-time status dashboard"""
    while True:
        try:
            clear_screen()
            print("=" * 60)
            print(f"🔍 SYSTEM STATUS DASHBOARD - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print("=" * 60)
            
            # เรียก health check API
            response = requests.get("http://localhost:8000/api/v1/health", timeout=5)
            health = response.json()
            
            # แสดงสถานะรวม
            status = health.get("status", "unknown")
            if status == "healthy":
                print(f"🟢 Overall Status: {status.upper()}")
            elif status == "degraded":
                print(f"🟡 Overall Status: {status.upper()}")
            else:
                print(f"🔴 Overall Status: {status.upper()}")
            
            print("-" * 60)
            
            # แสดงรายละเอียดแต่ละ service
            services = health.get("services", {})
            
            for service_name, service_info in services.items():
                status_icon = "🟢" if service_info.get("status") == "up" else "🔴"
                print(f"{status_icon} {service_name.title()}: {service_info.get('status', 'unknown')}")
                
                if service_name == "rabbitmq" and "messages_pending" in service_info:
                    print(f"   📨 Messages pending: {service_info['messages_pending']}")
                    print(f"   👥 Active consumers: {service_info['consumers']}")
                    
                elif service_name == "worker" and "processed_today" in service_info:
                    print(f"   📊 Processed today: {service_info['processed_today']}")
                    if "last_heartbeat" in service_info:
                        print(f"   💓 Last heartbeat: {service_info['last_heartbeat']}")
            
            print("-" * 60)
            print("🔄 Refreshing in 10 seconds... (Ctrl+C to exit)")
            
        except KeyboardInterrupt:
            print("\n👋 Dashboard stopped")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
        
        time.sleep(10)

if __name__ == "__main__":
    main()