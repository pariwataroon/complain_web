import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import InformRelatedParties from "@components/ReceiveData/InformRelatedParties/InformRelatedParties";

const Informrelatedparties = () => {
  return (
    <div>
      <InformRelatedParties />
    </div>
  );
};

Informrelatedparties.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Informrelatedparties;
