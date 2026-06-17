/**
 * ============================================================
 *  API Service — เรื่องราวร้องทุกข์ช่องทางเว็บไซต์ Mof_EOffice
 * ============================================================
 *
 *  ไฟล์นี้คือช่องสำหรับเชื่อม API จริงจาก eofficer
 *  เมื่อ API จาก eofficer พร้อมใช้งาน ให้ใส่ URL และ logic ในแต่ละฟังก์ชัน
 *
 *  ─────────────────────────────────────────
 *  📌 วิธีใส่ API จริง:
 *  ─────────────────────────────────────────
 *
 *  1) import axiosInstance จาก @pages/api/axiosInstance (สำหรับ API ภายใน)
 *     หรือสร้าง axios instance ใหม่ถ้า eofficer เป็น server ต่าง domain:
 *
 *       import axios from "axios";
 *       const eofficeInstance = axios.create({
 *         baseURL: "https://eoffice-api-url.go.th/api/v1",  // ← เปลี่ยนเป็น URL จริง
 *         headers: { "Content-Type": "application/json" },
 *       });
 *
 *  2) ในแต่ละฟังก์ชัน ให้แทนที่ TODO ด้วยการเรียก API จริง:
 *
 *       const response = await eofficeInstance.get("/complaints");
 *       return response?.data;
 *
 *  3) response จาก eofficer จะเป็น JSON โครงสร้างประมาณนี้:
 *       {
 *         "res_code": "0000",
 *         "res_message": "GET_DATA_SUCCESSFULLY",
 *         "res_data": { ... }
 *       }
 *
 *  ─────────────────────────────────────────
 *  📌 โครงสร้างข้อมูลที่ eofficer จะส่งมา (JSON):
 *  ─────────────────────────────────────────
 *
 *  **รายการร้องทุกข์ (GET /complaints)** → res_data เป็น array:
 *    [{
 *       case_id: string,          // เลขที่เรื่อง เช่น "EO-2569-00001"
 *       subject: string,          // ชื่อเรื่อง
 *       complainant_name: string,  // ชื่อผู้ร้อง
 *       complainant_phone: string,
 *       type_name: string,         // ประเภทเรื่อง
 *       status: string,            // "new" | "in_progress" | "completed"
 *       status_name: string,       // ชื่อสถานะภาษาไทย
 *       channel_name: string,
 *       date_received: string,     // "2569/01/15 09:30:00"
 *       date_updated: string,
 *       priority: string,          // "ปกติ" | "ด่วน" | "เร่งด่วน"
 *    }]
 *
 *  **รายละเอียดร้องทุกข์ (GET /complaints/{case_id})** → res_data เป็น object:
 *    {
 *       case_id, case_code, subject, description,
 *       status, status_name, type_name, channel_name,
 *       priority, severity, confidentiality,
 *       date_received, date_updated, reference_no,
 *       complainant: { title, first_name, last_name, citizen_id, gender, phone, email, address, province, district, sub_district, zipcode },
 *       respondent: { type, name, department, position, phone },
 *       organizations: [{ org_id, org_name, status, assigned_date }],
 *       attachments: [{ id, file_name, file_type, file_size, uploaded_date }],
 *       operatings: [{ id, step_no, status, detail, operating_by, operating_date, org_name, attachments }]
 *    }
 *
 * ============================================================
 */

import axios from "axios";

