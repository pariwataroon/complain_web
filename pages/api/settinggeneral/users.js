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

const GetTitleDetails = async () => {
  try {
    const response = await axiosInstance.get("/users/title/details");
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching title details:", error);
    throw error;
  }
};

const GetRoles = async () => {
  try {
    const response = await axiosInstance.get("/permissions/roles");
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching title details:", error);
    throw error;
  }
};

const AddUsers = async (data) => {
  try {
    const response = await axiosInstance.post("/users", data);
    if (response && response.data) {
      const registerData = response.data;
      // Optional: Handle successful registration response
      if (
        registerData?.res_code === "0001" ||
        registerData?.res_code === "0000"
      ) {
        try {
          await resendVerification({ email: data.email });
        } catch (verificationError) {
          console.error("Verification resend failed:", verificationError);
        }
      }
      return registerData;
    }
  } catch (error) {
    console.error("Error during user registration:", error);
    throw error;
  }
};

const DelUsers = async (id) => {
  try {
    const { data } = await axiosInstance.delete(`/users/${id}`);
    return data;
  } catch (err) {
    console.error("Error deleting user:", err);
    throw err;
  }
};

const resendVerification = async (payload) => {
  try {
    const response = await axiosInstance.post(
      "/auth/resend-verification",
      payload
    );

    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error during resend-verification:", error);
    throw error;
  }
};
const PutUser = async (userId, data) => {
  try {
    const response = await axiosInstance.put(`/users/admin/${userId}`, data);
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};
export {
  GetDetailedStatsbyRole,
  GetTitleDetails,
  AddUsers,
  DelUsers,
  resendVerification,
  GetRoles,
  PutUser,
};
