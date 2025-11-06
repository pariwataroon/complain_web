import axiosInstance from "@pages/api/axiosInstance";

/**
 * ดึงรายงานการแจ้งเตือนเจ้าหน้าที่
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Response data
 */
export const getStaffNotifications = async (params = {}) => {
  try {
    // เรียก endpoint หลักเพื่อแสดงทุกคนที่ถูก assign งาน (ไม่กรอง user_id)
    const { data } = await axiosInstance.get("/staff-notification-report", {
      params,
    });
    return data;
  } catch (err) {
    console.error("Error fetching staff notifications:", err);
    throw err;
  }
};

/**
 * ดึงสถิติการรับงานของเจ้าหน้าที่
 * @param {string} userId - User ID (optional)
 * @returns {Promise<Object>} Statistics data
 */
export const getStaffNotificationStatistics = async (userId = null) => {
  try {
    const params = userId ? { user_id: userId } : {};
    const { data } = await axiosInstance.get("/staff-notification-report/statistics", {
      params,
    });
    return data;
  } catch (err) {
    console.error("Error fetching staff notification statistics:", err);
    throw err;
  }
};
