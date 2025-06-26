import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import Opm1111Components from "@components/ReceiveData/Opm1111/Opm1111";

const Opm1111 = () => {
  return (
    <div>
      <Opm1111Components />
    </div>
  );
};

Opm1111.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Opm1111;
