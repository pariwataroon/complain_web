import subprocess
import sys
import os

def start_worker():
    """เริ่มต้น complaint worker"""
    try:
        print("Starting Complaint Worker...")
        
        # Change to workers directory
        worker_path = os.path.join(os.path.dirname(__file__), 'workers', 'complaint_worker.py')
        
        # Run worker
        result = subprocess.run([
            sys.executable, worker_path
        ], check=True)
        
    except subprocess.CalledProcessError as e:
        print(f"Worker failed with exit code: {e.returncode}")
    except KeyboardInterrupt:
        print("Worker stopped by user")
    except Exception as e:
        print(f"Error starting worker: {str(e)}")

if __name__ == "__main__":
    start_worker()