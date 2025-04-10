import axiosInstance from "@pages/api/axiosInstance";
import Cookies from "js-cookie";

const loginThaID = async (authCode) => {
  try {
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI;
    const data = {
      auth_code: authCode,
      redirect_uri: redirectUri,
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

export { loginThaID };
