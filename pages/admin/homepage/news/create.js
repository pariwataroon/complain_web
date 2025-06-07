import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import NewDetails from "@components/HomePage/News/NewDetails";

export default function CreateNewsPage() {
  return <NewDetails mode="create" />
}

CreateNewsPage.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;