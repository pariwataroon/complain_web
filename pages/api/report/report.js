import axiosInstance from "@pages/api/axiosInstance";

const GetAllReportsNewadDitional = async (skip, limit, search, level, is_active) => {
  try {
    const { data } = await axiosInstance.get("/reports/new-additional-complaints?skip=0&limit=20&date_from=&date_to=&department_id=&officer_id=&search=", {
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
    const { data } = await axiosInstance.get(`/reports/pending-tasks?skip=0&limit=20&date_from=&date_to=&department_id=&officer_id=&status=&search=`);
    return data;
  } catch (error) {
    console.error("Error fetching GetPositionByID:", error);
    throw error;
  }
};

export { GetAllReportsNewadDitional, GetAllReportsPending };
