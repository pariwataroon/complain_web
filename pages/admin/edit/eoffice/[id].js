import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import EOfficeDetail from "@components/ReceiveData/EOffice/EOfficeDetail";

const EOfficeDetailPage = () => {
  return (
    <div>
      <EOfficeDetail />
    </div>
  );
};

EOfficeDetailPage.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default EOfficeDetailPage;
