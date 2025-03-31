import React from "react";
import styles from "./Navbar.module.scss";
import { useRouter } from "next/router";

export default function Navbar() {
  const router = useRouter();

  const handleLoginClick = () => {
    window.open('/login', '_blank');
  };
  

  return (
    <div className={styles.navbarContainer}>
      <nav className={styles.navbar}>
        <div className={styles.logoGroup}>
          <img src="/logo.png" alt="ตราครุฑ" className={styles.logo} />
        </div>

        <div className={styles.menu}>
          <a href="#" className={styles.menuItem}>
            หน้าหลัก
          </a>
          <a href="#" className={styles.menuItem}>
            ขั้นตอนการแจ้งเรื่องร้องทุกข์
          </a>
          <a href="#" className={styles.menuItem}>
            ข่าวสาร
          </a>
          <a href="#" className={styles.menuItem}>
            คำถามที่พบบ่อย
          </a>
        </div>

        <div className={styles.buttonContainer}>
          <button className={styles.loginButton} onClick={handleLoginClick}>
            ลงชื่อเข้าใช้
          </button>
        </div>
      </nav>
    </div>
  );
}
