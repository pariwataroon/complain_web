import { useRouter } from "next/router";

const ComplaintDetail = () => {
  const { id } = useRouter().query;

  return <h1>รายละเอียดคำร้อง ID: {id}</h1>;
};

export default ComplaintDetail;
