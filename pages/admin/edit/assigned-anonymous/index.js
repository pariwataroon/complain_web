import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import AssignedAnonymousComponents from "@components/ReceiveData/AssignedAnonymousComponents/AssignedAnonymousComponents";

const Assignedanonymous = () => {
  return (
    <div>
      <AssignedAnonymousComponents />
    </div>
  );
};

Assignedanonymous.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Assignedanonymous;
