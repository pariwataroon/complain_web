import axiosInstance from "@pages/api/axiosInstance";

const GetComplaintsbyPageTypeAssignmentForm = async ({
  page_type = "website",
  skip = 0,
  limit = 10000,
}) => {
  try {
    const response = await axiosInstance.get(
      "/complaints-assignment/by-page-type",
      {
        params: { page_type, skip, limit },
      }
    );
    return response?.data;
  } catch (error) {
    console.error("Error fetching complaints-assignment:", error);
    throw error;
  }
};


export { GetComplaintsbyPageTypeAssignmentForm };