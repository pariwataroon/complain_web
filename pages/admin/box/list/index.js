import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import ComplaintArchives from "@components/Box/ComplaintArchives/ComplaintArchives";

const List = () => {
  return (
    <div>
      <ComplaintArchives />
    </div>
  );
};

List.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default List;
