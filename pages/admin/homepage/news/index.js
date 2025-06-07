import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import DefineNewsComponents from "@components/HomePage/News/NewsComponents";

const News = () => {
  return <DefineNewsComponents/>;
};

News.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default News;
