import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";

const Department = () => {
  return <div> กำหนดหน่วยงานในสังกัด</div>
};

Department.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Department;
