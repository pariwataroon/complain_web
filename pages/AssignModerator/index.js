import AssignComponent from "@components/GeneralUsageMenu/AssignModerator/AssignComponent";
import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";

const AssignModerator = () => {
  return <AssignComponent />;
};

AssignModerator.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default AssignModerator;
