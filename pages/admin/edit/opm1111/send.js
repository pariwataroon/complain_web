import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import SendComplaintOPM from "@components/ReceiveData/Opm1111/SendComplaintOPm";

const Send = () => {
  return null;
};

Send.getLayout = () => (
  <AdminLayout>
    <SendComplaintOPM />
  </AdminLayout>
);

export default Send;