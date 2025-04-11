import axiosInstance from "@pages/api/axiosInstance";
import Cookies from "js-cookie";


const loginThaID = async (authCode) => {
  try {
    const data = {
      auth_code: authCode,
    };
    const response = await axiosInstance.post("/thaid/auth", data);

    if (response && response.data) {
      console.log("Login successful:", response.data);

      const { access_token, refresh_token } = response.data.res_data;

      Cookies.set("access_token", access_token, { expires: 7, path: "/" });
      Cookies.set("refresh_token", refresh_token, { expires: 7, path: "/" });

      return response.data;
    }
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
};

const loginCard = async (authCode) => {
  try {
    const data = {
      auth_code: authCode,
    };
    const response = await axiosInstance.post("/auth/login", data);

    if (response && response.data) {
      console.log("Login successful:", response.data);

      const { access_token, refresh_token } = response.data.res_data;

      Cookies.set("access_token", access_token, { expires: 7, path: "/" });
      Cookies.set("refresh_token", refresh_token, { expires: 7, path: "/" });

      return response.data;
    }
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
};

export { loginThaID, loginCard };
