import React from "react";
import styles from "./Homepage4.module.scss";

const Homepage4 = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Left Content */}
        <div className={styles.leftContent}>
          <h2 className={styles.title}>ยืนยันตัวตนผ่านแอป ThaID</h2>

          <div className={styles.description}>
            <p>สำนักตรวจสอบและประเมินผล สำนักงานปกติการกระทรวงการคลัง</p>
            <p>พร้อมรับฟังทุกปัญหาและข้อร้องเรียนของประชาชน มุ่งมั่นให้ขับเคลื่อนไปอย่างโปร่งใส เป็นธรรม</p>
            <p>และรวดเร็ว เพื่อให้ทุกท่านได้รับข้อมูลที่ถูกต้องและทันสมัย</p>
          </div>

          <div className={styles.downloadButtons}>
            <div
              className={styles.playStoreButton}
              onClick={() =>
                window.open(
                  "https://play.google.com/store/apps/details?id=th.go.dopa.bora.dims.ddopa&pcampaignid=web_share",
                  "_blank"
                )
              }
            >
              <img src="/Google_Play.png" alt="Download on Google Play" />
            </div>
            <div
              className={styles.appStoreButton}
              onClick={() =>
                window.open(
                  "https://apps.apple.com/th/app/thaid/id1533612248",
                  "_blank"
                )
              }
            >
              <img src="/App_Store.png" alt="Download on App Store" />
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className={styles.rightContent}>
          <div className={styles.thaidLogo}>
            <img src="/ThaID_logo_2.png" alt="ThaID Logo" />
          </div>

          <div className={styles.phoneWithQR}>
            <img
              src="/iphone_MOF_CODE.png"
              alt="Mobile Phone with QR Code"
              className={styles.phoneImage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage4;