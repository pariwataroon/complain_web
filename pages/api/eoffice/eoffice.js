/**
 * ============================================================
 *  API Service — เรื่องราวร้องทุกข์ช่องทางเว็บไซต์ Mof_EOffice
 * ============================================================
 *
 *  เชื่อมต่อ API จาก eofficer (Rongtook ↔ Saraban)
 *  Base URL: https://172.29.34.216/api/v1/rongtook/SOAP
 *  Auth: token_id แนบเป็น query parameter (แบบ OPM)
 *  Response: JSON (ไม่ใช่ SOAP XML)
 *
 *  ─────────────────────────────────────────
 *  📌 3 endpoints จาก Postman:
 *  ─────────────────────────────────────────
 *  1. POST /v1/rongtook/SOAP/General             → login → คืน token_id
 *  2. GET  /v1/rongtook/SOAP/Officer             → ดึงรายการเอกสาร (list + detail)
 *  3. POST /v1/rongtook/SOAP/SetOrgSummaryResult → อัปเดตสถานะเอกสาร
 *
 * ============================================================
 */

import axios from "axios";
import Cookies from "js-cookie";

// ──────────────────────────────────────────────
// 🔧 Axios instance สำหรับ eofficer API
//    ใช้ proxy /api/eoffice-proxy/... (server-side) เพื่อ:
//    - local dev + VPN: proxy ส่งต่อไป EOffice API ได้เลย
//    - prod server (ในกระทรวง): proxy ส่งต่อไปได้ ผู้ใช้ไม่ต้อง VPN
//    Browser → /api/eoffice-proxy/... → Next.js server → EOffice API
// ──────────────────────────────────────────────
const eofficeInstance = axios.create({
  baseURL: "/api/eoffice-proxy",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// ──────────────────────────────────────────────
// 🔧 Config — แก้ตรงนี้ถ้า credentials ต่างจาก Postman
// ──────────────────────────────────────────────
const EOFFICE_USER = process.env.NEXT_PUBLIC_EOFFICE_USER || "INTEGRATION_USER";
const EOFFICE_PASSWORD = process.env.NEXT_PUBLIC_EOFFICE_PASSWORD || "";

// ──────────────────────────────────────────────
// 🔧 Cookie names สำหรับเก็บ token
// ──────────────────────────────────────────────
const TOKEN_COOKIE = "eoffice_token";

// ============================================================
//  1. LOGIN — POST /v1/rongtook/SOAP/General
// ============================================================

/**
 * Login และรับ token_id จาก eofficer API
 * คล้าย OPM Encode() → GetToken()
 *
 * Response: { success: true, data: { token_id, officer_id, officer_name, org_id, ... } }
 */
const loginEOffice = async () => {
  try {
    const response = await eofficeInstance.post("/v1/rongtook/SOAP/General", {
      user: EOFFICE_USER,
      password: EOFFICE_PASSWORD,
      authen_from: "S",
      ip_address: "",
    });

    const json = response?.data || {};

    if (json.success && json.data?.token_id) {
      // เก็บ token_id ใน cookie (ใช้ 30 นาที่)
      Cookies.set(TOKEN_COOKIE, json.data.token_id, { expires: 30, path: "/" });
      return json.data;
    }

    throw new Error(json.message || "Login ล้มเหลว");
  } catch (error) {
    console.error("[EOffice API] loginEOffice error:", error);
    throw error;
  }
};

/**
 * ดึง token_id จาก cookie หรือ login ใหม่
 */
const getEOfficeToken = async () => {
  let token = Cookies.get(TOKEN_COOKIE);

  if (!token) {
    const tokenData = await loginEOffice();
    token = tokenData.token_id;
  }

  return token;
};

// ============================================================
//  2. OFFICER — GET /v1/rongtook/SOAP/Officer
// ============================================================

/**
 * ดึงรายการเอกสารหนังสือเข้า (เหมือน GetTimelineHeader ของ OPM)
 *
 * @param {Object} params
 * @param {number} params.take    - จำนวนที่ต้องการ (default: 50)
 * @param {number} params.skip    - ข้าม (default: 0)
 * @param {number} params.folder_id - แฟ้มที่อนุญาต (default: 271,272)
 * @param {number} params.year    - ปี พ.ศ. (default: ปัจจุบัน)
 * @returns {Object} { success, data: [...], totalSize }
 */
export const GetEOfficeComplaints = async ({ take = 50, skip = 0, folder_id = 271, year = 0 } = {}) => {
  try {
    const token = await getEOfficeToken();

    const response = await eofficeInstance.get("/v1/rongtook/SOAP/Officer", {
      params: {
        token_id: token,
        take,
        skip,
        folder_id,
        year,
      },
    });

    const json = response?.data || {};
    return json;
  } catch (error) {
    console.error("[EOffice API] GetEOfficeComplaints error:", error);
    throw error;
  }
};

/**
 * ดึงเอกสารรายตัวด้วย id
 * คล้าย GetCase() ของ OPM
 *
 * @param {string} docId - id ของเอกสาร
 * @returns {Object} { success, data: { id, uuid, ... } }
 */
export const GetEOfficeCaseDetail = async (docId) => {
  try {
    const token = await getEOfficeToken();

    const response = await eofficeInstance.get("/v1/rongtook/SOAP/Officer", {
      params: {
        token_id: token,
        id: docId,
      },
    });

    const json = response?.data || {};
    return json;
  } catch (error) {
    console.error(`[EOffice API] GetEOfficeCaseDetail(${docId}) error:`, error);
    throw error;
  }
};

/**
 * ดึงประวัติการดำเนินการ — เรียกแยก endpoint ถ้า API มีแยก
 * ตอนนี้ใช้ endpoint เดียวกับ Officer แต่กรองเฉพาะ id
 */
export const GetEOfficeOperatings = async (docId) => {
  try {
    const token = await getEOfficeToken();

    // TODO: ถ้า eofficer มี endpoint แยกสำหรับ operatings ให้เปลี่ยนที่นี่
    // ตอนนี้เรียกเอกสารรายตัวแล้วแยก operating จาก response
    const response = await eofficeInstance.get("/v1/rongtook/SOAP/Officer", {
      params: {
        token_id: token,
        id: docId,
      },
    });

    const json = response?.data || {};
    // TODO: แยก operatings จาก response ตามโครงสร้างจริงของ eofficer
    return json.data?.operatings || json.data?.steps || [];
  } catch (error) {
    console.error(`[EOffice API] GetEOfficeOperatings(${docId}) error:`, error);
    throw error;
  }
};

/**
 * ดึงไฟล์แนบ
 * TODO: ถ้า eofficer มี endpoint แยกสำหรับ attachments
 */
export const GetEOfficeAttachments = async (docId) => {
  try {
    // TODO: เปลี่ยนเป็น API จริงเมื่อ eofficer มี endpoint สำหรับ attachments
    const token = await getEOfficeToken();
    const response = await eofficeInstance.get("/v1/rongtook/SOAP/Officer", {
      params: { token_id: token, id: docId },
    });
    const json = response?.data || {};
    return json.data?.attachments || [];
  } catch (error) {
    console.error(`[EOffice API] GetEOfficeAttachments(${docId}) error:`, error);
    throw error;
  }
};

// ============================================================
//  3. SET STATUS — POST /v1/rongtook/SOAP/SetOrgSummaryResult
// ============================================================

/**
 * อัปเดตสถานะเอกสาร
 * คล้าย SetOrgSummaryResult / AddOperating ของ OPM
 *
 * @param {Object} submitData
 * @param {string} submitData.id        - id ของเอกสาร
 * @param {string} submitData.status_id - 0=กำลังดำเนินการ, 1=ยุติเรื่อง, 2=รับทราบไว้ชั้นต้น, 3=ไม่อยู่ในอำนาจ
 * @param {string} submitData.result    - รายละเอียดผลการพิจารณา
 * @returns {Object} { success: true }
 */
export const UpdateEOfficeStatus = async ({ id, status_id = "0", result = "" }) => {
  try {
    const token = await getEOfficeToken();

    const response = await eofficeInstance.post("/v1/rongtook/SOAP/SetOrgSummaryResult", {
      token_id: token,
      id,
      status_id,
      result,
    });

    return response?.data || {};
  } catch (error) {
    console.error("[EOffice API] UpdateEOfficeStatus error:", error);
    throw error;
  }
};

/**
 * ส่งผลพิจารณา (wrapper สำหรับ Send form)
 * เรียก UpdateEOfficeStatus แต่อรับ parameter แบบ form
 */
export const AddEOfficeOperating = async (submitData) => {
  try {
    return await UpdateEOfficeStatus({
      id: submitData.case_id,
      status_id: submitData.status === "ยุติเรื่อง" ? "1" : "0",
      result: submitData.detail,
    });
  } catch (error) {
    console.error("[EOffice API] AddEOfficeOperating error:", error);
    throw error;
  }
};

// ============================================================
//  AUTH HELPERS
// ============================================================

/**
 * Mark เรื่องว่าอ่านแล้ว (ถ้า API รองรับ)
 * TODO: ถ้า eofficer มี endpoint สำหรับ mark as read
 */
export const MarkEOfficeCaseAsRead = async (docId) => {
  try {
    // TODO: เปลี่ยนเป็น API จริงเมื่อพร้อม
    console.log(`[EOffice API] MarkEOfficeCaseAsRead(${docId}) — not implemented yet`);
    return { success: true };
  } catch (error) {
    console.error(`[EOffice API] MarkEOfficeCaseAsRead(${docId}) error:`, error);
    throw error;
  }
};

/**
 * สร้างเรื่องใหม่ใน EOffice (ถ้า API รองรับ)
 * TODO: ถ้า eofficer มี endpoint สำหรับ AddCase
 */
export const AddEOfficeCase = async (submitData) => {
  try {
    // TODO: เปลี่ยนเป็น API จริงเมื่อพร้อม
    console.log("[EOffice API] AddEOfficeCase — not implemented yet");
    return { success: true };
  } catch (error) {
    console.error("[EOffice API] AddEOfficeCase error:", error);
    throw error;
  }
};

// ============================================================
//  MASTER DATA (จำเป็นไว้ใช้ dropdowns)
//  TODO: เมี endpoint แยกจาก eofficer หรือใช้ API หลักของ MOF
// ============================================================

export const GetEOfficeProvinces = async () => {
  try {
    // TODO: เปลี่ยนเป็น API จริงของ eofficer ถ้ามี หรือใช้ geography API ของ MOF
    return [];
  } catch (error) {
    console.error("[EOffice API] GetEOfficeProvinces error:", error);
    throw error;
  }
};

export const GetEOfficeDistricts = async () => {
  try { return []; } catch (error) { throw error; }
};

export const GetEOfficeSubDistricts = async () => {
  try { return []; } catch (error) { throw error; }
};

export const GetEOfficeChannels = async () => {
  try { return []; } catch (error) { throw error; }
};

export const GetEOfficeCaseStatus = async () => {
  try { return []; } catch (error) { throw error; }
};

export const GetEOfficeCaseTypes = async () => {
  try { return []; } catch (error) { throw error; }
};

// ============================================================
//  EXPORT ALL
// ============================================================
export {
  loginEOffice,
  getEOfficeToken,
};
