import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import ReportResultsComponents from "@components/Report/AnnualComplaintSummaryComponents/ReportResultsComponents/ReportResultsComponents";

const ReportResults = () => {
  return (
    <div>
      <ReportResultsComponents />
    </div>
  );
};

ReportResults.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default ReportResults;
