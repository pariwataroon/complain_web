import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import RequestResultProgress from "@components/ReceiveData/RequestResultProgress/RequestResultProgress";

const Requestresultorprogress = () => {
  return (
    <div>
      <RequestResultProgress />
    </div>
  );
};

Requestresultorprogress.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Requestresultorprogress;
