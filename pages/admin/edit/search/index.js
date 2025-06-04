import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import SearchComplaints from "@components/ReceiveData/SearchComplaints/SearchComplaints";

const Search = () => {
  return null;
};

Search.getLayout = () => (
  <AdminLayout>
    <SearchComplaints />
  </AdminLayout>
);

export default Search;