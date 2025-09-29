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
  search = "",
  status = ""
}) => {
  try {
    const response = await axiosInstance.get("/complaints/me", {
      params: { skip, limit, search, status },
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
}) => {
  try {
    const response = await axiosInstance.get("/complaints/group-by-channel", {
      params: { skip, limit },
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

const UpdateComplaint = async (complaintId, payload) => {
  try {
    const { data } = await axiosInstance.put(`/complaints/${complaintId}`, payload);
    return data;
  } catch (err) {
    if (err?.response?.status === 405 || err?.response?.status === 404) {
      const { data } = await axiosInstance.patch(`/complaints/${complaintId}`, payload);
      return data;
    }
    console.error("UpdateComplaint failed:", err?.response?.data || err);
    throw err;
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

const GetAssignmentCompleteByAdmin = async (id) => {
  try {
    const res = await axiosInstance.get(`/complaints-assignment/${id}/assignment-form`);
    return res.data;
  } catch (error) {
    console.error("Error in GetAssignmentCompleteByAdmin:", error);
    throw error;
  }
};

const UpdateAssignmentCompleteByAdmin = async (complaint_id, formData) => {
  try {
    const response = await axiosInstance.put(
      `/complaints-assignment/${complaint_id}/assignment`,
      formData
    );

    // Normalize return to include HTTP status and a generic success flag
    if (response) {
      const data = response.data ?? {};
      const httpStatus = response.status;
      const success =
        (typeof data.res_code === "string" && data.res_code === "0000") ||
        (httpStatus >= 200 && httpStatus < 300);
      return { ...data, httpStatus, success };
    }
    return null;
  } catch (error) {
    console.error("Error adding complaint:", error);
    throw error;
  }
};

const ConfirmAssignment = async (complaint_id, remark = "ยืนยันรับงานร้องทุกข์กระทรวงการคลัง") => {
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

const GetEnhancedComplaints = async ({ skip = 0, limit = 100, search = "" }) => {
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

const GetMyRelatedComplaints = async ({ skip = 0, limit = 10000 } = {}) => {
  try {
    const response = await axiosInstance.get("/complaints/my-related", {
      params: { skip, limit },
    });
    return response?.data;
  } catch (error) {
    console.error("Error fetching my-related complaints:", error);
    throw error;
  }
};

const GetReferenceComplaints = async ({
  skip = 0,
  limit = 100,
}) => {
  try {
    const response = await axiosInstance.get("/complaints/enhanced", {
      params: { skip, limit },
    });
    return response?.data;
  } catch (error) {
    console.error("Error fetching complaints:", error);
    throw error;
  }
};

const GetReDocumentComplaints = async ({
  skip = 0,
  limit = 100,
}) => {
  try {
    const response = await axiosInstance.get("/complaints/enhanced?document_number=not_null", {
      params: { skip, limit },
    });
    return response?.data;
  } catch (error) {
    console.error("Error fetching complaints:", error);
    throw error;
  }
};

const GetDepartments = async () => {
  try {
    const response = await axiosInstance.get("/departments");
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw error;
  }
};
const GetComplaintOutgoingTracking = async (complaint_id) => {
  try {
    const response = await axiosInstance.get(
      `/complaints/${complaint_id}/outgoing-tracking`
    );
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching outgoing tracking:", error);
    throw error;
  }
}

const UpdateAssignedRemark = async (complaint_id, assigned_remark, options = {}) => {
  try {
    // ค่าเริ่มต้นสำหรับ payload
    const defaultPayload = {
      assigned_remark,
      new_complaint: true,
    };

    // รวม options เพิ่มเติมถ้ามี
    const payload = { ...defaultPayload, ...options };

    const response = await axiosInstance.put(
      `/complaints-assignment/${complaint_id}/assignment`,
      payload
    );

    // Normalize return to include HTTP status and a generic success flag
    if (response) {
      const data = response.data ?? {};
      const httpStatus = response.status;
      const success =
        (typeof data.res_code === "string" && (data.res_code === "0000" || data.res_code === "0002")) ||
        (httpStatus >= 200 && httpStatus < 300);
      return { ...data, httpStatus, success };
    }
    return null;
  } catch (error) {
    console.error("Error updating assigned remark:", error);

    // ลองใช้ PATCH method ถ้า PUT ไม่สำเร็จ
    try {
      const fallbackPayload = { assigned_remark };
      const patchResponse = await axiosInstance.patch(
        `/complaints-assignment/${complaint_id}/assignment`,
        fallbackPayload
      );

      if (patchResponse) {
        const data = patchResponse.data ?? {};
        const httpStatus = patchResponse.status;
        const success =
          (typeof data.res_code === "string" && (data.res_code === "0000" || data.res_code === "0002")) ||
          (httpStatus >= 200 && httpStatus < 300);
        return { ...data, httpStatus, success };
      }
    } catch (patchError) {
      console.error("PATCH fallback also failed:", patchError);
    }

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
  GetMyRelatedComplaints,
  GetReferenceComplaints,
  GetReDocumentComplaints,
  GetDepartments,
  GetAssignmentCompleteByAdmin,
  GetComplaintOutgoingTracking,
  UpdateComplaint,
  UpdateAssignedRemark,
};
