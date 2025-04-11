import axiosInstance from "@pages/api/axiosInstance";

const registerCard = async (data) => {
  try {
    const response = await axiosInstance.post("/users/register", data);
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error during registration:", error);
    throw error;
  }
}

export { registerCard };