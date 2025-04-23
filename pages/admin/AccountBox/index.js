import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";

const AccountBox = () => {
  return <div>สถิติการทำงานของเจ้าหน้าที่</div>;
};

AccountBox.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default AccountBox;
