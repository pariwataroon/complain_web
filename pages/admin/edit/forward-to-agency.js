import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";


const Forwardtoagency = () => {
  return <div>แบบรายงานส่งหน่วยงานที่เกี่ยวข้อง</div>;
};

Forwardtoagency.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Forwardtoagency;
