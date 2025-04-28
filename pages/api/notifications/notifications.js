import axiosInstance from "@pages/api/axiosInstance";

export const getNotifications = async () => {
  try {
    const { data } = await axiosInstance.get("/notifications/");
    return data; // 👈 ส่งกลับไปให้คนเรียก
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return []; // หรือโยนต่อ: throw err;
  }
};

export const markNotificationAsSeen = async (id) => {
  try {
    const { data } = await axiosInstance.put(`/notifications/${id}/seen`);
    return data; // ผลลัพธ์จากเซิร์ฟเวอร์ (optional)
  } catch (err) {
    console.error(`Error marking notification ${id} as seen:`, err);
    throw err;
  }
};
