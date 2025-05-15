import axiosInstance from "@pages/api/axiosInstance";

export const getNotifications = async () => {
  try {
    const { data } = await axiosInstance.get("/notifications");
    return data;
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return [];
  }
};

export const markNotificationAsSeen = async (id) => {
  try {
    const { data } = await axiosInstance.put(`/notifications/${id}/seen`);
    return data;
  } catch (err) {
    console.error(`Error marking notification ${id} as seen:`, err);
    throw err;
  }
};
