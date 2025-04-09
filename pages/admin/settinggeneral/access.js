import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";

const Access = () => {
  return <div> กำหนดสิทธิ์การเข้าถึง</div>
};

Access.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Access;
