# Production Migration Guide

## 📋 Overview

Migration script สำหรับอัพเดท production database schema ให้ตรงกับ development environment

**วันที่สร้าง:** 2025-11-05
**ไฟล์:** `PRODUCTION_MIGRATION_COMPLETE.sql`
**ระยะเวลาประมาณ:** 1-2 นาที

---

## ⚠️ Pre-Migration Checklist

### 1. **Backup Database** (Required!)

```sql
-- Option 1: Full Backup (Recommended)
BACKUP DATABASE [comp_mof]
TO DISK = 'D:\Backup\comp_mof_backup_2025-11-05.bak'
WITH FORMAT, INIT, NAME = 'Full Backup Before Migration';

-- Option 2: Quick SSMS Backup
-- Right-click database → Tasks → Back Up...
```

### 2. **Maintenance Window**
- ⏰ แนะนำช่วงเวลาที่ user ใช้งานน้อย
- ⏱️ ประมาณ 5-10 นาที (รวมทดสอบ)
- 📢 แจ้ง user ล่วงหน้า

### 3. **Production Database Access**
- Server: `[YOUR_PRODUCTION_SERVER]`
- Database: `comp_mof`
- Username: `admin_comp_mof`
- Password: `[ASK ADMIN]`

---

## 🚀 Migration Steps

### Option 1: SQL Server Management Studio (SSMS) - แนะนำ

1. **เปิด SSMS และเชื่อมต่อ Production Server**
   ```
   Server: [YOUR_PRODUCTION_SERVER]
   Authentication: SQL Server Authentication
   Login: admin_comp_mof
   Password: [Production Password]
   ```

2. **เปิดไฟล์ Migration**
   - File → Open → File...
   - เลือก: `PRODUCTION_MIGRATION_COMPLETE.sql`

3. **ตรวจสอบ Database ที่เลือก**
   - ตรวจสอบว่าเลือก database `comp_mof` แล้ว
   - หรือดู `USE [comp_mof];` ในบรรทัดแรกของ script

4. **รัน Migration**
   - กด `Execute` (F5) หรือปุ่ม ▶️
   - รอ script รันเสร็จ

5. **ตรวจสอบผลลัพธ์**
   - ดู Messages tab
   - ต้องเห็น `✅ All migrations applied successfully!`

### Option 2: Command Line (sqlcmd)

```bash
# Production Server
sqlcmd -S [PRODUCTION_SERVER] -d comp_mof -U admin_comp_mof -P [PASSWORD] -i PRODUCTION_MIGRATION_COMPLETE.sql

# ตัวอย่าง Local Testing
sqlcmd -S localhost -d comp_mof -U admin_comp_mof -P Password@1234 -i PRODUCTION_MIGRATION_COMPLETE.sql
```

---

## ✅ Post-Migration Verification

### 1. **ตรวจสอบ Columns ถูกเพิ่ม**

```sql
-- Check comp_complaints
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'comp_complaints'
AND COLUMN_NAME IN ('director_submission_date', 'assigned_remark', 'confirm_assigned_date')
ORDER BY COLUMN_NAME;

-- Check outgoing_reports5
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'outgoing_reports5'
AND COLUMN_NAME = 'process_step';
```

**Expected Result:** ต้องเห็นทุก column ที่ query

### 2. **ทดสอบ API Endpoints**

```bash
# Test Document Storage (เคยเจอ error)
curl https://complain.mof.go.th/api/v1/document-storage/[SOME_ID]

# Test Complaints
curl https://complain.mof.go.th/api/v1/complaints/enhanced?skip=0&limit=10
```

**Expected:** ไม่มี error `Invalid column name`

### 3. **ตรวจสอบ Application Logs**

```bash
# Check FastAPI logs for errors
tail -f /var/log/capts_mof/api.log

# หรือ Windows
Get-Content api.log -Wait -Tail 50
```

### 4. **Restart Application** (Required!)

