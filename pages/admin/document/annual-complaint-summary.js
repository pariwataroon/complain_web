import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";


const AnnualComplaintSummary = () => {
  return <div>รายงานสรุปเรื่องร้องเรียนประจำปีงบประมาณ</div>;
};

AnnualComplaintSummary.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default AnnualComplaintSummary;
