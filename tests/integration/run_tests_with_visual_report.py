#!/usr/bin/env python3
# filepath: c:\Users\User\OneDrive\เอกสาร\capts_mof_api\tests\integration\run_tests_with_visual_report.py
"""
CAPTS MOF API - Complete Test Runner with Visual Reports
รันการทดสอบ Integration ทั้งหมดและสร้างรายงานภาพ
"""

import subprocess
import sys
import os
from pathlib import Path
from datetime import datetime
import json

def install_requirements():
    """ติดตั้ง dependencies ที่จำเป็น"""
    print("📦 ติดตั้ง dependencies...")
    
    requirements_files = [
        "requirements_visual.txt",  # สำหรับ visual report
    ]
    
    for req_file in requirements_files:
        if Path(req_file).exists():
            try:
                subprocess.run([sys.executable, "-m", "pip", "install", "-r", req_file], 
                             check=True, capture_output=True, text=True)
                print(f"✅ ติดตั้ง {req_file} สำเร็จ")
            except subprocess.CalledProcessError as e:
                print(f"❌ ไม่สามารถติดตั้ง {req_file}: {e.stderr}")
                return False
        else:
            print(f"⚠️ ไม่พบไฟล์ {req_file}")
    
    return True

def run_integration_tests():
    """รันการทดสอบ integration"""
    print("\n🧪 รันการทดสอบ Integration...")
    
    test_file = "test_comprehensive_api_integration.py"
    
    if not Path(test_file).exists():
        print(f"❌ ไม่พบไฟล์ทดสอบ: {test_file}")
        return None
    
    try:
        # รัน pytest
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            test_file, 
            "-v",
            "--tb=short"
        ], capture_output=True, text=True, timeout=300)
        
        print("📊 ผลการทดสอบ:")
        print(result.stdout)
        
        if result.stderr:
            print("⚠️ Warnings/Errors:")
            print(result.stderr)
        
        # หาไฟล์รายงาน JSON ล่าสุด - แก้ไขส่วนนี้
        report_dir = Path("test_reports")
        if report_dir.exists():
            # ลองหาไฟล์ JSON ทั้งหมด
            json_files = list(report_dir.glob("*.json"))
            if json_files:
                # เรียงตามเวลาสร้าง
                latest_report = max(json_files, key=lambda f: f.stat().st_mtime)
                print(f"✅ พบไฟล์รายงาน: {latest_report}")
                return str(latest_report)
        
        print("⚠️ ไม่พบไฟล์รายงาน JSON")
        return None
        
    except subprocess.TimeoutExpired:
        print("❌ การทดสอบใช้เวลานานเกินไป (timeout)")
        return None
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดในการรันทดสอบ: {e}")
        return None

def generate_visual_report(json_report_path):
    """สร้างรายงานภาพ"""
    print(f"\n🎨 สร้างรายงานภาพจาก: {json_report_path}")
    
    try:
        # Import และรัน visual report generator
        from visual_report_generator import VisualReportGenerator
        
        generator = VisualReportGenerator(json_report_path)
        generator.generate_all_reports()
        
        print("✅ สร้างรายงานภาพสำเร็จ!")
        return True
        
    except ImportError as e:
        print(f"❌ ไม่สามารถ import visual_report_generator: {e}")
        print("💡 โปรดตรวจสอบว่าติดตั้ง dependencies ครบถ้วน")
        return False
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดในการสร้างรายงานภาพ: {e}")
        return False

def create_summary_report(json_report_path):
    """สร้างสรุปรายงานแบบ text"""
    try:
        with open(json_report_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        summary = data['summary']
        
        report_text = f"""
╔══════════════════════════════════════════════════════════════╗
║                  CAPTS MOF API TEST SUMMARY                  ║
╠══════════════════════════════════════════════════════════════╣
║ 📅 Test Date: {data['timestamp'][:10]}                           ║
║ ⏰ Test Time: {data['timestamp'][11:19]}                          ║
║                                                              ║
║ 📊 TEST RESULTS:                                             ║
║   🎯 Total Tests: {summary['total_tests']:>3} tests                            ║
║   ✅ Passed:      {summary['passed']:>3} tests ({summary['passed']/summary['total_tests']*100:>5.1f}%)              ║
║   ❌ Failed:      {summary['failed']:>3} tests ({summary['failed']/summary['total_tests']*100:>5.1f}%)              ║
║   ⏭️ Skipped:     {summary['skipped']:>3} tests ({summary['skipped']/summary['total_tests']*100:>5.1f}%)              ║
║                                                              ║
║ 🏆 PASS RATE: {summary['pass_rate']:>5.1f}%                                    ║
║                                                              ║
║ 📁 VISUAL REPORTS GENERATED:                                 ║
║   • Summary Dashboard                                        ║
║   • Test Groups Chart                                        ║
║   • Status Distribution                                      ║
║   • Performance Analysis                                     ║
║   • Detailed Results Table                                   ║
║   • Interactive HTML Dashboard                               ║
╚══════════════════════════════════════════════════════════════╝
"""
        
        # บันทึกสรุป
        summary_file = Path("test_reports") / "test_summary.txt"
        with open(summary_file, 'w', encoding='utf-8') as f:
            f.write(report_text)
        
        print(report_text)
        print(f"📄 สรุปรายงานบันทึกที่: {summary_file}")
        
    except Exception as e:
        print(f"❌ ไม่สามารถสร้างสรุปรายงาน: {e}")

def main():
    """ฟังก์ชันหลัก"""
    print("🚀 CAPTS MOF API - Complete Test Runner with Visual Reports")
    print("=" * 60)
    
    # 1. ติดตั้ง dependencies
    if not install_requirements():
        print("❌ ไม่สามารถติดตั้ง dependencies ได้")
        return 1
    
    # 2. รันการทดสอบ
    json_report_path = run_integration_tests()
    if not json_report_path:
        print("❌ ไม่สามารถรันการทดสอบได้")
        return 1
    
    # 3. สร้างรายงานภาพ
    if not generate_visual_report(json_report_path):
        print("❌ ไม่สามารถสร้างรายงานภาพได้")
        return 1
    
    # 4. สร้างสรุปรายงาน
    create_summary_report(json_report_path)
    
    # 5. แสดงข้อมูลไฟล์ที่สร้าง
    print("\n📁 ไฟล์ที่สร้างแล้ว:")
    
    visual_dir = Path("visual_reports")
    if visual_dir.exists():
        for file in visual_dir.iterdir():
            if file.is_file():
                print(f"   📊 {file.name}")
    
    test_reports_dir = Path("test_reports")
    if test_reports_dir.exists():
        for file in test_reports_dir.iterdir():
            if file.is_file():
                print(f"   📄 {file.name}")
    
    print("\n✅ การทดสอบและสร้างรายงานเสร็จสมบูรณ์!")
    print("\n💡 เปิดไฟล์ visual_reports/interactive_dashboard.html ในเบราว์เซอร์เพื่อดูรายงานแบบ interactive")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
