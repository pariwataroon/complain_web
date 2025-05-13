import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import ResultsComplaintsComponents from "@components/Report/AnnualInspectorComplaintsSummaryComponents/ResultsComplaintsComponents/ResultsComplaintsComponents";

const ResultsComplaints = () => {
  return (
    <div>
      <ResultsComplaintsComponents />
    </div>
  );
};

ResultsComplaints.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default ResultsComplaints;
