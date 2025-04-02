from dotenv import load_dotenv
import os

load_dotenv()  # จะไปอ่านไฟล์ .env ในโฟลเดอร์ปัจจุบัน

project_name = os.getenv("PROJECT_NAME")
console_logging = os.getenv("CONSOLE_LOGGING")
prefix = os.getenv("PREFIX")
jwt_serect_key = os.getenv('JWT_SECRET_KEY')
