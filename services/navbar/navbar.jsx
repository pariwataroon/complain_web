import React, { useState, useRef, useEffect } from "react";
import styles from "./Navbar.module.scss";
import { useRouter } from "next/router";

export default function Navbar() {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();

  const handleLoginClick = () => {
    router.push("/login");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  // ปิดเมนูเมื่อคลิกนอก container
  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

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

        {/* Mobile Menu Container สำหรับจัดตำแหน่ง */}
        <div className={styles.mobileMenuContainer} ref={menuRef}>
          <div className={styles.hamburger} onClick={toggleMobileMenu}>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
          </div>
          {isMobileMenuOpen && (
            <div className={styles.mobileMenu}>
              <a
                href="#"
                className={styles.mobileMenuItem}
                onClick={() => setMobileMenuOpen(false)}
              >
                หน้าหลัก
              </a>
              <a
                href="#"
                className={styles.mobileMenuItem}
                onClick={() => setMobileMenuOpen(false)}
              >
                ขั้นตอนการแจ้งเรื่องร้องทุกข์
              </a>
              <a
                href="#"
                className={styles.mobileMenuItem}
                onClick={() => setMobileMenuOpen(false)}
              >
                ข่าวสาร
              </a>
              <a
                href="#"
                className={styles.mobileMenuItem}
                onClick={() => setMobileMenuOpen(false)}
              >
                คำถามที่พบบ่อย
              </a>
              <button
                className={styles.mobileLoginButton}
                onClick={() => {
                  handleLoginClick();
                  setMobileMenuOpen(false);
                }}
              >
                ลงชื่อเข้าใช้
              </button>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
