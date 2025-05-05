import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import AddDepartment from "@components/GeneralUsageMenu/CommitteeCompositionSettings/addDepartment/addDepartment";

const Department = () => {
  return <AddDepartment />;
};

Department.getLayout = (page) => (
  <AdminLayout backgroundColor="#e7f1ff">{page}</AdminLayout>
);

export default Department;
