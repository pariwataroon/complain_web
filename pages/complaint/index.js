import { useEffect } from "react";
import { useRouter } from "next/router";
import { alertWarning } from "@utils/Alerts";
import Cookies from "js-cookie";
import ComplaintComponent from "@components/Complaint/ComplaintComponent";

export default function Complaint() {
  const router = useRouter();

  useEffect(() => {
    const accessToken = Cookies.get("access_token");
    const refreshToken = Cookies.get("refresh_token");
    const info = Cookies.get("info");

    if (!accessToken || !refreshToken || !info) {
     alertWarning(
       "กรุณาเข้าสู่ระบบ",
       "กรุณาเข้าสู่ระบบก่อนใช้งาน"
     ).then(() => {
       router.push("/login");
     });
    }
  }, [router]);

  return <ComplaintComponent />;
}