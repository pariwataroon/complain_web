import axiosInstance from "@pages/api/axiosInstance";
const getStaffWorkload = async ({
  skip = 0,
  limit = 10000,
  date_from = "2025-01-01",
  date_to = "2025-12-31",
  year = 2025,
} = {}) => {
  try {
    const response = await axiosInstance.get(`/dashboard/staff-workload`, {
      params: { skip, limit, date_from, date_to, year },
    });

    // รองรับโครงสร้าง API เดิม: { res_code, res_message, res_data }
    const data = response?.data;
    if (!data) {
      console.warn("Empty API response.");
      return [];
    }

    if (data.res_code && data.res_code !== "0000") {
      // เซิร์ฟเวอร์แจ้ง error ในรูปแบบมาตรฐานของระบบ
      const msg = data.res_message || "API returned error";
      console.error("Staff workload API error:", msg, data);
      throw new Error(msg);
    }

    // ถ้า res_data เป็น array ให้รีเทิร์นเลย
    if (Array.isArray(data.res_data)) {
      return data.res_data;
    }

    // ถ้าเป็น object อื่น ๆ ให้รีเทิร์นตามจริง (ปรับใช้ตามสคีมาที่หลังบ้านส่งมา)
    return data.res_data ?? [];
  } catch (error) {
    console.error("Error fetching staff workload dashboard:", error);
    throw error; // โยนต่อไปให้หน้าบ้าน handle (เช่น alert, toast)
  }
};

export { getStaffWorkload };
