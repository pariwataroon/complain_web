import React from "react";
import styles from "./LoginPage.module.scss";

export default function CardIDPage() {
  const handleClick = (method) => {
    alert(`เข้าสู่ระบบด้วย ${method}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.logoWrapper}>
        <img src="/logo_No_text.png" alt="การคลัง" className={styles.logo} />
      </div>
      <h1 className={styles.title}>ยินดีต้อนรับ CardIDPage</h1>
      <div className={styles.buttonWrapper}>
        <div className={styles.card} onClick={() => handleClick("ThaID")}>
          <img src="/logo_ThaID.png" alt="ThaID"/>
          <div>เข้าสู่ระบบด้วย ThaID</div>
        </div>
        <div className={styles.divider} />
        <div className={styles.card} onClick={() => handleClick("บัตรประชาชน")}>
          <img src="/logo_card.png" alt="บัตรประชาชน" />
          <div>เข้าสู่ระบบด้วยเลขบัตรประชาชน</div>
        </div>
      </div>
    </div>
  );
}
