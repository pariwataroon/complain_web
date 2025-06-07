import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import ChatbotComponents from "@components/HomePage/Chatbot/ChatbotComponents";


const Chatbot = () => {
  return <ChatbotComponents/>
};

Chatbot.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Chatbot;
