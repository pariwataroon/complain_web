import { useEffect, useState } from "react";
import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import AnonymousLetterRepository from "@components/Box/AnonymousLetterRepository/AnonymousLetterRepository";
import AnonymousLetterRepository_department from "@components/Box/AnonymousLetterRepository_department/AnonymousLetterRepository";


import { showLoading, closeAlert } from "@utils/Alerts";

const New = ({ roles }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    showLoading("กำลังโหลด...");

    const timer = setTimeout(() => {
      closeAlert();
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

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
