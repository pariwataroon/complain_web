import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import Positions from "@components/GeneralUsageMenu/Positions/Positions";

const PositionsPage = () => {
  return <Positions />;
};

PositionsPage.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default PositionsPage;
