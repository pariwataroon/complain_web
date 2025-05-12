import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import NewAdditionalComplaintsSummaryComponents from "@components/Report/NewAdditionalComplaintsSummaryComponents/NewAdditionalComplaintsSummaryComponents";

const NewAdditionalComplaintsSummary = () => {
  return (
    <div>
      <NewAdditionalComplaintsSummaryComponents />
    </div>
  );
};

NewAdditionalComplaintsSummary.getLayout = (page) => (
  <AdminLayout>{page}</AdminLayout>
);

export default NewAdditionalComplaintsSummary;
