import concurrent.futures
import pytest
import requests
import time
import json
import os
import base64
from datetime import datetime

os.makedirs("test_report", exist_ok=True)
BASE_URL = "http://localhost:8000/api/v1"

def make_request(method, endpoint, data=None, params=None, headers=None, auth_token=None):
    url = BASE_URL + endpoint
    headers = headers.copy() if headers else {}
    headers.setdefault("Content-Type", "application/json")

    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"

    start_time = time.time()

    if method.upper() == "GET":
        response = requests.get(url, headers=headers, params=params)
    elif method.upper() == "POST":
        response = requests.post(url, headers=headers, json=data)
    elif method.upper() == "PUT":
        response = requests.put(url, headers=headers, json=data)
    elif method.upper() == "DELETE":
        response = requests.delete(url, headers=headers, params=params)
    elif method.upper() == "PATCH":
        response = requests.patch(url, headers=headers, json=data)
    else:
        raise ValueError(f"Method {method} not supported")
    
    duration = time.time() - start_time
    return response


LOGIN_DATA = {
    "citizen_id": "1234567890122",
    "password": "password"
}
test_results = []

@pytest.fixture(scope="session")
def auth_token():
    url = BASE_URL + "/auth/login"
    resp = requests.post(url, json=LOGIN_DATA, headers={"Content-Type": "application/json"})
    resp.raise_for_status()
    # ดึง access_token จาก res_data
    token = resp.json().get("res_data", {}).get("access_token")
    if not token:
        pytest.exit("❌ ไม่สามารถล็อกอินได้ - ไม่พบ access_token ใน response")
    return token


@pytest.fixture(scope="session", autouse=True)
def setup_and_teardown():
    global test_results
    test_results = []
    yield
    save_test_results()

