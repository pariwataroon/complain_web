import axiosInstance from "@pages/api/axiosInstance";

const GetAllLogs = async ({ skip = 0, limit, path = "/api/v1/auth" }) => {
  try {
    const { data } = await axiosInstance.get("/notifications", {
      params: { skip, limit, path },
    });
    return data;
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return [];
  }
};

const GetLogDetails = async () => {
  try {
    const { data } = await axiosInstance.get("/notifications");
    return data;
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return [];
  }
};

const GetLogStatistics = async () => {
  try {
    const { data } = await axiosInstance.get("/notifications");
    return data;
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return [];
  }
};

const GetUserActivityLogs = async () => {
  try {
    const { data } = await axiosInstance.get("/notifications");
    return data;
  } catch (err) {
    console.error("Error fetching notifications:", err);
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
  GetUserActivityLogs,
  CleanupOldLogs,
};
