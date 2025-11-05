# Database Migrations

## วิธีการรัน Migration Script

### สำหรับ Windows (SQL Server Management Studio - SSMS)

1. เปิด **SQL Server Management Studio (SSMS)**
2. เชื่อมต่อกับ server:
   - Server: `localhost`
   - Database: `comp_mof`
   - Username: `admin_comp_mof`
   - Password: `Password@1234`

3. เปิดไฟล์ `add_process_step_to_outgoing_reports5.sql`
4. กด **Execute** (F5) เพื่อรัน script

### สำหรับ Command Line (sqlcmd)

```bash
sqlcmd -S localhost -d comp_mof -U admin_comp_mof -P Password@1234 -i migrations/add_process_step_to_outgoing_reports5.sql
```

### ตรวจสอบว่า Migration สำเร็จ

หลังจากรัน migration แล้ว ให้ตรวจสอบว่า column `process_step` ถูกเพิ่มเข้าไปแล้ว:

```sql
USE [comp_mof];
GO

-- ตรวจสอบว่า column process_step มีอยู่ในตาราง
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'outgoing_reports5'
AND COLUMN_NAME = 'process_step';
GO
```

ผลลัพธ์ที่ควรเห็น:
```
COLUMN_NAME    DATA_TYPE    CHARACTER_MAXIMUM_LENGTH    IS_NULLABLE
-----------    ---------    ------------------------    -----------
process_step   nvarchar     255                         YES
```

## Migration Scripts

| Filename | Description | Date | Status |
|----------|-------------|------|--------|
| `add_process_step_to_outgoing_reports5.sql` | เพิ่มฟิลด์ "ขั้นตอนการดำเนินการ" (process_step) | 2025-11-05 | ✅ Ready |

## ค่าที่รองรับใน process_step

- `รับเรื่อง`
- `ตรวจสอบเอกสาร`
- `ส่งต่อหน่วยงาน`
- `ดำเนินการสอบสวน`
- `รายงานผล`
- `ติดตามผล`
- `ปิดเรื่อง`

## หมายเหตุ

- Script นี้จะตรวจสอบว่า column มีอยู่แล้วหรือไม่ ก่อนที่จะเพิ่ม (idempotent)
- สามารถรัน script ซ้ำได้โดยไม่เกิด error
- ใช้ `NVARCHAR(255)` เพื่อรองรับข้อความภาษาไทย
