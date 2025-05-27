import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import ForwardtoagencyComponents from "@components/ReceiveData/ForwardtoagencyComponents/ForwardtoagencyComponents";

const Forwardtoagency = () => {
  return (
    <div>
      <ForwardtoagencyComponents />
    </div>
  );
};

Forwardtoagency.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Forwardtoagency;
