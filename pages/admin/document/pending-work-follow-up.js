import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";


const PendingWorkfollowup = () => {
  return <div>รายงานการติดตามงานค้าง</div>;
};

PendingWorkfollowup.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default PendingWorkfollowup;
