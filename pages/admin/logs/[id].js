import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import LogsComponentsDetail from "@components/LogsComponents/LogsComponentsDetail";

const logDetails = () => {
  return <LogsComponentsDetail />;
};

logDetails.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default logDetails;
