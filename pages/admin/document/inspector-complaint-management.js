import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";


const InspectorComplaintManagement = () => {
  return <div>รายงานผลการจัดการเรื่องร้องเรียนของผู้ตรวจ</div>;
};

InspectorComplaintManagement.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default InspectorComplaintManagement;
