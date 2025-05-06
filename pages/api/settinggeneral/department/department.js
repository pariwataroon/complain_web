import axiosInstance from "@pages/api/axiosInstance";

const GetDetailDepartment = async () => {
  try {
    const response = await axiosInstance.get("/venues/grouped/department");
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching all select data:", error);
    throw error;
  }
};

export { GetDetailDepartment };
