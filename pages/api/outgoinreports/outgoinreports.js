import axiosInstance from "@pages/api/axiosInstance";

const CreateOutgoingReport = async (data) => {
  try {
    const response = await axiosInstance.post(`/outgoing-reports`, data);
    return response.data;
  } catch (error) {
    console.error("Error creating outgoing report:", error);
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

export { CreateOutgoingReport, UploadOutgoingReportAttachments, CreateOutgoingReport2, CreateOutgoingReport3 ,CreateOutgoingReport5, getDepartmentsPrefix };
