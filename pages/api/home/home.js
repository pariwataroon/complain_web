import axiosInstance from "@pages/api/axiosInstance";

const getApiLogsCounter = async () => {
  try {
    const { data } = await axiosInstance.get("/api-logs/counter");
    return data;
  } catch (err) {
    console.error("Error fetching API logs counter:", err);
    throw err;
  }
};

export { getApiLogsCounter };
