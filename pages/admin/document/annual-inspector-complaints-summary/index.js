import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import AnnualInspectorComplaintsSummaryComponents from "@components/Report/AnnualInspectorComplaintsSummaryComponents/AnnualInspectorComplaintsSummaryComponents";

const AnnualInspectorComplaintsSummary = () => {
  return (
    <div>
      <AnnualInspectorComplaintsSummaryComponents />
    </div>
  );
};

AnnualInspectorComplaintsSummary.getLayout = (page) => (
  <AdminLayout>{page}</AdminLayout>
);

export default AnnualInspectorComplaintsSummary;
