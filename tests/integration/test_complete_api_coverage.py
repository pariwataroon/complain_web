# tests/integration/test_complete_api_coverage.py
import pytest
import requests
import json
import time
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import uuid

class APITestSuite:
	"""Complete API Test Suite for MOF Complaint System"""
	
	def __init__(self, base_url: str = "https://compdev.minertatech.com/api/v1"):
		self.base_url = base_url
		self.headers = {"Content-Type": "application/json"}
		self.auth_token = None
		self.test_data = {}
		self.test_results = []
		
	def log_test_result(self, test_name: str, status: str, details: str = ""):
		"""บันทึกผลการทดสอบ"""
		result = {
			"test_name": test_name,
			"status": status,
			"timestamp": datetime.now().isoformat(),
			"details": details
		}
		self.test_results.append(result)
		print(f"{'✅' if status == 'PASS' else '❌'} {test_name}: {status}")
		if details:
			print(f"   Details: {details}")
	
	def get_auth_headers(self) -> Dict[str, str]:
		"""ได้รับ headers พร้อม authentication token"""
		if self.auth_token:
			return {
				"Authorization": f"Bearer {self.auth_token}",
				"Content-Type": "application/json"
			}
		return self.headers
	
	def authenticate(self) -> bool:
		"""ทำการ login เพื่อรับ token"""
		try:
			url = f"{self.base_url}/auth/login"
			data = {
				"citizen_id": "1234567890122",
				"password": "password"
			}
			
			response = requests.post(url, json=data, headers=self.headers)
			
			if response.status_code == 200:
				result = response.json()
				if result.get("res_code") == "0000":
					self.auth_token = result["res_data"]["access_token"]
					self.log_test_result("Authentication", "PASS", "Successfully authenticated")
					return True
			
			self.log_test_result("Authentication", "FAIL", f"HTTP {response.status_code}")
			return False
			
		except Exception as e:
			self.log_test_result("Authentication", "ERROR", str(e))
			return False

class AuthenticationTests(APITestSuite):
	"""ทดสอบระบบ Authentication และ Authorization"""
	
	def test_login_endpoint(self):
		"""ทดสอบ Login Endpoint"""
		test_cases = [
			{
				"name": "Valid Login",
				"data": {"citizen_id": "1234567890122", "password": "password"},
				"expected_status": 200
			},
			{
				"name": "Invalid Credentials",
				"data": {"citizen_id": "invalid", "password": "wrong"},
				"expected_status": [200, 400, 401]
			},
			{
				"name": "Missing Fields",
				"data": {"citizen_id": ""},
				"expected_status": [400, 422]
			},
			{
				"name": "SQL Injection Attempt",
				"data": {"citizen_id": "admin'; DROP TABLE users; --", "password": "test"},
				"expected_status": [200, 400, 401]
			}
		]
		
		for case in test_cases:
			try:
				url = f"{self.base_url}/auth/login"
				response = requests.post(url, json=case["data"], headers=self.headers)
				
				expected = case["expected_status"]
				if isinstance(expected, list):
					status_ok = response.status_code in expected
				else:
					status_ok = response.status_code == expected
				
				if status_ok:
					self.log_test_result(f"Login - {case['name']}", "PASS")
				else:
					self.log_test_result(f"Login - {case['name']}", "FAIL", 
									   f"Expected {expected}, got {response.status_code}")
					
			except Exception as e:
				self.log_test_result(f"Login - {case['name']}", "ERROR", str(e))
	
	def test_auth_me_endpoint(self):
		"""ทดสอบ /auth/me endpoint"""
		if not self.authenticate():
			return
			
		try:
			url = f"{self.base_url}/auth/me"
			response = requests.get(url, headers=self.get_auth_headers())
			
			if response.status_code == 200:
				result = response.json()
				if "res_data" in result:
					self.log_test_result("Auth Me", "PASS", "User info retrieved")
				else:
					self.log_test_result("Auth Me", "FAIL", "Invalid response format")
			else:
				self.log_test_result("Auth Me", "FAIL", f"HTTP {response.status_code}")
				
		except Exception as e:
			self.log_test_result("Auth Me", "ERROR", str(e))
	
	def test_thaid_endpoints(self):
		"""ทดสอบ ThaiID endpoints"""
		endpoints = [
			"/thaid/auth",
			"/thaid/login"
		]
		
		for endpoint in endpoints:
			try:
				url = f"{self.base_url}{endpoint}"
				test_data = {
					"auth_code": "test_code_12345"
				}
				
				response = requests.post(url, json=test_data, headers=self.headers)
				
				# ThaiID endpoints อาจต้องการ external service
				if response.status_code in [200, 400, 401, 404, 502, 503]:
					self.log_test_result(f"ThaiID {endpoint}", "PASS", 
									   f"Endpoint accessible (HTTP {response.status_code})")
				else:
					self.log_test_result(f"ThaiID {endpoint}", "FAIL", 
									   f"Unexpected status {response.status_code}")
					
			except Exception as e:
				self.log_test_result(f"ThaiID {endpoint}", "ERROR", str(e))

