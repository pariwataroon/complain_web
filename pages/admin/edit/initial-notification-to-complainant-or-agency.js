import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";


const Initialnotificationtocomplainantoragency = () => {
  return (
    <div>
      แบบรายงานแจ้งผู้ร้องเรียนหรือส่วนราชการที่ส่งเรื่องมากระทรวงทราบเบื้องต้น
    </div>
  );
};

Initialnotificationtocomplainantoragency.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Initialnotificationtocomplainantoragency;
