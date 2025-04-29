import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";

const Dashboard = () => {
  return <div>dashboard</div>;
};

Dashboard.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Dashboard;
