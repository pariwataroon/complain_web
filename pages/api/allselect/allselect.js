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

const getSubComplaintTypeById = async (complaint_type_id) => {
  try {
    const response = await axiosInstance.get(`/complaint-metadata/subtypes`, {
      params: {
        skip: 0,
        limit: 100,
        active_only: true,
        parent_type_id: complaint_type_id,
      },
    });
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error(
      "Error fetching sub complaint types by parent type ID:",
      error
    );
    throw error;
  }
};

const GetAllComplaintChannels = async () => {
  try {
    const response = await axiosInstance.get(`/complaint-metadata/channels`, {
      params: {
        skip: 0,
        limit: 100,
        active_only: true,
      },
    });
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching complaint channels:", error);
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

const GetOutgoingReportOptions = async (type) => {
  try {
    const response = await axiosInstance.get(`/outgoing-reports/options`);

    const results = response?.data?.res_data;

    if (response?.data?.res_code === "0000" && results) {
      switch (type) {
        case "positions":
          return results.positions.map((position) => ({
            value: position.id,
            label: `${position.description} (${position.level})`,
            name: position.name,
            level: position.level,
            description: position.description,
          }));

        case "departments":
          return results.departments.map((department) => ({
            value: department.id,
            label: department.name,
            code: department.code,
            shortName: department.short_name,
          }));

        case "signature_authorities":
          return results.signature_authorities.map((authority) => ({
            value: authority.id,
            label: authority.name,
            email: authority.email,
            userId: authority.user_id,
          }));

        case "confidentiality_levels":
          return results.confidentiality_levels.map((level, index) => ({
            value: index,
            label: level,
          }));

        case "urgency_levels":
          return results.urgency_levels.map((level, index) => ({
            value: index,
            label: level,
          }));

        default:
          return [];
      }
    }

    return [];
  } catch (error) {
    console.error(`Error fetching ${type}:`, error);
    return [];
  }
};

const GetAllSignatureAuthorities = async () => {
  try {
    const response = await axiosInstance.get(`/signature-authorities`);

    const results = response?.data?.res_data;

    if (response?.data?.res_code === "0000" && results) {
      // Access the individuals array from the nested structure
      const individuals = results.individuals || [];

      const formattedUsers = individuals
        .filter((item) => item.is_active)
        .map((item) => ({
          value: item.user.id,
          label: item.user.name,
          fullName: item.user.name,
          email: item.user.email,
          department: item.department,
          departmentId: item.department.id,
          departmentName: item.department.name,
        }));

      return formattedUsers;
    }

    return [];
  } catch (error) {
    console.error("Error fetching signature authorities:", error);
    return [];
  }
};


const GetAllSelectYears = async () => {
  try {
    const response = await axiosInstance.get(`/dashboard/years`);

    if (
      response?.data?.res_code === "0000" &&
      response?.data?.res_data?.years
    ) {
      const yearsData = response.data.res_data.years;

      const yearOptions = yearsData.map((year) => ({
        value: year.value.toString(),
        label: year.label,
        be: year.be,
        ce: year.ce,
      }));

      const yearRange = response.data.res_data.range;

      return {
        success: true,
        yearOptions,
        range: yearRange,
        totalYears: yearOptions.length,
        raw: response.data,
      };
    } else {
      return {
        success: false,
        yearOptions: [],
        range: null,
        totalYears: 0,
        message: response?.data?.res_message || "ไม่พบข้อมูล",
        raw: response?.data,
      };
    }
  } catch (error) {
    console.error("Error fetching years:", error);
    return {
      success: false,
      yearOptions: [],
      range: null,
      totalYears: 0,
      error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล",
      raw: null,
    };
  }
};

export {
  GetAllSelect,
  getSubComplaintTypeById,
  GetProvincesSelect,
  GetAmphuresSelect,
  GetDistrictsSelect,
  GetZipcodeSelect,
  GetAllSelectComplaintTypes,
  UsersSearchByRole,
  UsersSearchByRolesupervisor,
  GetOutgoingReportOptions,
  GetAllSignatureAuthorities,
  GetAllComplaintChannels,
  GetAllSelectYears,
};
