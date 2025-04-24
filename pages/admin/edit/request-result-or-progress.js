import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";


const Requestresultorprogress = () => {
  return <div>แบบรายงานขอทราบผลการพิจารณาหรือผลความคืบหน้า</div>;
};

Requestresultorprogress.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Requestresultorprogress;
