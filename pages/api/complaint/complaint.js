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

const CreateComplaint = async (opmChannel, data) => {
  try {
    const response = await axiosInstance.post(
      `/complaints?complaint_channel_id=${opmChannel}`,
      data
    );
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

const NewsUploadAttachments = async (formDataUpload) => {
  try {
    const response = await axiosInstance.post(
      `/complaints/upload-attachment`,
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

const ConfirmAssignment = async (complaint_id, remark ="ยืนยันรับงานร้องทุกข์กระทรวงการคลัง") => {
  try {
    const requestBody = {
      confirm_status: true,
      remark: remark
    };

    const response = await axiosInstance.post(
      `/complaints-assignment/${complaint_id}/confirm-assignment`,
      requestBody
    );
    
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error confirming assignment:", error);
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
const GetComplaintsWithSearch = async ({
  skip = 0,
  limit = 10,
  search = "",
}) => {
  try {
    const response = await axiosInstance.get("/complaints", {
      params: { skip, limit, search },
    });
    return response?.data;
  } catch (error) {
    console.error("Error fetching complaints with search:", error);
    throw error;
  }
};

const GetComplaintsSubjectOPM = async ({ skip = 0, limit = 10, case_code }) => {
  try {
    const response = await axiosInstance.get(
      `/complaints?${skip}&${limit}&subject=${case_code}`
    );
    return response?.data;
  } catch (error) {
    console.error("Error fetching complaints:", error);
    throw error;
  }
};

const GetComplaintsByPageType = async ({
  pageType = "website",
  skip = 0,
  limit = 10,
}) => {
  try {
    const response = await axiosInstance.get(
      `/complaints-assignment/by-page-type`, {
        params: { page_type: pageType, skip, limit, },
      }
    );
    return response?.data;
  } catch (error) {
    console.error("Error fetching complaints by page type:", error);
    throw error;
  }
};

const GetComplaintsByPageTypeCard = async ({
  pageType = "card",  // Set the default to "card"
  skip = 0,
  limit = 10,
}) => {
  try {
    const response = await axiosInstance.get(
      `/complaints-assignment/by-page-type`, 
      {
        params: { page_type: pageType, skip, limit, },
      }
    );
    return response?.data;
  } catch (error) {
    console.error("Error fetching complaints by card page type:", error);
    throw error;
  }
};


export {
  CreateComplaint,
  Addcomplaints,
  GetAllComplaints,
  UploadAttachments,
  GetComplaintByID,
  GetMeAllComplaints,
  GetComplaintMeByID,
  GetComplaintTaskStatus,
  GetComplaintsGroupedbyChannel,
  UpdateAssignmentCompleteByAdmin,
  GetEnhancedComplaints,
  GetComplaintsWithSearch,
  GetComplaintsSubjectOPM,
  GetComplaintsByPageType,
  GetComplaintsByPageTypeCard,
  NewsUploadAttachments,
  ConfirmAssignment,
};
