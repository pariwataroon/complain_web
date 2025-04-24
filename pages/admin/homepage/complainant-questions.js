import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";


const Complainantquestions = () => {
  return <div>รายงานคำถามจากผู้ร้อง</div>;
};

Complainantquestions.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Complainantquestions;
