import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import SummaryResultsComponens from "@components/Report/NewAdditionalComplaintsSummaryComponents/SummaryResultsComponens/SummaryResultsComponens";

const SummaryResults = () => {
  return (
    <div>
      <SummaryResultsComponens />
    </div>
  );
};

SummaryResults.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default SummaryResults;
