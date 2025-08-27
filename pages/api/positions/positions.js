import axiosInstance from "@pages/api/axiosInstance";

const GetAllPositions = async (skip, limit, search, level, is_active) => {
  try {
    const { data } = await axiosInstance.get("/positions", {
      params: { skip, limit, search, level, is_active }
    });
    return data;
  } catch (error) {
    console.error("Error fetching GetAllPositions:", error);
    throw error;
  }
};

const GetPositionByID = async (id) => {
  try {
    const { data } = await axiosInstance.get(`/positions/${id}`);
    return data;
  } catch (error) {
    console.error("Error fetching GetPositionByID:", error);
    throw error;
  }
};

const CreatePosition = async (data) => {
  try {
    const res = await axiosInstance.post("/positions", data);
    return res.data;
  } catch (error) {
    console.error("Error fetching CreatePosition:", error);
    throw error;
  }
};

const UpdatePosition = async (id, data) => {
  try {
    const res = await axiosInstance.put(`/positions/${id}`, data);
    return res.data;
  } catch (error) {
    console.error("Error fetching UpdatePosition:", error);
    throw error;
  }
};

const DeletePosition = async (id) => {
  try {
    const res = await axiosInstance.delete(`/positions/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching DeletePosition:", error);
    throw error;
  }
};

export { GetAllPositions, GetPositionByID, CreatePosition, UpdatePosition, DeletePosition };
