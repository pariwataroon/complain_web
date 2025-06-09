import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useSearchParams } from 'next/navigation';
import DefineNewsComponents from "@components/HomePage/News/NewsComponents";
import NewDetails from "@components/HomePage/News/NewDetails";

const News = () => {
  const router = useRouter();
  const { method, id, title, content, url, pinTop, publish, expireDate, img } = router.query;

  const initialData = {
    title: title || '',
    content: content || '',
    url: url || '',
    pinTop: pinTop === 'true',
    publish: publish === 'true',
    expireDate: expireDate || '',
    images: img ? [img] : [],
  };

  useEffect(() => {
    const validMethods = ["New", "CreateNew", "EditNew"];

    if (router.isReady && !validMethods.includes(method)) {
      router.replace({
        pathname: "/admin/homepage/news",
        query: { method: "New" }
      });
    }
  }, [method, router]);

  if (!router.isReady || !method) return null;

  switch (method) {
    case "New":
      return <DefineNewsComponents />;
    case "CreateNew":
      return <NewDetails mode="create" />;
    case "EditNew":
      return <NewDetails mode="edit" initialData={initialData} />;
    default:
      return null;
  }
};

News.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default News;
