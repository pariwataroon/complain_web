import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import FollowStatus from "@components/Report/StatusTrackingReport/FollowStatus";

const SearchID = () => {
  return (
      <FollowStatus />
  );
};

SearchID.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default SearchID;