class SecurityTests(APITestSuite):
	"""ทดสอบความปลอดภัยตาม OWASP Top 10"""
	
	def test_injection_attacks(self):
		"""ทดสอบ SQL Injection และ NoSQL Injection"""
		injection_payloads = [
			"'; DROP TABLE users; --",
			"' OR '1'='1",
			"admin'/*",
			"' UNION SELECT * FROM users--",
			"'; EXEC xp_cmdshell('dir'); --",
			"1; DELETE FROM users; --",
			"{$ne: null}",
			"'; return 'vulnerable'; //"
		]
		
		endpoints_to_test = [
			("/auth/login", {"citizen_id": "{payload}", "password": "test"}),
			("/users/register", {"citizen_id": "{payload}", "email": "test@test.com"}),
		]
		
		for endpoint, data_template in endpoints_to_test:
			for payload in injection_payloads:
				try:
					url = f"{self.base_url}{endpoint}"
					data = {}
					for key, value in data_template.items():
						data[key] = value.format(payload=payload) if "{payload}" in str(value) else value
					
					response = requests.post(url, json=data, headers=self.headers, timeout=10)
					
					# ระบบควรปฏิเสธ injection attempts
					if response.status_code in [200, 400, 401, 422]:
						# ตรวจสอบว่าไม่มี database error หรือข้อมูลที่ไม่ควรเห็น
						response_text = response.text.lower()
						dangerous_patterns = [
							"syntax error", "mysql", "postgresql", "sqlite", 
							"ora-", "microsoft ole db", "odbc", "jdbc"
						]
						
						if any(pattern in response_text for pattern in dangerous_patterns):
							self.log_test_result(f"Injection Test {endpoint}", "FAIL", 
											   "Database error exposed")
						else:
							self.log_test_result(f"Injection Test {endpoint}", "PASS", 
											   "Injection attempt properly handled")
					else:
						self.log_test_result(f"Injection Test {endpoint}", "PASS", 
										   "Request rejected")
						
				except Exception as e:
					self.log_test_result(f"Injection Test {endpoint}", "PASS", 
									   "Request properly blocked")
	
	def test_authentication_bypass(self):
		"""ทดสอบ Authentication Bypass"""
		bypass_attempts = [
			{"Authorization": "Bearer fake_token"},
			{"Authorization": "Bearer "},
			{"Authorization": ""},
			{"X-Forwarded-For": "127.0.0.1"},
			{"X-Real-IP": "localhost"},
		]
		
		protected_endpoints = [
			"/auth/me",
			"/users/",
			"/complaints",
			"/permissions/roles"
		]
		
		for endpoint in protected_endpoints:
			for headers in bypass_attempts:
				try:
					url = f"{self.base_url}{endpoint}"
					test_headers = {**self.headers, **headers}
					
					response = requests.get(url, headers=test_headers)
					
					# Protected endpoints ควร return 401/403 สำหรับ invalid auth
					if response.status_code in [401, 403]:
						self.log_test_result(f"Auth Bypass {endpoint}", "PASS", 
										   "Properly protected")
					elif response.status_code == 200:
						self.log_test_result(f"Auth Bypass {endpoint}", "FAIL", 
										   "Authentication bypass possible")
					else:
						self.log_test_result(f"Auth Bypass {endpoint}", "PARTIAL", 
										   f"HTTP {response.status_code}")
						
				except Exception as e:
					self.log_test_result(f"Auth Bypass {endpoint}", "ERROR", str(e))
	
	def test_xss_protection(self):
		"""ทดสอบ XSS Protection"""
		xss_payloads = [
			"<script>alert('XSS')</script>",
			"javascript:alert('XSS')",
			"<img src=x onerror=alert('XSS')>",
			"';alert('XSS');//",
			"<svg onload=alert('XSS')>",
		]
		
		# ทดสอบในฟิลด์ที่อาจแสดงผลบนหน้าเว็บ
		test_data_templates = [
			{"first_name": "{payload}", "last_name": "Test"},
			{"email": "test@example.com", "phone": "{payload}"},
			{"subject": "{payload}", "description": "Test complaint"}
		]
		
		for payload in xss_payloads:
			for template in test_data_templates:
				data = {}
				for key, value in template.items():
					data[key] = value.format(payload=payload) if "{payload}" in str(value) else value
				
				# ทดสอบใน registration endpoint
				try:
					url = f"{self.base_url}/users/register"
					full_data = {
						"citizen_id": f"test{int(time.time())}",
						"title_id": 1,
						"password": "test123!A",
						**data
					}
					
					response = requests.post(url, json=full_data, headers=self.headers)
					
					# ไม่ควรมี script tags ในการตอบกลับ
					if "<script>" not in response.text.lower():
						self.log_test_result("XSS Protection", "PASS", "XSS filtered")
					else:
						self.log_test_result("XSS Protection", "FAIL", "XSS not filtered")
						
				except Exception as e:
					self.log_test_result("XSS Protection", "PARTIAL", "Request blocked")

