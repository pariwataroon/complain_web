import axiosInstance from "@pages/api/axiosInstance";

const getPendingTasksReport = async ({
  skip = 0,
  limit = 20,
  date_from = "",
  date_to = "",
  department_id = "",
  officer_id = "",
  status = "",
  search = "",
} = {}) => {
  try {
    const response = await axiosInstance.get(
      `/reports/pending-tasks`,
      {
        params: {
          skip,
          limit,
          date_from,
          date_to,
          department_id,
          officer_id,
          status,
          search,
        },
      }
    );
    return response?.data;
  } catch (error) {
    console.error("Error fetching reports/pending-tasks:", error);
    throw error;
  }
};

const getNewAdditionalComplaintsReport = async ({
  skip = 0,
  limit = 20,
  date_from = "",
  date_to = "",
  department_id = "",
  officer_id = "",
  search = "",
} = {}) => {
  try {
    const response = await axiosInstance.get(
      `/reports/new-additional-complaints`,
      {
        params: {
          skip,
          limit,
          date_from,
          date_to,
          department_id,
          officer_id,
          search,
        },
      }
    );
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