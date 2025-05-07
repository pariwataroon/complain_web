import axiosInstance from "@pages/api/axiosInstance";

const registerCard = async (data) => {
  try {
    const response = await axiosInstance.post("/users/register", data);
    if (response && response.data) {
      const registerData = response.data;
      if (registerData?.res_code === "0001" || registerData?.res_code === "0000") {
        try {
          await resendVerification({ email: data.email });
        } catch (verificationError) {
          console.error("Verification resend failed:", verificationError);
        }
      }
      return registerData;
    }
  } catch (error) {
    console.error("Error during registration:", error);
    throw error;
  }
};

const resendVerification = async (payload) => {
  try {
    const response = await axiosInstance.post(
      "/auth/resend-verification",
      payload
    );

    if (response && response.data) {
      // console.log("Verification successful:", response.data);
      return response.data;
    }
  } catch (error) {
    console.error("Error during resend-verification:", error);
    throw error;
  }
};

export { registerCard, resendVerification };
