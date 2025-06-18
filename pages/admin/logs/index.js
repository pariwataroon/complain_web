import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import LogsComponents from "@components/LogsComponents/LogsComponents";

const Logs = () => {
  return <LogsComponents />;
};

Logs.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Logs;
