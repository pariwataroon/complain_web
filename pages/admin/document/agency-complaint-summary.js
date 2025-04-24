import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";


const AgencyComplaintSummary = () => {
  return <div>รายงานสรุปเรื่องร้องเรียนของหน่วยงาน</div>;
};

AgencyComplaintSummary.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default AgencyComplaintSummary;
