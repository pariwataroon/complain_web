import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { IconButton } from "@mui/material";
import styles from "./LoginPage.module.scss";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { alertWarning } from "@utils/Alerts";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (router.query.error === "token_expired") {
      alertWarning(
        "หมดเวลา",
        "Token ของคุณหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง"
      );

      const { error, ...queryWithoutError } = router.query;
      router.replace({
        pathname: router.pathname,
        query: queryWithoutError,
      }, undefined, { shallow: true });
    }
  }, [router.query.error]);

  const handleClick = (method) => {
    router.push({
      pathname: "/register",
      query: { method },
    });
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  return (
    <div className={styles.container}>
      <div className={styles.logoWrapper}>
        <img src="/logo_No_text.png" alt="การคลัง" className={styles.logo} />
      </div>
      <h1 className={styles.title}>ยินดีต้อนรับ</h1>
      <div className={styles.buttonWrapper}>
        <IconButton
          onClick={handleBackToHome}
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            color: "grey.600",
          }}
        >
          <ArrowBackIosNewIcon />
        </IconButton>
        <div className={styles.card} onClick={() => handleClick("ThaID")}>
          <img src="/logo_ThaID.png" alt="ThaID" />
          <div>เข้าสู่ระบบด้วย ThaID</div>
        </div>
        <div className={styles.divider} />
        <div className={styles.card} onClick={() => handleClick("CardID")}>
          <img src="/logo_card.png" alt="บัตรประชาชน" />
          <div>เข้าสู่ระบบด้วยเลขบัตรประชาชน</div>
        </div>
      </div>
    </div>
  );
}