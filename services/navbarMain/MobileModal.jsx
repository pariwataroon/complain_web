import React from "react";
import styles from "./MobileModal.module.scss";

export default function MobileModal({
  isOpen,
  onClose,
  userInfo,
  onLoginClick,
  onComplaintClick,
  onFollowUpClick,
  onAdminClick,
  onLogoutClick,
  isAdminUser
}) {
  if (!isOpen) return null;

  const handleStepsClick = () => {
    const stepsSection = document.getElementById('steps-section');
    if (stepsSection) {
      stepsSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
    onClose();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        {/* Header with close button */}
        <div className={styles.modalHeader}>
          <img src="/logo.png" alt="ตราครุฑ" className={styles.modalLogo} />
          <button className={styles.closeButton} onClick={onClose}>
            <div className={styles.closeIcon}>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className={styles.modalNav}>
          <a href="/" className={styles.modalNavItem} onClick={onClose}>
            หน้าหลัก
          </a>
          <a href="#steps-section" className={styles.modalNavItem} onClick={handleStepsClick}>
            ขั้นตอนการแจ้งเรื่องร้องทุกข์
          </a>
          <a href="#" className={styles.modalNavItem} onClick={onClose}>
            ข่าวสาร
          </a>
          <a href="#" className={styles.modalNavItem} onClick={onClose}>
            คำถามที่พบบ่อย
          </a>
        </nav>

        {/* User Section */}
        <div className={styles.modalUserSection}>
          {userInfo ? (
            <div className={styles.modalUserInfo}>
              <div className={styles.userWelcome}>
                <img
                  src="/icons/userprofile.png"
                  alt="โปรไฟล์ผู้ใช้"
                  className={styles.modalProfileImage}
                />
                <span className={styles.welcomeText}>
                  สวัสดี คุณ {userInfo.first_name}
                </span>
              </div>
              <div className={styles.modalButtonGroup}>
                {/* ✅ เพิ่มปุ่ม Admin ถ้าเป็น admin user */}
                {isAdminUser && (
                  <button
                    className={styles.modalAdminButton}
                    onClick={() => {
                      onAdminClick();
                      onClose();
                    }}
                  >
                    จัดการระบบ
                  </button>
                )}

                <button
                  className={styles.modalComplaintButton}
                  onClick={() => {
                    onComplaintClick();
                    onClose();
                  }}
                >
                  แจ้งเรื่องร้องทุกข์
                </button>
                <button
                  className={styles.modalFollowupButton}
                  onClick={() => {
                    onFollowUpClick();
                    onClose();
                  }}
                >
                  ติดตามผล
                </button>

                {/* ✅ เพิ่มปุ่ม Logout */}
                <button
                  className={styles.modalLogoutButton}
                  onClick={() => {
                    onLogoutClick();
                    onClose();
                  }}
                >
                  ออกจากระบบ
                </button>
              </div>
            </div>
          ) : (
            <button
              className={styles.modalLoginButton}
              onClick={() => {
                onLoginClick();
                onClose();
              }}
            >
              ลงชื่อเข้าใช้
            </button>
          )}
        </div>
      </div>
    </div>
  );
}