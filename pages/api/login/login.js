import axiosInstance from "@pages/api/axiosInstance";
import Cookies from "js-cookie";
import { DecodeJWT } from "@utils/DecodeJWT";

const loginThaID = async (authCode) => {
  try {
    const data = { auth_code: authCode };
    const response = await axiosInstance.post("/thaid/auth", data);

    if (response && response.data) {
      const { access_token, refresh_token } = response.data.res_data;
      if (access_token && refresh_token) {
        const decoded = DecodeJWT(access_token);
        const info = decoded?.payload || {};

        Cookies.set("access_token", access_token, { expires: 7, path: "/" });
        Cookies.set("refresh_token", refresh_token, { expires: 7, path: "/" });
        Cookies.set("info", JSON.stringify(info), { expires: 7, path: "/" });

        const meRes = await axiosInstance.get(
          "/permissions/user-resources/bygroup",);

          const permissionGroups = meRes?.data?.res_data || [];
          const paths = permissionGroups
            .flatMap((group) => group.resources || [])
            .map((resource) => resource.path)
            .filter(Boolean);

          Cookies.set("permission_paths", JSON.stringify(paths), {
            expires: 7,
            path: "/",
          });
      }

      return response.data;
    }
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
};


const loginCard = async (authCode) => {
  try {
    const response = await axiosInstance.post("/auth/login", authCode);

    if (response && response.data) {
      const { access_token, refresh_token } = response.data.res_data;
      if (access_token && refresh_token) {
        const decoded = DecodeJWT(access_token);
        const info = decoded?.payload || {};

        Cookies.set("access_token", access_token, { expires: 7, path: "/" });
        Cookies.set("refresh_token", refresh_token, { expires: 7, path: "/" });
        Cookies.set("info", JSON.stringify(info), { expires: 7, path: "/" });

        const meRes = await axiosInstance.get(
          "/permissions/user-resources/bygroup"
        );

        const permissionGroups = meRes?.data?.res_data || [];
        const paths = permissionGroups
          .flatMap((group) => group.resources || [])
          .map((resource) => resource.path)
          .filter(Boolean);

        Cookies.set("permission_paths", JSON.stringify(paths), {
          expires: 7,
          path: "/",
        });
      }

      return response.data;
    }
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
};



export { loginThaID, loginCard };
