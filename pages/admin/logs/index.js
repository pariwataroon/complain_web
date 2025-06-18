import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";

const Logs = () => {
  return <div>Logs</div>;
};

Logs.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Logs;
