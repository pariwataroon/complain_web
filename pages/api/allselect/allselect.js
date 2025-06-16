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

// !! ComplaintTypes

const GetAllSelectComplaintTypes = async ({
  skip = 0,
  limit = 100,
  active_only = "true",
} = {}) => {
  try {
    const response = await axiosInstance.get("/complaint-metadata/types", {
      params: { skip, limit, active_only },
    });
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching all select data:", error);
    throw error;
  }
};

// !! GEOGRAPHY
//  All Provinces
const GetProvincesSelect = async () => {
  try {
    const response = await axiosInstance.get("/geography/provinces");
    if (response?.data?.res_data) {
      return response.data.res_data.map((item) => ({
        value: item.id,
        label: item.name_th,
      }));
    }
  } catch (error) {
    console.error("Error fetching all select provinces:", error);
    throw error;
  }
};
//  All Amphures
const GetAmphuresSelect = async (provinceCode) => {
  try {
    const response = await axiosInstance.get(
      `/geography/amphures?province_id=${provinceCode}`
    );
    if (response?.data?.res_data) {
      return response.data.res_data.map((item) => ({
        value: item.id,
        label: item.name_th,
      }));
    }

    return [];
  } catch (error) {
    console.error("Error fetching all select Amphures:", error);
    return [];
  }
};

//  All Districts
const GetDistrictsSelect = async (amphureCode) => {
  try {
    const response = await axiosInstance.get(
      `/geography/districts?amphure_id=${amphureCode}`
    );

    if (response?.data?.res_data) {
      return response.data.res_data.map((item) => ({
        value: item.id,
        label: item.name_th,
        zip_code: item.zip_code,
      }));
    }

    return [];
  } catch (error) {
    console.error("Error fetching all select Districts:", error);
    return [];
  }
};
//  All Zipcode
const GetZipcodeSelect = async (districtNameTH) => {
  try {
    const response = await axiosInstance.get(
      `/geography/search/by-zipcode/${districtNameTH}`
    );

    const results = response?.data?.res_data;

    if (Array.isArray(results)) {
      const matched = results.find(
        (item) => item.district?.name_th === districtNameTH
      );

      if (matched && matched.district?.zip_code) {
        return [
          {
            value: matched.district.zip_code,
            label: String(matched.district.zip_code),
          },
        ];
      }
    }

    return [];
  } catch (error) {
    console.error("Error fetching zipcode from name_th:", error);
    return [];
  }
};

//  All UsersSearchByRole
const UsersSearchByRole = async () => {
  try {
    const response = await axiosInstance.get(
      `/users/search/by-role?role_name=staff`
    );

    const results = response?.data?.res_data;

    if (response?.data?.res_code === "0000" && results) {
      const formattedUsers = results
        .filter((user) => user.is_active)
        .map((user) => ({
          value: user.id,
          label: user.full_name_with_title,
          fullName: user.full_name,
          email: user.email,
          roles: user.roles,
        }));

      return formattedUsers;
    }

    return [];
  } catch (error) {
    console.error("Error fetching users by role:", error);
    return [];
  }
};

const UsersSearchByRolesupervisor = async () => {
  try {
    const response = await axiosInstance.get(
      `/users/search/by-role?role_name=supervisor`
    );

    const results = response?.data?.res_data;

    if (response?.data?.res_code === "0000" && results) {
      const formattedUsers = results
        .filter((user) => user.is_active)
        .map((user) => ({
          value: user.id,
          label: user.full_name_with_title,
          fullName: user.full_name,
          email: user.email,
          roles: user.roles,
        }));

      return formattedUsers;
    }

    return [];
  } catch (error) {
    console.error("Error fetching users by role:", error);
    return [];
  }
};

export {
  GetAllSelect,
  GetProvincesSelect,
  GetAmphuresSelect,
  GetDistrictsSelect,
  GetZipcodeSelect,
  GetAllSelectComplaintTypes,
  UsersSearchByRole,
  UsersSearchByRolesupervisor,
};
