import axiosInstance from "@pages/api/axiosInstance";


const GetAllSelect = async () => {
  try {
    const response = await axiosInstance.get("/users/title/details");
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching all select data:", error);
    throw error;
  }
};

export { GetAllSelect };
