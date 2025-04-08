import React, { useState, useRef, useEffect } from "react";
import styles from "./NavbarMain.module.scss";
import { useRouter } from "next/router";

export default function NavbarMain() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileRef = useRef(null);
  const menuRef = useRef(null);
  const router = useRouter();

  const handleLogin = () => {
    setIsLoggedIn(true);
    router.push("/");
  };

  const handleReportClick = () => {
    console.log("แจ้งเรื่องร้องทุกข์");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMobileMenuOpen(false);
    }
    if (profileRef.current && !profileRef.current.contains(event.target)) {
      setProfileDropdownOpen(false);
    }
  };
  const handleLogout = () => {
    setIsLoggedIn(false);
    setProfileDropdownOpen(false);
    router.push("/login");
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

  const renderMobileButtons = () => {
    if (isLoggedIn) {
      return (
        <div className={styles.mobileUserSection}>
          <span className={styles.userGreeting}>สวัสดิ์ คุณณภัทร</span>
          <button
            className={`${styles.reportButton} ${styles.loggedIn}`}
            onClick={handleReportClick}
          >
            แจ้งเรื่องร้องทุกข์
          </button>
        </div>
      );
    }
    return (
      <>
        <button
          className={styles.mobileLoginButton}
          onClick={() => {
            handleLogin();
            setMobileMenuOpen(false);
          }}
        >
          ลงชื่อเข้าใช้
        </button>
        <button className={styles.reportButton} onClick={handleReportClick}>
          แจ้งเรื่องร้องทุกข์
        </button>
      </>
    );
  };

  const renderDesktopButtons = () => {
    if (isLoggedIn) {
      return (
        <div className={styles.userSection} ref={profileRef}>
          <div
            className={styles.userInfoContainer}
            onClick={() => setProfileDropdownOpen(!isProfileDropdownOpen)}
          >
            <img
              src="/icons/userprofile.png"
              alt="โปรไฟล์ผู้ใช้"
              className={styles.profileImage}
            />
            <span className={styles.userGreeting}>สวัสดิ์ คุณณภัทร</span>
            <span className={styles.dropdownArrow}>
              {isProfileDropdownOpen ? "▲" : "▼"}
            </span>
          </div>

          {isProfileDropdownOpen && (
            <div className={styles.profileDropdown}>
              <div className={styles.dropdownContent}>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    handleLogout();
                    setProfileDropdownOpen(false);
                  }}
                >
                  ออกจากระบบ
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }
    return (
      <div className={styles.authButtons}>
        <button className={styles.loginButton} onClick={handleLogin}>
          ลงชื่อเข้าใช้
        </button>
        <button className={styles.reportButton} onClick={handleReportClick}>
          แจ้งเรื่องร้องทุกข์
        </button>
      </div>
    );
  };

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
                {renderMobileButtons()}
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
          <a href="#" className={styles.menuItem}>
            ระเบียบขั้นตอน
          </a>

          <a href="#" className={styles.menuItem}>
            การรับเรื่องร้องทุกข์
          </a>

          <a href="#" className={styles.menuItem}>
            ติดต่อเรา
          </a>
        </div>

        <div className={styles.buttonContainer}>{renderDesktopButtons()}</div>
      </nav>
    </div>
  );
}
