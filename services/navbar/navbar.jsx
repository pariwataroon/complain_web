import React, { useState, useRef, useEffect } from "react";
import styles from "./Navbar.module.scss";
import { useRouter } from "next/router";
import Cookies from "js-cookie";

export default function Navbar() {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const menuRef = useRef(null);
  const router = useRouter();

  const handleLoginClick = () => {
    router.push("/login");
  };

  const handleComplaintClick = () => {
    router.push("/complaint");
  };
  const handleFollowUpClick = () => {
    router.push("/followup");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    const cookieInfo = Cookies.get("info");
    if (cookieInfo) {
      try {
        const parsedInfo = JSON.parse(cookieInfo);
        setUserInfo(parsedInfo);
      } catch (err) {
        console.error("Error parsing user info cookie:", err);
      }
    }
  }, []);


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
          <div className={styles.mobileMenuContainer} ref={menuRef}>
            <div className={styles.hamburger} onClick={toggleMobileMenu}>
              <div className={styles.bar}></div>
              <div className={styles.bar}></div>
              <div className={styles.bar}></div>
            </div>
            {isMobileMenuOpen && (
              <div className={styles.mobileMenu}>
                <a
                  href="/"
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
                {userInfo ? (
                  <div className={styles.mobileLoginInfo}>
                    <img
                      src="/icons/userprofile.png"
                      alt="โปรไฟล์ผู้ใช้"
                      className={styles.profileImage}
                    />
                    สวัสดี คุณ {userInfo.first_name} 
                    <button className={styles.complaintButton} onClick={handleComplaintClick}>
                      แจ้งเรื่องร้องทุกข์
                    </button>
                    <button className={styles.followupButton} onClick={handleFollowUpClick}>
                      ติดตามผล
                    </button>
                  </div>
                ) : (
                  <button
                    className={styles.mobileLoginButton}
                    onClick={() => {
                      handleLoginClick();
                      setMobileMenuOpen(false);
                    }}
                  >
                    ลงชื่อเข้าใช้
                  </button>
                )}

              </div>
            )}
          </div>
        </div>

        <div className={styles.menu}>
          <a href="/" className={styles.menuItem}>
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
          {userInfo ? (
            <div className={styles.userDisplay}>
              <img
                src="/icons/userprofile.png"
                alt="โปรไฟล์ผู้ใช้"
                className={styles.profileImage}
              />
              <span>
                สวัสดี คุณ {userInfo.first_name}
              </span>
              <button className={styles.complaintButton} onClick={handleComplaintClick}>
                แจ้งเรื่องร้องทุกข์
              </button>
              <button className={styles.followupButton} onClick={handleFollowUpClick}>
                ติดตามผล
              </button>
            </div>
          ) : (
            <button className={styles.loginButton} onClick={handleLoginClick}>
              ลงชื่อเข้าใช้
            </button>
          )}
        </div>


      </nav>
    </div>
  );
}
