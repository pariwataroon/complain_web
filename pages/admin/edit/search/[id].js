import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import ComplaintDetail from "@components/ReceiveData/SearchComplaints/ComplaintDetail";

const Search = () => {
  return (
    <div>
      <ComplaintDetail />
    </div>
  );
};

Search.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Search;
