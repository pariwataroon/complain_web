import axiosInstance from "@pages/api/axiosInstance";

const GetDetailedStatsbyRole = async () => {
  try {
    const response = await axiosInstance.get("/users/detailed-stats/by-role");
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching all select data:", error);
    throw error;
  }
};

export { GetDetailedStatsbyRole };