def save_test_results():
    global test_results
    total_tests = len(test_results)
    passed_tests = len([r for r in test_results if r['status'] == 'PASSED'])
    failed_tests = len([r for r in test_results if r['status'] == 'FAILED'])
    summary = {
        "total_tests": total_tests,
        "passed": passed_tests,
        "failed": failed_tests,
        "success_rate": f"{(passed_tests/total_tests*100):.2f}%" if total_tests else "0%",
        "test_date": datetime.now().isoformat(),
        "results": test_results
    }
    with open("test_report/api_test_results.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)


# def get_valid_complaint_id(token):
#     response = requests.get(BASE_URL + "/complaints", headers={"Authorization": f"Bearer {token}"})
#     return response.json()["res_data"][0]["id"]


apikey_required_endpoints = [
    "/auth/verify-employee",
    "/auth/me",
    "/users",
    "/users/stats",
    "/departments",
    "/api-logs/stats?days=7&user_id=",
    "/api-logs/cleanup",
    "/complaint-metadata/types",
    "/complaint-metadata/subtypes",
    "/complaint-metadata/channels",
    "/complaints/00000000-0000-0000-0000-000000000001",
    "/geography/regions"
]


def _test_endpoint(
    test_name,
    method,
    endpoint,
    data=None,
    headers=None,
    token=None,
    auth_token=None,
    expect_success=True,
    params=None
):
    global test_results
    url = BASE_URL + endpoint

    _headers = headers.copy() if headers else {}
    _headers.setdefault("Content-Type", "application/json")
    if any(endpoint.startswith(ep) for ep in apikey_required_endpoints):
        _headers["x-api-key"] = "YOUR_SECRET_KEY"
    if token or auth_token:
        _headers["Authorization"] = f"Bearer {token or auth_token}"

    start = time.time()
    try:
        if method == "GET":
            resp = requests.get(url, headers=_headers, params=params)
        elif method == "POST":
            resp = requests.post(url, headers=_headers, json=data)
        elif method == "PUT":
            resp = requests.put(url, headers=_headers, json=data)
        elif method == "DELETE":
            resp = requests.delete(url, headers=_headers, params=params)
        elif method == "PATCH":
            resp = requests.patch(url, headers=_headers, json=data)
        else:
            pytest.skip(f"Method {method} ไม่รองรับ")

        elapsed = time.time() - start
        status = "PASSED"
        error = None

        if expect_success:
            if resp.status_code != 200:
                status = "FAILED"
                error = f"HTTP {resp.status_code}: {resp.text[:100]}"
            elif elapsed >= 2.5:
                status = "FAILED"
                error = f"Response time too slow: {elapsed:.2f}s"

        result = {
            "test_name": test_name,
            "method": method,
            "endpoint": endpoint,
            "duration": elapsed,
            "http_status": resp.status_code,
            "status": status,
            "error": error,
            "timestamp": datetime.now().isoformat()
        }

        test_results.append(result)

        if expect_success:
            assert resp.status_code == 200, f"API {endpoint} status {resp.status_code}, response: {resp.text}"
            assert elapsed < 2.5, f"API {endpoint} ใช้เวลานานเกินไป {elapsed:.2f} วินาที"

        return resp

    except Exception as e:
        elapsed = time.time() - start
        result = {
            "test_name": test_name,
            "method": method,
            "endpoint": endpoint,
            "duration": elapsed,
            "http_status": None,
            "status": "FAILED",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
        test_results.append(result)
        raise


class TestAPIIntegration:

    # Outgoing Reports 2
    def test_get_all_outgoing_reports2(auth_token):
        """GET /outgoing-reports2?skip=0&limit=100"""
        _test_endpoint(
            "test_get_all_outgoing_reports2",
            "GET",
            "/outgoing-reports2?skip=0&limit=100",
            token=auth_token
        )

    def test_get_outgoing_report2_options(auth_token):
        """GET /outgoing-reports2/options"""
        _test_endpoint(
            "test_get_outgoing_report2_options",
            "GET",
            "/outgoing-reports2/options",
            token=auth_token
        )

    def test_auto_fill_from_complaint2(auth_token, complaint_id):
        """GET /outgoing-reports2/auto-fill/{complaint_id}"""
        _test_endpoint(
            "test_auto_fill_from_complaint2",
            "GET",
            f"/outgoing-reports2/auto-fill/{complaint_id}",
            token=auth_token
        )

    def test_create_outgoing_report2(auth_token):
        """POST /outgoing-reports2"""
        data = {
            "position_id": "38a64e67-5df6-4370-a46b-7c160c5b92f7",
            "complaint_number": "MOF-20250624-00002",
            "complaint_number_date": "2025-06-24",
            "subject": "เรื่อง แจ้งผลการพิจารณาเรื่องร้องเรียน",
            "signature_authority_user_id": "0195d822-24ef-43d4-89db-926e1277a158",
            "department_id": "85c5547d-a0d4-4ea5-a4e3-e55d94837ddd",
            "user_id": None,
            "confidentiality_level": "ปกติ",
            "urgency_level": "ปกติ",
            "complaint_id": "81edc778-d618-4bc7-ad21-8ab81b14d4e7",
            "remarks": "หมายเหตุ"
        }
        _test_endpoint(
            "test_create_outgoing_report2",
            "POST",
            "/outgoing-reports2",
            data=data,
            token=auth_token
        )

    def test_get_outgoing_report2_by_id(auth_token, report2_id):
        """GET /outgoing-reports2/{report2_id}"""
        _test_endpoint(
            "test_get_outgoing_report2_by_id",
            "GET",
            f"/outgoing-reports2/{report2_id}",
            token=auth_token
        )

    # --- Outgoing Reports 3 ---

    def test_get_all_outgoing_reports3(auth_token):
        """GET /outgoing-reports3?skip=0&limit=100"""
        _test_endpoint(
            "test_get_all_outgoing_reports3",
            "GET",
            "/outgoing-reports3?skip=0&limit=100",
            token=auth_token
        )

    def test_get_outgoing_report3_options(auth_token):
        """GET /outgoing-reports3/options"""
        _test_endpoint(
            "test_get_outgoing_report3_options",
            "GET",
            "/outgoing-reports3/options",
            token=auth_token
        )

    def test_auto_fill_from_complaint3(auth_token, complaint_id):
        """GET /outgoing-reports3/auto-fill/{complaint_id}"""
        _test_endpoint(
            "test_auto_fill_from_complaint3",
            "GET",
            f"/outgoing-reports3/auto-fill/{complaint_id}",
            token=auth_token
        )

    def test_create_outgoing_report3(auth_token):
        """POST /outgoing-reports3"""
        data = {
            "position_id": "38a64e67-5df6-4370-a46b-7c160c5b92f7",
            "complaint_number": "MOF-20250624-00001",
            "complaint_number_date": "2025-06-24",
            "subject": "เรื่อง ขอทราบผลการพิจารณาเรื่องร้องเรียน",
            "signature_authority_user_id": "0195d822-24ef-43d4-89db-926e1277a158",
            "department_id": "85c5547d-a0d4-4ea5-a4e3-e55d94837ddd",
            "confidentiality_level": "ปกติ",
            "urgency_level": "ปกติ",
            "complaint_id": "81edc778-d618-4bc7-ad21-8ab81b14d4e7",
            "remarks": "หมายเหตุ"
        }
        _test_endpoint(
            "test_create_outgoing_report3",
            "POST",
            "/outgoing-reports3",
            data=data,
            token=auth_token
        )

    def test_get_outgoing_report3_by_id(auth_token, report3_id):
        """GET /outgoing-reports3/{report3_id}"""
        _test_endpoint(
            "test_get_outgoing_report3_by_id",
            "GET",
            f"/outgoing-reports3/{report3_id}",
            token=auth_token
        )

    # --- Outgoing Reports 4 ---

    def test_get_all_outgoing_reports4(auth_token):
        """GET /outgoing-reports4?skip=0&limit=100"""
        _test_endpoint(
            "test_get_all_outgoing_reports4",
            "GET",
            "/outgoing-reports4?skip=0&limit=100",
            token=auth_token
        )



    def test_get_outgoing_report4_options(auth_token):
        """GET /outgoing-reports4/options"""
        _test_endpoint(
            "test_get_outgoing_report4_options",
            "GET",
            "/outgoing-reports4/options",
            token=auth_token
        )

    def test_auto_fill_from_complaint4(auth_token, complaint_id):
        """GET /outgoing-reports4/auto-fill/{complaint_id}"""
        _test_endpoint(
            "test_auto_fill_from_complaint4",
            "GET",
            f"/outgoing-reports4/auto-fill/{complaint_id}",
            token=auth_token
        )

    def test_create_outgoing_report4(auth_token):
        """POST /outgoing-reports4"""
        data = {
            "reference_number": "เลขอ้างอิง-2025-001",
            "reference_date": "2025-06-24",
            "subject": "เรื่อง แจ้งผลการให้ผู้เกี่ยวข้องทราบ",
            "signature_authority_user_id": "0195d822-24ef-43d4-89db-926e1277a158",
            "department_id": "85c5547d-a0d4-4ea5-a4e3-e55d94837ddd",
            "user_id": "0195d822-24ef-43d4-89db-926e1277a158",
            "other_department": "หน่วยงานอื่นๆ",
            "confidentiality_level": "ปกติ",
            "urgency_level": "ปกติ",
            "remarks": "หมายเหตุ",
            "proposal_purpose": "เสนอเพื่อทราบ",
            "consideration_result": "ผลการพิจารณา",
            "complaint_id": "81edc778-d618-4bc7-ad21-8ab81b14d4e7"
        }
        _test_endpoint(
            "test_create_outgoing_report4",
            "POST",
            "/outgoing-reports4",
            data=data,
            token=auth_token
        )

    def test_get_outgoing_report4_by_id(auth_token, report4_id):
        """GET /outgoing-reports4/{report4_id}"""
        _test_endpoint(
            "test_get_outgoing_report4_by_id",
            "GET",
            f"/outgoing-reports4/{report4_id}",
            token=auth_token
        )


if __name__ == "__main__":
    # รันด้วย pytest
    pytest.main([__file__, "-v", "--tb=short"])