```bash
# Production Server - หลังรัน migration เสร็จ
# ต้อง restart FastAPI เพื่อ refresh connection pool

# Linux/Ubuntu
sudo systemctl restart capts_mof_api

# หรือ Docker
docker restart capts_mof_api

# หรือ PM2
pm2 restart capts_mof_api
```

---

## 📊 Migration Summary

| Table | Columns Added | Purpose |
|-------|---------------|---------|
| `comp_complaints` | 6 columns | เพิ่มข้อมูลการยืนยันรับงาน, วันที่เสนอผู้อำนวยการ |
| `outgoing_reports` | 3 columns | เพิ่มข้อมูลตำแหน่ง, เลขที่/วันที่เอกสาร |
| `outgoing_reports2` | 4 columns | เพิ่มข้อมูลหน่วยงานภายนอก, เอกสาร |
| `outgoing_reports3` | 3 columns | เพิ่มข้อมูลตำแหน่ง, เอกสาร |
| `outgoing_reports4` | 8 columns | เพิ่มข้อมูลครบถ้วนสำหรับรายงาน |
| `outgoing_reports5` | 1 column | เพิ่มขั้นตอนการดำเนินการ |

**Total:** 25 columns added across 6 tables

---

## 🔄 Rollback Plan (ถ้ามีปัญหา)

### 1. **Restore from Backup**

```sql
-- Stop application first!

USE master;
GO

-- Restore database
RESTORE DATABASE [comp_mof]
FROM DISK = 'D:\Backup\comp_mof_backup_2025-11-05.bak'
WITH REPLACE, RECOVERY;
GO
```

### 2. **Manual Column Removal** (ถ้าต้องการ rollback บางส่วน)

```sql
-- ⚠️ ใช้เฉพาะกรณีฉุกเฉิน!
ALTER TABLE outgoing_reports5 DROP COLUMN process_step;
ALTER TABLE comp_complaints DROP COLUMN director_submission_date;
-- ... (ทำกับ columns อื่นๆ)
```

---

## 🛠️ Troubleshooting

### Error: "Column already exists"
**สาเหตุ:** Migration เคยรันไปแล้วบางส่วน
**แก้ไข:** ไม่ต้องทำอะไร - script จะ skip columns ที่มีอยู่แล้ว

### Error: "Foreign key constraint failed"
**สาเหตุ:** ตาราง reference ไม่มี
**แก้ไข:** ตรวจสอบว่า tables `comp_users`, `outside_departments`, `positions` มีอยู่

### Error: "Cannot connect to database"
**สาเหตุ:** Connection string ผิด หรือ database ไม่ online
**แก้ไข:**
1. ตรวจสอบ SQL Server service รัน อยู่
2. ตรวจสอบ firewall
3. ตรวจสอบ credentials

### Application ยัง error หลัง migration
**สาเหตุ:** Application ยังใช้ connection pool เก่า
**แก้ไข:** **Restart application!** (สำคัญมาก)

---

## 📝 Notes

- ✅ Script นี้ **idempotent** = รันได้หลายครั้งไม่เกิด error
- ✅ มี **data migration** สำหรับ columns ที่ต้องการค่า default
- ✅ ทุก column เพิ่มเป็น **NULL** ไม่กระทบข้อมูลเดิม
- ✅ Foreign keys ถูกเพิ่มอัตโนมัติ
- ⚠️ **ต้อง restart application** หลังรัน migration

---

## 👥 Contact

ถ้ามีปัญหาติดต่อ:
- **DevOps Team:** [YOUR_CONTACT]
- **DBA Team:** [YOUR_CONTACT]
- **Emergency:** [YOUR_CONTACT]

---

## ✅ Sign-off

- [ ] Backup completed
- [ ] Migration script reviewed
- [ ] Maintenance window scheduled
- [ ] Migration executed successfully
- [ ] Verification tests passed
- [ ] Application restarted
- [ ] Production monitoring for 1 hour
- [ ] Migration completed

**Executed by:** ________________
**Date:** ________________
**Time:** ________________
