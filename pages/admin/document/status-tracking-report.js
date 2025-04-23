import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";


const StatustrackingReport = () => {
  return <div>รายงานติดตามสถานะ</div>;
};

StatustrackingReport.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default StatustrackingReport;