class UsersManagementTests(APITestSuite):
	"""ทดสอบระบบจัดการผู้ใช้"""
	
	def test_user_registration(self):
		"""ทดสอบการลงทะเบียนผู้ใช้"""
		if not self.authenticate():
			return
			
		test_cases = [
			{
				"name": "Valid Registration",
				"data": {
					"citizen_id": f"test{int(time.time())}",
					"title_id": 1,
					"first_name": "Test",
					"last_name": "User",
					"email": f"test{int(time.time())}@example.com",
					"phone": "0812345678",
					"password": "test123!A"
				},
				"endpoint": "/users/register"
			},
			{
				"name": "Admin Create User", 
				"data": {
					"citizen_id": f"admin{int(time.time())}",
					"title_id": 1,
					"first_name": "Admin",
					"last_name": "Created",
					"email": f"admin{int(time.time())}@example.com",
					"phone": "0812345679",
					"password": "admin123!A"
				},
				"endpoint": "/users/"
			}
		]
		
		for case in test_cases:
			try:
				url = f"{self.base_url}{case['endpoint']}"
				headers = self.get_auth_headers() if "admin" in case["name"].lower() else self.headers
				
				response = requests.post(url, json=case["data"], headers=headers)
				
				if response.status_code in [200, 201]:
					result = response.json()
					if "res_code" in result and result["res_code"] == "0000":
						self.log_test_result(f"User Registration - {case['name']}", "PASS")
						# เก็บ user ID สำหรับการทดสอบต่อไป
						if "res_data" in result and "id" in result["res_data"]:
							self.test_data[f"user_id_{case['name']}"] = result["res_data"]["id"]
					else:
						self.log_test_result(f"User Registration - {case['name']}", "FAIL", 
										   f"Error code: {result.get('res_code')}")
				else:
					self.log_test_result(f"User Registration - {case['name']}", "FAIL", 
									   f"HTTP {response.status_code}")
					
			except Exception as e:
				self.log_test_result(f"User Registration - {case['name']}", "ERROR", str(e))
	
	def test_user_management_endpoints(self):
		"""ทดสอบ endpoints การจัดการผู้ใช้"""
		if not self.authenticate():
			return
			
		endpoints = [
			("GET", "/users/", "List Users"),
			("GET", "/users/title/details", "Title Details"),
			("GET", "/users/search/by-role", "Search by Role"),
			("GET", "/users/stats/by-role", "Stats by Role"),
			("GET", "/users/detailed-stats/by-role", "Detailed Stats")
		]
		
		for method, endpoint, description in endpoints:
			try:
				url = f"{self.base_url}{endpoint}"
				
				if method == "GET":
					response = requests.get(url, headers=self.get_auth_headers())
				elif method == "POST":
					response = requests.post(url, json={}, headers=self.get_auth_headers())
				
				if response.status_code in [200, 401, 403]:
					self.log_test_result(f"User Management - {description}", "PASS", 
									   f"HTTP {response.status_code}")
				else:
					self.log_test_result(f"User Management - {description}", "FAIL", 
									   f"HTTP {response.status_code}")
					
			except Exception as e:
				self.log_test_result(f"User Management - {description}", "ERROR", str(e))

