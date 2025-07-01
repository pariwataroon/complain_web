import time
import requests
import statistics
import json
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
import os

os.makedirs("test_report", exist_ok=True)

# ----- Configuration -----
REPEAT_COUNT = 10
BASE_URL = "http://localhost:8000/api/v1"
AUTH_TOKEN = None
HEADERS = {
    "Content-Type": "application/json"
}

# ----- Metric Storage -----
ALL_RESULTS = []

# ----- Utility -----
def measure_request(method, endpoint, headers=None, data=None):
    url = f"{BASE_URL}{endpoint}"
    start = time.time()
    try:
        response = requests.request(method, url, headers=headers, json=data)
        duration = time.time() - start
        return duration, response.status_code
    except Exception as e:
        return -1, str(e)

def login_and_get_token():
    global AUTH_TOKEN
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "citizen_id": "1234567890122",
        "password": "password"
    })
    if response.status_code == 200:
        AUTH_TOKEN = response.json().get("access_token")
        print("[✅] Logged in successfully. Token:", AUTH_TOKEN)
    else:
        print("[❌] Login failed:", response.status_code)
        print(response.text)
        exit(1)

APIS = [
    {"name": "Login", "method": "POST", "endpoint": "/auth/login", "auth": False, "data": {"citizen_id": "1234567890122", "password": "password"}},
    {"name": "User Info", "method": "GET", "endpoint": "/auth/me", "auth": True},
    {"name": "thaid", "method": "POST", "endpoint": "/thaid/auth", "auth": True, "data": {"auth_code": "NWI2M2EwZDYtNTdjNC00NDZjLWIzMzAtMjdiNmMzYzkwOWRhIzQ1MGYyMDAzLTdhN2ItNDU2Yi1iNzg2LThhYzRkYjg2MDJiZQ"}},
    {"name": "Forgot Password", "method": "GET", "endpoint": "/auth/forgot-password", "auth": True},
    {"name": "List Users", "method": "GET", "endpoint": "/users", "auth": True},
    {"name": "Create Users", "method": "POST", "endpoint": "/users", "auth": True, "data": {"citizen_id": "1234567980139", "title_id": 3, "first_name": "as11", "last_name": "afsa1","email": "buddyibeam89@gmail.com", "phone": "0864703371", "password": "test123!Z", "prefix_other": "test"}},
    {"name": "Create Complaint", "method": "POST", "endpoint": "/complaints", "auth": True,
      "data": {
            "step1": {
                "general": {
                "general": {
                    "idCard": "1100500123456",
                    "name": "นายมานะ รักชาติ",
                    "address": "123/456 หมู่ 7 ถนนพหลโยธิน",
                    "phone": "0812345678",
                    "province": {
                    "value": 1,
                    "label": "กรุงเทพมหานคร"
                    },
                    "districts": {
                    "value": 30,
                    "label": "จตุจักร"
                    },
                    "subdistricts": {
                    "value": "103001",
                    "label": "ลาดยาว",
                    "zip_code": 10900
                    },
                    "zipcode": {
                    "value": 10900,
                    "label": "10900"
                    },
                    "email": "mana@example.com"
                }
                }
            },
            "step2": {
                "general": {
                "individual": {
                    "idCard": "1100500654321",
                    "name": "นายสมชาย มีเงิน",
                    "email": "somchai@example.com",
                    "address": "88/99 หมู่บ้านเศรษฐกิจ",
                    "phone": "0898765432",
                    "province": {
                    "value": 1,
                    "label": "กรุงเทพมหานคร"
                    },
                    "districts": {
                    "value": 40,
                    "label": "บางแค"
                    },
                    "subdistricts": {
                    "value": "104001",
                    "label": "บางแค",
                    "zip_code": 10160
                    },
                    "zipcode": {
                    "value": 10160,
                    "label": "10160"
                    }
                },
                "activeType": "individual"
                }
            },
            "step3": {
                "general": {
                "complaintType": "ฉ้อโกง",
                "subject": "ถูกหลอกให้โอนเงินซื้อสินค้าออนไลน์",
                "incidentDate": "2023-12-25T10:00:00.000Z",
                "description": "ข้าพเจ้าได้ซื้อโทรศัพท์มือถือจากร้านค้าออนไลน์ ได้โอนเงิน 15,000 บาทไปแล้ว แต่ไม่ได้รับสินค้า และผู้ขายบล็อกการติดต่อทั้งหมด",
                "attachment": []
                }
            },
            "step4": {
                "general": {
                "accepted": True
                }
            }
            }},
    {"name": "Complaint Details", "method": "GET", "endpoint": "/complaints/1", "auth": True},
    {"name": "Delete Complaint", "method": "DELETE", "endpoint": "/complaints/1", "auth": True},
    {"name": "Roles Details", "method": "GET", "endpoint": "/permissions/roles", "auth": True},
    {"name": "Create Roles", "method": "POST", "endpoint": "/permissions/roles", "auth": True, "data": {"name": "test-role","description": "A test role"}},
    {"name": "Get Resources", "method": "GET", "endpoint": "/permissions/resources", "auth": True},
    {"name": "Get Resources", "method": "POST", "endpoint": "/permissions/resources", "auth": True, "data": { "name": "Test Resource", "path": "/api/v1/test-resource", "description": "A test resource"} },
    {"name": "Get Resources", "method": "DELETE", "endpoint": "/permissions/resources/1", "auth": True},
    {"name": "Departments Details", "method": "GET", "endpoint": "/departments", "auth": True},
    {"name": "Create Departments", "method": "POST", "endpoint": "/departments", "auth": True, "data": {"name": "Security Test Department", "description": "Department created for security testing", "is_active": True, "code": "STD001"}},
    {"name": "Departments With Venues", "method": "GET", "endpoint": "/departments/with-venues", "auth": True},
    {"name": "Venues Details", "method": "GET", "endpoint": "/venues", "auth": True},
    {"name": "Create Venues", "method": "POST", "endpoint": "/venues", "auth": True, "data": {"name": "Security_Test_Venue", "description": "Test venue created by security test"}},
    {"name": "Venues Stats Overview", "method": "GET", "endpoint": "/venues/stats/overview", "auth": True},
    {"name": "Positions Details", "method": "GET", "endpoint": "/positions", "auth": True},
    {"name": "Create Positions", "method": "POST", "endpoint": "/positions", "auth": True, "data": {"name": "Security Test Position", "description": "Test position"}},
    {"name": "Notifications Details", "method": "GET", "endpoint": "/notifications", "auth": True},
    {"name": "Create Notifications", "method": "POST", "endpoint": "/notifications", "auth": True, "data": {"title": "Security Test Notification", "message": "This is a test notification created by security test", "type": "info", "priority": "normal", "target_user_id": 1}},
    {"name": "Regions Details", "method": "GET", "endpoint": "/geography/regions", "auth": True},
    {"name": "Provinces Details", "method": "GET", "endpoint": "/geography/provinces", "auth": True},
    {"name": "Districts Details", "method": "GET", "endpoint": "/geography/districts", "auth": True},
    {"name": "Amphures Details", "method": "GET", "endpoint": "/geography/amphures", "auth": True},
    {"name": "Subdistricts Details", "method": "GET", "endpoint": "/geography/subdistricts", "auth": True},
    {"name": "Dashboard Staff Workload", "method": "GET", "endpoint": "/dashboard/staff-workload", "auth": True},
    {"name": "Dashboard Staff Performance", "method": "GET", "endpoint": "/dashboard/staff-performance", "auth": True},
]

