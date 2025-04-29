import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import SetRole from "@components/GeneralUsageMenu/SetRole/SetRole";
const Access = () => {
  return (
      <SetRole />
  );
};

Access.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Access;
