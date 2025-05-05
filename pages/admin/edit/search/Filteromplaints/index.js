import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import Filteromplaints from "@components/ReceiveData/Filteromplaints/Filteromplaints";

const Search = () => {
  return (
      <Filteromplaints />
  );
};

Search.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Search;
