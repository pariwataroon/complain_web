import axiosInstance from "@pages/api/axiosInstance";

const getDepartmentGroup = async () => {
  try {
    const response = await axiosInstance.get(
      "/department-groups/with-departments"
    );
    return response?.data;
  } catch (error) {
    console.error("Error fetching complaints-assignment:", error);
    throw error;
  }
};

const getDepartments = async () => {
  try {
    const response = await axiosInstance.get("/departments");
    return response?.data;
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw error;
  }
};

const getPositions = async () => {
  try {
    const response = await axiosInstance.get("/positions");
    return response?.data;
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw error;
  }
};

const getAvailable = async () => {
  try {
    const response = await axiosInstance.get(
      "/signature-authorities/available-users"
    );
    return response?.data;
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw error;
  }
};
const getSignatureAuthorities = async () => {
  try {
    const response = await axiosInstance.get("/signature-authorities");
    return response?.data;
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw error;
  }
};
const createSignatureAuthorityGroup = async (payload) => {
  try {
    const response = await axiosInstance.post(
      "/signature-authorities/groups",
      payload
    );
    return response?.data;
  } catch (error) {
    console.error("Error posting /signature-authorities/groups:", error);
    throw error;
  }
};
const updateSignatureAuthorityGroup = async (groupId, payload) => {
  try {
    const response = await axiosInstance.put(
      `/signature-authorities/groups/${groupId}`,
      payload
    );
    return response?.data;
  } catch (error) {
    console.error(
      `Error putting /signature-authorities/groups/${groupId}:`,
      error
    );
    throw error;
  }
};
const getDepartmentsPrefix = async () => {
  try {
    const response = await axiosInstance.get("/departments");
    return response?.data;
  } catch (error) {
    console.error("Error fetching departments with prefix:", error);
    throw error;
  }
};

const deleteSignatureAuthorityGroup = async (groupId) => {
  try {
    const response = await axiosInstance.delete(
      `/signature-authorities/groups/${groupId}`
    );
    return response?.data;
  } catch (error) {
    console.error(
      `Error deleting /signature-authorities/groups/${groupId}:`,
      error
    );
    throw error;
  }
};

export {
  getDepartmentGroup,
  getDepartments,
  getPositions,
  getAvailable,
  getSignatureAuthorities,
  createSignatureAuthorityGroup,
  updateSignatureAuthorityGroup,
  getDepartmentsPrefix,
  deleteSignatureAuthorityGroup,
};
