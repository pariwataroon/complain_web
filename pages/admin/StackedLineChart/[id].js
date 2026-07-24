import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import FollowComp from "@components/Box/ComplaintArchives/FollowComp/FollowComp";

const SearchID = () => {
  return (
    <div>
      <FollowComp />
    </div>
  );
};

SearchID.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;
export default SearchID;
