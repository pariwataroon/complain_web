import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import EOfficeComplaints from "@components/ReceiveData/EOffice/EOfficeComplaints";

const EOffice = () => {
  return (
    <div>
      <EOfficeComplaints />
    </div>
  );
};

EOffice.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default EOffice;
