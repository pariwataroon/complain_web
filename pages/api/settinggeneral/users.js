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

const AddUsers = async () => {

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

export { GetDetailedStatsbyRole, AddUsers, DelUsers };