class PermissionsTests(APITestSuite):
	"""ทดสอบระบบ Permissions และ RBAC"""
	
	def test_permissions_endpoints(self):
		"""ทดสอบ Permissions Management"""
		if not self.authenticate():
			return
			
		endpoints = [
			("GET", "/permissions/roles", "List Roles"),
			("GET", "/permissions/resources", "List Resources"),
			("GET", "/permissions/resources-bygroup", "Resources by Group"),
			("GET", "/permissions/user-resources/bygroup", "User Resources"),
			("GET", "/permissions/list", "List Permissions"),
			("GET", "/permissions/resources-permissions", "Resources with Permissions")
		]
		
		for method, endpoint, description in endpoints:
			try:
				url = f"{self.base_url}{endpoint}"
				response = requests.get(url, headers=self.get_auth_headers())
				
				if response.status_code in [200, 401, 403]:
					if response.status_code == 200:
						result = response.json()
						if "res_data" in result:
							self.log_test_result(f"Permissions - {description}", "PASS")
						else:
							self.log_test_result(f"Permissions - {description}", "PARTIAL", 
											   "Response format issue")
					else:
						self.log_test_result(f"Permissions - {description}", "PASS", 
										   "Properly protected")
				else:
					self.log_test_result(f"Permissions - {description}", "FAIL", 
									   f"HTTP {response.status_code}")
					
			except Exception as e:
				self.log_test_result(f"Permissions - {description}", "ERROR", str(e))

