import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import FollowStatus from "@components/Report/StatusTrackingReport/FollowStatus";

const StatustrackingReport = () => {
  return (
    <div>
      <FollowStatus />
    </div>
  );
};

StatustrackingReport.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default StatustrackingReport;
