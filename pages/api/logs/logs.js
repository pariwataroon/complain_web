import axiosInstance from "@pages/api/axiosInstance";

const GetAllLogs = async ({ skip = 0, limit = 10, filters = {} }) => {
  try {
    const params = { skip, limit };

    if (filters.method) params.method = filters.method;
    if (filters.path) params.path = filters.path;
    if (filters.clientIp) params.client_ip = filters.clientIp;
    if (filters.statusCode) params.status_code = filters.statusCode;
    if (filters.userId) params.user_id = filters.userId;
    if (filters.userName) params.user_name = filters.userName;
    
    const { data } = await axiosInstance.get("/api-logs", {
      params,
    });
    return data;
  } catch (err) {
    console.error("Error fetching logs:", err);
    return { res_data: [], total: 0 };
  }
};

const GetLogDetails = async (id) => {
  try {
    const { data } = await axiosInstance.get(`/api-logs/details/${id}`);
    return data;
  } catch (err) {
    console.error("Error fetching details:", err);
    return null;
  }
};

const GetLogStatistics = async (day) => {
  try {
    const { data } = await axiosInstance.get(`/api-logs/stats?days=${day}`);
    return data;
  } catch (err) {
    console.error("Error fetching stats:", err);
    return [];
  }
};


const CleanupOldLogs = async () => {
  try {
    const { data } = await axiosInstance.DELETE("/api-logs/cleanup?days=90");
    return data;
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return [];
  }
};

export {
  GetAllLogs,
  GetLogDetails,
  GetLogStatistics,
  CleanupOldLogs,
};
