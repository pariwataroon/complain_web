import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import WebsiteComplaints from "@components/ReceiveData/WebsiteComplaints/WebsiteComplaints";

const Websitecomplaints = () => {
  return null;
};

Websitecomplaints.getLayout = () => (
  <AdminLayout>
    <WebsiteComplaints />
  </AdminLayout>
);

export default Websitecomplaints;
