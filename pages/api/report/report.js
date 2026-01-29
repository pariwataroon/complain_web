import axiosInstance from "@pages/api/axiosInstance";

// กำหนด PREFIX และ API หากต้องการ (กรณีใช้ ENV อัตโนมัติ)
const API = process.env.NEXT_PUBLIC_API || "";
const PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || "";

// ฟังก์ชันดึงรายงานผู้ตรวจสอบ (inspector) ตามปี, แผนก, ผู้ตรวจ, สถานะ, วันที่
const GetAllReportsInspector = async (year = "", department_id = "", inspector_id = "", status = "", date_from = "", date_to = "", include_details = false) => {
  try {
    const { data } = await axiosInstance.get(`${API}${PREFIX}/reports/inspector`, {
      params: { year, department_id, inspector_id, status, date_from, date_to, include_details }
    });
    return data;
  } catch (error) {
    console.error("Error fetching GetAllReportsInspector:", error);
    throw error;
  }
};

// ฟังก์ชันดึงรายงานผู้ตรวจสอบที่รอดำเนินการ (inspector-pending) ตามปี, แผนก, ผู้ตรวจ, วันที่
const GetAllReportsInspectorPending = async (year = "", department_id = "", inspector_id = "", date_from = "", date_to = "") => {
  try {
    const { data } = await axiosInstance.get(`${API}${PREFIX}/reports/inspector-pending`, {
      params: { year, department_id, inspector_id, date_from, date_to }
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

// ฟังก์ชันดึงรายงานสรุปเรื่องร้องเรียนประจำปีงบประมาณ (hierarchical summary)
const GetAnnualComplaintSummary = async (year = "", date_from = "", date_to = "") => {
  try {
    const { data } = await axiosInstance.get(`${API}${PREFIX}/reports/annual-complaint/summary`, {
      params: { year, date_from, date_to }
    });
    return data;
  } catch (error) {
    console.error("Error fetching GetAnnualComplaintSummary:", error);
    throw error;
  }
};

// ฟังก์ชันดึงรายละเอียดเรื่องร้องเรียนแต่ละเรื่อง
const GetAnnualComplaintDetails = async (skip = 0, limit = 100, year = "", date_from = "", date_to = "", department_id = "", status = "") => {
  try {
    const { data } = await axiosInstance.get(`${API}${PREFIX}/reports/annual-complaint/details`, {
      params: { skip, limit, year, date_from, date_to, department_id, status }
    });
    return data;
  } catch (error) {
    console.error("Error fetching GetAnnualComplaintDetails:", error);
    throw error;
  }
};

const GetAgencyComplaintReport = async (
  skip = 0,
  limit = 100,
  year = "",
  date_from = "",
  date_to = "",
  department_id = "",
  status = "",
  agency = "",
  responsible_officer = "",
  claimant_name = ""
) => {
  try {
    const { data } = await axiosInstance.get(`${API}${PREFIX}/reports/agency-complaint/list`, {
      params: {
        skip,
        limit,
        year,
        date_from,
        date_to,
        department_id,
        status,
        agency,
        responsible_officer,
        claimant_name,
      },
    });
    return data;
  } catch (error) {
    console.error("Error fetching GetAgencyComplaintReport:", error);
    throw error;
  }
};

// ฟังก์ชันดึงรายงานผลการจัดการเรื่องร้องเรียนของผู้ตรวจราชการกระทรวงการคลัง
const GetInspectorComplaintManagement = async (
  skip = 0,
  limit = 1000,
  year = "",
  date_from = "",
  date_to = "",
  inspector_id = ""
) => {
  try {
    const { data } = await axiosInstance.get(`${API}${PREFIX}/reports/inspector-complaint-management/list`, {
      params: {
        skip,
        limit,
        year,
        date_from,
        date_to,
        inspector_id,
      },
    });
    return data;
  } catch (error) {
    console.error("Error fetching GetInspectorComplaintManagement:", error);
    throw error;
  }
};

export {
  GetAllReportsInspector,
  GetAllReportsInspectorPending,
  GetAllReportsNewadDitional,
  GetAllReportsPending,
  GetAnnualComplaintSummary,
  GetAnnualComplaintDetails,
  GetAgencyComplaintReport,
  GetInspectorComplaintManagement
};