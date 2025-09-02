"""
ตัวอย่างการใช้งาน External Department API สำหรับหน่วยงานภายนอก
Demo Script สำหรับการเชื่อมต่อและจัดการ complaints
"""

import requests
import hmac
import hashlib
import time
import json
import logging
from typing import Dict, List, Optional
from datetime import datetime

# ตั้งค่า logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class MOFComplaintAPI:
    """Client สำหรับเชื่อมต่อกับ MOF Complaint Management System"""
    
    def __init__(self, base_url: str, api_key: str, api_secret: str):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.api_secret = api_secret
        self.session = requests.Session()
        
        # ตั้งค่า default timeout
        self.session.timeout = 30
        
        logger.info(f"Initialized MOF API client for: {base_url}")
    
    def _create_signature(self, body: str = "") -> tuple:
        """สร้าง HMAC signature สำหรับ authentication"""
        timestamp = str(int(time.time()))
        message = f"{self.api_key}{timestamp}{body}"
        
        signature = hmac.new(
            self.api_secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return timestamp, signature
    
    def _create_headers(self, body: str = "") -> Dict[str, str]:
        """สร้าง headers สำหรับ API request"""
        timestamp, signature = self._create_signature(body)
        
        return {
            'X-API-Key': self.api_key,
            'X-API-Timestamp': timestamp,
            'X-API-Signature': signature,
            'Content-Type': 'application/json',
            'User-Agent': 'ExternalDepartmentClient/1.0'
        }
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict:
        """ทำ HTTP request พร้อม error handling"""
        url = f"{self.base_url}{endpoint}"
        
        # เตรียม body สำหรับ signature
        body = ""
        if 'json' in kwargs:
            body = json.dumps(kwargs['json'], ensure_ascii=False, separators=(',', ':'))
            kwargs['data'] = body
            kwargs.pop('json')
        
        # สร้าง headers
        headers = self._create_headers(body)
        if 'headers' in kwargs:
            headers.update(kwargs['headers'])
        kwargs['headers'] = headers
        
        try:
            logger.debug(f"{method.upper()} {url}")
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()
            
            return response.json()
            
        except requests.exceptions.HTTPError as e:
            error_msg = f"HTTP Error {e.response.status_code}: {e.response.text}"
            logger.error(error_msg)
            
            if e.response.status_code == 401:
                raise Exception("Authentication failed - ตรวจสอบ API Key และ Secret")
            elif e.response.status_code == 403:
                raise Exception("Access denied - ตรวจสอบ IP whitelist และ permissions")
            elif e.response.status_code == 429:
                raise Exception("Rate limit exceeded - รอสักครู่แล้วลองใหม่")
            else:
                raise Exception(error_msg)
                
        except requests.exceptions.RequestException as e:
            error_msg = f"Request failed: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)
    
    # =================== Authentication ===================
    
    def test_authentication(self) -> Dict:
        """ทดสอบการ authentication"""
        logger.info("Testing authentication...")
        return self._make_request('POST', '/api/v1/external/auth/test')
    
    # =================== Complaint Management ===================
    
    def get_complaints(self, 
                      skip: int = 0, 
                      limit: int = 50,
                      status: Optional[str] = None,
                      date_from: Optional[str] = None,
                      date_to: Optional[str] = None,
                      search: Optional[str] = None) -> Dict:
        """ดึงรายการ complaints ที่ได้รับมอบหมาย"""
        logger.info(f"Fetching complaints (skip={skip}, limit={limit})")
        
        params = {'skip': skip, 'limit': limit}
        if status:
            params['status'] = status
        if date_from:
            params['date_from'] = date_from
        if date_to:
            params['date_to'] = date_to
        if search:
            params['search'] = search
        
        return self._make_request('GET', '/api/v1/external/complaints', params=params)
    
    def get_complaint_detail(self, complaint_id: str) -> Dict:
        """ดึงรายละเอียด complaint เฉพาะ"""
        logger.info(f"Fetching complaint detail: {complaint_id}")
        return self._make_request('GET', f'/api/v1/external/complaints/{complaint_id}')
    
    def update_progress(self, 
                       complaint_id: str,
                       progress_percentage: int,
                       processing_notes: str,
                       external_status: Optional[str] = None) -> Dict:
        """อัพเดทความคืบหน้าการดำเนินงาน"""
        logger.info(f"Updating progress for complaint: {complaint_id}")
        
        data = {
            'progress_percentage': progress_percentage,
            'processing_notes': processing_notes
        }
        
        if external_status:
            data['external_status'] = external_status
        
        return self._make_request('PATCH', f'/api/v1/external/complaints/{complaint_id}/progress', json=data)
    
    def complete_complaint(self,
                          complaint_id: str,
                          resolution_summary: str,
                          outcome: str = "resolved",
                          completion_notes: Optional[str] = None) -> Dict:
        """แจ้งผลการดำเนินงานเสร็จสิ้น"""
        logger.info(f"Completing complaint: {complaint_id}")
        
        data = {
            'resolution_summary': resolution_summary,
            'outcome': outcome
        }
        
        if completion_notes:
            data['completion_notes'] = completion_notes
        
        return self._make_request('POST', f'/api/v1/external/complaints/{complaint_id}/complete', json=data)
    
    def get_department_info(self) -> Dict:
        """ดึงข้อมูลหน่วยงานและสถิติ"""
        logger.info("Fetching department information")
        return self._make_request('GET', '/api/v1/external/department/info')
    
    # =================== Batch Operations ===================
    
    def sync_all_complaints(self) -> List[Dict]:
        """ดึง complaints ทั้งหมดแบบ batch"""
        logger.info("Starting full sync of all complaints")
        
        all_complaints = []
        skip = 0
        limit = 50
        
        while True:
            result = self.get_complaints(skip=skip, limit=limit)
            
            if result.get('res_code') != '0000':
                raise Exception(f"Failed to fetch complaints: {result.get('res_message')}")
            
            complaints = result['res_data']['complaints']
            all_complaints.extend(complaints)
            
            # ตรวจสอบว่ามีข้อมูลเพิ่มเติมหรือไม่
            pagination = result['res_data']['pagination']
            if not pagination.get('has_more', False):
                break
            
            skip += limit
            
            # หยุดพักเพื่อไม่ให้เกิน rate limit
            time.sleep(0.5)
        
        logger.info(f"Synced {len(all_complaints)} complaints")
        return all_complaints


class ComplaintProcessor:
    """ประมวลผลและจัดการ complaints"""
    
    def __init__(self, api_client: MOFComplaintAPI):
        self.api = api_client
    
    def process_new_complaints(self):
        """ประมวลผล complaints ใหม่ที่ยังไม่ได้ดำเนินการ"""
        logger.info("Processing new complaints...")
        
        # ดึง complaints ที่ส่งมาใหม่
        result = self.api.get_complaints(status="SENT_TO_EXTERNAL", limit=20)
        
        if result.get('res_code') != '0000':
            logger.error(f"Failed to fetch complaints: {result.get('res_message')}")
            return
        
        complaints = result['res_data']['complaints']
        logger.info(f"Found {len(complaints)} new complaints to process")
        
        for complaint in complaints:
            try:
                self._process_single_complaint(complaint)
                # หยุดพักระหว่างการประมวลผล
                time.sleep(1)
            except Exception as e:
                logger.error(f"Failed to process complaint {complaint['id']}: {str(e)}")
    
    def _process_single_complaint(self, complaint: Dict):
        """ประมวลผล complaint เดียว"""
        complaint_id = complaint['id']
        logger.info(f"Processing complaint: {complaint_id}")
        
        # ตัวอย่างการประมวลผล
        current_progress = complaint.get('progress', {}).get('percentage', 0)
        
        if current_progress == 0:
            # เริ่มต้นดำเนินการ
            self.api.update_progress(
                complaint_id=complaint_id,
                progress_percentage=10,
                processing_notes="เริ่มต้นรับเรื่องและตรวจสอบเอกสาร",
                external_status="received"
            )
        elif current_progress < 50:
            # กำลังดำเนินการ
            self.api.update_progress(
                complaint_id=complaint_id,
                progress_percentage=50,
                processing_notes="กำลังดำเนินการตรวจสอบและวิเคราะห์",
                external_status="in_progress"
            )
        elif current_progress < 100:
            # เกือบเสร็จ
            self.api.update_progress(
                complaint_id=complaint_id,
                progress_percentage=90,
                processing_notes="กำลังจัดทำรายงานผลการดำเนินการ",
                external_status="finalizing"
            )
    
    def complete_resolved_complaints(self):
        """แจ้งงานเสร็จสำหรับ complaints ที่ดำเนินการเสร็จแล้ว"""
        logger.info("Checking for completed complaints...")
        
        # ในระบบจริง จะดึงข้อมูลจากฐานข้อมูลภายในของหน่วยงาน
        # ตัวอย่างนี้จะจำลองการหา complaints ที่เสร็จแล้ว
        
        completed_complaints = self._get_completed_complaints_from_internal_system()
        
        for complaint_id in completed_complaints:
            try:
                self.api.complete_complaint(
                    complaint_id=complaint_id,
                    resolution_summary="ได้ดำเนินการตรวจสอบและแก้ไขปัญหาเรียบร้อยแล้ว",
                    outcome="resolved",
                    completion_notes="งานเสร็จสิ้นตามกระบวนการที่กำหนด"
                )
                logger.info(f"Completed complaint: {complaint_id}")
            except Exception as e:
                logger.error(f"Failed to complete complaint {complaint_id}: {str(e)}")
    
    def _get_completed_complaints_from_internal_system(self) -> List[str]:
        """
        ดึงรายการ complaint IDs ที่เสร็จแล้วจากระบบภายในของหน่วยงาน
        ในการใช้งานจริง ให้เชื่อมต่อกับฐานข้อมูลของหน่วยงาน
        """
        # ตัวอย่าง: ส่งคืนรายการ complaint IDs ที่เสร็จแล้ว
        return []
    
    def generate_daily_report(self) -> Dict:
        """สร้างรายงานสรุปประจำวัน"""
        logger.info("Generating daily report...")
        
        # ดึงข้อมูลหน่วยงาน
        dept_info = self.api.get_department_info()
        
        # ดึง complaints วันนี้
        today = datetime.now().strftime('%Y-%m-%d')
        today_complaints = self.api.get_complaints(
            date_from=f"{today}T00:00:00Z",
            date_to=f"{today}T23:59:59Z",
            limit=100
        )
        
        report = {
            'date': today,
            'department': dept_info['res_data']['department']['name'],
            'statistics': dept_info['res_data']['statistics'],
            'today_complaints': len(today_complaints['res_data']['complaints']) if today_complaints.get('res_code') == '0000' else 0,
            'generated_at': datetime.now().isoformat()
        }
        
        logger.info(f"Generated daily report: {report}")
        return report


def main():
    """ตัวอย่างการใช้งานหลัก"""
    
    # การตั้งค่า - ใช้ค่าจริงจากหน่วยงาน
    API_BASE_URL = "https://complaint.mof.go.th"  # URL จริงของระบบ
    API_KEY = "ext_dept_1725123456_your_api_key_here"  # API Key ที่ได้รับจาก MOF
    API_SECRET = "your_secret_key_here"  # Secret Key ที่ได้รับจาก MOF
    
    try:
        # สร้าง API client
        api = MOFComplaintAPI(API_BASE_URL, API_KEY, API_SECRET)
        
        # ทดสอบการเชื่อมต่อ
        auth_result = api.test_authentication()
        logger.info(f"Authentication test: {auth_result}")
        
        # ดึงข้อมูลหน่วยงาน
        dept_info = api.get_department_info()
        logger.info(f"Department info: {dept_info}")
        
        # สร้าง processor
        processor = ComplaintProcessor(api)
        
        # ประมวลผล complaints ใหม่
        processor.process_new_complaints()
        
        # แจ้งงานที่เสร็จแล้ว
        processor.complete_resolved_complaints()
        
        # สร้างรายงานประจำวัน
        daily_report = processor.generate_daily_report()
        
        logger.info("Process completed successfully!")
        
    except Exception as e:
        logger.error(f"Process failed: {str(e)}")
        raise


if __name__ == "__main__":
    main()
