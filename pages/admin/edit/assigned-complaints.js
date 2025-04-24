import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";


const Assignedcomplaints = () => {
  return <div>เรื่องร้องเรียนที่ได้รับมอบหมาย</div>;
};

Assignedcomplaints.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Assignedcomplaints;
