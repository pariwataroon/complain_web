import React from "react";
import styles from "./LoginPage.module.scss";

export default function LoginPage() {
  const handleClick = () => {
    alert(`เข้าสู่ระบบด้วย `);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>ยินดีต้อนรับ</h1>
      <div className={styles.buttonWrapper}>
        <div className={styles.card} onClick={() => handleClick("ThaiID")}>
          <img src="/logo_ThaID.png" alt="ThaiID"/>
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
