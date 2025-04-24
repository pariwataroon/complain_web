import axiosInstance from "@pages/api/axiosInstance";

const getRoles = async () => {
  try {
    const response = await axiosInstance.get("/permissions/roles");
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching all select data:", error);
    throw error;
  }
};

export { getRoles };
