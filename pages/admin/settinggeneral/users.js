import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";

const Users = () => {
  return <div> กำหนดผู้ใช้งาน</div>
};

Users.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Users;
