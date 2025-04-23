import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";


const StaffNotification = () => {
  return <div>รายงานการแจ้งเตือนเจ้าหน้าที่</div>;
};

StaffNotification.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default StaffNotification;
