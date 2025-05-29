import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any
import matplotlib.pyplot as plt
import seaborn as sns
from docx import Document
from docx.shared import Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.style import WD_STYLE_TYPE
import pandas as pd

class OWASPDocumentGenerator:
    """สร้างเอกสารรายงาน OWASP Top 10 Security Testing"""
    
    def __init__(self):
        self.reports_dir = Path("test_reports")
        self.reports_dir.mkdir(exist_ok=True)
    
    def generate_word_document(self, owasp_results: Dict[str, Any]) -> str:
        """สร้างเอกสาร Word รายงาน OWASP"""
        
        # สร้าง Document
        doc = Document()
        
        # หัวเรื่อง
        title = doc.add_heading('รายงานการทดสอบความปลอดภัย OWASP Top 10 2021', 0)
        title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        # ข้อมูลพื้นฐาน
        doc.add_heading('ข้อมูลการทดสอบ', level=1)
        
        info_table = doc.add_table(rows=6, cols=2)
        info_table.style = 'Table Grid'
        
        info_data = [
            ('วันที่ทดสอบ', datetime.now().strftime('%d/%m/%Y %H:%M:%S')),
            ('เป้าหมาย', owasp_results.get('target', 'N/A')),
            ('OWASP Version', owasp_results.get('owasp_version', '2021')),
            ('จำนวนการทดสอบ', str(owasp_results.get('summary', {}).get('total_tests', 0))),
            ('ช่องโหว่ที่พบ', str(len(owasp_results.get('vulnerabilities', [])))),
            ('ผู้ทดสอบ', 'Automated Security Scanner')
        ]
        
        for i, (key, value) in enumerate(info_data):
            info_table.cell(i, 0).text = key
            info_table.cell(i, 1).text = value
        
        # สรุปผล
        doc.add_heading('สรุปผลการทดสอบ', level=1)
        
        summary = owasp_results.get('summary', {})
        summary_table = doc.add_table(rows=5, cols=2)
        summary_table.style = 'Table Grid'
        
        summary_data = [
            ('Critical', str(summary.get('critical', 0))),
            ('High', str(summary.get('high', 0))),
            ('Medium', str(summary.get('medium', 0))),
            ('Low', str(summary.get('low', 0))),
            ('Total', str(len(owasp_results.get('vulnerabilities', []))))
        ]
        
        for i, (severity, count) in enumerate(summary_data):
            cell1 = summary_table.cell(i, 0)
            cell2 = summary_table.cell(i, 1)
            cell1.text = f'ระดับ {severity}'
            cell2.text = f'{count} รายการ'
            
            # เพิ่มสี
            if severity == 'Critical':
                self._set_cell_color(cell1, RGBColor(220, 53, 69))  # แดง
            elif severity == 'High':
                self._set_cell_color(cell1, RGBColor(255, 193, 7))  # เหลือง
            elif severity == 'Medium':
                self._set_cell_color(cell1, RGBColor(255, 165, 0))  # ส้ม
            elif severity == 'Low':
                self._set_cell_color(cell1, RGBColor(40, 167, 69))  # เขียว
        
        # รายละเอียดช่องโหว่
        doc.add_heading('รายละเอียดช่องโหว่ที่พบ', level=1)
        
        vulnerabilities = owasp_results.get('vulnerabilities', [])
        
        if not vulnerabilities:
            doc.add_paragraph('🎉 ไม่พบช่องโหว่ด้านความปลอดภัย')
        else:
            for i, vuln in enumerate(vulnerabilities, 1):
                # หัวข้อช่องโหว่
                vuln_heading = doc.add_heading(f"{i}. {vuln.get('title', 'Unknown')}", level=2)
                
                # ตารางรายละเอียด
                vuln_table = doc.add_table(rows=7, cols=2)
                vuln_table.style = 'Table Grid'
                
                vuln_details = [
                    ('ID', vuln.get('id', 'N/A')),
                    ('หมวดหมู่', f"{vuln.get('category', 'N/A')} - {vuln.get('category_name', 'N/A')}"),
                    ('ระดับความรุนแรง', vuln.get('severity', 'N/A')),
                    ('คำอธิบาย', vuln.get('description', 'N/A')),
                    ('หลักฐาน', vuln.get('evidence', 'N/A')),
                    ('คำแนะนำ', vuln.get('recommendation', 'N/A')),
                    ('เวลาที่พบ', vuln.get('timestamp', 'N/A'))
                ]
                
                for j, (field, value) in enumerate(vuln_details):
                    vuln_table.cell(j, 0).text = field
                    vuln_table.cell(j, 1).text = str(value)[:500]  # จำกัดความยาว
                    
                    if field == 'ระดับความรุนแรง':
                        severity_cell = vuln_table.cell(j, 1)
                        if value == 'CRITICAL':
                            self._set_cell_color(severity_cell, RGBColor(220, 53, 69))
                        elif value == 'HIGH':
                            self._set_cell_color(severity_cell, RGBColor(255, 193, 7))
                        elif value == 'MEDIUM':
                            self._set_cell_color(severity_cell, RGBColor(255, 165, 0))
                        elif value == 'LOW':
                            self._set_cell_color(severity_cell, RGBColor(40, 167, 69))
                
                doc.add_paragraph('')  # เว้นบรรทัด
        
        # OWASP Top 10 Categories Overview
        doc.add_heading('ภาพรวม OWASP Top 10 2021', level=1)
        
        owasp_categories = {
            "A01": "Broken Access Control - การควบคุมการเข้าถึงที่ผิดพลาด",
            "A02": "Cryptographic Failures - ความล้มเหลวในการเข้ารหัส", 
            "A03": "Injection - การแทรกคำสั่ง",
            "A04": "Insecure Design - การออกแบบที่ไม่ปลอดภัย",
            "A05": "Security Misconfiguration - การตั้งค่าความปลอดภัยผิดพลาด",
            "A06": "Vulnerable and Outdated Components - ส่วนประกอบที่มีช่องโหว่และล้าสมัย",
            "A07": "Identification and Authentication Failures - ความล้มเหลวในการระบุตัวตนและการยืนยัน",
            "A08": "Software and Data Integrity Failures - ความล้มเหลวในความสมบูรณ์ของซอฟต์แวร์และข้อมูล",
            "A09": "Security Logging and Monitoring Failures - ความล้มเหลวในการบันทึกและตรวจสอบความปลอดภัย",
            "A10": "Server-Side Request Forgery (SSRF) - การปลอมแปลงคำขอฝั่งเซิร์ฟเวอร์"
        }
        
        for category_id, description in owasp_categories.items():
            doc.add_paragraph(f"• {category_id}: {description}")
        
        # คำแนะนำทั่วไป
        doc.add_heading('คำแนะนำทั่วไป', level=1)
        
        recommendations = [
            "ตรวจสอบและปรับปรุงระบบรักษาความปลอดภัยอย่างสม่ำเสมอ",
            "อัปเดตซอฟต์แวร์และ dependencies ให้เป็นเวอร์ชั่นล่าสุด",
            "ใช้ HTTPS สำหรับการส่งข้อมูลทั้งหมด",
            "ตรวจสอบสิทธิ์การเข้าถึงอย่างเข้มงวด",
            "ตรวจสอบและ validate ข้อมูลนำเข้าทั้งหมด",
            "ใช้การเข้ารหัสที่แข็งแกร่ง",
            "จัดเก็บ log การใช้งานและตรวจสอบอย่างสม่ำเสมอ",
            "ทำการทดสอบความปลอดภัยอย่างสม่ำเสมอ"
        ]
        
        for rec in recommendations:
            doc.add_paragraph(f"• {rec}")
        
        # บันทึกไฟล์
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        doc_path = self.reports_dir / f"OWASP_Security_Report_{timestamp}.docx"
        doc.save(doc_path)
        
        return str(doc_path)
    
    def _set_cell_color(self, cell, color: RGBColor):
        """ตั้งค่าสีพื้นหลังของ cell"""
        try:
            from docx.oxml.shared import qn
            from docx.oxml import parse_xml
            
            shading_elm = parse_xml(r'<w:shd {} w:fill="{:02x}{:02x}{:02x}"/>'.format(
                'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"',
                color.r, color.g, color.b))
            cell._tc.get_or_add_tcPr().append(shading_elm)
        except:
            pass  # ถ้าไม่สามารถตั้งสีได้ก็ข้าม
    
    def generate_excel_report(self, owasp_results: Dict[str, Any]) -> str:
        """สร้างรายงาน Excel"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        excel_path = self.reports_dir / f"OWASP_Security_Report_{timestamp}.xlsx"
        
        with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
            # Sheet 1: Summary
            summary_data = {
                'Severity': ['Critical', 'High', 'Medium', 'Low', 'Total'],
                'Count': [
                    owasp_results.get('summary', {}).get('critical', 0),
                    owasp_results.get('summary', {}).get('high', 0),
                    owasp_results.get('summary', {}).get('medium', 0),
                    owasp_results.get('summary', {}).get('low', 0),
                    len(owasp_results.get('vulnerabilities', []))
                ]
            }
            
            df_summary = pd.DataFrame(summary_data)
            df_summary.to_excel(writer, sheet_name='Summary', index=False)
            
            # Sheet 2: Vulnerabilities Detail
            if owasp_results.get('vulnerabilities'):
                vuln_data = []
                for vuln in owasp_results['vulnerabilities']:
                    vuln_data.append({
                        'ID': vuln.get('id', ''),
                        'Category': vuln.get('category', ''),
                        'Title': vuln.get('title', ''),
                        'Severity': vuln.get('severity', ''),
                        'Description': vuln.get('description', ''),
                        'Evidence': vuln.get('evidence', ''),
                        'Recommendation': vuln.get('recommendation', ''),
                        'Timestamp': vuln.get('timestamp', '')
                    })
                
                df_vulns = pd.DataFrame(vuln_data)
                df_vulns.to_excel(writer, sheet_name='Vulnerabilities', index=False)
            
            # Sheet 3: OWASP Categories Tested
            categories_data = []
            for category_id, details in owasp_results.get('test_details', {}).items():
                vulns_in_category = len([v for v in owasp_results.get('vulnerabilities', []) 
                                       if v.get('category') == category_id])
                categories_data.append({
                    'Category': category_id,
                    'Name': details.get('name', ''),
                    'Tests Performed': len(details.get('tests_performed', [])),
                    'Vulnerabilities Found': vulns_in_category
                })
            
            if categories_data:
                df_categories = pd.DataFrame(categories_data)
                df_categories.to_excel(writer, sheet_name='Categories', index=False)
        
        return str(excel_path)
    
    def generate_charts(self, owasp_results: Dict[str, Any]) -> str:
        """สร้างกราฟสำหรับรายงาน"""
        try:
            plt.style.use('seaborn-v0_8')
        except:
            try:
                plt.style.use('seaborn')
            except:
                plt.style.use('default')
        
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        fig.suptitle('OWASP Top 10 Security Testing Results', fontsize=16, fontweight='bold')
        
        summary = owasp_results.get('summary', {})
        
        # กราฟ 1: Severity Distribution
        severities = ['Critical', 'High', 'Medium', 'Low']
        counts = [summary.get(s.lower(), 0) for s in severities]
        colors = ['#dc3545', '#ffc107', '#fd7e14', '#28a745']
        
        if sum(counts) > 0:
            axes[0, 0].pie(counts, labels=severities, colors=colors, autopct='%1.1f%%', startangle=90)
            axes[0, 0].set_title('Vulnerabilities by Severity')
        else:
            axes[0, 0].text(0.5, 0.5, 'No Vulnerabilities Found', ha='center', va='center')
            axes[0, 0].set_title('Vulnerabilities by Severity')
        
        # กราฟ 2: OWASP Categories
        categories = list(owasp_results.get('test_details', {}).keys())
        category_vulns = []
        
        for cat in categories:
            vuln_count = len([v for v in owasp_results.get('vulnerabilities', []) 
                            if v.get('category') == cat])
            category_vulns.append(vuln_count)
        
        if categories:
            axes[0, 1].bar(categories, category_vulns, color='skyblue')
            axes[0, 1].set_title('Vulnerabilities by OWASP Category')
            axes[0, 1].set_xlabel('OWASP Category')
            axes[0, 1].set_ylabel('Number of Vulnerabilities')
            axes[0, 1].tick_params(axis='x', rotation=45)
        
        # กราฟ 3: Test Coverage
        if categories:
            tests_performed = []
            for cat in categories:
                test_count = len(owasp_results.get('test_details', {}).get(cat, {}).get('tests_performed', []))
                tests_performed.append(test_count)
            
            axes[1, 0].bar(categories, tests_performed, color='lightgreen')
            axes[1, 0].set_title('Tests Performed by Category')
            axes[1, 0].set_xlabel('OWASP Category')
            axes[1, 0].set_ylabel('Number of Tests')
            axes[1, 0].tick_params(axis='x', rotation=45)
        
        # กราฟ 4: Timeline (Mock)
        axes[1, 1].plot([1, 2, 3, 4], [10, 15, 12, 8], 'o-', color='purple')
        axes[1, 1].set_title('Security Testing Timeline')
        axes[1, 1].set_xlabel('Test Phase')
        axes[1, 1].set_ylabel('Issues Found')
        
        plt.tight_layout()
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        chart_path = self.reports_dir / f"OWASP_Security_Charts_{timestamp}.png"
        plt.savefig(chart_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        return str(chart_path)
    
    def generate_complete_report(self, json_report_path: str) -> Dict[str, str]:
        """สร้างรายงานครบถ้วน"""
        # อ่านข้อมูลจากไฟล์ JSON
        with open(json_report_path, 'r', encoding='utf-8') as f:
            owasp_results = json.load(f)
        
        print("📊 กำลังสร้างรายงาน OWASP...")
        
        # สร้างเอกสารต่างๆ
        word_doc = self.generate_word_document(owasp_results)
        excel_report = self.generate_excel_report(owasp_results)
        charts = self.generate_charts(owasp_results)
        
        print("✅ สร้างรายงาน OWASP เสร็จสิ้น")
        
        return {
            "word_document": word_doc,
            "excel_report": excel_report,
            "charts": charts,
            "json_report": json_report_path
        }

if __name__ == "__main__":
    # ตัวอย่างการใช้งาน
    from owasp_top10_tester import OWASPTop10Tester
    
    # รันการทดสอบ
    tester = OWASPTop10Tester()
    results = tester.run_all_tests()
    json_path = tester.save_results()
    
    # สร้างเอกสาร
    doc_generator = OWASPDocumentGenerator()
    reports = doc_generator.generate_complete_report(json_path)
    
    print(f"\n📋 รายงานที่สร้าง:")
    print(f"   📄 Word Document: {reports['word_document']}")
    print(f"   📊 Excel Report: {reports['excel_report']}")
    print(f"   📈 Charts: {reports['charts']}")
    print(f"   📝 JSON Data: {reports['json_report']}")