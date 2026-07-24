import axiosInstance from "@pages/api/axiosInstance";

const GetAllComplaints = async ({
  skip = 0,
  limit = 10000,
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
  limit = 10000,
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
  limit = 10000,
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

const Addcomplaints = async (data, complaint_channel_id = null, complaint_type_id = null) => {
  try {
    let url = "/complaints";
    const params = [];

    if (complaint_channel_id) {
      params.push(`complaint_channel_id=${complaint_channel_id}`);
    }
    if (complaint_type_id) {
      params.push(`complaint_type_id=${complaint_type_id}`);
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    console.log('✅ Sending complaint:', { complaint_channel_id, complaint_type_id, url });

    const response = await axiosInstance.post(url, data);
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

const GetEnhancedComplaints = async ({ skip = 0, limit = 10000, search = "" }) => {
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
  limit = 10000,
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

// ค้นหา complaints โดย reference_number1 (เลข สป.กค.) เพื่อตรวจซ้ำก่อนบันทึก
const GetComplaintByReferenceNumber1 = async ({
  reference_number1,
  skip = 0,
  limit = 10,
}) => {
  try {
    const response = await axiosInstance.get("/complaints", {
      params: { skip, limit, reference_number_exact: reference_number1 },
    });
    return response?.data;
  } catch (error) {
    console.error("Error fetching complaint by reference_number1:", error);
    throw error;
  }
};

// ค้นหา complaints โดย reference_number5 (=EOffice case_id / OPM case_code) เพื่อ dedup
const GetComplaintByReferenceNumber5 = async ({
  reference_number5,
  skip = 0,
  limit = 10,
}) => {
  try {
    const response = await axiosInstance.get("/complaints", {
      params: { skip, limit, reference_number5 },
    });
    return response?.data;
  } catch (error) {
    console.error("Error fetching complaint by reference_number5:", error);
    throw error;
  }
};

const GetComplaintsSubjectOPM = async ({ skip = 0, limit = 10, subject }) => {
  try {
    const response = await axiosInstance.get(
      `/complaints`,
      { params: { skip, limit, subject } }
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
  limit = 10000,
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
  pageType = "card",
  skip = 0,
  limit = 10000,
  myAssignmentsOnly = true,
}) => {
  try {
    const response = await axiosInstance.get(
      `/complaints-assignment/by-page-type`,
      {
        params: { page_type: pageType, skip, limit, my_assignments_only: myAssignmentsOnly },
      }
    );
    return response?.data;
  } catch (error) {
    console.error("Error fetching complaints by card page type:", error);
    throw error;
  }
};

const GetMyRelatedComplaints = async ({ skip = 0, limit = 10000, date_from = "", date_to = "" } = {}) => {
  try {
    const params = { skip, limit };
    if (date_from) params.date_from = date_from;
    if (date_to) params.date_to = date_to;

    const response = await axiosInstance.get("/complaints/my-related", {
      params,
    });
    return response?.data;
  } catch (error) {
    console.error("Error fetching my-related complaints:", error);
    throw error;
  }
};

const GetReferenceComplaints = async ({
  skip = 0,
  limit = 10000,
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
  limit = 10000,
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

const DeleteComplaintAttachment = async (complaint_id, attachment_id) => {
  console.log("🗑️ DeleteComplaintAttachment called:", { complaint_id, attachment_id });

  try {
    // DELETE with attachment_id in URL path
    const response = await axiosInstance.delete(
      `/complaints/${complaint_id}/attachments/${attachment_id}`
    );

    console.log("✅ DELETE response:", response.data);

    if (response && response.data) {
      return response.data;
    }
    return { success: true, res_code: "0000" };
  } catch (error) {
    console.error("❌ DELETE failed:", error?.response?.status, error?.response?.data);

    // If DELETE fails, fallback to marking for deletion on save
    console.log("⚠️ DELETE endpoint failed. Will remove from UI and update on save.");

  }
};


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
  DeleteComplaintAttachment,
  GetComplaintByID,
  GetMeAllComplaints,
  GetComplaintMeByID,
  GetComplaintTaskStatus,
  GetComplaintsGroupedbyChannel,
  UpdateAssignmentCompleteByAdmin,
  GetEnhancedComplaints,
  GetComplaintsWithSearch,
  GetComplaintByReferenceNumber1,
  GetComplaintByReferenceNumber5,
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
