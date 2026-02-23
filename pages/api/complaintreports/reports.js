import axiosInstance from "@pages/api/axiosInstance";

// Utility: filter out empty, undefined, or null values from params
function filterParams(params) {
  const filtered = {};
  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== "" &&
      value !== undefined &&
      value !== null &&
      !(typeof value === "string" && value.trim() === "")
    ) {
      filtered[key] = value;
    }
  });
  return filtered;
}

const getPendingTasksReport = async (params = {}) => {
  try {
    // ตั้งค่า default limit เป็น 10000 เพื่อดึงข้อมูลทั้งหมด
    const defaultParams = { limit: 10000, ...params };
    const response = await axiosInstance.get(
      `/reports/pending-tasks`,
      { params: filterParams(defaultParams) }
    );
    // คืนเฉพาะ array items
    // (ถ้า API เปลี่ยนโครงสร้างให้ return response.data.res_data.items)
    return response?.data?.res_data?.items || [];
  } catch (error) {
    console.error("Error fetching reports/pending-tasks:", error);
    throw error;
  }
};

const getNewAdditionalComplaintsReport = async (params = {}) => {
  try {
    const response = await axiosInstance.get(
      `/reports/new-additional-complaints`,
      { params: filterParams(params) }
    );
    // คืน res_code, res_data, etc. (เพื่อใช้ใน component ตรวจสอบ res_code)
    return response?.data;
  } catch (error) {
    console.error("Error fetching reports/new-additional-complaints:", error);
    throw error;
  }
};

export {
  getPendingTasksReport,
  getNewAdditionalComplaintsReport,
};