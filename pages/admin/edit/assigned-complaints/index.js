import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import AssignedComplaintsComponents from "@components/ReceiveData/AssignedComplaintsComponents/AssignedComplaintsComponents";

const Assignedcomplaints = () => {
  return (
    <div>
      <AssignedComplaintsComponents />
    </div>
  );
};

Assignedcomplaints.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Assignedcomplaints;
