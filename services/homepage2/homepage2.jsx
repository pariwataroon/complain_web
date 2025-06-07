import React from "react";
import styles from "./Homepage2.module.scss";

const Homepage2 = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.hotlineSection}>
          <h1 className={styles.hotlineTitle}>
            HOTLINE
            <span className={styles.hotlineNumber}>1689</span>
          </h1>
        </div>

        <div className={styles.departmentSection}>
          <h1 className={styles.departmentTitle}>
            สำนักตรวจสอบและประเมินผล
            <span className={styles.departmentSubtitle}>
              สำนักงานปลัดกระทรวงการคลัง
            </span>
          </h1>
        </div>
      </div>
    </div>
  );
};

export default Homepage2;