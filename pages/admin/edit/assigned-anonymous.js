import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";


const Assignedanonymous = () => {
  return <div>บัตรสนเท่ห์ที่ได้รับมอบหมาย</div>;
};

Assignedanonymous.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Assignedanonymous;
