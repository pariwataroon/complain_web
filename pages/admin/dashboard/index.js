import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import DashboardComponents_Main from "@components/Dashboard/DashboardComponents_Main";
import DashboardComponents_Home from "@components/Dashboard/DashboardComponents_Home";

const Dashboard = ({ roles }) => {
  if (!roles?.length) {
    return <div>ไม่พบข้อมูลผู้ใช้</div>;
  }

  if (
    ["admin", "staff", "supervisor", "department"].some((r) =>
      roles.includes(r)
    )
  ) {
    return <DashboardComponents_Main />;
  }

  if (roles.includes("admin_home")) {
    return <DashboardComponents_Home />;
  }

  return <div>ไม่ได้รับอนุญาตให้เข้าถึง</div>;
};

Dashboard.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Dashboard;

export async function getServerSideProps(context) {
  const { req } = context;
  const cookie = req.cookies?.info || null;
  let roles = [];

  if (cookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(cookie));
      if (typeof parsed.roles === "string") {
        roles = JSON.parse(parsed.roles);
      } else if (Array.isArray(parsed.roles)) {
        roles = parsed.roles;
      }
    } catch (err) {
      console.error("Error parsing cookie or roles:", err);
    }
  }

  return {
    props: { roles },
  };
}