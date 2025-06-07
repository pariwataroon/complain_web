import { useRouter } from "next/router";

const SendComplaintOPm = () => {
  const router = useRouter();
  const queryParams = router.query;

  return (
    <div>
      <h1>รายละเอียดคำร้อง</h1>
      <pre>{JSON.stringify(queryParams, null, 2)}</pre>
    </div>
  );
};

export default SendComplaintOPm;