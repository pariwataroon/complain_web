import { useRouter } from "next/router";

const SearchComplaints = () => {
  const { id } = useRouter().query; // ดึงค่าจาก slug

  return <h1>รายละเอียดคำร้อง ID: {id}</h1>;
};

export default SearchComplaints;
