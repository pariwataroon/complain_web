import React from "react";
import { useRouter } from "next/router";
import styles from "./Homepage1.module.scss";

const Homepage1 = () => {
  const router = useRouter();

  const handleComplaintClick = () => {
    router.push("/complaint");
  };

  const handleFollowUpClick = () => {
    router.push("/followup");
  };

  return (
    <div className={styles.container}>
      {/* Background */}
      <div className={styles.background}></div>

      {/* Mobile Image - ติดอยู่แค่ใน Homepage1 เท่านั้น */}
      <div className={styles.mobileImageWrapper}>
        <img
          src="/images/iphone_MOF.png"
          alt="Mobile Phone"
          className={styles.mobileImage}
        />
      </div>

      {/* Header Text */}
      <div className={styles.headerWrapper}>
        <h1 className={styles.headerText}>
          <span className={styles.mofText}>MOF</span>
          <span className={styles.divider}></span>
          <span className={styles.subText}>
            รับเรื่องด้วยใจ โปร่งใส ทันสมัยและเป็นธรรม
          </span>
        </h1>
      </div>

      {/* Buttons */}
      <div className={styles.buttonWrapper}>
        <button className={styles.button} onClick={handleComplaintClick}>
          แจ้งเรื่องร้องทุกข์
        </button>
        <button className={styles.buttonwhit} onClick={handleFollowUpClick}>
          ติดตามผล
        </button>
      </div>
    </div>
  );
};

export default Homepage1;