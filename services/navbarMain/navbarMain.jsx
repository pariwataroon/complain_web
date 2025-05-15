import React, { useState, useRef, useEffect } from "react";
import Cookies from "js-cookie";
import styles from "./NavbarMain.module.scss";
import { useRouter } from "next/router";

export default function NavbarMain() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isMobileProfileDropdownOpen, setMobileProfileDropdownOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const profileRef = useRef(null);
  const menuRef = useRef(null);
  const router = useRouter();

  const handleLogin = () => {
    setIsLoggedIn(true);
    router.push("/login");
  };

  const handleReportClick = () => {
    router.push("/complaint");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const handleLogout = () => {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    Cookies.remove("info");
    Cookies.remove("permission_paths");
    setIsLoggedIn(false);
    setUserInfo(null);
    setMobileProfileDropdownOpen(false);
    setProfileDropdownOpen(false);
    router.push("/");
  };

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMobileMenuOpen(false);
    }
    if (profileRef.current && !profileRef.current.contains(event.target)) {
      setProfileDropdownOpen(false);
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

  useEffect(() => {
    const cookieInfo = Cookies.get("info");
    if (cookieInfo) {
      try {
        const parsedInfo = JSON.parse(cookieInfo);
        setUserInfo(parsedInfo);
        setIsLoggedIn(true);
      } catch (err) {
        console.error("Error parsing user info cookie:", err);
      }
    }
  }, []);

  const renderMobileButtons = () => {
    if (isLoggedIn && userInfo) {
      return (
        <div className={styles.mobileUserSection}>
          <div
            className={styles.mobileUserInfo}
            onClick={() => setMobileProfileDropdownOpen(!isMobileProfileDropdownOpen)}
          >
            <img
              src="/icons/userprofile.png"
              alt="โปรไฟล์ผู้ใช้"
              className={styles.profileImage}
            />
            <span className={styles.userGreeting}>
              สวัสดี คุณ {userInfo.first_name}
            </span>
            <span className={styles.dropdownArrow}>
              {isMobileProfileDropdownOpen ? "▲" : "▼"}
            </span>
          </div>

          {isMobileProfileDropdownOpen && (
            <div className={styles.mobileDropdownContent}>
              <button
                className={styles.dropdownItem}
                onClick={handleReportClick}
              >
                แจ้งเรื่องร้องทุกข์
              </button>
              <button
                className={styles.dropdownItem}
                onClick={handleLogout}
              >
                ออกจากระบบ
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={styles.mobileUserSection}>
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
      </div>
    );
  };

  const renderDesktopButtons = () => {
    if (isLoggedIn && userInfo) {
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
            <span className={styles.userGreeting}>
              สวัสดี คุณ {userInfo.first_name}
            </span>
            <span className={styles.dropdownArrow}>
              {isProfileDropdownOpen ? "▲" : "▼"}
            </span>
          </div>

          {isProfileDropdownOpen && (
            <div className={styles.profileDropdown}>
              <div className={styles.dropdownContent}>
                <button
                  className={styles.dropdownItem}
                  onClick={handleLogout}
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
                <a href="/" className={styles.mobileMenuItem}>
                  หน้าหลัก
                </a>
                <a href="#" className={styles.mobileMenuItem}>
                  ขั้นตอนการแจ้งเรื่องร้องทุกข์
                </a>
                <a href="#" className={styles.mobileMenuItem}>
                  ข่าวสาร
                </a>
                <a href="#" className={styles.mobileMenuItem}>
                  คำถามที่พบบ่อย
                </a>
                {renderMobileButtons()}
              </div>
            )}
          </div>
        </div>

        <div className={styles.menu}>
          <a href="/" className={styles.menuItem}>หน้าหลัก</a>
          <a href="#" className={styles.menuItem}>เกี่ยวกับ</a>
          <a href="#" className={styles.menuItem}>ระเบียบขั้นตอน</a>
          <a href="#" className={styles.menuItem}>การรับเรื่องร้องทุกข์</a>
          <a href="#" className={styles.menuItem}>ติดต่อเรา</a>
        </div>

        <div className={styles.buttonContainer}>
          {renderDesktopButtons()}
        </div>
      </nav>
    </div>
  );
}
