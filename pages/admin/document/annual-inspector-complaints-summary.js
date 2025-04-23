import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";


const AnnualInspectorComplaintsSummary = () => {
  return <div>รายงานสรุปเรื่องราวร้องทุกข์ของผู้ตรวจประจำปีงบประมาณ</div>;
};

AnnualInspectorComplaintsSummary.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default AnnualInspectorComplaintsSummary;
