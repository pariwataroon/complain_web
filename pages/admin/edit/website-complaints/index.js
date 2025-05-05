import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import WebsiteComplaints from "@components/ReceiveData/WebsiteComplaints/WebsiteComplaints";

const Websitecomplaints = () => {
  return (
    <div>
      <WebsiteComplaints />
    </div>
  );
};

Websitecomplaints.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Websitecomplaints;
