import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import StatusTrackingReport from "@components/Report/StatusTrackingReport/StatusTrackingReport";

const StatustrackingReport = () => {
  return (
    <div>
      <StatusTrackingReport />
    </div>
  );
};

StatustrackingReport.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default StatustrackingReport;
