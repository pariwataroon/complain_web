import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import Departments_External from "@components/GeneralUsageMenu/Departments_External/Departments_External";

const Departments_ExternalPage = () => {
  return <Departments_External />;
};

Departments_ExternalPage.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Departments_ExternalPage;
