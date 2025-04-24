import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";


const NewAdditionalComplaintsSummary = () => {
  return <div>รายงานสรุปเรื่องเข้าใหม่และร้องเพิ่มทั้งหมด</div>;
};

NewAdditionalComplaintsSummary.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default NewAdditionalComplaintsSummary;
