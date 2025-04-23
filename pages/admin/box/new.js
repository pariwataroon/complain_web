import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";


const New = () => {
  return <div>คลังบัตรสนเท่ห์</div>;
};

New.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default New;
