from dotenv import load_dotenv
import os

load_dotenv()  # จะไปอ่านไฟล์ .env ในโฟลเดอร์ปัจจุบัน

prefix = os.getenv("PREFIX")
jwt_serect_key = os.getenv('JWT_SECRET_KEY')