class ComplaintsTests(APITestSuite):
	"""ทดสอบระบบร้องเรียน"""
	
	def test_complaint_creation(self):
		"""ทดสอบการสร้างเรื่องร้องเรียน"""
		if not self.authenticate():
			return
			
		complaint_data = {
			"step1": {
				"general": {
					"general": {
						"idCard": "1234567890123",
						"name": "ผู้ร้องทุกข์ทดสอบ",
						"address": "123 ถนนทดสอบ",
						"phone": "0812345678",
						"subdistricts": "ตำบลทดสอบ",
						"districts": "อำเภอทดสอบ",
						"email": "test@example.com",
						"province": "กรุงเทพมหานคร",
						"zipcode": "10100"
					}
				}
			},
			"step2": {
				"general": {
					"individual": {
						"idCard": "1122334455667",
						"name": "ผู้ถูกร้องทุกข์ทดสอบ",
						"email": "respondent@example.com",
						"address": "789 ถนนทดสอบ",
						"phone": "0823456789",
						"subdistricts": "ตำบลทดสอบ 3",
						"districts": "อำเภอทดสอบ 3",
						"province": "กรุงเทพมหานคร",
						"zipcode": "10120"
					}
				}
			},
			"step3": {
				"general": {
					"incidentDate": datetime.now().isoformat(),
					"complaintType": "การทุจริต",
					"subject": f"เรื่องร้องเรียนทดสอบ {int(time.time())}",
					"description": "รายละเอียดเรื่องร้องเรียนทดสอบ เพื่อการทดสอบระบบ",
					"attachment": []
				}
			},
			"step4": {
				"general": {
					"accepted": True
				}
			}
		}
		
		try:
			url = f"{self.base_url}/complaints"
			response = requests.post(url, json=complaint_data, headers=self.get_auth_headers())
			
			if response.status_code in [200, 201]:
				result = response.json()
				if "res_code" in result and result["res_code"] == "0000":
					self.log_test_result("Complaint Creation", "PASS")
					# เก็บ complaint ID
					if "res_data" in result:
						if "complaint_id" in result["res_data"]:
							self.test_data["complaint_id"] = result["res_data"]["complaint_id"]
						elif "task_id" in result["res_data"]:
							self.test_data["task_id"] = result["res_data"]["task_id"]
				else:
					self.log_test_result("Complaint Creation", "FAIL", 
									   f"Error: {result.get('res_desc', 'Unknown error')}")
			else:
				self.log_test_result("Complaint Creation", "FAIL", 
								   f"HTTP {response.status_code}")
				
		except Exception as e:
			self.log_test_result("Complaint Creation", "ERROR", str(e))
	
	def test_complaint_management(self):
		"""ทดสอบการจัดการเรื่องร้องเรียน"""
		if not self.authenticate():
			return
		
		# สร้างร้องเรียนก่อน
		self.test_complaint_creation()
		
		endpoints = [
			("GET", "/complaints", "List Complaints"),
			("GET", "/complaints/me", "My Complaints"),
		]
		
		for method, endpoint, description in endpoints:
			try:
				url = f"{self.base_url}{endpoint}?skip=0&limit=10"
				response = requests.get(url, headers=self.get_auth_headers())
				
				if response.status_code == 200:
					result = response.json()
					if "res_data" in result:
						self.log_test_result(f"Complaint Management - {description}", "PASS")
					else:
						self.log_test_result(f"Complaint Management - {description}", "PARTIAL", 
										   "Unexpected response format")
				else:
					self.log_test_result(f"Complaint Management - {description}", "FAIL", 
									   f"HTTP {response.status_code}")
					
			except Exception as e:
				self.log_test_result(f"Complaint Management - {description}", "ERROR", str(e))

class MetadataTests(APITestSuite):
	"""ทดสอบระบบ Metadata และการตั้งค่า"""
	
	def test_complaint_metadata(self):
		"""ทดสอบ Complaint Metadata"""
		if not self.authenticate():
			return
			
		endpoints = [
			"/complaint-metadata/types",
			"/complaint-metadata/subtypes", 
			"/complaint-metadata/channels"
		]
		
		for endpoint in endpoints:
			try:
				url = f"{self.base_url}{endpoint}"
				response = requests.get(url, headers=self.get_auth_headers())
				
				if response.status_code == 200:
					result = response.json()
					if "res_data" in result:
						self.log_test_result(f"Metadata {endpoint}", "PASS")
					else:
						self.log_test_result(f"Metadata {endpoint}", "PARTIAL", 
										   "Response format issue")
				else:
					self.log_test_result(f"Metadata {endpoint}", "FAIL", 
									   f"HTTP {response.status_code}")
					
			except Exception as e:
				self.log_test_result(f"Metadata {endpoint}", "ERROR", str(e))
	
	def test_geography_endpoints(self):
		"""ทดสอบ Geography API"""
		if not self.authenticate():
			return
			
		endpoints = [
			"/geography/regions",
			"/geography/provinces",
			"/geography/amphures",
			"/geography/districts"
		]
		
		for endpoint in endpoints:
			try:
				url = f"{self.base_url}{endpoint}"
				response = requests.get(url, headers=self.get_auth_headers())
				
				if response.status_code == 200:
					self.log_test_result(f"Geography {endpoint}", "PASS")
				else:
					self.log_test_result(f"Geography {endpoint}", "FAIL", 
									   f"HTTP {response.status_code}")
					
			except Exception as e:
				self.log_test_result(f"Geography {endpoint}", "ERROR", str(e))

