# Integration Testing API Documentation

## Overview
รายการ API Endpoints ทั้งหมดสำหรับ Integration Testing ของระบบ CAPTS MOF API

**รวมทั้งหมด: 84 API endpoints**

---

## 📋 Table of Contents
- [1. Authentication Group](#1-authentication-group) (13 endpoints)
- [2. User Management Group](#2-user-management-group) (8 endpoints)
- [3. Roles & Permissions Group](#3-roles--permissions-group) (10 endpoints)
- [4. Organization Management Group](#4-organization-management-group) (7 endpoints)
- [5. Departments Group](#5-departments-group) (6 endpoints)
- [6. Employees Group](#6-employees-group) (8 endpoints)
- [7. File Upload/Download Group](#7-file-uploaddownload-group) (6 endpoints)
- [8. Notifications Group](#8-notifications-group) (6 endpoints)
- [9. Audit Logs Group](#9-audit-logs-group) (4 endpoints)
- [10. Reports Group](#10-reports-group) (5 endpoints)
- [11. System Settings Group](#11-system-settings-group) (6 endpoints)
- [12. Health & Monitoring Group](#12-health--monitoring-group) (5 endpoints)

---

## 1. Authentication Group
> **13 endpoints** - การจัดการการยืนยันตัวตนและการเข้าสู่ระบบ

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/login` | เข้าสู่ระบบด้วย citizen_id และ password |
| `GET` | `/api/v1/auth/me` | ดึงข้อมูลผู้ใช้ปัจจุบัน |
| `POST` | `/api/v1/thaid/auth` | การยืนยันตัวตนผ่าน ThaiD |
| `POST` | `/api/v1/thaid/login` | เข้าสู่ระบบผ่าน ThaiD |
| `POST` | `/api/v1/auth/resend-verification` | ส่งอีเมลยืนยันใหม่ |
| `POST` | `/api/v1/auth/forgot-password` | ขอรีเซ็ตรหัสผ่าน |
| `POST` | `/api/v1/auth/reset-password` | รีเซ็ตรหัสผ่าน |
| `GET` | `/api/v1/auth/verify-reset-token` | ตรวจสอบ token สำหรับรีเซ็ตรหัสผ่าน |
| `POST` | `/api/v1/auth/verify-employee` | ยืนยันข้อมูลพนักงาน |
| `POST` | `/api/v1/auth/register` | สมัครสมาชิกใหม่ |
| `POST` | `/api/v1/auth/logout` | ออกจากระบบ |
| `GET` | `/api/v1/auth/verify-email` | ยืนยันอีเมล |
| `POST` | `/api/v1/auth/refresh-token` | รีเฟรช access token |

---

## 2. User Management Group
> **8 endpoints** - การจัดการข้อมูลผู้ใช้

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/users/profile` | ดึงข้อมูลโปรไฟล์ผู้ใช้ |
| `PUT` | `/api/v1/users/profile` | อัปเดตโปรไฟล์ผู้ใช้ |
| `POST` | `/api/v1/users/change-password` | เปลี่ยนรหัสผ่าน |
| `GET` | `/api/v1/users/{id}` | ดึงข้อมูลผู้ใช้ตาม ID |
| `PUT` | `/api/v1/users/{id}` | อัปเดตข้อมูลผู้ใช้ |
| `DELETE` | `/api/v1/users/{id}` | ลบผู้ใช้ |
| `GET` | `/api/v1/users` | ดึงรายการผู้ใช้ทั้งหมด |
| `POST` | `/api/v1/users` | สร้างผู้ใช้ใหม่ |

---

## 3. Roles & Permissions Group
> **10 endpoints** - การจัดการบทบาทและสิทธิ์

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/roles` | ดึงรายการบทบาททั้งหมด |
| `POST` | `/api/v1/roles` | สร้างบทบาทใหม่ |
| `GET` | `/api/v1/roles/{id}` | ดึงข้อมูลบทบาทตาม ID |
| `PUT` | `/api/v1/roles/{id}` | อัปเดตบทบาท |
| `DELETE` | `/api/v1/roles/{id}` | ลบบทบาท |
| `GET` | `/api/v1/permissions` | ดึงรายการสิทธิ์ทั้งหมด |
| `POST` | `/api/v1/permissions` | สร้างสิทธิ์ใหม่ |
| `GET` | `/api/v1/permissions/{id}` | ดึงข้อมูลสิทธิ์ตาม ID |
| `PUT` | `/api/v1/permissions/{id}` | อัปเดตสิทธิ์ |
| `DELETE` | `/api/v1/permissions/{id}` | ลบสิทธิ์ |

---

## 4. Organization Management Group
> **7 endpoints** - การจัดการองค์กร

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/organizations` | ดึงรายการองค์กรทั้งหมด |
| `POST` | `/api/v1/organizations` | สร้างองค์กรใหม่ |
| `GET` | `/api/v1/organizations/{id}` | ดึงข้อมูลองค์กรตาม ID |
| `PUT` | `/api/v1/organizations/{id}` | อัปเดตข้อมูลองค์กร |
| `DELETE` | `/api/v1/organizations/{id}` | ลบองค์กร |
| `GET` | `/api/v1/organizations/{id}/users` | ดึงรายการผู้ใช้ในองค์กร |
| `POST` | `/api/v1/organizations/{id}/users` | เพิ่มผู้ใช้เข้าองค์กร |
| `DELETE` | `/api/v1/organizations/{id}/users/{userId}` | ลบผู้ใช้ออกจากองค์กร |

---

## 5. Departments Group
> **6 endpoints** - การจัดการหน่วยงาน

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/departments` | ดึงรายการหน่วยงานทั้งหมด |
| `POST` | `/api/v1/departments` | สร้างหน่วยงานใหม่ |
| `GET` | `/api/v1/departments/{id}` | ดึงข้อมูลหน่วยงานตาม ID |
| `PUT` | `/api/v1/departments/{id}` | อัปเดตข้อมูลหน่วยงาน |
| `DELETE` | `/api/v1/departments/{id}` | ลบหน่วยงาน |
| `GET` | `/api/v1/departments/{id}/employees` | ดึงรายการพนักงานในหน่วยงาน |
| `POST` | `/api/v1/departments/{id}/employees` | เพิ่มพนักงานเข้าหน่วยงาน |

---

## 6. Employees Group
> **8 endpoints** - การจัดการพนักงาน

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/employees` | ดึงรายการพนักงานทั้งหมด |
| `POST` | `/api/v1/employees` | สร้างข้อมูลพนักงานใหม่ |
| `GET` | `/api/v1/employees/{id}` | ดึงข้อมูลพนักงานตาม ID |
| `PUT` | `/api/v1/employees/{id}` | อัปเดตข้อมูลพนักงาน |
| `DELETE` | `/api/v1/employees/{id}` | ลบข้อมูลพนักงาน |
| `GET` | `/api/v1/employees/search` | ค้นหาพนักงาน |
| `POST` | `/api/v1/employees/{id}/assign-role` | กำหนดบทบาทให้พนักงาน |
| `DELETE` | `/api/v1/employees/{id}/remove-role` | ลบบทบาทของพนักงาน |

---

## 7. File Upload/Download Group
> **6 endpoints** - การจัดการไฟล์

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/files/upload` | อัปโหลดไฟล์ |
| `GET` | `/api/v1/files/{id}` | ดึงข้อมูลไฟล์ตาม ID |
| `DELETE` | `/api/v1/files/{id}` | ลบไฟล์ |
| `GET` | `/api/v1/files` | ดึงรายการไฟล์ทั้งหมด |
| `POST` | `/api/v1/files/bulk-upload` | อัปโหลดไฟล์หลายไฟล์ |
| `GET` | `/api/v1/files/{id}/download` | ดาวน์โหลดไฟล์ |

---

## 8. Notifications Group
> **6 endpoints** - การจัดการการแจ้งเตือน

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/notifications` | ดึงรายการการแจ้งเตือน |
| `POST` | `/api/v1/notifications` | สร้างการแจ้งเตือนใหม่ |
| `GET` | `/api/v1/notifications/{id}` | ดึงข้อมูลการแจ้งเตือนตาม ID |
| `PUT` | `/api/v1/notifications/{id}/read` | ทำเครื่องหมายอ่านแล้ว |
| `DELETE` | `/api/v1/notifications/{id}` | ลบการแจ้งเตือน |
| `GET` | `/api/v1/notifications/unread-count` | นับจำนวนการแจ้งเตือนที่ยังไม่อ่าน |

---

## 9. Audit Logs Group
> **4 endpoints** - การจัดการ Log การใช้งาน

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/audit-logs` | ดึงรายการ audit logs |
| `GET` | `/api/v1/audit-logs/{id}` | ดึงข้อมูล audit log ตาม ID |
| `POST` | `/api/v1/audit-logs/search` | ค้นหา audit logs |
| `GET` | `/api/v1/audit-logs/export` | ส่งออก audit logs |

---

## 10. Reports Group
> **5 endpoints** - การจัดการรายงาน

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/reports/users` | รายงานผู้ใช้ |
| `GET` | `/api/v1/reports/organizations` | รายงานองค์กร |
| `GET` | `/api/v1/reports/activities` | รายงานกิจกรรม |
| `POST` | `/api/v1/reports/custom` | สร้างรายงานแบบกำหนดเอง |
| `GET` | `/api/v1/reports/{id}/export` | ส่งออกรายงาน |

---

## 11. System Settings Group
> **6 endpoints** - การจัดการการตั้งค่าระบบ

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/settings` | ดึงการตั้งค่าทั้งหมด |
| `PUT` | `/api/v1/settings` | อัปเดตการตั้งค่า |
| `GET` | `/api/v1/settings/{key}` | ดึงการตั้งค่าตาม key |
| `PUT` | `/api/v1/settings/{key}` | อัปเดตการตั้งค่าตาม key |
| `POST` | `/api/v1/settings/backup` | สำรองข้อมูลการตั้งค่า |
| `POST` | `/api/v1/settings/restore` | กู้คืนการตั้งค่า |

---

## 12. Health & Monitoring Group
> **5 endpoints** - การตรวจสอบสถานะระบบ

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | ตรวจสอบสถานะระบบ |
| `GET` | `/api/v1/health/detailed` | ตรวจสอบสถานะระบบแบบละเอียด |
| `GET` | `/api/v1/metrics` | ดึงข้อมูลเมตริกระบบ |
| `GET` | `/api/v1/version` | ดึงข้อมูลเวอร์ชันระบบ |
| `GET` | `/api/v1/status` | ตรวจสอบสถานะการทำงาน |

---

## 📊 Summary

| Group | Endpoints Count | Priority |
|-------|----------------|----------|
| Authentication | 13 | 🔴 High |
| User Management | 8 | 🔴 High |
| Roles & Permissions | 10 | 🟡 Medium |
| Organizations | 7 | 🟡 Medium |
| Departments | 6 | 🟡 Medium |
| Employees | 8 | 🟡 Medium |
| Files | 6 | 🟢 Low |
| Notifications | 6 | 🟢 Low |
| Audit Logs | 4 | 🟢 Low |
| Reports | 5 | 🟢 Low |
| Settings | 6 | 🟡 Medium |
| Health & Monitoring | 5 | 🔴 High |

**Total: 84 API endpoints**

---

## 🧪 Testing Strategy

### Phase 1: Core Functionality (High Priority)
- Authentication endpoints
- User management
- Health & monitoring

### Phase 2: Business Logic (Medium Priority)
- Roles & permissions
- Organizations & departments
- Employees & settings

### Phase 3: Supporting Features (Low Priority)
- File management
- Notifications
- Audit logs & reports

---

## 📝 Notes
- Base URL: `http://localhost:8000/api/v1`
- Authentication required for most endpoints
- Rate limiting may apply
- Some endpoints require specific roles/permissions