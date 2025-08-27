import axiosInstance from "@pages/api/axiosInstance";

const GetAllOutsideDepartments = async (params) => {
  try {
    const { data } = await axiosInstance.get("/outside-departments", {
      params,
    });
    return data;
  } catch (error) {
    console.error("Error fetching AllOutsideDepartments:", error);
    throw error;
  }
};

const GetOutsideDepartmentByID = async (id) => {
  try {
    const { data } = await axiosInstance.get(`/outside-departments/${id}`);
    return data;
  } catch (error) {
    console.error("Error fetching GetOutsideDepartmentByID:", error);
    throw error;
  }
};

const CreateOutsideDepartment = async (data) => {
  try {
    const res = await axiosInstance.post("/outside-departments", data);
    return res.data;
  } catch (error) {
    console.error("Error fetching CreateOutsideDepartment:", error);
    throw error;
  }
};

const UpdateOutsideDepartment = async (id, data) => {
  try {
    const res = await axiosInstance.put(`/outside-departments/${id}`, data);
    return res.data;
  } catch (error) {
    console.error("Error fetching UpdateOutsideDepartment:", error);
    throw error;
  }
};

const DeleteOutsideDepartment = async (id) => {
  try {
    const res = await axiosInstance.delete(`/outside-departments/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching DeleteOutsideDepartment:", error);
    throw error;
  }
};

export {
  GetAllOutsideDepartments,
  GetOutsideDepartmentByID,
  CreateOutsideDepartment,
  UpdateOutsideDepartment,
  DeleteOutsideDepartment,
};