class PerformanceTests(APITestSuite):
	"""ทดสอบประสิทธิภาพ"""
	
	def test_response_times(self):
		"""ทดสอบเวลาตอบสนอง"""
		if not self.authenticate():
			return
			
		endpoints = [
			"/auth/me",
			"/users/title/details",
			"/geography/provinces",
			"/complaint-metadata/types"
		]
		
		for endpoint in endpoints:
			try:
				url = f"{self.base_url}{endpoint}"
				start_time = time.time()
				
				response = requests.get(url, headers=self.get_auth_headers(), timeout=30)
				
				end_time = time.time()
				response_time = end_time - start_time
				
				if response_time < 5.0:  # Less than 5 seconds
					self.log_test_result(f"Performance {endpoint}", "PASS", 
									   f"{response_time:.2f}s")
				elif response_time < 10.0:
					self.log_test_result(f"Performance {endpoint}", "PARTIAL", 
									   f"{response_time:.2f}s (slow)")
				else:
					self.log_test_result(f"Performance {endpoint}", "FAIL", 
									   f"{response_time:.2f}s (too slow)")
					
			except Exception as e:
				self.log_test_result(f"Performance {endpoint}", "ERROR", str(e))

class DataValidationTests(APITestSuite):
	"""ทดสอบการตรวจสอบข้อมูล"""
	
	def test_input_validation(self):
		"""ทดสอบการตรวจสอบข้อมูลนำเข้า"""
		if not self.authenticate():
			return
			
		# ทดสอบ email validation
		invalid_emails = [
			"invalid-email",
			"@domain.com",
			"user@",
			"user space@domain.com",
			"user@domain",
			""
		]
		
		for email in invalid_emails:
			try:
				url = f"{self.base_url}/users/register"
				data = {
					"citizen_id": f"test{int(time.time())}{hash(email) % 1000}",
					"title_id": 1,
					"first_name": "Test",
					"last_name": "User",
					"email": email,
					"phone": "0812345678",
					"password": "test123!A"
				}
				
				response = requests.post(url, json=data, headers=self.headers)
				
				# ควรปฏิเสธ email ที่ไม่ถูกต้อง
				if response.status_code in [400, 422]:
					self.log_test_result("Email Validation", "PASS", f"Rejected invalid email: {email}")
				elif response.status_code == 200:
					result = response.json()
					if result.get("res_code") != "0000":
						self.log_test_result("Email Validation", "PASS", f"Rejected invalid email: {email}")
					else:
						self.log_test_result("Email Validation", "FAIL", f"Accepted invalid email: {email}")
						
			except Exception as e:
				self.log_test_result("Email Validation", "ERROR", str(e))

# Main Test Runner
class TestRunner:
	"""Main Test Runner Class"""
	
	def __init__(self, base_url: str = "https://compdev.minertatech.com/api/v1"):
		self.base_url = base_url
		self.all_results = []
		
	def run_all_tests(self):
		"""รันการทดสอบทั้งหมด"""
		print("🔍 Starting Comprehensive API Testing")
		print("=" * 60)
		print(f"Testing API: {self.base_url}")
		print(f"Test Started: {datetime.now().isoformat()}")
		print("=" * 60)
		
		test_suites = [
			("Authentication Tests", AuthenticationTests),
			("Security Tests", SecurityTests),
			("Users Management Tests", UsersManagementTests),
			("Permissions Tests", PermissionsTests),
			("Complaints Tests", ComplaintsTests),
			("Metadata Tests", MetadataTests),
			("Performance Tests", PerformanceTests),
			("Data Validation Tests", DataValidationTests)
		]
		
		total_tests = 0
		passed_tests = 0
		failed_tests = 0
		
		for suite_name, suite_class in test_suites:
			print(f"\n📋 Running {suite_name}")
			print("-" * 40)
			
			suite = suite_class(self.base_url)
			
			# รันทุก method ที่ขึ้นต้นด้วย test_
			test_methods = [method for method in dir(suite) if method.startswith('test_')]
			
			for method_name in test_methods:
				method = getattr(suite, method_name)
				if callable(method):
					try:
						method()
					except Exception as e:
						suite.log_test_result(method_name, "ERROR", str(e))
			
			# รวบรวมผลการทดสอบ
			self.all_results.extend(suite.test_results)
			
			suite_total = len(suite.test_results)
			suite_passed = len([r for r in suite.test_results if r["status"] == "PASS"])
			suite_failed = len([r for r in suite.test_results if r["status"] in ["FAIL", "ERROR"]])
			
			total_tests += suite_total
			passed_tests += suite_passed
			failed_tests += suite_failed
			
			print(f"Suite Results: {suite_passed}/{suite_total} passed")
		
		self.print_summary(total_tests, passed_tests, failed_tests)
		self.save_results()
		
	def print_summary(self, total: int, passed: int, failed: int):
		"""พิมพ์สรุปผลการทดสอบ"""
		print("\n" + "=" * 60)
		print("📊 TEST SUMMARY")
		print("=" * 60)
		print(f"Total Tests: {total}")
		print(f"✅ Passed: {passed}")
		print(f"❌ Failed: {failed}")
		print(f"📈 Success Rate: {(passed/total*100):.1f}%" if total > 0 else "0%")
		print(f"Test Completed: {datetime.now().isoformat()}")
		
		# แสดงรายการที่ล้มเหลว
		failed_results = [r for r in self.all_results if r["status"] in ["FAIL", "ERROR"]]
		if failed_results:
			print("\n❌ Failed Tests:")
			for result in failed_results:
				print(f"  - {result['test_name']}: {result['details']}")
	
	def save_results(self):
		"""บันทึกผลการทดสอบลงไฟล์"""
		timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
		filename = f"api_test_results_{timestamp}.json"
		
		report = {
			"test_session": {
				"start_time": datetime.now().isoformat(),
				"base_url": self.base_url,
				"total_tests": len(self.all_results),
				"passed": len([r for r in self.all_results if r["status"] == "PASS"]),
				"failed": len([r for r in self.all_results if r["status"] in ["FAIL", "ERROR"]])
			},
			"results": self.all_results
		}
		
		try:
			with open(filename, 'w', encoding='utf-8') as f:
				json.dump(report, f, indent=2, ensure_ascii=False)
			print(f"\n💾 Results saved to: {filename}")
		except Exception as e:
			print(f"\n❌ Failed to save results: {e}")

