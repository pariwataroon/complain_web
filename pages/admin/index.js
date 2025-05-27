import { useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";

const Admin = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/dashboard");
  }, [router]);

  return null;
};

Admin.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Admin;