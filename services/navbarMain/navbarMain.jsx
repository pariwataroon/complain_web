import React, { useState, useRef, useEffect } from "react";
import Cookies from "js-cookie";
import styles from "./NavbarMain.module.scss";
import { useRouter } from "next/router";
import MobileModal from "./MobileModal";
import { showConfirm, alertSuccess, alertError } from "@utils/Alerts.js";

export default function NavbarMain() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileModalOpen, setMobileModalOpen] = useState(false);
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const profileRef = useRef(null);
  const router = useRouter();

  const handleLogin = () => {
    router.push("/login");
  };

  const handleComplaintClick = () => {
    router.push("/complaint");
  };

  const handleFollowUpClick = () => {
    router.push("/followup");
  };

  const handleAdminClick = () => {
    router.push("/admin/dashboard");
  };

  const toggleMobileModal = () => {
    setMobileModalOpen((prev) => !prev);
  };

  const closeMobileModal = () => {
    setMobileModalOpen(false);
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm(
      "ออกจากระบบ",
      "คุณต้องการออกจากระบบหรือไม่?",
      "ออกจากระบบ",
      "ยกเลิก"
    );

    if (confirmed) {
      try {
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        Cookies.remove("info");
        Cookies.remove("permission_paths");
        setUserInfo(null);
        setIsDropdownOpen(false);

        await alertSuccess("สำเร็จ", "ออกจากระบบเรียบร้อยแล้ว");
        router.push("/");
      } catch (error) {
        console.error("Logout error:", error);
        await alertError(
          "ข้อผิดพลาด",
          "ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง"
        );
      }
    }
  };

  const isAdminUser = () => {
    if (!userInfo || !userInfo.roles) return false;
    const adminRoles = [
      "admin",
      "admin_home",
      "staff",
      "supervisor",
      "department",
    ];
    return userInfo.roles.some((role) => adminRoles.includes(role));
  };

  const handleStepsClick = async (e) => {
    e.preventDefault();
    if (router.pathname !== "/") {
      // ไปหน้าหลักก่อน แล้วค่อย scroll หลังเปลี่ยนเสร็จ
      await router.push("/");
      // ใช้ setTimeout เพื่อให้ scroll หลัง DOM โหลดแล้ว (ในบางกรณี)
      setTimeout(() => {
        const stepsSection = document.getElementById("steps-section");
        if (stepsSection) {
          stepsSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 300);
    } else {
      const stepsSection = document.getElementById("steps-section");
      if (stepsSection) {
        stepsSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  };
  const handleStepsClickAsk = async (e) => {
    e.preventDefault();
    if (router.pathname !== "/") {
      // ไปหน้าหลักก่อน แล้วค่อย scroll หลังเปลี่ยนเสร็จ
      await router.push("/");
      // ใช้ setTimeout เพื่อให้ scroll หลัง DOM โหลดแล้ว (ในบางกรณี)
      setTimeout(() => {
        const stepsSection = document.getElementById("steps-ask");
        if (stepsSection) {
          stepsSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 300);
    } else {
      const stepsSection = document.getElementById("steps-ask");
      if (stepsSection) {
        stepsSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  };
  const handleStepsClickNews = async (e) => {
    e.preventDefault();
    if (router.pathname !== "/") {
      // ไปหน้าหลักก่อน แล้วค่อย scroll หลังเปลี่ยนเสร็จ
      await router.push("/");
      // ใช้ setTimeout เพื่อให้ scroll หลัง DOM โหลดแล้ว (ในบางกรณี)
      setTimeout(() => {
        const stepsSection = document.getElementById("steps-news");
        if (stepsSection) {
          stepsSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 300);
    } else {
      const stepsSection = document.getElementById("steps-news");
      if (stepsSection) {
        stepsSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  };
  const handleClickOutside = (event) => {
    if (profileRef.current && !profileRef.current.contains(event.target)) {
      setProfileDropdownOpen(false);
    }
  };

  useEffect(() => {
    if (isProfileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  useEffect(() => {
    const cookieInfo = Cookies.get("info");
    if (cookieInfo) {
      try {
        const parsedInfo = JSON.parse(cookieInfo);
        setUserInfo(parsedInfo);
        setIsLoggedIn(true);
      } catch (err) {
        console.error("Error parsing user info cookie:", err);
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    if (isMobileModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileModalOpen]);

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
                {isAdminUser() && (
                  <button
                    className={styles.dropdownItem}
                    onClick={handleAdminClick}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                    </svg>
                    จัดการระบบ
                  </button>
                )}

                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    handleComplaintClick();
                    setProfileDropdownOpen(false);
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                  </svg>
                  แจ้งเรื่องร้องทุกข์
                </button>
                
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    handleFollowUpClick();
                    setProfileDropdownOpen(false);
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                  </svg>
                  ติดตามผล
                </button>

                <div className={styles.dropdownDivider}></div>

                <button className={styles.dropdownItem} onClick={handleLogout}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5z" />
                  </svg>
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
        <button className={styles.reportButton} onClick={handleComplaintClick}>
          แจ้งเรื่องร้องทุกข์
        </button>
      </div>
    );
  };

  return (
    <>
      <div className={styles.navbarContainer}>
        <nav className={styles.navbar}>
          <div className={styles.logoGroup}>
            <img
              src="/logomain.png"
              alt="ตราครุฑ"
              className={styles.logo}
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/")}
            />
          </div>
            <div className={styles.hamburger} onClick={toggleMobileModal}>
              <div className={styles.bar}></div>
              <div className={styles.bar}></div>
              <div className={styles.bar}></div>
            </div>

          <div className={styles.menu}>
            <a href="/" className={styles.menuItem}>
              หน้าหลัก
            </a>
            <a href="/" className={styles.menuItem} onClick={handleStepsClick}>
              ขั้นตอนการแจ้งเรื่องร้องทุกข์
            </a>
            <a
              href="/"
              className={styles.menuItem}
              onClick={handleStepsClickNews}
            >
              ข่าวสาร
            </a>
            <a
              href="/"
              className={styles.menuItem}
              onClick={handleStepsClickAsk}
            >
              คำถามที่พบบ่อย
            </a>
          </div>

          <div className={styles.buttonContainer}>{renderDesktopButtons()}</div>
        </nav>
      </div>

      <MobileModal
        isOpen={isMobileModalOpen}
        onClose={closeMobileModal}
        userInfo={userInfo}
        onLoginClick={handleLogin}
        onComplaintClick={handleComplaintClick}
        onFollowUpClick={handleFollowUpClick}
        onAdminClick={handleAdminClick}
        onLogoutClick={handleLogout}
        isAdminUser={isAdminUser()}
      />
    </>
  );
}
