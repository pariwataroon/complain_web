import axiosInstance from "@pages/api/axiosInstance";

const getChatBot = async () => {
  try {
    const response = await axiosInstance.get(`/chat_bot`);
    if (
      response &&
      response.data &&
      response.data.res_data &&
      Array.isArray(response.data.res_data)
    ) {
      return response.data.res_data;
    } else {
      console.warn("Invalid API response structure:", response.data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching chatbot FAQs:", error);
    return [];
  }
};

const addChatBot = async (faqData) => {
  try {
    const response = await axiosInstance.post(`/chat_bot`, {
      title: faqData.title,
      detail: faqData.detail,
      keyword: faqData.keyword || [],
    });
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error adding chatbot FAQ:", error);
    throw error;
  }
};

const updateChatBot = async (faqData) => {
  try {
    const response = await axiosInstance.put(`/chat_bot/${faqData.id}`, {
      title: faqData.title,
      detail: faqData.detail,
      keyword: faqData.keyword || [],
    });
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error updating chatbot FAQ:", error);
    throw error;
  }
};

const deleteChatBot = async (chatBotId) => {
  try {
    const response = await axiosInstance.delete(`/chat_bot/${chatBotId}`);
    if (response && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error deleting chatbot FAQ:", error);
    throw error;
  }
};

export { getChatBot, addChatBot, updateChatBot, deleteChatBot };
