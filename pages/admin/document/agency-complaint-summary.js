import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import AgencyComplaintSummaryComponent from "@components/Report/AgencyComplaintSummaryComponent/AgencyComplaintSummaryComponent";

const AgencyComplaintSummary = () => {
  return (
    <div>
      <AgencyComplaintSummaryComponent />
    </div>
  );
};

AgencyComplaintSummary.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default AgencyComplaintSummary;
