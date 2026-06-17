import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import SendComplaintEOffice from "@components/ReceiveData/EOffice/SendComplaintEOffice";

const Send = () => {
  return (
    <div>
      <SendComplaintEOffice />
    </div>
  );
};

Send.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Send;
