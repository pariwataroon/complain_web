import axiosInstance from "@pages/api/axiosInstance";

export const getDocumentStorage = async ({
  page_type = "website",
  skip = 0,
  limit = 100,
} = {}) => {
  try {
    const { data } = await axiosInstance.get("/document-storage", {
      params: {
        page_type,
        skip,
        limit,
      },
    });
    return data;
  } catch (err) {
    console.error("Error fetching document storage:", err);
    return [];
  }
};
