import SetPeriodComponent from "@components/GeneralUsageMenu/SetPeriod/SetPeriodComponent";
import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";

const SetPeriod = () => {
  return <SetPeriodComponent />;
};

SetPeriod.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default SetPeriod;