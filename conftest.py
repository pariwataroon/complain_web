import pytest
import sys
import os
from unittest.mock import Mock, patch

# เพิ่ม project root path
project_root = os.path.dirname(os.path.dirname(__file__))
sys.path.insert(0, project_root)

@pytest.fixture(scope="session")
def app_config():
    """Configuration สำหรับ testing"""
    return {
        "base_url": "https://compdev.minertatech.com/api/v1",
        "test_user": {
            "citizen_id": "1234567890122",
            "password": "password",
            "name": "Test User"
        }
    }

@pytest.fixture
def mock_authenticate():
    """Mock authentication function"""
    def _authenticate(username: str, password: str) -> dict:
        if not username or not password:
            return {"res_code": "4010", "res_data": {"error": "Empty credentials"}}
        
        valid_credentials = {
            'valid_user': 'valid_password',
            'test_user': 'test123',
            'admin': 'admin123',
            '1234567890122': 'password'
        }
        
        if username in valid_credentials and valid_credentials[username] == password:
            return {
                "res_code": "0000",
                "res_data": {
                    "access_token": f"fake_jwt_token_for_{username}",
                    "refresh_token": f"fake_refresh_token_for_{username}",
                    "user_info": {"citizen_id": username, "name": "Test User"}
                }
            }
        else:
            return {"res_code": "4010", "res_data": {"error": "Invalid credentials"}}
    
    return _authenticate

@pytest.fixture
def mock_database():
    """Mock database session"""
    db_mock = Mock()
    db_mock.query.return_value.filter.return_value.first.return_value = None
    return db_mock

@pytest.fixture
def mock_queue_service():
    """Mock queue service"""
    with patch('app.services.complaint_queue_service.ComplaintQueueService') as mock:
        instance = Mock()
        instance.queue_complaint_creation.return_value = "fake-task-id-123"
        mock.return_value.__enter__.return_value = instance
        yield mock

@pytest.fixture
def test_user_data():
    """ข้อมูล user สำหรับทดสอบ"""
    return {
        "user_id": 1,
        "citizen_id": "1234567890122",
        "first_name": "Test",
        "last_name": "User",
        "email": "test@example.com",
        "phone": "0812345678"
    }

@pytest.fixture
def test_complaint_data():
    """ข้อมูล complaint สำหรับทดสอบ"""
    return {
        "step1": {
            "general": {
                "general": {
                    "idCard": "1100500123456",
                    "name": "นายทดสอบ ระบบ",
                    "address": "123 ถนนทดสอบ",
                    "phone": "0812345678",
                    "email": "test@example.com"
                }
            }
        },
        "step2": {
            "general": {
                "individual": {
                    "idCard": "1100500654321",
                    "name": "นายผู้ถูกร้อง"
                },
                "activeType": "individual"
            }
        },
        "step3": {
            "general": {
                "complaintType": "ทดสอบ",
                "subject": "ทดสอบระบบ",
                "description": "นี่คือการทดสอบ"
            }
        },
        "step4": {
            "general": {
                "accepted": True
            }
        }
    }

# Markers สำหรับแยกประเภท test
def pytest_configure(config):
    """Configure custom markers"""
    config.addinivalue_line("markers", "unit: Unit tests")
    config.addinivalue_line("markers", "integration: Integration tests")
    config.addinivalue_line("markers", "auth: Authentication related tests")
    config.addinivalue_line("markers", "queue: Queue system tests")
    config.addinivalue_line("markers", "slow: Slow running tests")