import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import InspectorComplaintManagementComponents from "@components/Report/InspectorComplaintManagementComponents/InspectorComplaintManagementComponents";

const InspectorComplaintManagement = () => {
  return (
    <div>
      <InspectorComplaintManagementComponents />
    </div>
  );
};

InspectorComplaintManagement.getLayout = (page) => (
  <AdminLayout>{page}</AdminLayout>
);

export default InspectorComplaintManagement;
