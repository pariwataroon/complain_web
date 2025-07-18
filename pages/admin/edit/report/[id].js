import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import ReceiveReportsAgencies from "@components/ReceiveData/ReceiveReportsAgencies/ReceiveReportsAgencies";

const Report = () => {
  return (
    <div>
      <ReceiveReportsAgencies />
    </div>
  );
};

Report.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Report;
