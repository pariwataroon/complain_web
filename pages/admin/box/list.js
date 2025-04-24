import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";


const List = () => {
  return <div>คลังเรื่องราวร้องทุกข์</div>;
};

List.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default List;