# ----- Load Testing -----
def load_testing(api):
    headers = HEADERS.copy()
    if api.get("auth") and AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"
    durations = []
    for _ in range(REPEAT_COUNT):
        duration, _ = measure_request(api["method"], api["endpoint"], headers, api.get("data"))
        if duration != -1:
            durations.append(duration)
    return {
        "type": "load",
        "name": api["name"],
        "endpoint": api["endpoint"],
        "method": api["method"],
        "avg_time": round(statistics.mean(durations), 4) if durations else -1,
        "max_time": round(max(durations), 4) if durations else -1,
        "min_time": round(min(durations), 4) if durations else -1,
        "count": len(durations),
        "timestamp": datetime.now().isoformat()
    }

# ----- Endurance Testing -----
def endurance_testing(api):
    headers = HEADERS.copy()
    if api.get("auth") and AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"
    durations = []
    start_time = time.time()
    while time.time() - start_time < 30:
        duration, _ = measure_request(api["method"], api["endpoint"], headers, api.get("data"))
        if duration != -1:
            durations.append(duration)
    return {
        "type": "endurance",
        "name": api["name"],
        "endpoint": api["endpoint"],
        "method": api["method"],
        "avg_time": round(statistics.mean(durations), 4) if durations else -1,
        "count": len(durations),
        "timestamp": datetime.now().isoformat()
    }

