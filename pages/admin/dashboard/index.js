import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import DashboardComponents_Main from "@components/Dashboard/DashboardComponents_Main";
import DashboardComponents_Home from "@components/Dashboard/DashboardComponents_Home";
import Cookies from "js-cookie";

const Dashboard = () => {
  const router = useRouter();
  const [component, setComponent] = useState(null);

  useEffect(() => {
    const cookieValue = Cookies.get("info");
    if (cookieValue) {
      try {
        const parsed = JSON.parse(cookieValue);
        const roles = parsed.roles || [];

        switch (true) {
          case roles.includes("admin" || "staff" || "supervisor" || "department"):
            setComponent(<DashboardComponents_Main />);
            break;
          case roles.includes("admin_home"):
            setComponent(<DashboardComponents_Home />);
            break;
        }
      } catch (err) {
        console.error("Error parsing cookie:", err);
        setComponent(<div>เกิดข้อผิดพลาดในการอ่านข้อมูลผู้ใช้</div>);
      }
    } else {
      setComponent(<div>ไม่พบข้อมูลผู้ใช้</div>);
    }
  }, []);

  return component || <div>กำลังโหลด...</div>;
};

Dashboard.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default Dashboard;