// ──────────────────────────────────────────────
// 🔧 ตั้งค่า axios instance สำหรับ eofficer
//    เปลี่ยน baseURL เป็น URL จริงของ eofficer API เมื่อพร้อม
// ──────────────────────────────────────────────
const eofficeInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_EOFFICE_API_BASE_URL || "https://eoffice-api.example.com/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Auth interceptor: เพิ่ม token ถ้า API ต้องการ ──
eofficeInstance.interceptors.request.use((config) => {
  // TODO: ถ้า eofficer API ต้องการ token ให้เอามาจาก cookie/env
  // const token = Cookies.get("eoffice_token");
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ============================================================
//  ฟังก์ชัน API — รายการร้องทุกข์ (List)
// ============================================================

/**
 * ดึงรายการร้องทุกข์ทั้งหมดจาก EOffice
 *
 * @param {Object} params
 * @param {number} params.take     - จำนวนที่ต้องการ (default: 10000)
 * @param {string} params.status   - สถานะ: "A"(ทั้งหมด), "I"(ใหม่), "P"(กำลังดำเนินการ), "C"(ยุติเรื่อง)
 * @returns {Array} รายการร้องทุกข์
 */
export const GetEOfficeComplaints = async ({ take = 10000, status = "A" } = {}) => {
  try {
    // TODO: 📌 แทนที่ด้วย API จริง — เปลี่ยน endpoint ตามที่ eofficer กำหนด
    // const response = await eofficeInstance.get("/complaints", {
    //   params: { take, status },
    // });
    // return response?.data?.res_data || [];

    console.warn("[EOffice API] GetEOfficeComplaints — API ยังไม่เชื่อม คืนค่าว่าง");
    return [];
  } catch (error) {
    console.error("[EOffice API] GetEOfficeComplaints error:", error);
    throw error;
  }
};

/**
 * ค้นหาร้องทุกข์
 *
 * @param {Object} params
 * @param {string} params.search - คำค้นหา
 * @param {string} params.status - สถานะ
 * @param {string} params.date_from - วันที่เริ่มต้น "2569/01/01"
 * @param {string} params.date_to - วันที่สิ้นสุด "2569/12/31"
 */
export const SearchEOfficeComplaints = async ({ search = "", status = "A", date_from = "", date_to = "" } = {}) => {
  try {
    // TODO: 📌 แทนที่ด้วย API จริง
    // const response = await eofficeInstance.get("/complaints/search", {
    //   params: { search, status, date_from, date_to },
    // });
    // return response?.data?.res_data || [];

    console.warn("[EOffice API] SearchEOfficeComplaints — API ยังไม่เชื่อม คืนค่าว่าง");
    return [];
  } catch (error) {
    console.error("[EOffice API] SearchEOfficeComplaints error:", error);
    throw error;
  }
};

// ============================================================
//  ฟังก์ชัน API — รายละเอียดร้องทุกข์ (Detail)
// ============================================================

/**
 * ดึงข้อมูลรายละเอียดร้องทุกข์ตาม case_id
 *
 * @param {string} caseId - เลขที่เรื่อง เช่น "EO-2569-00001"
 * @returns {Object} ข้อมูลรายละเอียดร้องทุกข์
 */
export const GetEOfficeCaseDetail = async (caseId) => {
  try {
    // TODO: 📌 แทนที่ด้วย API จริง
    // const response = await eofficeInstance.get(`/complaints/${caseId}`);
    // return response?.data?.res_data || null;

    console.warn(`[EOffice API] GetEOfficeCaseDetail(${caseId}) — API ยังไม่เชื่อม คืนค่า null`);
    return null;
  } catch (error) {
    console.error(`[EOffice API] GetEOfficeCaseDetail(${caseId}) error:`, error);
    throw error;
  }
};

/**
 * ดึงประวัติการดำเนินการ (Operating Steps) ของร้องทุกข์
 *
 * @param {string} caseId
 * @returns {Array} รายการ operating steps
 */
export const GetEOfficeOperatings = async (caseId) => {
  try {
    // TODO: 📌 แทนที่ด้วย API จริง
    // const response = await eofficeInstance.get(`/complaints/${caseId}/operatings`);
    // return response?.data?.res_data || [];

    console.warn(`[EOffice API] GetEOfficeOperatings(${caseId}) — API ยังไม่เชื่อม คืนค่าว่าง`);
    return [];
  } catch (error) {
    console.error(`[EOffice API] GetEOfficeOperatings(${caseId}) error:`, error);
    throw error;
  }
};

/**
 * ดึงไฟล์แนบของร้องทุกข์
 *
 * @param {string} caseId
 * @returns {Array} รายการไฟล์แนบ
 */
export const GetEOfficeAttachments = async (caseId) => {
  try {
    // TODO: 📌 แทนที่ด้วย API จริง
    // const response = await eofficeInstance.get(`/complaints/${caseId}/attachments`);
    // return response?.data?.res_data || [];

    console.warn(`[EOffice API] GetEOfficeAttachments(${caseId}) — API ยังไม่เชื่อม คืนค่าว่าง`);
    return [];
  } catch (error) {
    console.error(`[EOffice API] GetEOfficeAttachments(${caseId}) error:`, error);
    throw error;
  }
};

// ============================================================
//  ฟังก์ชัน API — ส่งผลพิจารณา (Send)
// ============================================================

/**
 * ส่งผลการพิจารณากลับไปยัง EOffice
 *
 * @param {Object} submitData - ข้อมูลที่จะส่ง
 * @param {string} submitData.case_id - เลขที่เรื่อง
 * @param {string} submitData.status - สถานะ
 * @param {string} submitData.detail - รายละเอียดผลการพิจารณา
 * @param {string} submitData.result - ผลลัพธ์
 * @param {string} submitData.reporter_name - ชื่อผู้รายงาน
 * @param {string} submitData.reporter_phone - เบอร์ผู้รายงาน
 * @returns {Object} response จาก API
 */
export const AddEOfficeOperating = async (submitData) => {
  try {
    // TODO: 📌 แทนที่ด้วย API จริง
    // const response = await eofficeInstance.post("/complaints/operating", submitData);
    // return response?.data;

    console.warn("[EOffice API] AddEOfficeOperating — API ยังไม่เชื่อม");
    return { res_code: "0000", res_message: "SUCCESS (mock)", res_data: null };
  } catch (error) {
    console.error("[EOffice API] AddEOfficeOperating error:", error);
    throw error;
  }
};

/**
 * สร้างเรื่องร้องทุกข์ใหม่ใน EOffice (ส่งออกจากระบบ MOF → EOffice)
 *
 * @param {Object} submitData - ข้อมูลร้องทุกข์
 * @returns {Object} response จาก API
 */
export const AddEOfficeCase = async (submitData) => {
  try {
    // TODO: 📌 แทนที่ด้วย API จริง
    // const response = await eofficeInstance.post("/complaints", submitData);
    // return response?.data;

    console.warn("[EOffice API] AddEOfficeCase — API ยังไม่เชื่อม");
    return { res_code: "0000", res_message: "SUCCESS (mock)", res_data: null };
  } catch (error) {
    console.error("[EOffice API] AddEOfficeCase error:", error);
    throw error;
  }
};

// ============================================================
//  ฟังก์ชัน API — Master Data (Dropdowns)
// ============================================================

/**
 * ดึงข้อมูลจังหวัด
 */
export const GetEOfficeProvinces = async () => {
  try {
    // TODO: 📌 แทนที่ด้วย API จริง
    // const response = await eofficeInstance.get("/master/provinces");
    // return response?.data?.res_data || [];

    console.warn("[EOffice API] GetEOfficeProvinces — API ยังไม่เชื่อม คืนค่าว่าง");
    return [];
  } catch (error) {
    console.error("[EOffice API] GetEOfficeProvinces error:", error);
    throw error;
  }
};

/**
 * ดึงข้อมูลอำเภอตามจังหวัด
 * @param {string} provinceId
 */
export const GetEOfficeDistricts = async (provinceId) => {
  try {
    // TODO: 📌 แทนที่ด้วย API จริง
    // const response = await eofficeInstance.get(`/master/districts/${provinceId}`);
    // return response?.data?.res_data || [];

    console.warn(`[EOffice API] GetEOfficeDistricts(${provinceId}) — API ยังไม่เชื่อม คืนค่าว่าง`);
    return [];
  } catch (error) {
    console.error(`[EOffice API] GetEOfficeDistricts(${provinceId}) error:`, error);
    throw error;
  }
};

/**
 * ดึงข้อมูลตำบลตามอำเภอ
 * @param {string} districtId
 */
export const GetEOfficeSubDistricts = async (districtId) => {
  try {
    // TODO: 📌 แทนที่ด้วย API จริง
    // const response = await eofficeInstance.get(`/master/sub-districts/${districtId}`);
    // return response?.data?.res_data || [];

    console.warn(`[EOffice API] GetEOfficeSubDistricts(${districtId}) — API ยังไม่เชื่อม คืนค่าว่าง`);
    return [];
  } catch (error) {
    console.error(`[EOffice API] GetEOfficeSubDistricts(${districtId}) error:`, error);
    throw error;
  }
};

/**
 * ดึงตัวเลือกช่องทาง (Channel options)
 */
export const GetEOfficeChannels = async () => {
  try {
    // TODO: 📌 แทนที่ด้วย API จริง
    // const response = await eofficeInstance.get("/master/channels");
    // return response?.data?.res_data || [];

    console.warn("[EOffice API] GetEOfficeChannels — API ยังไม่เชื่อม คืนค่าว่าง");
    return [];
  } catch (error) {
    console.error("[EOffice API] GetEOfficeChannels error:", error);
    throw error;
  }
};

/**
 * ดึงตัวเลือกสถานะ (Status options)
 */
export const GetEOfficeCaseStatus = async () => {
  try {
    // TODO: 📌 แทนที่ด้วย API จริง
    // const response = await eofficeInstance.get("/master/statuses");
    // return response?.data?.res_data || [];

    console.warn("[EOffice API] GetEOfficeCaseStatus — API ยังไม่เชื่อม คืนค่าว่าง");
    return [];
  } catch (error) {
    console.error("[EOffice API] GetEOfficeCaseStatus error:", error);
    throw error;
  }
};

/**
 * ดึงตัวเลือกประเภทเรื่อง (Case Type options)
 */
export const GetEOfficeCaseTypes = async () => {
  try {
    // TODO: 📌 แทนที่ด้วย API จริง
    // const response = await eofficeInstance.get("/master/case-types");
    // return response?.data?.res_data || [];

    console.warn("[EOffice API] GetEOfficeCaseTypes — API ยังไม่เชื่อม คืนค่าว่าง");
    return [];
  } catch (error) {
    console.error("[EOffice API] GetEOfficeCaseTypes error:", error);
    throw error;
  }
};

/**
 * Mark เรื่องว่าอ่านแล้ว
 * @param {string} caseId
 */
export const MarkEOfficeCaseAsRead = async (caseId) => {
  try {
    // TODO: 📌 แทนที่ด้วย API จริง
    // const response = await eofficeInstance.put(`/complaints/${caseId}/read`);
    // return response?.data;

    console.warn(`[EOffice API] MarkEOfficeCaseAsRead(${caseId}) — API ยังไม่เชื่อม`);
    return { res_code: "0000", res_message: "SUCCESS (mock)" };
  } catch (error) {
    console.error(`[EOffice API] MarkEOfficeCaseAsRead(${caseId}) error:`, error);
    throw error;
  }
};
