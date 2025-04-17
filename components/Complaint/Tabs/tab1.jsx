import React, { useState } from "react";
import styles from "./TabNav1.module.scss";

const tabs = ["บุคคลทั่วไป", "นิติบุคคล"];

const Tab1 = () => {
  const [active, setActive] = useState(0);

  return (
    <div className={styles.container}>
      {/* Tab Navigation */}
      <div className={styles.tabNav}>
        {tabs.map((label, idx) => (
          <div
            key={idx}
            className={`${styles.tab} ${active === idx ? styles.active : ""}`}
            onClick={() => setActive(idx)}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Form Placeholder based on active tab */}
      {active === 0 && (
        <>
          <div className={styles.formContainer}>
            {" "}
            {/* ฟอร์มบุคคลทั่วไป 1 */}{" "}
          </div>
          <div className={styles.formContainer2}>
            {" "}
            {/* ฟอร์มบุคคลทั่วไป 2 */}{" "}
          </div>
        </>
      )}
      {active === 1 && (
        <>
          <div className={styles.formContainer}> {/* ฟอร์มนิติบุคคล 1 */} </div>
          <div className={styles.formContainer2}>
            {" "}
            {/* ฟอร์มนิติบุคคล 2 */}{" "}
          </div>
        </>
      )}
    </div>
  );
};

export default Tab1;
