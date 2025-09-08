import axiosInstance from "@pages/api/axiosInstance";

const CreateOutgoingReport = async (data) => {
  try {
    const response = await axiosInstance.post(`/outgoing-reports`, data);
    return response.data;
  } catch (error) {
    const status = error?.response?.status;
    const dataResp = error?.response?.data;
    console.error("Error creating outgoing report:", {
      status,
      data: dataResp,
      message: error?.message,
    });
    // Return a structured error payload so callers can show a friendly alert instead of crashing dev overlay
    return (
      dataResp || {
        success: false,
        res_code: String(status || "422"),
        res_message: "CREATE_OUTGOING_REPORT_FAILED",
        res_data: { error: error?.message || "Request failed" },
      }
    );
  }
};

// ----- READ existing reports -----
const GetOutgoingReportById = async (id) => {
  if (!id) throw new Error("Missing id for GetOutgoingReportById");
  try {
    const response = await axiosInstance.get(`/outgoing-reports/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching outgoing report by id:", error?.response?.data || error.message);
    throw error;
  }
};

const GetOutgoingReport2ById = async (id) => {
  if (!id) throw new Error("Missing id for GetOutgoingReport2ById");
  try {
    const response = await axiosInstance.get(`/outgoing-reports2/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching outgoing report2 by id:", error?.response?.data || error.message);
    throw error;
  }
};

const CreateOutgoingReport2 = async (data) => {
  try {
    const response = await axiosInstance.post(`/outgoing-reports2`, data);
    return response.data;
  } catch (error) {
    console.error("Error creating outgoing report:", error);
    throw error;
  }
};

const CreateOutgoingReport3 = async (data) => {
  try {
    const response = await axiosInstance.post(`/outgoing-reports3`, data);
    return response.data;
  } catch (error) {
    console.error("Error creating outgoing report:", error);
    throw error;
  }
};
const GetOutgoingReport3ById = async (id) => {
  if (!id) throw new Error("Missing id for GetOutgoingReport3ById");
  try {
    const response = await axiosInstance.get(`/outgoing-reports3/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching outgoing report2 by id:", error?.response?.data || error.message);
    throw error;
  }
};

const CreateOutgoingReport4 = async (data) => {
  try {
    const response = await axiosInstance.post(`/outgoing-reports4`, data);
    return response.data;
  } catch (error) {
    console.error("Error creating outgoing report:", error);
    throw error;
  }
};
const CreateOutgoingReport5 = async (data) => {
  try {
    const response = await axiosInstance.post(`/outgoing-reports5`, data);
    return response.data;
  } catch (error) {
    console.error("Error creating outgoing report5:", error?.response?.data || error.message);
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

const UploadOutgoingReportAttachments = async (
  formData,
  outgoing_report_id
) => {
  if (!outgoing_report_id) {
    console.error("ไม่พบ report ID ในการอัพโหลดไฟล์แนบ");
    return {
      success: false,
      res_message: "ไม่พบ report ID ในการอัพโหลดไฟล์แนบ",
    };
  }
  try {
    const response = await axiosInstance.post(
      `/outgoing-reports/${outgoing_report_id}/attachments`,
      formData
    );
    return response.data;
  } catch (error) {
    console.error("Error uploading attachments:", error);
    throw error;
  }
};

const UploadOutgoingReport5Attachments = async (
  formData,
  outgoing_report_id
) => {
  if (!outgoing_report_id) {
    console.error("❌ ไม่พบ report ID ในการอัพโหลดไฟล์แนบ");
    return {
      success: false,
      res_message: "ไม่พบ report ID ในการอัพโหลดไฟล์แนบ",
    };
  }

  // Debug FormData contents
  if (formData instanceof FormData) {
    console.log('📋 FormData contents:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}:`, { name: value.name, size: value.size, type: value.type });
      } else {
        console.log(`  ${key}:`, value);
      }
    }
  }

  try {
    const endpoint = `/outgoing-reports5/${outgoing_report_id}/attachments`;

    const response = await axiosInstance.post(endpoint, formData);
    return response.data;
  } catch (error) {
    console.error("❌ Error uploading attachments:", {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message,
      config: {
        url: error?.config?.url,
        method: error?.config?.method,
        headers: error?.config?.headers
      }
    });

    // Return a structured error response instead of throwing
    return {
      success: false,
      res_message: error?.response?.data?.res_message || error?.message || 'การอัพโหลดไฟล์ล้มเหลว',
      res_code: error?.response?.status?.toString() || 'UPLOAD_ERROR'
    };
  }
};

// DELETE existing attachment
const DeleteOutgoingReportAttachment = async ({ outgoing_report_id, attachment_id }) => {
  if (!outgoing_report_id || !attachment_id) {
    return {
      success: false,
      res_message: "missing outgoing_report_id or attachment_id",
    };
  }
  try {
    const endpoint = `/outgoing-reports/${outgoing_report_id}/attachments/${attachment_id}`;
    const response = await axiosInstance.delete(endpoint);
    return response.data || { success: true };
  } catch (error) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.error("Error deleting attachment:", { status, data });
    return {
      success: false,
      res_message: data?.res_message || error?.message || "DELETE_FAILED",
      res_code: String(status || "500"),
    };
  }
};


export { CreateOutgoingReport, UploadOutgoingReportAttachments, CreateOutgoingReport2, CreateOutgoingReport3, CreateOutgoingReport4, CreateOutgoingReport5, getDepartmentsPrefix, GetOutgoingReportById, GetOutgoingReport2ById, GetOutgoingReport3ById, UploadOutgoingReport5Attachments, DeleteOutgoingReportAttachment };
