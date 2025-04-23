import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import AssignComponent from "@components/GeneralUsageMenu/AssignModerator/AssignComponent";


const Users = () => {
  return <AssignComponent />;
};

Users.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Users;
