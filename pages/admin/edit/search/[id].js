import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import ComplaintDetail from "@components/ReceiveData/SearchComplaints/ComplaintDetail";

const SearchID = () => {
  return (
    <div>
      <ComplaintDetail />
    </div>
  );
};

SearchID.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default SearchID;
