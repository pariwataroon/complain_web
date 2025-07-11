import axiosInstance from "@pages/api/axiosInstance";

const GetDetailDepartment = async () => {
  try {
    const response = await axiosInstance.get("/venues/grouped/department");
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching all select data:", error);
    throw error;
  }
};

const CreateVenue = async (body) => {
  try {
    const response = await axiosInstance.post("/venues", body);
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error creating venue:", error);
    throw error;
  }
};

const DeleteVenue = async (venueId) => {
  try {
    const response = await axiosInstance.delete(`/venues/${venueId}`);
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error deleting venue:", error);
    throw error;
  }
};

const UpdateVenue = async (venueId, body) => {
  try {
    const response = await axiosInstance.put(`/venues/${venueId}`, body);
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error updating venue:", error);
    throw error;
  }
};

export { GetDetailDepartment, CreateVenue, DeleteVenue, UpdateVenue };
