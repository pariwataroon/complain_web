import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import SearchComplaints from "@components/ReceiveData/SearchComplaints/SearchComplaints";

const Search = () => {
  return (
      <SearchComplaints />
  );
};

Search.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Search;
