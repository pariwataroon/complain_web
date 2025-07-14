import axiosInstance from "@pages/api/axiosInstance";

const GetAllComplaints = async ({
  skip = 0,
  limit = 10,
  status = "SUBMITTED",
}) => {
  try {
    const response = await axiosInstance.get("/complaints", {
      params: { skip, limit, status },
    });
    return response?.data;
  } catch (error) {
    console.error("Error fetching complaints:", error);
    throw error;
  }
};

const GetMeAllComplaints = async ({
  skip = 0,
  limit = 10,
  status = "SUBMITTED",
}) => {
  try {
    const response = await axiosInstance.get("/complaints/me", {
      params: { skip, limit, status },
    });
    return response?.data;
  } catch (error) {
    console.error("Error fetching complaints:", error);
    throw error;
  }
};

const GetComplaintsGroupedbyChannel = async ({
  skip = 0,
  limit = 10,
  status = "SUBMITTED",
}) => {
  try {
    const response = await axiosInstance.get("/complaints/group-by-channel", {
      params: { skip, limit, status },
    });
    return response?.data;
  } catch (error) {
    console.error("Error fetching complaints:", error);
    throw error;
  }
};

const GetComplaintByID = async (id) => {
  try {
    const response = await axiosInstance.get(`/complaints/${id}`);
    return response.data;
  } catch (err) {
    console.error("Error fetching GetComplaintByID :", err);
    return null;
  }
};


const GetComplaintMeByID = async (id) => {
  try {
    const response = await axiosInstance.get(`/complaints/me/${id}`);
    return response.data;
  } catch (err) {
    console.error("Error fetching GetComplaintByID :", err);
    return null;
  }
};

const GetComplaintTaskStatus = async (id) => {
  try {
    const response = await axiosInstance.get(`/complaints/queue/status/${id}`);
    return response.data;
  } catch (err) {
    console.error("Error fetching GetComplaintByID :", err);
    return null;
  }
};

const Addcomplaints = async (data) => {
  try {
    const response = await axiosInstance.post("/complaints", data);
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error adding complaint:", error);
    throw error;
  }
};

const UploadAttachments = async (complaint_id, formDataUpload) => {
  try {
    const response = await axiosInstance.post(
      `/complaints/${complaint_id}/attachments`,
      formDataUpload
    );
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error adding complaint:", error);
    throw error;
  }
};

const UpdateAssignmentCompleteByAdmin = async (complaint_id, formData) => {
  try {
    const response = await axiosInstance.put(
      `/complaints-assignment/${complaint_id}/assignment`,
      formData
    );
    
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error adding complaint:", error);
    throw error;
  }
};

const GetEnhancedComplaints = async ({ skip = 0, limit = 10, search = "" }) => {
  try {
    const response = await axiosInstance.get("/complaints/enhanced", {
      params: { skip, limit, search },
    });
    return response?.data;
  } catch (error) {
    console.error("Error fetching enhanced complaints:", error);
    throw error;
  }
};


export {
  Addcomplaints,
  GetAllComplaints,
  GetEnhancedComplaints,
  UploadAttachments,
  GetComplaintByID,
  GetMeAllComplaints,
  GetComplaintMeByID,
  GetComplaintTaskStatus,
  GetComplaintsGroupedbyChannel,
  UpdateAssignmentCompleteByAdmin,
};
