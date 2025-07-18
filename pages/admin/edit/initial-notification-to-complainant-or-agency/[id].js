import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import InitialNotificationComplainantAgency from "@components/ReceiveData/InitialNotificationComplainantAgency/InitialNotificationComplainantAgency";

const Initialnotificationtocomplainantoragency = () => {
  return (
    <div>
      <InitialNotificationComplainantAgency />
    </div>
  );
};

Initialnotificationtocomplainantoragency.getLayout = (page) => (
  <AdminLayout>{page}</AdminLayout>
);

export default Initialnotificationtocomplainantoragency;
