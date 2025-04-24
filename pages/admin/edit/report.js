import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";


const Report = () => {
  return <div>รับเรื่องรายงานผลการพิจารณาจากหน่วยงาน</div>;
};

Report.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Report;
