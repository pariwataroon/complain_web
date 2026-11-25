import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from lib.logger import get_logger

logger = get_logger("email_service", console_output=False)

# อ่านค่าจาก Environment Variables หรือใช้ค่าเริ่มต้น
SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME", "your-email@gmail.com")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "your-app-password")
EMAIL_FROM = os.environ.get("EMAIL_FROM", "noreply@yourdomain.com")
EMAIL_SEND_METHOD = os.environ.get("EMAIL_SEND_METHOD", "smtp")  # smtp, sendgrid, console

def send_email(to_email: str, subject: str, message: str, html_message: str = None):
    """
    ส่งอีเมลไปยังผู้รับที่ระบุ
    
    Args:
        to_email: อีเมลผู้รับ
        subject: หัวข้ออีเมล
        message: เนื้อหาอีเมลแบบ text
        html_message: เนื้อหาอีเมลแบบ HTML (ถ้ามี)
    
    Returns:
        bool: True ถ้าส่งสำเร็จ, False ถ้าไม่สำเร็จ
    """
    # ตรวจสอบวิธีการส่ง
    if EMAIL_SEND_METHOD == "console":
        return _send_email_console(to_email, subject, message, html_message)
    else:
        return _send_email_smtp(to_email, subject, message, html_message)

def _send_email_smtp(to_email: str, subject: str, message: str, html_message: str = None):
    """ส่งอีเมลผ่าน SMTP server"""
    try:
        # สร้าง email message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = EMAIL_FROM
        msg["To"] = to_email
        
        # เพิ่มเนื้อหาแบบ text
        msg.attach(MIMEText(message, "plain"))
        
        # เพิ่มเนื้อหาแบบ HTML ถ้ามี
        if html_message:
            msg.attach(MIMEText(html_message, "html"))
        
        # เชื่อมต่อกับ SMTP server
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()  # เข้ารหัสการเชื่อมต่อ
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        
        # ส่งอีเมล
        server.sendmail(EMAIL_FROM, to_email, msg.as_string())
        server.quit()
        
        logger.info(f"Email sent to {to_email} successfully via SMTP")
        return True
    except Exception as e:
        logger.error(f"Failed to send email via SMTP: {str(e)}")
        return False

def _send_email_console(to_email: str, subject: str, message: str, html_message: str = None):
    """แสดงอีเมลใน console (สำหรับ development เท่านั้น)"""
    try:
        print("\n" + "=" * 50)
        print("EMAIL SERVICE (CONSOLE MODE)")
        print("=" * 50)
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print("-" * 50)
        print("Text Content:")
        print(message)
        
        if html_message:
            print("-" * 50)
            print("HTML Content:")
            print(html_message)
            
        print("=" * 50 + "\n")
        
        logger.info(f"Email displayed in console to: {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to display email in console: {str(e)}")
        return False