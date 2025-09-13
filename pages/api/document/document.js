import axiosInstance from "@pages/api/axiosInstance";

// ฟังก์ชันสำหรับดึงข้อมูล document-storage สำหรับ page_type = "website"
export const getDocumentStorageForWebsite = async ({
  skip = 0,
  limit = 100,
} = {}) => {
  try {
    const { data } = await axiosInstance.get("/document-storage", {
      params: {
        // page_type: "website", // กำหนด page_type เป็น "website"
        skip,
        limit,
      },
    });
    return data;
  } catch (err) {
    console.error("Error fetching document storage for website:", err);
    return [];
  }
};

// ฟังก์ชันสำหรับดึงข้อมูล document-storage สำหรับ page_type = "card"
export const getDocumentStorageForCard = async ({
  skip = 0,
  limit = 100,
} = {}) => {
  try {
    const { data } = await axiosInstance.get("/document-storage", {
      params: {
        page_type: "card", // กำหนด page_type เป็น "card"
        skip,
        limit,
      },
    });
    return data;
  } catch (err) {
    console.error("Error fetching document storage for card:", err);
    return [];
  }
};

export const getDocumentStorageByComplaintId = async (complaint_id) => {
  if (!complaint_id) return [];
  try {
    const { data } = await axiosInstance.get(
      `/document-storage/${complaint_id}`
    );
    return data;
  } catch (err) {
    console.error(
      `Error fetching document storage for complaint_id ${complaint_id}:`,
      err
    );
    return [];
  }
};
