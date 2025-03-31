import React from "react";
import { useRouter } from "next/router";
import styles from "./LoginPage.module.scss";

export default function LoginPage() {
  const router = useRouter();

  const handleClick = (method) => {
    router.push({
      pathname: "/register",
      query: { method },
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.logoWrapper}>
        <img src="/logo_No_text.png" alt="การคลัง" className={styles.logo} />
      </div>
      <h1 className={styles.title}>ยินดีต้อนรับ</h1>
      <div className={styles.buttonWrapper}>
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
