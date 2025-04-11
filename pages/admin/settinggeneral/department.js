import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import CommitteeCompositionSettings from "@components/GeneralUsageMenu/CommitteeCompositionSettings/CommitteeCompositionSettings";

const Department = () => {
  return <CommitteeCompositionSettings />;
};

Department.getLayout = (page) => (
  <AdminLayout backgroundColor="#e7f1ff">{page}</AdminLayout>
);

export default Department;
