import axios from "axios";
import Cookies from "js-cookie";
import { alertWarning } from "@utils/Alerts";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "thaid_integration_key_2025@mof",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    const token = Cookies.get("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        await alertWarning(
          "หมดเวลา",
          "Session ของคุณหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง"
        );
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        Cookies.remove("info");
        Cookies.remove("permission_paths");
        window.location.href = "/login";
      }
      return;
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
