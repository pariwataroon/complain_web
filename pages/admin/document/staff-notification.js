import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import StaffNotificationComponents from "@components/Report/StaffNotificationComponents/StaffNotificationComponents";

const StaffNotification = () => {
  return (
    <div>
      <StaffNotificationComponents />
    </div>
  );
};

StaffNotification.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default StaffNotification;
