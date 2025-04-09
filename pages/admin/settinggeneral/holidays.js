import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";

const Holidays = () => {
  return <div>กำหนดวันหยุด</div>
};

Holidays.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Holidays;
