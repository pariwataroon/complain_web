import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import SetRole from "@components/GeneralUsageMenu/SetRole/SetRole";


const Access = () => {
  return (
    <div>
      <SetRole />
    </div>
  );
};

Access.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Access;
