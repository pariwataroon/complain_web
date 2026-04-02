import axiosInstance from "@pages/api/axiosInstance";

// --- New helper specific for type3 uploads (mirrors type5 pattern but simpler) ---
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

const UpdateOutgoingReport = async (id, data) => {
  if (!id) throw new Error("Missing id for UpdateOutgoingReport5");
  try {
    const response = await axiosInstance.put(`/outgoing-reports/${id}`, data);
    return response.data;
  } catch (errorPut) {
    const statusPut = errorPut?.response?.status;
    try {
      const responsePatch = await axiosInstance.patch(`/outgoing-reports/${id}`, data);
      return responsePatch.data;
    } catch (errorPatch) {
      console.error("Error updating outgoing report5:", {
        putStatus: statusPut,
        putData: errorPut?.response?.data,
        patchStatus: errorPatch?.response?.status,
        patchData: errorPatch?.response?.data,
        message: errorPatch?.message,
      });
      throw errorPatch;
    }
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

const UpdateOutgoingReport2 = async (id, data) => {
  if (!id) throw new Error("Missing id for UpdateOutgoingReport5");
  try {
    const response = await axiosInstance.put(`/outgoing-reports2/${id}`, data);
    return response.data;
  } catch (errorPut) {
    const statusPut = errorPut?.response?.status;
    try {
      const responsePatch = await axiosInstance.patch(`/outgoing-reports2/${id}`, data);
      return responsePatch.data;
    } catch (errorPatch) {
      console.error("Error updating outgoing report5:", {
        putStatus: statusPut,
        putData: errorPut?.response?.data,
        patchStatus: errorPatch?.response?.status,
        patchData: errorPatch?.response?.data,
        message: errorPatch?.message,
      });
      throw errorPatch;
    }
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

const UpdateOutgoingReport3 = async (id, data) => {
  if (!id) throw new Error("Missing id for UpdateOutgoingReport5");
  try {
    const response = await axiosInstance.put(`/outgoing-reports3/${id}`, data);
    return response.data;
  } catch (errorPut) {
    const statusPut = errorPut?.response?.status;
    try {
      const responsePatch = await axiosInstance.patch(`/outgoing-reports3/${id}`, data);
      return responsePatch.data;
    } catch (errorPatch) {
      console.error("Error updating outgoing report5:", {
        putStatus: statusPut,
        putData: errorPut?.response?.data,
        patchStatus: errorPatch?.response?.status,
        patchData: errorPatch?.response?.data,
        message: errorPatch?.message,
      });
      throw errorPatch;
    }
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

const GetOutgoingReport4ById = async (id) => {
  if (!id) throw new Error("Missing id for GetOutgoingReport4ById");
  try {
    const response = await axiosInstance.get(`/outgoing-reports4/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching outgoing report4 by id:", error?.response?.data || error.message);
    throw error;
  }
};

const UpdateOutgoingReport4 = async (id, data) => {
  if (!id) throw new Error("Missing id for UpdateOutgoingReport4");
  try {
    const response = await axiosInstance.put(`/outgoing-reports4/${id}`, data);
    return response.data;
  } catch (errorPut) {
    const statusPut = errorPut?.response?.status;
    try {
      const responsePatch = await axiosInstance.patch(`/outgoing-reports4/${id}`, data);
      return responsePatch.data;
    } catch (errorPatch) {
      console.error("Error updating outgoing report4:", {
        putStatus: statusPut,
        putData: errorPut?.response?.data,
        patchStatus: errorPatch?.response?.status,
        patchData: errorPatch?.response?.data,
        message: errorPatch?.message,
      });
      throw errorPatch;
    }
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

const GetOutgoingReport5ById = async (id) => {
  if (!id) throw new Error("Missing id for GetOutgoingReport5ById");
  try {
    const response = await axiosInstance.get(`/outgoing-reports5/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching outgoing report5 by id:", error?.response?.data || error.message);
    throw error;
  }
};

const UpdateOutgoingReport5 = async (id, data) => {
  if (!id) throw new Error("Missing id for UpdateOutgoingReport5");
  try {
    const response = await axiosInstance.put(`/outgoing-reports5/${id}`, data);
    return response.data;
  } catch (errorPut) {
    const statusPut = errorPut?.response?.status;
    try {
      const responsePatch = await axiosInstance.patch(`/outgoing-reports5/${id}`, data);
      return responsePatch.data;
    } catch (errorPatch) {
      console.error("Error updating outgoing report5:", {
        putStatus: statusPut,
        putData: errorPut?.response?.data,
        patchStatus: errorPatch?.response?.status,
        patchData: errorPatch?.response?.data,
        message: errorPatch?.message,
      });
      throw errorPatch;
    }
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

const GetOutgoingReportsList = async (params = {}) => {
  try {
    const {
      skip = 0,
      limit = 100,
      search = null,
      position_id = null,
      department_id = null,
      signature_authority_user_id = null,
      urgency_level = null,
      date_from = null,
      date_to = null
    } = params;

    const queryParams = new URLSearchParams();
    if (skip !== undefined) queryParams.append('skip', skip);
    if (limit !== undefined) queryParams.append('limit', limit);
    if (search) queryParams.append('search', search);
    if (position_id) queryParams.append('position_id', position_id);
    if (department_id) queryParams.append('department_id', department_id);
    if (signature_authority_user_id) queryParams.append('signature_authority_user_id', signature_authority_user_id);
    if (urgency_level) queryParams.append('urgency_level', urgency_level);
    if (date_from) queryParams.append('date_from', date_from);
    if (date_to) queryParams.append('date_to', date_to);

    const response = await axiosInstance.get(`/outgoing-reports?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching outgoing reports list:", error?.response?.data || error.message);
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

// Dedicated helper for Type3 attachments (outgoing-reports3)
const UploadOutgoingReport3Attachments = async (formData, outgoing_report_id) => {
  if (!outgoing_report_id) {
    console.error("❌ ไม่พบ report ID ในการอัพโหลดไฟล์แนบ (type3)");
    return { success: false, res_message: "ไม่พบ report ID ในการอัพโหลดไฟล์แนบ" };
  }
  try {
    const endpoint = `/outgoing-reports3/${outgoing_report_id}/attachments`;
    const response = await axiosInstance.post(endpoint, formData);
    return response.data;
  } catch (error) {
    console.error("❌ Error uploading attachments (type3):", {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });
    return { success: false, res_message: error?.response?.data?.res_message || error?.message || 'UPLOAD_FAILED', res_code: String(error?.response?.status || '500') };
  }
};

const DeleteOutgoingReportAttachment = async ({ outgoing_report_id, attachment_id }) => {
  if (!outgoing_report_id || !attachment_id) {
    return { success: false, res_message: "missing outgoing_report_id or attachment_id" };
  }
  try {
    const endpoint = `/outgoing-reports/${outgoing_report_id}/attachments/${attachment_id}`;
    const response = await axiosInstance.delete(endpoint);
    return response.data || { success: true };
  } catch (error) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.error("Error deleting attachment:", { status, data });
    return { success: false, res_message: data?.res_message || error?.message || "DELETE_FAILED", res_code: String(status || "500") };
  }
};

const DeleteOutgoingReport2Attachment = async ({ outgoing_report_id, attachment_id }) => {
  if (!outgoing_report_id || !attachment_id) {
    return { success: false, res_message: "missing outgoing_report_id or attachment_id" };
  }
  try {
    const endpoint = `/outgoing-reports2/${outgoing_report_id}/attachments/${attachment_id}`;
    const response = await axiosInstance.delete(endpoint);
    return response.data || { success: true };
  } catch (error) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.error("Error deleting attachment (type2):", { status, data });
    return { success: false, res_message: data?.res_message || error?.message || "DELETE_FAILED", res_code: String(status || "500") };
  }
};

const DeleteOutgoingReport3Attachment = async ({ outgoing_report_id, attachment_id }) => {
  if (!outgoing_report_id || !attachment_id) {
    return { success: false, res_message: "missing outgoing_report_id or attachment_id" };
  }
  try {
    const endpoint = `/outgoing-reports3/${outgoing_report_id}/attachments/${attachment_id}`;
    const response = await axiosInstance.delete(endpoint);
    return response.data || { success: true };
  } catch (error) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.error("Error deleting attachment (type3):", { status, data });
    return { success: false, res_message: data?.res_message || error?.message || "DELETE_FAILED", res_code: String(status || "500") };
  }
};

const DeleteOutgoingReport4Attachment = async ({ outgoing_report_id, attachment_id }) => {
  if (!outgoing_report_id || !attachment_id) {
    return { success: false, res_message: "missing outgoing_report_id or attachment_id" };
  }
  try {
    const endpoint = `/outgoing-reports4/${outgoing_report_id}/attachments/${attachment_id}`;
    const response = await axiosInstance.delete(endpoint);
    return response.data || { success: true };
  } catch (error) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.error("Error deleting attachment (type4):", { status, data });
    return { success: false, res_message: data?.res_message || error?.message || "DELETE_FAILED", res_code: String(status || "500") };
  }
};


const DeleteOutgoingReport5Attachment = async ({ outgoing_report_id, attachment_id }) => {
  if (!outgoing_report_id || !attachment_id) {
    return { success: false, res_message: "missing outgoing_report_id or attachment_id" };
  }
  try {
    const endpoint = `/outgoing-reports5/${outgoing_report_id}/attachments/${attachment_id}`;
    const response = await axiosInstance.delete(endpoint);
    return response.data || { success: true };
  } catch (error) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.error("Error deleting attachment (type5):", { status, data });
    return { success: false, res_message: data?.res_message || error?.message || "DELETE_FAILED", res_code: String(status || "500") };
  }
};


// --- LIST endpoints for types 2-5 ---
const GetOutgoingReports2List = async (params = {}) => {
  try {
    const {
      skip = 0,
      limit = 10000,
      search = null,
      position_id = null,
      outside_department_id = null,
      signature_authority_user_id = null,
      urgency_level = null,
      date_from = null,
      date_to = null,
    } = params;

    const queryParams = new URLSearchParams();
    if (skip !== undefined) queryParams.append("skip", skip);
    if (limit !== undefined) queryParams.append("limit", limit);
    if (search) queryParams.append("search", search);
    if (position_id) queryParams.append("position_id", position_id);
    if (outside_department_id) queryParams.append("outside_department_id", outside_department_id);
    if (signature_authority_user_id) queryParams.append("signature_authority_user_id", signature_authority_user_id);
    if (urgency_level) queryParams.append("urgency_level", urgency_level);
    if (date_from) queryParams.append("date_from", date_from);
    if (date_to) queryParams.append("date_to", date_to);

    const response = await axiosInstance.get(`/outgoing-reports2?${queryParams.toString()}`);
    return response?.data?.res_data?.items || response?.data?.data?.items || [];
  } catch (error) {
    console.error("Error fetching outgoing reports2 list:", error?.response?.data || error.message);
    return [];
  }
};

const GetOutgoingReports3List = async (params = {}) => {
  try {
    const {
      skip = 0,
      limit = 10000,
      search = null,
      position_id = null,
      department_id = null,
      signature_authority_user_id = null,
      urgency_level = null,
      date_from = null,
      date_to = null,
    } = params;

    const queryParams = new URLSearchParams();
    if (skip !== undefined) queryParams.append("skip", skip);
    if (limit !== undefined) queryParams.append("limit", limit);
    if (search) queryParams.append("search", search);
    if (position_id) queryParams.append("position_id", position_id);
    if (department_id) queryParams.append("department_id", department_id);
    if (signature_authority_user_id) queryParams.append("signature_authority_user_id", signature_authority_user_id);
    if (urgency_level) queryParams.append("urgency_level", urgency_level);
    if (date_from) queryParams.append("date_from", date_from);
    if (date_to) queryParams.append("date_to", date_to);

    const response = await axiosInstance.get(`/outgoing-reports3?${queryParams.toString()}`);
    return response?.data?.res_data?.items || response?.data?.data?.items || [];
  } catch (error) {
    console.error("Error fetching outgoing reports3 list:", error?.response?.data || error.message);
    return [];
  }
};

const GetOutgoingReports4List = async (params = {}) => {
  try {
    const {
      skip = 0,
      limit = 10000,
      search = null,
      outside_department_id = null,
      signature_authority_user_id = null,
      urgency_level = null,
      date_from = null,
      date_to = null,
    } = params;

    const queryParams = new URLSearchParams();
    if (skip !== undefined) queryParams.append("skip", skip);
    if (limit !== undefined) queryParams.append("limit", limit);
    if (search) queryParams.append("search", search);
    if (outside_department_id) queryParams.append("outside_department_id", outside_department_id);
    if (signature_authority_user_id) queryParams.append("signature_authority_user_id", signature_authority_user_id);
    if (urgency_level) queryParams.append("urgency_level", urgency_level);
    if (date_from) queryParams.append("date_from", date_from);
    if (date_to) queryParams.append("date_to", date_to);

    const response = await axiosInstance.get(`/outgoing-reports4?${queryParams.toString()}`);
    return response?.data?.res_data?.items || response?.data?.data?.items || [];
  } catch (error) {
    console.error("Error fetching outgoing reports4 list:", error?.response?.data || error.message);
    return [];
  }
};

const GetOutgoingReports5List = async (params = {}) => {
  try {
    const {
      skip = 0,
      limit = 10000,
      search = null,
      department_id = null,
      signature_authority_user_id = null,
      urgency_level = null,
      date_from = null,
      date_to = null,
    } = params;

    const queryParams = new URLSearchParams();
    if (skip !== undefined) queryParams.append("skip", skip);
    if (limit !== undefined) queryParams.append("limit", limit);
    if (search) queryParams.append("search", search);
    if (department_id) queryParams.append("department_id", department_id);
    if (signature_authority_user_id) queryParams.append("signature_authority_user_id", signature_authority_user_id);
    if (urgency_level) queryParams.append("urgency_level", urgency_level);
    if (date_from) queryParams.append("date_from", date_from);
    if (date_to) queryParams.append("date_to", date_to);

    const response = await axiosInstance.get(`/outgoing-reports5?${queryParams.toString()}`);
    return response?.data?.res_data?.items || response?.data?.data?.items || [];
  } catch (error) {
    console.error("Error fetching outgoing reports5 list:", error?.response?.data || error.message);
    return [];
  }
};

export { CreateOutgoingReport, UploadOutgoingReportAttachments, CreateOutgoingReport2, CreateOutgoingReport3, CreateOutgoingReport4, CreateOutgoingReport5, getDepartmentsPrefix, GetOutgoingReportById, GetOutgoingReport2ById, GetOutgoingReport3ById, UploadOutgoingReport5Attachments, DeleteOutgoingReportAttachment, DeleteOutgoingReport4Attachment, GetOutgoingReport4ById, UpdateOutgoingReport4, GetOutgoingReport5ById, UpdateOutgoingReport5, DeleteOutgoingReport5Attachment, UploadOutgoingReport3Attachments, UpdateOutgoingReport3, DeleteOutgoingReport3Attachment, DeleteOutgoingReport2Attachment, UpdateOutgoingReport2, UpdateOutgoingReport, GetOutgoingReportsList, GetOutgoingReports2List, GetOutgoingReports3List, GetOutgoingReports4List, GetOutgoingReports5List };