# ----- Spike Testing -----
def spike_testing(api):
    headers = HEADERS.copy()
    if api.get("auth") and AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"
    durations = []
    for _ in range(2):
        threads = []
        spike_results = []
        for _ in range(5):
            t = threading.Thread(target=lambda: spike_results.append(measure_request(api["method"], api["endpoint"], headers, api.get("data"))))
            threads.append(t)
            t.start()
        for t in threads:
            t.join()
        durations.extend([d for d, _ in spike_results if d != -1])
    return {
        "type": "spike",
        "name": api["name"],
        "endpoint": api["endpoint"],
        "method": api["method"],
        "avg_time": round(statistics.mean(durations), 4) if durations else -1,
        "max_time": round(max(durations), 4) if durations else -1,
        "count": len(durations),
        "timestamp": datetime.now().isoformat()
    }

# ----- Concurrency Testing -----
def concurrency_testing(api):
    headers = HEADERS.copy()
    if api.get("auth") and AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"
    concurrency_levels = [200]
    results = {}
    for level in concurrency_levels:
        durations = []
        with ThreadPoolExecutor(max_workers=level) as executor:
            futures = [executor.submit(measure_request, api["method"], api["endpoint"], headers, api.get("data")) for _ in range(level)]
            for future in futures:
                duration, status = future.result()
                if duration != -1:
                    durations.append(duration)
        results[str(level)] = {
            "avg": round(statistics.mean(durations), 4) if durations else -1,
            "count": len(durations)
        }
    return {
        "type": "concurrency",
        "name": api["name"],
        "endpoint": api["endpoint"],
        "method": api["method"],
        "concurrency_levels": results,
        "timestamp": datetime.now().isoformat()
    }

# ----- Summary Calculation -----
def calc_summary(all_results):
    load_list = [r["avg_time"] for r in all_results if r["type"] == "load" and r["avg_time"] != -1]
    endurance_list = [r["avg_time"] for r in all_results if r["type"] == "endurance" and r["avg_time"] != -1]
    spike_list = [r["avg_time"] for r in all_results if r["type"] == "spike" and r["avg_time"] != -1]
    concurrency_list = []
    for r in all_results:
        if r["type"] == "concurrency":
            for v in r.get("concurrency_levels", {}).values():
                if v["avg"] != -1:
                    concurrency_list.append(v["avg"])

    summary = {
        "Load Testing เฉลี่ยรวม": round(statistics.mean(load_list), 4) if load_list else -1,
        "Endurance Testing เฉลี่ยรวม": round(statistics.mean(endurance_list), 4) if endurance_list else -1,
        "Spike Testing เฉลี่ยรวม": round(statistics.mean(spike_list), 4) if spike_list else -1,
        "Concurrency Testing เฉลี่ยรวม": round(statistics.mean(concurrency_list), 4) if concurrency_list else -1,
    }
    return summary

# ----- Main Execution -----
def run_all_tests():
    print("\n--- Starting Full Performance Test ---\n")
    for api in APIS:
        print(f"▶ {api['name']} | {api['method']} {api['endpoint']}")
        ALL_RESULTS.append(load_testing(api))
        ALL_RESULTS.append(endurance_testing(api))
        ALL_RESULTS.append(spike_testing(api))
        ALL_RESULTS.append(concurrency_testing(api))
    # Calculate summary
    summary = calc_summary(ALL_RESULTS)
    # Append summary as the last record of ALL_RESULTS
    ALL_RESULTS.append({
        "summary": summary,
        "timestamp": datetime.now().isoformat()
    })
    # Save results
    with open("test_report/performance_results.json", "w", encoding="utf-8") as f:
        json.dump(ALL_RESULTS, f, indent=2, ensure_ascii=False)
    print("\n✅ All results and summary saved to test_report/performance_results.json")
    print("\n---- SUMMARY ----")
    for k, v in summary.items():
        print(f"{k}: {v}")

if __name__ == "__main__":
    login_and_get_token()
    run_all_tests()