import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import SearchComplaints from "@components/ReceiveData/AssignedComplaintsComponents/SearchComplaints";

const SearchID = () => {
  return (
    <div>
      <SearchComplaints />
    </div>
  );
};

SearchID.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default SearchID;
