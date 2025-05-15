import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import AnnualComplaintSummaryComponents from "@components/Report/AnnualComplaintSummaryComponents/AnnualComplaintSummaryComponents";

const AnnualComplaintSummary = () => {
  return (
    <div>
      <AnnualComplaintSummaryComponents />
    </div>
  );
};

AnnualComplaintSummary.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default AnnualComplaintSummary;
