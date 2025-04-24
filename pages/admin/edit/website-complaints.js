import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";


const Websitecomplaints = () => {
  return <div>เรื่องราวร้องทุกข์ช่องทางเว็บไซต์</div>;
};

Websitecomplaints.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Websitecomplaints;
