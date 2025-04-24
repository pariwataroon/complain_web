import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import SetRole from "@components/GeneralUsageMenu/SetRole/SetRole";

const Access = () => {
  return (
    <div>
      <SetRole />
    </div>
  );
};

// แก้ไขให้ใช้ getLayout สำหรับการกำหนด layout ของเพจ
Access.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Access;
