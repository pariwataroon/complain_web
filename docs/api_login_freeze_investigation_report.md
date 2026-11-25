# รายงานการวิเคราะห์และแนวทางแก้ไขปัญหา API ค้างและเข้าสู่ระบบช้า
**Endpoint:** `https://complain.mof.go.th/api/v1/auth/login`  
**วันที่วิเคราะห์:** 24 พฤศจิกายน 2026  
**ระบบ:** CAPTS MOF API (`c:\capts_mof_api`)

---

## 1. ปัญหาที่พบ (Issue Summary)
ผู้ใช้งานประสบปัญหาเข้าใช้งานระบบผ่านหน้า Login (`/api/v1/auth/login`) ตอบสนองช้ามาก และส่งผลให้โปรแกรม API (`uvicorn`) ค้างทั้งระบบ ไม่สามารถให้บริการ Endpoint อื่นๆ ได้ในเวลาเดียวกัน

---

## 2. หลักฐานจากการตรวจสอบ Log ระบบ (`logs/2026-11-24/09.log`)
จากการตรวจสอบ Log การทำงานจริงของ API ประจำวันที่ 24 พ.ย. 2026 พบหลักฐานสำคัญดังนี้:

* **ช่วงเวลา 09:36:46 น.:**
  * `POST /v1/auth/login` ใช้เวลาประมวลผลสูงถึง **179,520 ms (เกือบ 3 นาที)**
  * Endpoint อื่นๆ เช่น `/v1/news/public/displayable` และ `/v1/chat_bot` ที่ส่งเข้ามาในช่วงเวลาเดียวกัน ใช้เวลาประมาณ 178,000 ms และตอบสนองกลับมาในเสี้ยววินาทีเดียวกัน
* **ช่วงเวลา 09:51:48 น.:**
  * `POST /v1/auth/login` ใช้เวลาประมวลผลสูงถึง **261,473 ms (4 นาที 21 วินาที)**
  * Endpoint อื่นๆ ได้แก่ `/v1/api-logs/counter`, `/v1/news/public/displayable`, `/v1/chat_bot`, `/v1/users/title/details` ค้างพร้อมกันที่ **261,000 ms** และตอบกลับมาในมิลลิวินาทีเดียวกันทั้งหมด
* **ข้อสังเกตเชิงลึก:**
  * ระหว่างเวลา `09:45:54` ถึง `09:51:48` (เกือบ 6 นาที) **ไม่มี Log ถูกบันทึกเลยแม้แต่บรรทัดเดียว** ชี้ชัดว่า **Main asyncio Event Loop ของ FastAPI หยุดการทำงานชั่วขณะ (Freeze)** ทำให้ Socket รับคำขอค้างสะสม

---

## 3. การวิเคราะห์หาสาเหตุที่แท้จริง (Root Cause Analysis)

### 3.1 สาเหตุหลัก: `CounterUpdateService` รัน Full Table Scan บนตาราง `api_logs` (1,000,000+ แถว)
1. **ตำแหน่ง:** `main.py` บรรทัดที่ 70 เรียกใช้ `await counter_service.start_background_update()`
2. **การทำงาน:** ใน `lib/counter_service.py` มีการตั้งเวลาวนลูปทำงาน **ทุก 60 วินาที** โดยเรียก `get_user_counter_from_chatbot_logs(db, use_cache=False)`
3. **ปัญหาใน Query (`app/api/v1/controllers/api_log_controller.py`):**
   * ระบบทำการรัน **8 Query ติดต่อกัน** ด้วยเงื่อนไข:
     ```python
     ApiLog.path.like('%/chat_bot%')
     ```
   * ปัจจุบันตาราง `dbo.api_logs` ในฐานข้อมูลมีข้อมูลสะสมมากถึง **1,009,079 แถว**
   * ฟิลด์ `path`, `user_id`, `created_at` **ไม่มี Index**
   * การใช้ `LIKE '%...'` มีเครื่องหมาย `%` ด้านหน้า ส่งผลให้ Database Engine (SQL Server) ไม่สามารถใช้ Index ได้ ต้องทำ **Full Table Scan กวาดอ่านทั้ง 1 ล้านแถว x 8 รอบ** (กวาดอ่านรวม 8 ล้านเรคคอร์ด)
   * ฟังก์ชันนี้เป็น **Synchronous Blocking DB call** แต่ถูกรันอยู่บน **Main Event Loop** โดยตรง จึงทำให้ Process ของ Python ค้างสนิท 2 - 4 นาทีในทุกๆ รอบ 60 วินาที

### 3.2 สาเหตุรอง: Uvicorn รันแบบ Single-Worker และเปิด `--reload`
1. **คำสั่งเดิม:**
   ```cmd
   uvicorn main:app --reload --host 0.0.0.0 --port 3000
   ```
2. **ผลกระทบของ `--reload`:**
   * ตัว File Watcher (`watchfiles`) จะสแกนไฟล์ทั้งไดเรกทอรีตลอดเวลา เมื่อมีการเขียน Log ลง `logs/` หรืออัปโหลดไฟล์ จะทำให้ Uvicorn รีสตาร์ทตัวเองกลางคัน ส่งผลให้ Request หลุด (Drop Connection)
