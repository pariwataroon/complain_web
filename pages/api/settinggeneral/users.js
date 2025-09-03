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
    console.error("Error fetching roles:", error);
    throw error;
  }
};

const GetPositions = async () => {
  try {
    const response = await axiosInstance.get("/positions");
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching positions:", error);
    throw error;
  }
};

const AddUsers = async (data) => {
  try {
    let position_ids = [];
    let primary_position_id = null;

    if (data.position_id) {
      // ถ้ามีแค่ตำแหน่งเดียว
      position_ids = [data.position_id];
      primary_position_id = data.position_id;
    } else if (
      Array.isArray(data.position_ids) &&
      data.position_ids.length > 0
    ) {
      position_ids = data.position_ids;
      primary_position_id = data.primary_position_id || data.position_ids[0];
    }

    const payload = {
      ...data,
      position_ids,
      primary_position_id,
      department_ids: data.department_ids || [],
    };

    const response = await axiosInstance.post("/users", payload);
    if (response && response.data) {
      const registerData = response.data;

      // ตรวจสอบว่า user ถูกสร้างแล้วหรือยัง
      if (["0001", "0000"].includes(registerData?.res_code)) {
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

const GetUserById = async (userId) => {
  try {
    const response = await axiosInstance.get(
      `/users/${userId}?include_address=true`
    );
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching user by ID:", error);
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
  GetPositions,
  PutUser,
  GetUserById,
};
