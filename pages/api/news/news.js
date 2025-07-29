import axiosInstance from "@pages/api/axiosInstance";

// ฟังก์ชันดึงข้อมูลข่าวสารทั้งหมด
const getAllNews = async (skip = 0, limit = 100, search = "", isPublished = "") => {
  try {
    const response = await axiosInstance.get('/api/v1/news', {
      params: { skip, limit, search, is_published: isPublished },
    });

    if (response && response.data && response.data.res_data) {
      return response.data.res_data;
    } else {
      console.warn('Invalid API response structure:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching all news:', error.response || error.message);
    return [];
  }
};

// ฟังก์ชันดึงข้อมูลข่าวสารตาม ID
const getNewsById = async (newsId) => {
  try {
    const response = await axiosInstance.get(`/api/v1/news/${newsId}`);
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching news by ID:", error.response || error.message);
    throw error;
  }
};

// ฟังก์ชันดึงข่าวสารที่เผยแพร่แล้ว
const getPublishedNews = async (skip = 0, limit = 100, search = "") => {
  try {
    const response = await axiosInstance.get('/api/v1/news/public', {
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
const getDisplayableNews = async (skip = 0, limit = 100, search = "") => {
  try {
    const response = await axiosInstance.get('/api/v1/news/public/displayable', {
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
    const response = await axiosInstance.get(`/api/v1/news/public/${newsId}`);
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
    const response = await axiosInstance.post('/api/v1/news', newsData);
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error('Error creating news:', error.response || error.message);
    throw error;
  }
};

// ฟังก์ชันอัปเดตข่าวสาร
const updateNews = async (newsId, newsData) => {
  try {
    const response = await axiosInstance.put(`/api/v1/news/${newsId}`, newsData);
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
    const response = await axiosInstance.delete(`/api/v1/news/${newsId}`);
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error('Error deleting news:', error.response || error.message);
    throw error;
  }
};

export { getAllNews, getNewsById, getPublishedNews, getDisplayableNews, getPublishedNewsById, createNews, updateNews, deleteNews };
