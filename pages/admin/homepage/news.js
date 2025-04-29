import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";


const News = () => {
  return <div>กำหนดข่าวสาร</div>;
};

News.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default News;