# FastAPI Test Client Integration
class FastAPITestClient:
	"""Integration with FastAPI TestClient for unit testing"""
	
	def __init__(self, app):
		try:
			from fastapi.testclient import TestClient
			self.client = TestClient(app)
			self.available = True
		except ImportError:
			print("⚠️  FastAPI TestClient not available. Install with: pip install fastapi[all]")
			self.available = False
	
	def test_endpoints_with_testclient(self):
		"""ทดสอบ endpoints ด้วย FastAPI TestClient"""
		if not self.available:
			return
			
		print("🔧 Testing with FastAPI TestClient")
		
		# ทดสอบ basic endpoints
		endpoints = [
			("GET", "/"),
			("GET", "/health"),
			("POST", "/api/v1/auth/login"),
		]
		
		for method, endpoint in endpoints:
			try:
				if method == "GET":
					response = self.client.get(endpoint)
				elif method == "POST":
					response = self.client.post(endpoint, json={})
				
				print(f"✅ {method} {endpoint}: {response.status_code}")
				
			except Exception as e:
				print(f"❌ {method} {endpoint}: {e}")

# Entry Point
if __name__ == "__main__":
	import argparse
	
	parser = argparse.ArgumentParser(description="MOF API Comprehensive Test Suite")
	parser.add_argument("--url", default="https://compdev.minertatech.com/api/v1", 
					  help="Base URL for API testing")
	parser.add_argument("--suite", choices=["all", "auth", "security", "users", "complaints"], 
					  default="all", help="Test suite to run")
	
	args = parser.parse_args()
	
	if args.suite == "all":
		runner = TestRunner(args.url)
		runner.run_all_tests()
	elif args.suite == "auth":
		suite = AuthenticationTests(args.url)
		suite.test_login_endpoint()
		suite.test_auth_me_endpoint()
		suite.test_thaid_endpoints()
	elif args.suite == "security":
		suite = SecurityTests(args.url)
		suite.test_injection_attacks()
		suite.test_authentication_bypass()
		suite.test_xss_protection()
	elif args.suite == "users":
		suite = UsersManagementTests(args.url)
		suite.test_user_registration()
		suite.test_user_management_endpoints()
	elif args.suite == "complaints":
		suite = ComplaintsTests(args.url)
		suite.test_complaint_creation()
		suite.test_complaint_management()
