import requests
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Tuple
import base64
import hashlib
import random
import string
from urllib.parse import quote, unquote
import xml.etree.ElementTree as ET

class OWASPTop10Tester:
    """
    OWASP Top 10 2021 Security Testing Framework
    ทดสอบความปลอดภัยตาม OWASP Top 10 2021
    """
    
    def __init__(self, base_url: str = "http://localhost:8000/api/v1"):
        self.base_url = base_url
        self.session = requests.Session()
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "target": base_url,
            "owasp_version": "2021",
            "summary": {
                "total_tests": 0,
                "passed": 0,
                "failed": 0,
                "critical": 0,
                "high": 0,
                "medium": 0,
                "low": 0
            },
            "vulnerabilities": [],
            "test_details": {}
        }
        
        # OWASP Top 10 2021 Categories
        self.owasp_categories = {
            "A01": "Broken Access Control",
            "A02": "Cryptographic Failures", 
            "A03": "Injection",
            "A04": "Insecure Design",
            "A05": "Security Misconfiguration",
            "A06": "Vulnerable and Outdated Components",
            "A07": "Identification and Authentication Failures",
            "A08": "Software and Data Integrity Failures",
            "A09": "Security Logging and Monitoring Failures",
            "A10": "Server-Side Request Forgery (SSRF)"
        }
    
    def log_vulnerability(self, category: str, title: str, severity: str, 
                         description: str, evidence: str, recommendation: str):
        """บันทึกช่องโหว่ที่พบ"""
        vuln = {
            "id": f"OWASP-{category}-{len(self.results['vulnerabilities'])+1:03d}",
            "category": category,
            "category_name": self.owasp_categories.get(category, "Unknown"),
            "title": title,
            "severity": severity,
            "description": description,
            "evidence": evidence,
            "recommendation": recommendation,
            "timestamp": datetime.now().isoformat()
        }
        
        self.results["vulnerabilities"].append(vuln)
        self.results["summary"][severity.lower()] += 1
        
        return vuln
    
    def test_server_connectivity(self) -> bool:
        """ทดสอบการเชื่อมต่อ server"""
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            return response.status_code in [200, 404, 405]
        except:
            return False
    
    # ==================== A01: Broken Access Control ====================
    
    def test_a01_broken_access_control(self) -> Dict[str, Any]:
        """A01:2021 – Broken Access Control"""
        category = "A01"
        test_results = {
            "category": category,
            "name": self.owasp_categories[category],
            "tests_performed": [],
            "vulnerabilities_found": 0
        }
        
        # Test 1: Direct Object Reference
        test_results["tests_performed"].append(self._test_direct_object_reference())
        
        # Test 2: Missing Function Level Access Control
        test_results["tests_performed"].append(self._test_missing_function_access_control())
        
        # Test 3: Privilege Escalation
        test_results["tests_performed"].append(self._test_privilege_escalation())
        
        # Test 4: CORS Misconfiguration
        test_results["tests_performed"].append(self._test_cors_misconfiguration())
        
        self.results["test_details"][category] = test_results
        return test_results
    
    def _test_direct_object_reference(self) -> Dict[str, Any]:
        """ทดสอบ Direct Object Reference"""
        test_name = "Direct Object Reference (IDOR)"
        
        try:
            # ทดสอบการเข้าถึง user ID อื่น
            test_cases = [
                f"{self.base_url}/users/1",
                f"{self.base_url}/users/2", 
                f"{self.base_url}/users/999",
                f"{self.base_url}/complaints/1",
                f"{self.base_url}/complaints/../admin"
            ]
            
            vulnerabilities = []
            for url in test_cases:
                response = self.session.get(url)
                if response.status_code == 200:
                    # ตรวจสอบว่าได้ข้อมูลที่ไม่ควรเข้าถึงได้หรือไม่
                    try:
                        data = response.json()
                        if isinstance(data, dict) and ("id" in data or "user" in data):
                            vuln = self.log_vulnerability(
                                "A01", 
                                "Insecure Direct Object Reference",
                                "HIGH",
                                f"API allows direct access to objects without proper authorization check at {url}",
                                f"HTTP 200 response with data: {str(data)[:200]}...",
                                "Implement proper authorization checks for all object access"
                            )
                            vulnerabilities.append(vuln)
                    except:
                        pass
            
            return {
                "test": test_name,
                "status": "FAIL" if vulnerabilities else "PASS",
                "vulnerabilities": len(vulnerabilities),
                "details": f"Tested {len(test_cases)} endpoints for IDOR"
            }
            
        except Exception as e:
            return {
                "test": test_name,
                "status": "ERROR",
                "error": str(e)
            }
    
    def _test_missing_function_access_control(self) -> Dict[str, Any]:
        """ทดสอบการควบคุมการเข้าถึงฟังก์ชัน"""
        test_name = "Missing Function Level Access Control"
        
        try:
            # ทดสอบ admin endpoints โดยไม่มี authentication
            admin_endpoints = [
                f"{self.base_url}/admin/users",
                f"{self.base_url}/admin/complaints", 
                f"{self.base_url}/admin/reports",
                f"{self.base_url}/admin/settings"
            ]
            
            vulnerabilities = []
            for endpoint in admin_endpoints:
                response = self.session.get(endpoint)
                if response.status_code in [200, 201]:
                    vuln = self.log_vulnerability(
                        "A01",
                        "Missing Function Level Access Control", 
                        "HIGH",
                        f"Admin endpoint accessible without authentication: {endpoint}",
                        f"HTTP {response.status_code} response received",
                        "Implement proper authentication and authorization for admin functions"
                    )
                    vulnerabilities.append(vuln)
            
            return {
                "test": test_name,
                "status": "FAIL" if vulnerabilities else "PASS",
                "vulnerabilities": len(vulnerabilities)
            }
            
        except Exception as e:
            return {"test": test_name, "status": "ERROR", "error": str(e)}
    
    def _test_privilege_escalation(self) -> Dict[str, Any]:
        """ทดสอบการเพิ่มสิทธิ์"""
        test_name = "Privilege Escalation"
        
        try:
            # ทดสอบการเปลี่ยน role ใน request
            test_data = {
                "citizen_id": "1234567890123",
                "password": "test123",
                "role": "admin",  # พยายามเพิ่มสิทธิ์
                "is_admin": True
            }
            
            response = self.session.post(f"{self.base_url}/auth/login", json=test_data)
            
            vulnerabilities = []
            if response.status_code == 200:
                try:
                    data = response.json()
                    if "role" in str(data).lower() and "admin" in str(data).lower():
                        vuln = self.log_vulnerability(
                            "A01",
                            "Privilege Escalation via Parameter Manipulation",
                            "CRITICAL", 
                            "User can escalate privileges by adding admin parameters to login request",
                            f"Response contains admin privileges: {data}",
                            "Implement server-side privilege validation and never trust client-side role assignments"
                        )
                        vulnerabilities.append(vuln)
                except:
                    pass
            
            return {
                "test": test_name,
                "status": "FAIL" if vulnerabilities else "PASS",
                "vulnerabilities": len(vulnerabilities)
            }
            
        except Exception as e:
            return {"test": test_name, "status": "ERROR", "error": str(e)}
    
    def _test_cors_misconfiguration(self) -> Dict[str, Any]:
        """ทดสอบ CORS Misconfiguration"""
        test_name = "CORS Misconfiguration"
        
        try:
            headers = {
                "Origin": "https://evil.com",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type"
            }
            
            response = self.session.options(f"{self.base_url}/auth/login", headers=headers)
            
            vulnerabilities = []
            cors_headers = {
                "access-control-allow-origin": response.headers.get("Access-Control-Allow-Origin", ""),
                "access-control-allow-credentials": response.headers.get("Access-Control-Allow-Credentials", "")
            }
            
            if cors_headers["access-control-allow-origin"] == "*" and cors_headers["access-control-allow-credentials"] == "true":
                vuln = self.log_vulnerability(
                    "A01",
                    "CORS Misconfiguration",
                    "MEDIUM",
                    "CORS allows any origin with credentials, enabling potential credential theft",
                    f"CORS headers: {cors_headers}",
                    "Configure CORS to allow only trusted origins and avoid wildcard with credentials"
                )
                vulnerabilities.append(vuln)
            
            return {
                "test": test_name,
                "status": "FAIL" if vulnerabilities else "PASS", 
                "vulnerabilities": len(vulnerabilities)
            }
            
        except Exception as e:
            return {"test": test_name, "status": "ERROR", "error": str(e)}
    
    # ==================== A02: Cryptographic Failures ====================
    
    def test_a02_cryptographic_failures(self) -> Dict[str, Any]:
        """A02:2021 – Cryptographic Failures"""
        category = "A02"
        test_results = {
            "category": category,
            "name": self.owasp_categories[category],
            "tests_performed": [],
            "vulnerabilities_found": 0
        }
        
        test_results["tests_performed"].append(self._test_weak_encryption())
        test_results["tests_performed"].append(self._test_insecure_transmission())
        test_results["tests_performed"].append(self._test_weak_hashing())
        
        self.results["test_details"][category] = test_results
        return test_results
    
    def _test_weak_encryption(self) -> Dict[str, Any]:
        """ทดสอบการเข้ารหัสที่อ่อนแอ"""
        test_name = "Weak Encryption Detection"
        
        try:
            # ทดสอบ HTTP vs HTTPS
            vulnerabilities = []
            if self.base_url.startswith("http://"):
                vuln = self.log_vulnerability(
                    "A02",
                    "Unencrypted Data Transmission",
                    "HIGH",
                    "API is served over HTTP instead of HTTPS",
                    f"Base URL: {self.base_url}",
                    "Implement HTTPS with strong TLS configuration"
                )
                vulnerabilities.append(vuln)
            
            return {
                "test": test_name,
                "status": "FAIL" if vulnerabilities else "PASS",
                "vulnerabilities": len(vulnerabilities)
            }
            
        except Exception as e:
            return {"test": test_name, "status": "ERROR", "error": str(e)}
    
    def _test_insecure_transmission(self) -> Dict[str, Any]:
        """ทดสอบการส่งข้อมูลที่ไม่ปลอดภัย"""
        test_name = "Insecure Data Transmission"
        
        try:
            # ทดสอบการส่งรหัสผ่านแบบ plain text
            test_data = {"citizen_id": "test", "password": "plaintext123"}
            
            response = self.session.post(f"{self.base_url}/auth/login", json=test_data)
            
            vulnerabilities = []
            # ตรวจสอบว่ามีการ log หรือ echo password กลับมาหรือไม่
            if "plaintext123" in response.text:
                vuln = self.log_vulnerability(
                    "A02",
                    "Password Exposure in Response",
                    "HIGH", 
                    "Password appears in API response",
                    f"Password found in response: {response.text[:200]}",
                    "Never include passwords in API responses"
                )
                vulnerabilities.append(vuln)
            
            return {
                "test": test_name,
                "status": "FAIL" if vulnerabilities else "PASS",
                "vulnerabilities": len(vulnerabilities)
            }
            
        except Exception as e:
            return {"test": test_name, "status": "ERROR", "error": str(e)}
    
    def _test_weak_hashing(self) -> Dict[str, Any]:
        """ทดสอบ Hash Algorithm ที่อ่อนแอ"""
        test_name = "Weak Hashing Algorithm"
        
        try:
            # ทดสอบ JWT token หรือ session token
            login_data = {"citizen_id": "test", "password": "test"}
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            
            vulnerabilities = []
            if response.status_code == 200:
                try:
                    data = response.json()
                    token = data.get("access_token", "")
                    
                    # ตรวจสอบ JWT header สำหรับ algorithm ที่อ่อนแอ
                    if token and "." in token:
                        try:
                            header = json.loads(base64.b64decode(token.split(".")[0] + "=="))
                            if header.get("alg") in ["none", "HS256"]:  # HS256 อาจอ่อนแอถ้าใช้ secret สั้น
                                vuln = self.log_vulnerability(
                                    "A02",
                                    "Weak JWT Algorithm",
                                    "MEDIUM",
                                    f"JWT uses potentially weak algorithm: {header.get('alg')}",
                                    f"JWT header: {header}",
                                    "Use strong algorithms like RS256 for JWT signing"
                                )
                                vulnerabilities.append(vuln)
                        except:
                            pass
                except:
                    pass
            
            return {
                "test": test_name,
                "status": "FAIL" if vulnerabilities else "PASS",
                "vulnerabilities": len(vulnerabilities)
            }
            
        except Exception as e:
            return {"test": test_name, "status": "ERROR", "error": str(e)}
    
    # ==================== A03: Injection ====================
    
    def test_a03_injection(self) -> Dict[str, Any]:
        """A03:2021 – Injection"""
        category = "A03"
        test_results = {
            "category": category,
            "name": self.owasp_categories[category], 
            "tests_performed": [],
            "vulnerabilities_found": 0
        }
        
        test_results["tests_performed"].append(self._test_sql_injection())
        test_results["tests_performed"].append(self._test_nosql_injection())
        test_results["tests_performed"].append(self._test_command_injection())
        test_results["tests_performed"].append(self._test_ldap_injection())
        
        self.results["test_details"][category] = test_results
        return test_results
    
    def _test_sql_injection(self) -> Dict[str, Any]:
        """ทดสอบ SQL Injection"""
        test_name = "SQL Injection"
        
        sql_payloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "' UNION SELECT * FROM users --",
            "admin'--",
            "' OR 1=1#"
        ]
        
        vulnerabilities = []
        
        try:
            for payload in sql_payloads:
                test_data = {
                    "citizen_id": payload,
                    "password": "test"
                }
                
                response = self.session.post(f"{self.base_url}/auth/login", json=test_data)
                
                # ตรวจสอบ SQL error messages
                error_indicators = [
                    "mysql", "postgresql", "sqlite", "ora-", 
                    "syntax error", "sql", "database"
                ]
                
                response_text = response.text.lower()
                for indicator in error_indicators:
                    if indicator in response_text:
                        vuln = self.log_vulnerability(
                            "A03",
                            "SQL Injection Vulnerability",
                            "CRITICAL",
                            f"SQL injection detected with payload: {payload}",
                            f"Database error exposed: {response.text[:300]}",
                            "Use parameterized queries and input validation"
                        )
                        vulnerabilities.append(vuln)
                        break
            
            return {
                "test": test_name,
                "status": "FAIL" if vulnerabilities else "PASS",
                "vulnerabilities": len(vulnerabilities),
                "payloads_tested": len(sql_payloads)
            }
            
        except Exception as e:
            return {"test": test_name, "status": "ERROR", "error": str(e)}
    
    def _test_nosql_injection(self) -> Dict[str, Any]:
        """ทดสอบ NoSQL Injection"""
        test_name = "NoSQL Injection"
        
        nosql_payloads = [
            {"$ne": None},
            {"$gt": ""},
            {"$regex": ".*"},
            {"$where": "1==1"}
        ]
        
        vulnerabilities = []
        
        try:
            for payload in nosql_payloads:
                test_data = {
                    "citizen_id": payload,
                    "password": "test"
                }
                
                response = self.session.post(f"{self.base_url}/auth/login", json=test_data)
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        if "access_token" in data:  # ถ้า login สำเร็จด้วย NoSQL injection
                            vuln = self.log_vulnerability(
                                "A03",
                                "NoSQL Injection Vulnerability",
                                "CRITICAL",
                                f"NoSQL injection bypass authentication with payload: {payload}",
                                f"Successful login response: {data}",
                                "Validate and sanitize all inputs, use proper query builders"
                            )
                            vulnerabilities.append(vuln)
                    except:
                        pass
            
            return {
                "test": test_name,
                "status": "FAIL" if vulnerabilities else "PASS",
                "vulnerabilities": len(vulnerabilities)
            }
            
        except Exception as e:
            return {"test": test_name, "status": "ERROR", "error": str(e)}
    
    def _test_command_injection(self) -> Dict[str, Any]:
        """ทดสอบ Command Injection"""
        test_name = "Command Injection"
        
        cmd_payloads = [
            "; ls",
            "| whoami",
            "&& cat /etc/passwd",
            "`id`",
            "$(sleep 5)"
        ]
        
        vulnerabilities = []
        
        try:
            for payload in cmd_payloads:
                # ทดสอบในช่อง search หรือ file upload
                test_data = {
                    "search": payload,
                    "filename": f"test{payload}.txt"
                }
                
                start_time = time.time()
                response = self.session.post(f"{self.base_url}/search", json=test_data)
                response_time = time.time() - start_time
                
                # ตรวจสอบ command execution indicators
                if response_time > 4 and "sleep" in payload:  # Time-based detection
                    vuln = self.log_vulnerability(
                        "A03",
                        "Command Injection (Time-based)",
                        "CRITICAL",
                        f"Command injection detected with time delay: {payload}",
                        f"Response time: {response_time:.2f} seconds",
                        "Sanitize inputs and avoid system command execution"
                    )
                    vulnerabilities.append(vuln)
                
                # ตรวจสอบ command output ใน response
                cmd_indicators = ["root:", "uid=", "bin/", "/home/"]
                for indicator in cmd_indicators:
                    if indicator in response.text:
                        vuln = self.log_vulnerability(
                            "A03", 
                            "Command Injection (Output-based)",
                            "CRITICAL",
                            f"Command execution output detected: {payload}",
                            f"Command output in response: {response.text[:200]}",
                            "Never execute user input as system commands"
                        )
                        vulnerabilities.append(vuln)
                        break
            
            return {
                "test": test_name,
                "status": "FAIL" if vulnerabilities else "PASS",
                "vulnerabilities": len(vulnerabilities)
            }
            
        except Exception as e:
            return {"test": test_name, "status": "ERROR", "error": str(e)}
    
    def _test_ldap_injection(self) -> Dict[str, Any]:
        """ทดสอบ LDAP Injection"""
        test_name = "LDAP Injection"
        
        ldap_payloads = [
            "*)(uid=*))(|(uid=*",
            "*)(|(password=*))",
            "admin)(&(password=*)",
            "*))%00"
        ]
        
        vulnerabilities = []
        
        try:
            for payload in ldap_payloads:
                test_data = {
                    "citizen_id": payload,
                    "password": "test"
                }
                
                response = self.session.post(f"{self.base_url}/auth/login", json=test_data)
                
                # ตรวจสอบ LDAP error messages
                ldap_errors = ["ldap", "directory", "distinguished name", "dn:"]
                response_text = response.text.lower()
                
                for error in ldap_errors:
                    if error in response_text:
                        vuln = self.log_vulnerability(
                            "A03",
                            "LDAP Injection Vulnerability", 
                            "HIGH",
                            f"LDAP injection detected with payload: {payload}",
                            f"LDAP error in response: {response.text[:200]}",
                            "Use proper LDAP query escaping and validation"
                        )
                        vulnerabilities.append(vuln)
                        break
            
            return {
                "test": test_name,
                "status": "FAIL" if vulnerabilities else "PASS",
                "vulnerabilities": len(vulnerabilities)
            }
            
        except Exception as e:
            return {"test": test_name, "status": "ERROR", "error": str(e)}
    
    # ==================== A07: Identification and Authentication Failures ====================
    
    def test_a07_auth_failures(self) -> Dict[str, Any]:
        """A07:2021 – Identification and Authentication Failures"""
        category = "A07"
        test_results = {
            "category": category,
            "name": self.owasp_categories[category],
            "tests_performed": [],
            "vulnerabilities_found": 0
        }
        
        test_results["tests_performed"].append(self._test_weak_passwords())
        test_results["tests_performed"].append(self._test_brute_force_protection())
        test_results["tests_performed"].append(self._test_session_management())
        test_results["tests_performed"].append(self._test_default_credentials())
        
        self.results["test_details"][category] = test_results
        return test_results
    
    def _test_weak_passwords(self) -> Dict[str, Any]:
        """ทดสอบรหัสผ่านที่อ่อนแอ"""
        test_name = "Weak Password Policy"
        
        weak_passwords = ["123", "password", "admin", "test", "123456"]
        
        vulnerabilities = []
        
        try:
            for weak_pass in weak_passwords:
                test_data = {
                    "citizen_id": "1234567890123",
                    "password": weak_pass
                }
                
                response = self.session.post(f"{self.base_url}/auth/register", json=test_data)
                
                if response.status_code in [200, 201]:
                    vuln = self.log_vulnerability(
                        "A07",
                        "Weak Password Policy",
                        "MEDIUM",
                        f"System accepts weak password: {weak_pass}",
                        f"Registration successful with weak password",
                        "Implement strong password policy with complexity requirements"
                    )
                    vulnerabilities.append(vuln)
            
            return {
                "test": test_name,
                "status": "FAIL" if vulnerabilities else "PASS",
                "vulnerabilities": len(vulnerabilities)
            }
            
        except Exception as e:
            return {"test": test_name, "status": "ERROR", "error": str(e)}
    
    def _test_brute_force_protection(self) -> Dict[str, Any]:
        """ทดสอบการป้องกัน Brute Force"""
        test_name = "Brute Force Protection"
        
        vulnerabilities = []
        
        try:
            # ทดสอบ login หลายครั้งด้วยรหัสผ่านผิด
            for i in range(10):
                test_data = {
                    "citizen_id": "1234567890123",
                    "password": f"wrong_password_{i}"
                }
                
                response = self.session.post(f"{self.base_url}/auth/login", json=test_data)
                
                # ถ้า attempt ที่ 6+ ยังไม่มี rate limiting
                if i >= 5 and response.status_code != 429:
                    vuln = self.log_vulnerability(
                        "A07",
                        "Missing Brute Force Protection",
                        "MEDIUM",
                        f"No rate limiting after {i+1} failed login attempts",
                        f"Still accepting login attempts without delay",
                        "Implement account lockout and rate limiting for authentication"
                    )
                    vulnerabilities.append(vuln)
                    break
            
            return {
                "test": test_name,
                "status": "FAIL" if vulnerabilities else "PASS",
                "vulnerabilities": len(vulnerabilities)
            }
            
        except Exception as e:
            return {"test": test_name, "status": "ERROR", "error": str(e)}
    
    def _test_session_management(self) -> Dict[str, Any]:
        """ทดสอบการจัดการ Session"""
        test_name = "Session Management"
        
        vulnerabilities = []
        
        try:
            # ทดสอบ JWT token expiration
            login_data = {"citizen_id": "test", "password": "test"}
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    token = data.get("access_token", "")
                    
                    if token and "." in token:
                        # ตรวจสอบ JWT payload
                        payload = json.loads(base64.b64decode(token.split(".")[1] + "=="))
                        
                        # ตรวจสอบ expiration time
                        if "exp" not in payload:
                            vuln = self.log_vulnerability(
                                "A07",
                                "JWT Token Without Expiration",
                                "HIGH",
                                "JWT token doesn't have expiration time",
                                f"JWT payload: {payload}",
                                "Always set expiration time for JWT tokens"
                            )
                            vulnerabilities.append(vuln)
                        
                        # ตรวจสอบ token entropy
                        if len(token) < 100:  # Very short token
                            vuln = self.log_vulnerability(
                                "A07",
                                "Weak Session Token",
                                "MEDIUM",
                                "Session token appears to have low entropy",
                                f"Token length: {len(token)}",
                                "Use cryptographically strong random tokens"
                            )
                            vulnerabilities.append(vuln)
                            
                except Exception as e:
                    pass
            
            return {
                "test": test_name,
                "status": "FAIL" if vulnerabilities else "PASS",
                "vulnerabilities": len(vulnerabilities)
            }
            
        except Exception as e:
            return {"test": test_name, "status": "ERROR", "error": str(e)}
    
    def _test_default_credentials(self) -> Dict[str, Any]:
        """ทดสอบ Default Credentials"""
        test_name = "Default Credentials"
        
        default_creds = [
            ("admin", "admin"),
            ("admin", "password"),
            ("root", "root"),
            ("test", "test"),
            ("admin", "123456")
        ]
        
        vulnerabilities = []
        
        try:
            for username, password in default_creds:
                test_data = {
                    "citizen_id": username,
                    "password": password
                }
                
                response = self.session.post(f"{self.base_url}/auth/login", json=test_data)
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        if "access_token" in data:
                            vuln = self.log_vulnerability(
                                "A07",
                                "Default Credentials Active",
                                "CRITICAL",
                                f"Default credentials work: {username}/{password}",
                                f"Successful login with default credentials",
                                "Change all default credentials before deployment"
                            )
                            vulnerabilities.append(vuln)
                    except:
                        pass
            
            return {
                "test": test_name,
                "status": "FAIL" if vulnerabilities else "PASS",
                "vulnerabilities": len(vulnerabilities)
            }
            
        except Exception as e:
            return {"test": test_name, "status": "ERROR", "error": str(e)}
    
    # ==================== Main Test Runner ====================
    
    def run_all_tests(self) -> Dict[str, Any]:
        """รันการทดสอบทั้งหมด"""
        print("🔒 เริ่มการทดสอบความปลอดภัย OWASP Top 10 2021")
        print("=" * 60)
        
        # ตรวจสอบการเชื่อมต่อ
        if not self.test_server_connectivity():
            print("❌ ไม่สามารถเชื่อมต่อกับ API server")
            return {"error": "Cannot connect to API server"}
        
        print("✅ เชื่อมต่อกับ API server สำเร็จ")
        print()
        
        # รันการทดสอบแต่ละหมวด
        test_categories = [
            ("A01", self.test_a01_broken_access_control),
            ("A02", self.test_a02_cryptographic_failures), 
            ("A03", self.test_a03_injection),
            ("A07", self.test_a07_auth_failures)
        ]
        
        for category_id, test_func in test_categories:
            print(f"🔍 กำลังทดสอบ {category_id}: {self.owasp_categories[category_id]}")
            try:
                result = test_func()
                vulns = len([v for v in self.results["vulnerabilities"] if v["category"] == category_id])
                print(f"   พบช่องโหว่: {vulns} รายการ")
                self.results["summary"]["total_tests"] += len(result.get("tests_performed", []))
            except Exception as e:
                print(f"   ❌ Error: {e}")
            print()
        
        # คำนวณสถิติ
        total_vulns = len(self.results["vulnerabilities"])
        self.results["summary"]["failed"] = total_vulns
        self.results["summary"]["passed"] = self.results["summary"]["total_tests"] - total_vulns
        
        print("=" * 60)
        print(f"📊 สรุปผลการทดสอบ:")
        print(f"   ทดสอบทั้งหมด: {self.results['summary']['total_tests']} รายการ")
        print(f"   พบช่องโหว่: {total_vulns} รายการ")
        print(f"   - Critical: {self.results['summary']['critical']} รายการ")
        print(f"   - High: {self.results['summary']['high']} รายการ")
        print(f"   - Medium: {self.results['summary']['medium']} รายการ")
        print(f"   - Low: {self.results['summary']['low']} รายการ")
        
        return self.results
    
    def save_results(self, filename: str = None) -> str:
        """บันทึกผลการทดสอบ"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"owasp_security_report_{timestamp}.json"
        
        Path("test_reports").mkdir(exist_ok=True)
        filepath = Path("test_reports") / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)
        
        return str(filepath)

if __name__ == "__main__":
    # รันการทดสอบ
    tester = OWASPTop10Tester()
    results = tester.run_all_tests()
    
    # บันทึกผลลัพธ์
    report_file = tester.save_results()
    print(f"\n📄 รายงานถูกบันทึกที่: {report_file}")