3. **ผลกระทบของ Single Worker (1 Process):**
   * Python มี GIL หากมีงานที่คำนวณหนักหรืองานบล็อกเพียงงานเดียว จะไม่มี Worker สำรองคอยรับ Request ของผู้ใช้คนอื่น

### 3.3 สาเหตุเสริม: Endpoint `/login` เป็น `async def` แต่รัน Blocking Tasks
* ใน `app/api/v1/routers/auth_router.py`:
  * ฟังก์ชันถูกประกาศเป็น `async def login(...)`
  * ภายในมีการเรียก `bcrypt.checkpw()` (CPU-bound) และ Synchronous DB Queries หลายตัว ทำให้งานคำนวณรหัสผ่านเข้าไปแย่งทรัพยากรบน Event Loop โดยตรง

### 3.4 สาเหตุเสริม: Database Connection Pool ขาด `pool_pre_ping`
* ใน `config/database.py` มีการตั้งค่า `pool_pre_ping=False` ทำให้เวลา Connection ไปยัง SQL Server (`172.29.34.137`) หลุดหรือค้าง ระบบจะไม่ตรวจสอบก่อนนำมาใช้ ส่งผลให้ Request รอนานจนเกิด Timeout (30 วินาที)

---

## 4. ตำแหน่งตารางและข้อมูลใน Database
* **Database Server:** `172.29.34.137:1433`
* **Database Name:** `comp_mof`
* **Table Name:** `dbo.api_logs`
* **Model ในโค้ด:** `models/api_log.py`
* **ที่มาของข้อมูล:** เกิดจาก `app/api/common/middlewares/logger_middleware.py` ที่คอย `INSERT` ประวัติทุกๆ HTTP Request ลงใน Database ตลอดเวลาตั้งแต่เปิดระบบ

---

## 5. วิธีการแก้ไข (Action Items)

### ขั้นตอนที่ 1: แก้ไขโค้ดในโปรเจกต์ (ดำเนินการแล้ว/ต้องทำทันที)
1. **ปิด Background Loop ใน `main.py`:**
   ```python
   # main.py (Line 70)
   # await counter_service.start_background_update()
   ```
2. **ปรับ `/login` ให้รันใน ThreadPool ใน `app/api/v1/routers/auth_router.py`:**
   ```python
   # auth_router.py (Line 24) - ตัด async ออก
   @router.post("/login", response_model=format_data.FormatResponseModel)
   def login(request: Request, user: schemas.UserLogin, db: Session = Depends(get_db)):
   ```
3. **เปิด `pool_pre_ping=True` ใน `config/database.py`:**
   ```python
   # database.py (Line 30)
   pool_pre_ping=True
   ```
4. **เพิ่ม Index ใน Model `models/api_log.py`:**
   ```python
   path = Column(NVARCHAR(255), index=True)
   user_id = Column(UNIQUEIDENTIFIER, ForeignKey("comp_users.id"), index=True, nullable=True)
   created_at = Column(DateTime, default=func.now(), index=True)
   ```

---

### ขั้นตอนที่ 2: ปรับคำสั่งรันระบบผ่าน CMD
เปลี่ยนคำสั่งรัน Uvicorn โดย **ตัด `--reload`** และ **เพิ่ม `--workers 4`**:
```cmd
C:\capts_mof_api>venv\Scripts\activate
C:\capts_mof_api>uvicorn main:app --host 0.0.0.0 --port 3000 --workers 4
```

---

### ขั้นตอนที่ 3: การบำรุงรักษาฐานข้อมูล SQL Server (รันผ่าน SSMS)

#### 1) ลบข้อมูล Log เก่าที่เกิน 30 วัน:
```sql
USE comp_mof;

DELETE FROM api_logs 
WHERE created_at < DATEADD(DAY, -30, GETDATE());
```

#### 2) สร้าง Index เพื่อเพิ่มความเร็วในการสแกนข้อมูล:
```sql
USE comp_mof;

CREATE NONCLUSTERED INDEX IX_api_logs_path_created 
ON api_logs (path, created_at) 
INCLUDE (user_id);

CREATE NONCLUSTERED INDEX IX_api_logs_created_at 
ON api_logs (created_at);
```
*(หมายเหตุ: การสร้าง Index ใน SQL Server ไม่จำเป็นต้องแก้โค้ดคำสั่ง Query ในโปรเจกต์ SQL Server จะเลือกใช้ Index เองโดยอัตโนมัติ)*

---

## 6. สรุปผลหลังการแก้ไข
* ตัดปัญหา Event Loop Freeze ที่เกิดจากการสแกนตาราง 1 ล้านแถวทุกๆ 60 วินาที
* ปลดล็อค `/login` ให้ทำงานแบบแยก Thread อิสระ ไม่ติดค้าง
* Uvicorn มี 4 Worker คอยสลับกันให้บริการได้อย่างต่อเนื่อง แม้มีผู้ใช้งานเรียกรายงานขนาดใหญ่
* การเชื่อมต่อฐานข้อมูลมี `pool_pre_ping` คอยดักจับ Connection ที่หลุด ทำให้ไม่มี Request ค้าง 30 วินาทีอีกต่อไป
