import pytest
import requests
import json
import time
from datetime import datetime
from typing import Dict, Any
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
HEADERS = {"Content-Type": "application/json"}

class APITestReporter:
    """Reporter สำหรับเก็บผลการทดสอบ"""
    
    def __init__(self):
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_tests": 0,
                "passed": 0,
                "failed": 0,
                "skipped": 0,
                "pass_rate": 0.0
            },
            "test_details": [],
            "performance_data": {},
            "security_tests": [],  # เพิ่มบรรทัดนี้
            "coverage_analysis": {}
        }
    
    def add_test_result(self, test_name: str, status: str, duration: float, details: dict = None):
        """เพิ่มผลการทดสอบ"""
        self.results["test_details"].append({
            "name": test_name,
            "status": status,
            "duration": duration,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        })
        
        self.results["summary"]["total_tests"] += 1
        if status == "PASS":
            self.results["summary"]["passed"] += 1
        elif status == "FAIL":
            self.results["summary"]["failed"] += 1
        else:
            self.results["summary"]["skipped"] += 1
        
        # คำนวณ pass rate
        total = self.results["summary"]["total_tests"]
        passed = self.results["summary"]["passed"]
        self.results["summary"]["pass_rate"] = (passed / total * 100) if total > 0 else 0
    
    def save_report(self, filename: str = None):
        """บันทึกรายงาน"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"integration_test_report_{timestamp}.json"
        
        Path("test_reports").mkdir(exist_ok=True)
        filepath = Path("test_reports") / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)
        
        return str(filepath)

# Global reporter instance
reporter = APITestReporter()

# ================ SIMPLE INTEGRATION TESTS ================

def test_api_server_connectivity():
    """ทดสอบการเชื่อมต่อกับ API Server"""
    start_time = time.time()
    
    try:
        # ลองเชื่อมต่อกับ server
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        duration = time.time() - start_time
        
        # ถ้าได้ response แสดงว่า server ทำงาน (ไม่ว่าจะ 200 หรือ 404)
        assert response.status_code in [200, 404, 405], f"Server not responding, status: {response.status_code}"
        
        reporter.add_test_result(
            "test_api_server_connectivity", "PASS", duration,
            {"status_code": response.status_code, "server_responding": True}
        )
        
    except requests.exceptions.ConnectionError:
        duration = time.time() - start_time
        # Server ไม่ทำงาน - ข้าม test นี้
        reporter.add_test_result(
            "test_api_server_connectivity", "SKIP", duration,
            {"error": "Server not running", "skipped_reason": "API server not available"}
        )
        pytest.skip("API server is not running")
        
    except Exception as e:
        duration = time.time() - start_time
        reporter.add_test_result(
            "test_api_server_connectivity", "FAIL", duration,
            {"error": str(e)}
        )
        raise

def test_login_endpoint_structure():
    """ทดสอบโครงสร้างของ login endpoint"""
    start_time = time.time()
    
    try:
        url = f"{BASE_URL}/auth/login"
        data = {"citizen_id": "test", "password": "test"}
        
        response = requests.post(url, json=data, headers=HEADERS, timeout=10)
        duration = time.time() - start_time
        
        # ตรวจสอบว่า endpoint มีอยู่ (ไม่ใช่ 404)
        assert response.status_code != 404, "Login endpoint not found"
        
        # ถ้าได้ response เป็น JSON ให้ตรวจสอบโครงสร้าง
        if response.headers.get('content-type', '').startswith('application/json'):
            try:
                result = response.json()
                # ตรวจสอบโครงสร้างพื้นฐาน
                assert isinstance(result, dict), "Response should be a dictionary"
                
                reporter.add_test_result(
                    "test_login_endpoint_structure", "PASS", duration,
                    {"status_code": response.status_code, "has_json_response": True}
                )
            except json.JSONDecodeError:
                reporter.add_test_result(
                    "test_login_endpoint_structure", "PASS", duration,
                    {"status_code": response.status_code, "has_json_response": False}
                )
        else:
            reporter.add_test_result(
                "test_login_endpoint_structure", "PASS", duration,
                {"status_code": response.status_code, "content_type": response.headers.get('content-type')}
            )
            
    except requests.exceptions.ConnectionError:
        duration = time.time() - start_time
        reporter.add_test_result(
            "test_login_endpoint_structure", "SKIP", duration,
            {"error": "Server not running"}
        )
        pytest.skip("API server is not running")
        
    except Exception as e:
        duration = time.time() - start_time
        reporter.add_test_result(
            "test_login_endpoint_structure", "FAIL", duration,
            {"error": str(e)}
        )
        raise

def test_invalid_json_handling():
    """ทดสอบการจัดการ JSON ที่ไม่ถูกต้อง"""
    start_time = time.time()
    
    try:
        url = f"{BASE_URL}/auth/login"
        invalid_json = '{"citizen_id": "test", "password":}'  # JSON ไม่ถูกต้อง
        
        response = requests.post(
            url, 
            data=invalid_json,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        duration = time.time() - start_time
        
        # ควรได้รับ error status code สำหรับ JSON ที่ไม่ถูกต้อง
        assert response.status_code in [400, 422, 500], f"Should return error for invalid JSON, got: {response.status_code}"
        
        reporter.add_test_result(
            "test_invalid_json_handling", "PASS", duration,
            {"status_code": response.status_code, "handled_invalid_json": True}
        )
        
    except requests.exceptions.ConnectionError:
        duration = time.time() - start_time
        reporter.add_test_result(
            "test_invalid_json_handling", "SKIP", duration,
            {"error": "Server not running"}
        )
        pytest.skip("API server is not running")
        
    except Exception as e:
        duration = time.time() - start_time
        reporter.add_test_result(
            "test_invalid_json_handling", "FAIL", duration,
            {"error": str(e)}
        )
        raise

# Security test สำหรับ Integration
@pytest.mark.parametrize("payload", [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "<script>alert('xss')</script>"
])
def test_basic_security_injection(payload):
    """ทดสอบการป้องกัน injection พื้นฐาน"""
    start_time = time.time()
    
    try:
        url = f"{BASE_URL}/auth/login"
        data = {
            "citizen_id": payload,
            "password": "test"
        }
        
        response = requests.post(url, json=data, headers=HEADERS, timeout=10)
        duration = time.time() - start_time
        
        # ระบบควรไม่ crash และไม่เปิดเผยข้อมูลอันตราย
        security_passed = True
        error_details = {}
        
        # ตรวจสอบว่าไม่มี database error ที่เปิดเผย
        response_text = response.text.lower()
        dangerous_patterns = [
            "syntax error", "mysql", "postgresql", "sqlite", 
            "ora-", "stack trace", "exception"
        ]
        
        for pattern in dangerous_patterns:
            if pattern in response_text:
                security_passed = False
                error_details["exposed_error"] = pattern
                break
        
        # บันทึกผลการทดสอบ security
        reporter.security_tests.append({
            "test": "basic_security_injection",
            "payload": payload,
            "passed": security_passed,
            "details": error_details,
            "response_time": duration
        })
        
        reporter.add_test_result(
            f"test_basic_security_injection_{payload[:10]}", 
            "PASS" if security_passed else "FAIL", 
            duration,
            {"payload": payload, "security_passed": security_passed}
        )
        
        assert security_passed, f"Security test failed for payload: {payload}"
        
    except requests.exceptions.ConnectionError:
        duration = time.time() - start_time
        reporter.add_test_result(
            f"test_basic_security_injection_{payload[:10]}", "SKIP", duration,
            {"error": "Server not running", "payload": payload}
        )
        pytest.skip("API server is not running")
        
    except Exception as e:
        duration = time.time() - start_time
        reporter.add_test_result(
            f"test_basic_security_injection_{payload[:10]}", "FAIL", duration,
            {"error": str(e), "payload": payload}
        )
        raise

# Coverage Analysis
def analyze_test_coverage():
    """วิเคราะห์ความครอบคลุมของการทดสอบ"""
    coverage_data = {
        "endpoints_tested": ["/auth/login"],
        "security_tests_performed": len(reporter.security_tests),
        "performance_metrics_collected": len(reporter.performance_data),
        "test_types": ["connectivity", "structure", "security", "error_handling"]
    }
    
    reporter.results["coverage_analysis"] = coverage_data
    return coverage_data

# Pytest Hooks
def pytest_sessionfinish(session, exitstatus):
    """Hook ที่จะทำงานเมื่อ test session จบ"""
    analyze_test_coverage()
    report_path = reporter.save_report()
    print(f"\n📊 Integration Test Report: {report_path}")

if __name__ == "__main__":
    # สำหรับรันโดยตรง
    pytest.main([__file__, "-v", "--tb=short"])