import os

from dotenv import load_dotenv

load_dotenv()  # จะไปอ่านไฟล์ .env ในโฟลเดอร์ปัจจุบัน

PROJECT_NAME = os.getenv("PROJECT_NAME")
CONSOLE_LOGGING = os.getenv("CONSOLE_LOGGING")
PREFIX = os.getenv("PREFIX")
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
ENVIRONMENT = os.getenv("ENVIRONMENT")
ALGORITHM = os.getenv("ALGORITHM")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
