import { useEffect, useState } from "react";
import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import AnonymousLetterRepository from "@components/Box/AnonymousLetterRepository/AnonymousLetterRepository";
import AnonymousLetterRepository_department from "@components/Box/AnonymousLetterRepository_department/AnonymousLetterRepository";
import { showLoading, closeAlert } from "@utils/Alerts";

const New = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [roles, setRoles] = useState([]);

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

  if (["admin", "staff", "supervisor"].some((r) => roles.includes(r))) {
    return <AnonymousLetterRepository />;
  }

  if (roles.includes("department")) {
    return <AnonymousLetterRepository_department />;
  }

  return <div>ไม่ได้รับอนุญาตให้เข้าถึง</div>;
};

New.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default New;