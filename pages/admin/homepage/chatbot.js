import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";


const Chatbot = () => {
  return <div>กำหนดคำถาม Chat Bot</div>;
};

Chatbot.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Chatbot;
