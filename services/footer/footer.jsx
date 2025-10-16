import React, { useEffect, useState } from "react";
import styles from "./Footer.module.scss";
import { LocalPhone, ChatBubbleOutline } from "@mui/icons-material";
import { getApiLogsCounter } from "@pages/api/home/home";

export default function Footer() {
  const [apiLogsStats, setApiLogsStats] = useState(null);

  useEffect(() => {
    const fetchApiLogsCounter = async () => {
      try {
        const data = await getApiLogsCounter();
        setApiLogsStats(data?.res_data ?? data); // ใช้ res_data โดยตรง
      } catch (error) {
        setApiLogsStats(null);
      }
    };
    fetchApiLogsCounter();
  }, []);

  const handleStepsClick = (e) => {
    e.preventDefault();
    const stepsSection = document.getElementById("steps-section");
    if (stepsSection) {
      stepsSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        {/* คอลัมน์ซ้าย */}
        <div className={styles.column}>
          <h4>เว็บไซต์</h4>
          <div className={styles.linkContainer}>
            <a href="/" className={styles.linkItem}>
              หน้าหลัก
            </a>
            <a
              href="#steps-section"
              className={styles.linkItem}
              onClick={handleStepsClick}
            >
              ขั้นตอนการแจ้งเรื่องร้องทุกข์
            </a>
            <a href="/complaint" className={styles.linkItem}>
              แจ้งเรื่องร้องทุกข์
            </a>
            <a href="/login" className={styles.linkItem}>
              ลงทะเบียน
            </a>
            <a href="#" className={styles.linkItem}>
              ช่องทางการติดต่อ
            </a>
          </div>
        </div>

        {/* คอลัมน์กลาง */}
        <div className={styles.column}>
          <h4>ช่องทางติดต่อ</h4>
          <p>
            กระทรวงการคลัง
            <br />
            ถนนพระรามที่ 6 แขวงพญาไท เขตพญาไท
            <br />
            กรุงเทพฯ 10400
            <br />
            รับส่งหนังสือราชการ: saraban@mof.go.th
            <br />
            โทรศัพท์: 02-126-5800 | โทรสาร: 02-273-9408
          </p>
          <p className={styles.hotline}>สายด่วน: 1689</p>
        </div>

        {/* คอลัมน์ขวา */}
        <div className={styles.column}>
          <div className={styles.mapContainer}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3874.952691334089!2d100.53412475911195!3d13.781725477105375!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30e29c018a2abc03%3A0xc4b9f24d3fcf4b15!2z4LiB4Lij4Liw4LiX4Lij4Lin4LiH4LiB4Liy4Lij4LiE4Lil4Lix4LiH!5e0!3m2!1sth!2sth!4v1743495813071!5m2!1sth!2sth"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          <div className={styles.apiLogsCounterContainer}>
            <div className={styles.statsBox}>
              <div className={styles.statsTitleRow}>
                <span className={styles.statsIcon}>📶</span>
                <span className={styles.statsTitle}>จำนวนผู้เข้าชม</span>
              </div>
              <div className={styles.statsRow}>
                <span className={styles.statsLabel}>7 วันที่ผ่านมา</span>
                <span className={styles.statsValue}>
                  {apiLogsStats ? (
                    apiLogsStats.total_week_requests ?? "-"
                  ) : (
                    <span className={styles.loadingSpinnerInline}></span>
                  )}
                </span>
              </div>
              <div className={styles.statsRow}>
                <span className={styles.statsLabel}>30 วันที่ผ่านมา</span>
                <span className={styles.statsValue}>
                  {apiLogsStats ? (
                    apiLogsStats.total_month_requests ?? "-"
                  ) : (
                    <span className={styles.loadingSpinnerInline}></span>
                  )}
                </span>
              </div>
              <div className={styles.statsRow}>
                <span className={styles.statsLabel}>ทั้งหมด</span>
                <span className={styles.statsValue}>
                  {apiLogsStats ? (
                    apiLogsStats.total_requests ?? "-"
                  ) : (
                    <span className={styles.loadingSpinnerInline}></span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <p>
          Copyright ©2025 Thailand's Ministry of Finance All rights Reserved.
        </p>
      </div>
    </footer>
  );
}
