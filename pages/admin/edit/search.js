import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";


const Search = () => {
  return <div>สืบค้นเรื่องร้องเรียน</div>;
};

Search.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Search;
