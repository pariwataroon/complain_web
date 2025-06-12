import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import { useEffect } from "react";
import { useRouter } from "next/router";
import DefineNewsComponents from "@components/HomePage/News/NewsComponents";
import NewsDetails from "@components/HomePage/News/NewsDetails";

const News = () => {
  const router = useRouter();
  const { method } = router.query;

  useEffect(() => {
    const validMethods = ["New", "CreateNew", "EditNew"];
    if (router.isReady && !validMethods.includes(method)) {
      router.replace({
        pathname: "/admin/homepage/news",
        query: { method: "New" },
      });
    }
  }, [method, router]);

  if (!router.isReady || !method) return null;

  switch (method) {
    case "New":
      return <DefineNewsComponents />;
    case "CreateNew":
      return <NewsDetails mode="create" />;
    case "EditNew":
      return <NewsDetails mode="edit" />;
    default:
      return null;
  }
};

News.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default News;
