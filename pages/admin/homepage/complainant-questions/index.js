import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import ComplainantquestionsComponents from "@components/HomePage/Complainantquestions/ComplainantquestionsComponents";

const Complainantquestions = () => {
  return <ComplainantquestionsComponents/>
};

Complainantquestions.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Complainantquestions;
