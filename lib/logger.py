import os
import logging
import datetime
import shutil
from pathlib import Path
from config.dotenv import console_logging

# ตรวจสอบค่า environment variable
CONSOLE_LOGGING = console_logging.lower() == 'true' if console_logging else True

class HourlyRotatingFileHandler(logging.Handler):
    def __init__(self, base_dir="logs"):
        super().__init__()
        self.base_dir = base_dir
        Path(base_dir).mkdir(exist_ok=True)
        self.current_date = None
        self.current_hour = None
        self.file_handler = None
        self.update_handler()
        self.clean_old_logs()
    
    def update_handler(self):
        now = datetime.datetime.now()
        date_str = now.strftime("%Y-%m-%d")
        hour = now.hour
        
        if self.current_date != date_str or self.current_hour != hour:
            if self.file_handler:
                self.file_handler.close()
            
            # Create date directory if needed
            date_dir = os.path.join(self.base_dir, date_str)
            Path(date_dir).mkdir(exist_ok=True)
            
            # Create hourly log file
            file_path = os.path.join(date_dir, f"{hour:02d}.log")
            self.file_handler = logging.FileHandler(file_path, encoding='utf-8')
            self.file_handler.setFormatter(logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            ))
            
            self.current_date = date_str
            self.current_hour = hour
    
    def emit(self, record):
        self.update_handler()
        self.file_handler.emit(record)
    
    def clean_old_logs(self):
        """Delete log folders older than 3 months"""
        today = datetime.datetime.now().date()
        three_months_ago = today - datetime.timedelta(days=90)
        
        for date_dir in Path(self.base_dir).iterdir():
            if not date_dir.is_dir():
                continue
            
            try:
                dir_date = datetime.datetime.strptime(date_dir.name, "%Y-%m-%d").date()
                if dir_date < three_months_ago:
                    shutil.rmtree(date_dir)
            except ValueError:
                # Skip directories that don't match the date format
                continue

def get_logger(name, console_output=None):
    """Get a logger with the specified name that logs to hourly files
    
    Args:
        name: The name of the logger
        console_output: Override environment setting for console output
    """
    logger = logging.getLogger(name)
    
    # ใช้ค่า CONSOLE_LOGGING จาก environment หากไม่ได้ระบุ console_output
    show_console = CONSOLE_LOGGING if console_output is None else console_output
    
    # Avoid adding handlers multiple times
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        
        # Console handler (only add if show_console is True)
        if show_console:
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            ))
            logger.addHandler(console_handler)
        
        # Hourly file handler
        file_handler = HourlyRotatingFileHandler()
        logger.addHandler(file_handler)
    
    return logger