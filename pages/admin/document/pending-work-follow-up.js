import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import PendingWorkfollowupComponents from "@components/Report/PendingWorkfollowupComponents/PendingWorkfollowupComponents";

const PendingWorkfollowup = () => {
  return (
    <div>
      <PendingWorkfollowupComponents />
    </div>
  );
};

PendingWorkfollowup.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default PendingWorkfollowup;
