import React, { useState, useRef, useEffect } from "react";
import styles from "./Navbar.module.scss";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import MobileModal from "./MobileModal";

export default function Navbar() {
  const [isMobileModalOpen, setMobileModalOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
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

  const toggleMobileModal = () => {
    setMobileModalOpen((prev) => !prev);
  };

  const closeMobileModal = () => {
    setMobileModalOpen(false);
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

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isMobileModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileModalOpen]);

  return (
    <>
      <div className={styles.navbarContainer}>
        <nav className={styles.navbar}>
          <div className={styles.logoGroup}>
            <img src="/logo.png" alt="ตราครุฑ" className={styles.logo} />
            <div className={styles.hamburger} onClick={toggleMobileModal}>
              <div className={styles.bar}></div>
              <div className={styles.bar}></div>
              <div className={styles.bar}></div>
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

      {/* Mobile Modal */}
      <MobileModal
        isOpen={isMobileModalOpen}
        onClose={closeMobileModal}
        userInfo={userInfo}
        onLoginClick={handleLoginClick}
        onComplaintClick={handleComplaintClick}
        onFollowUpClick={handleFollowUpClick}
      />
    </>
  );
}