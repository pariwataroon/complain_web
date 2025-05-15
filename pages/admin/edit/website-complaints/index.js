import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import WebsiteComplaints from "@components/ReceiveData/WebsiteComplaints/WebsiteComplaints";

const Websitecomplaints = () => {
  return (
      <WebsiteComplaints />
  );
};

Websitecomplaints.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Websitecomplaints;
