import React from "react";
import Image from "next/image";
import styles from "./Navbar.module.css";

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarContent}>
        <div className={styles.logoSection}>
          <Image
            src="/logo.png"
            alt="Department Emblem"
            width={200}
            height={200}
            className={styles.logo}
          />
        </div>
        <div className={styles.navLinks}>
          <a href="#" className={styles.navLink}>
            หน้าแรก
          </a>
          <a href="#" className={styles.navLink}>
            บันทึกการร้องเรียน
          </a>
          <a href="#" className={styles.navLink}>
            บริการ
          </a>
          <a href="#" className={styles.navLink}>
            กรณีที่สนใจ
          </a>
          <a href="#" className={styles.navLink}>
            คู่มือการใช้งาน
          </a>
        </div>
        <div className={styles.actionButton}>
          <button className={styles.loginButton}>ลงชื่อเข้าใช้</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
