import SetPeriodComponent from "@components/GeneralUsageMenu/SetPeriod/SetPeriodComponent";
import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";

const Times = () => {
  return <SetPeriodComponent />;
};

Times.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Times;
