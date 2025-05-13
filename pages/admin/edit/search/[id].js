import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import ComplaintDetail from "@components/ReceiveData/SearchComplaints/ComplaintDetail";

const SearchID = () => {
  return (
      <ComplaintDetail />
  );
};

SearchID.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default SearchID;


