import os
import logging
import datetime
import shutil
from pathlib import Path
from config.dotenv import CONSOLE_LOGGING

CONSOLE_LOGGING = CONSOLE_LOGGING.lower() == 'true' if CONSOLE_LOGGING else True
APP_LOG_LEVEL = os.getenv("APP_LOG_LEVEL", "INFO").upper()

class HourlyRotatingFileHandler(logging.Handler):
    def __init__(self, base_dir="logs"):
        super().__init__()
        self.base_dir = base_dir
        Path(base_dir).mkdir(exist_ok=True)
        self.current_date = None
        self.current_hour = None
        self.file_handler = None
        self._update_handler()
        self._clean_old_logs()

    def _update_handler(self):
        now = datetime.datetime.now()
        date_str = now.strftime("%Y-%m-%d")
        hour = now.hour
        if self.current_date != date_str or self.current_hour != hour:
            if self.file_handler:
                self.file_handler.close()
            date_dir = os.path.join(self.base_dir, date_str)
            Path(date_dir).mkdir(exist_ok=True)
            file_path = os.path.join(date_dir, f"{hour:02d}.log")
            self.file_handler = logging.FileHandler(file_path, encoding='utf-8')
            self.file_handler.setFormatter(logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            ))
            self.current_date = date_str
            self.current_hour = hour

    def emit(self, record):
        self._update_handler()
        self.file_handler.emit(record)

    def _clean_old_logs(self):
        """Delete log folders older than 90 days"""
        today = datetime.datetime.now().date()
        three_months_ago = today - datetime.timedelta(days=90)
        for date_dir in Path(self.base_dir).iterdir():
            if not date_dir.is_dir():
                continue
            try:
                dir_date = datetime.datetime.strptime(date_dir.name, "%Y-%m-%d").date()
                if dir_date < three_months_ago:
                    shutil.rmtree(date_dir, ignore_errors=True)
            except ValueError:
                continue

    def clean_old_logs(self):
        self._clean_old_logs()

def get_logger(name: str, console_output: bool | None = None) -> logging.Logger:
    """
    Return a named logger that ALWAYS writes to hourly files,
    and prints to console ONLY when allowed.
    """
    logger = logging.getLogger(name)

    # กันไม่ให้ไหลขึ้น root/uvicorn (เพื่อให้ CONSOLE_LOGGING คุมได้จริง)
    logger.propagate = False

    # ตัดสินใจแสดงบนคอนโซลจาก env/argument
    show_console = CONSOLE_LOGGING if console_output is None else bool(console_output)

    # ตั้งระดับจาก ENV (default INFO)
    numeric_level = getattr(logging, APP_LOG_LEVEL, logging.INFO)
    logger.setLevel(numeric_level)

    if not logger.handlers:
        # Console handler (เฉพาะเมื่ออนุญาต)
        if show_console:
            ch = logging.StreamHandler()
            ch.setLevel(numeric_level)
            ch.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
            logger.addHandler(ch)

        # Hourly file handler (มีเสมอ)
        fh = HourlyRotatingFileHandler()
        fh.setLevel(numeric_level)
        logger.addHandler(fh)
    else:
        # อัปเดตระดับและ toggle console handler ตามสถานะล่าสุด
        for h in list(logger.handlers):
            h.setLevel(numeric_level)
            if isinstance(h, logging.StreamHandler) and not isinstance(h, logging.FileHandler):
                if not show_console:
                    logger.removeHandler(h)
        if show_console and not any(isinstance(h, logging.StreamHandler) and not isinstance(h, logging.FileHandler)
                                    for h in logger.handlers):
            ch = logging.StreamHandler()
            ch.setLevel(numeric_level)
            ch.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
            logger.addHandler(ch)

    return logger