import React from "react";
import styles from "./Navbar.module.scss";

export default function Navbar() {
  return (
    <div className={styles.navbarContainer}>
      <nav className={styles.navbar}>
        {/* Left side - Logo and text */}
        <div className={styles.logoGroup}>
          <img src="/logo.png" alt="ตราครุฑ" className={styles.logo} />
        </div>

        {/* Center - Menu items */}
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

        {/* Right side - Login button */}
        <div className={styles.buttonContainer}>
          <button className={styles.loginButton}>ลงชื่อเข้าใช้</button>
        </div>
      </nav>
    </div>
  );
}
