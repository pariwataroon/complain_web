import axiosInstance from "@pages/api/axiosInstance";

// ✅ ดึงรายการ time settings ทั้งหมด
const getTimeSettings = async () => {
  const res = await axiosInstance.get("/time-settings");
  return res?.data?.res_data || [];
};

// ✅ อัปเดตรายการ time setting ตาม id
const updateTimeSettingById = async (id, updateData) => {
  const res = await axiosInstance.put(`/time-settings/${id}`, updateData);
  return res?.data;
};

export { getTimeSettings, updateTimeSettingById };
