import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import DashboardComponents_Main from "@components/Dashboard/DashboardComponents_Main";
import DashboardComponents_Home from "@components/Dashboard/DashboardComponents_Home";
import { showLoading, closeAlert } from "@utils/Alerts";

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const router = useRouter();

  useEffect(() => {
    showLoading("กำลังโหลด...");

    const getUserRoles = () => {
      try {
        const cookies = document.cookie.split(";").reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split("=");
          if (key && value) {
            acc[key] = value;
          }
          return acc;
        }, {});

        const infoCookie = cookies.info;

        if (infoCookie) {
          const parsed = JSON.parse(decodeURIComponent(infoCookie));
          let userRoles = [];

          if (typeof parsed.roles === "string") {
            userRoles = JSON.parse(parsed.roles);
          } else if (Array.isArray(parsed.roles)) {
            userRoles = parsed.roles;
          }

          return userRoles;
        } else {
        }
      } catch (err) {
        console.error("Error parsing cookie or roles:", err);
      }

      return [];
    };

    const userRoles = getUserRoles();
    setRoles(userRoles);

    const timer = setTimeout(() => {
      closeAlert();
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <div>กำลังโหลด...</div>;
  }

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
