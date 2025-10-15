import axiosInstance from "@pages/api/axiosInstance";

// ฟังก์ชันดึงข้อมูลข่าวสารทั้งหมด
const getAllNews = async (skip = 0, limit = 10000, search = "", isPublished = null) => {
  try {
    // ปรับปรุงเงื่อนไขในการส่งค่า is_published
    const response = await axiosInstance.get('/news', {
      params: {
        skip,
        limit,
        search,
        // หาก isPublished เป็น null หรือ undefined จะไม่ส่งพารามิเตอร์ is_published ไป
        ...(isPublished !== null && { is_published: isPublished }),
      },
    });

    console.log("API Response:", response); // ตรวจสอบค่าที่ได้รับจาก API

    if (response && response.data && response.data.res_data) {
      return response.data.res_data; // ดึงข้อมูลข่าวสารจาก res_data
    } else {
      console.warn('Invalid API response structure:', response.data);
      return []; // หากไม่มีข้อมูลหรือข้อมูลไม่ถูกต้อง ส่งค่าเป็นอาร์เรย์ว่าง
    }
  } catch (error) {
    console.error('Error fetching all news:', error.response || error.message);
    return []; // กรณีมีข้อผิดพลาดในการดึงข้อมูล ส่งค่าเป็นอาร์เรย์ว่าง
  }
};



// ฟังก์ชันดึงข้อมูลข่าวสารตาม ID
const getNewsById = async (newsId) => {
  try {
    const response = await axiosInstance.get(`/news/${newsId}`); // ส่ง HTTP GET เพื่อดึงข้อมูลข่าว
    if (response && response.data) {
      return response.data.res_data; // ส่งข้อมูลที่ดึงมาในฟอร์แมตที่ต้องการ
    }
  } catch (error) {
    console.error('Error fetching news by ID:', error.response || error.message);
    throw error;
  }
};


// ฟังก์ชันดึงข่าวสารที่เผยแพร่แล้ว
const getPublishedNews = async (skip = 0, limit = 10000, search = "") => {
  try {
    const response = await axiosInstance.get('/news/public', {
      params: { skip, limit, search },
    });

    if (response && response.data && response.data.res_data) {
      return response.data.res_data;
    } else {
      console.warn('Invalid API response structure:', response.data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching published news:", error.response || error.message);
    return [];
  }
};

// ฟังก์ชันดึงข่าวสารที่สามารถแสดงผลได้
const getDisplayableNews = async (skip = 0, limit = 10000, search = "") => {
  try {
    const response = await axiosInstance.get('/news/public/displayable', {
      params: { skip, limit, search },
    });

    if (response && response.data && response.data.res_data) {
      return response.data.res_data;
    } else {
      console.warn('Invalid API response structure:', response.data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching displayable news:", error.response || error.message);
    return [];
  }
};

// ฟังก์ชันดึงข่าวสารที่เผยแพร่ตาม ID
const getPublishedNewsById = async (newsId) => {
  try {
    const response = await axiosInstance.get(`/news/public/${newsId}`);
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching published news by ID:", error.response || error.message);
    throw error;
  }
};

// ฟังก์ชันสร้างข่าวสารใหม่
const createNews = async (newsData) => {
  try {
    const response = await axiosInstance.post('/news', newsData); // ส่งข้อมูลไปยัง API เพื่อสร้างข่าว
    if (response && response.data) {
      return response.data; // ส่งข้อมูลที่ได้รับจาก API (อาจเป็น ID หรือข้อมูลที่สร้างขึ้น)
    }
  } catch (error) {
    console.error('❌ Error creating news:', error.response?.data || error.response || error.message);
    console.error('❌ Status:', error.response?.status);
    console.error('❌ Data sent:', newsData);
    throw error;
  }
};


// ฟังก์ชันอัปเดตข่าวสาร
const updateNews = async (newsId, newsData) => {
  try {
    const response = await axiosInstance.put(`/news/${newsId}`, newsData);
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error('Error updating news:', error.response || error.message);
    throw error;
  }
};

// ฟังก์ชันลบข่าวสาร
const deleteNews = async (newsId) => {
  try {
    const response = await axiosInstance.delete(`/news/${newsId}`);
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error('Error deleting news:', error.response || error.message);
    throw error;
  }
};

export { getAllNews, getNewsById, getPublishedNews, getDisplayableNews, getPublishedNewsById, createNews, updateNews, deleteNews };
