import axiosInstance from "@pages/api/axiosInstance";

// กำหนด PREFIX และ API หากต้องการ (กรณีใช้ ENV อัตโนมัติ)
const API = process.env.NEXT_PUBLIC_API || "";
const PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || "";

// ฟังก์ชันดึงรายงานผู้ตรวจสอบ (inspector) ตามปี, แผนก, ผู้ตรวจ, สถานะ
const GetAllReportsInspector = async (year = "", department_id = "", inspector_id = "", status = "") => {
  try {
    const { data } = await axiosInstance.get(`${API}${PREFIX}/reports/inspector`, {
      params: { year, department_id, inspector_id, status }
    });
    return data;
  } catch (error) {
    console.error("Error fetching GetAllReportsInspector:", error);
    throw error;
  }
};

// ฟังก์ชันดึงรายงานผู้ตรวจสอบที่รอดำเนินการ (inspector-pending) ตามปี, แผนก, ผู้ตรวจ
const GetAllReportsInspectorPending = async (year = "", department_id = "", inspector_id = "") => {
  try {
    const { data } = await axiosInstance.get(`${API}${PREFIX}/reports/inspector-pending`, {
      params: { year, department_id, inspector_id }
    });
    return data;
  } catch (error) {
    console.error("Error fetching GetAllReportsInspectorPending:", error);
    throw error;
  }
};

const GetAllReportsNewadDitional = async (skip, limit, search, level, is_active) => {
  try {
    const { data } = await axiosInstance.get(`${API}${PREFIX}/reports/new-additional-complaints?skip=0&limit=20&date_from=&date_to=&department_id=&officer_id=&search=`, {
      params: { skip, limit, search, level, is_active }
    });
    return data;
  } catch (error) {
    console.error("Error fetching GetAllPositions:", error);
    throw error;
  }
};

const GetAllReportsPending = async (id) => {
  try {
    const { data } = await axiosInstance.get(`${API}${PREFIX}/reports/pending-tasks?skip=0&limit=20&date_from=&date_to=&department_id=&officer_id=&status=&search=`);
    return data;
  } catch (error) {
    console.error("Error fetching GetPositionByID:", error);
    throw error;
  }
};

export {
  GetAllReportsInspector,
  GetAllReportsInspectorPending,
  GetAllReportsNewadDitional,
  GetAllReportsPending
};