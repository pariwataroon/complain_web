import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import FollowComp from "@components/Box/AnonymousLetterRepository/FollowComp/FollowComp";

const List = () => {
  return (
    <div>
      <FollowComp />
    </div>
  );
};

List.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default List;
