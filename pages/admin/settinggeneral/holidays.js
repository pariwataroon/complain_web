import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import HolidaysComponent from "@components/GeneralUsageMenu/Holidays/HolidaysComponent";

const Holidays = () => {
  return <HolidaysComponent />;
};

Holidays.getLayout = (page) => <AdminLayout backgroundColor="#e7f1ff">{page}</AdminLayout>;

export default Holidays;
