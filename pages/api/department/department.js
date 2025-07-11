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

export { getDepartmentGroup, getDepartments };
