import React, { useState, useRef, useEffect } from "react";
import styles from "./NavbarMain.module.scss";
import { useRouter } from "next/router";

export default function NavbarMain() {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDropdownOpen1, setDropdownOpen1] = useState(false); // สำหรับเมนู "ระเบียบขั้นตอน"
  const [isDropdownOpen2, setDropdownOpen2] = useState(false); // สำหรับเมนู "การรับเรื่องร้องทุกข์"
  const menuRef = useRef(null);
  const router = useRouter();

  const handleLoginClick = () => {
    router.push("/login");
  };

  const handleReportClick = () => {
    console.log("แจ้งเรื่องร้องทุกข์");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  // ปิดเมนูเมื่อคลิกนอก container
  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMobileMenuOpen(false);
      setDropdownOpen1(false);
      setDropdownOpen2(false);
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
          <img src="/logomain.png" alt="ตราครุฑ" className={styles.logo} />
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
                <button
                  className={styles.reportButton}
                  onClick={handleReportClick}
                >
                  แจ้งเรื่องร้องทุกข์
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={styles.menu}>
          <a href="/" className={styles.menuItem}>
            หน้าหลัก
          </a>
          <a href="#" className={styles.menuItem}>
            เกี่ยวกับ
          </a>
          <a
            href="#"
            className={`${styles.menuItem} ${styles.hasDropdown} ${
              isDropdownOpen1 ? styles.active : ""
            }`}
            onClick={() => setDropdownOpen1((prev) => !prev)}
          >
            ระเบียบขั้นตอน
            {isDropdownOpen1 && (
              <div className={styles.dropdownMenu}>
                <a href="#" className={styles.dropdownItem}>
                  ขั้นตอนที่ 1
                </a>
                <a href="#" className={styles.dropdownItem}>
                  ขั้นตอนที่ 2
                </a>
                <a href="#" className={styles.dropdownItem}>
                  ขั้นตอนที่ 3
                </a>
              </div>
            )}
          </a>

          <a
            href="#"
            className={`${styles.menuItem} ${styles.hasDropdown} ${
              isDropdownOpen2 ? styles.active : ""
            }`}
            onClick={() => setDropdownOpen2((prev) => !prev)}
          >
            การรับเรื่องร้องทุกข์
            {isDropdownOpen2 && (
              <div className={styles.dropdownMenu}>
                <a href="#" className={styles.dropdownItem}>
                  วิธีการรับเรื่อง 1
                </a>
                <a href="#" className={styles.dropdownItem}>
                  วิธีการรับเรื่อง 2
                </a>
              </div>
            )}
          </a>

          <a href="#" className={styles.menuItem}>
            ติดต่อเรา
          </a>
        </div>

        <div className={styles.buttonContainer}>
          <button className={styles.loginButton} onClick={handleLoginClick}>
            ลงชื่อเข้าใช้
          </button>
          <button className={styles.reportButton} onClick={handleReportClick}>
            แจ้งเรื่องร้องทุกข์
          </button>
        </div>
      </nav>
    </div>
  );
}
