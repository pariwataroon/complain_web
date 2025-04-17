import React, { useState } from "react";
import styles from "./TabNav2.module.scss";

const tabs = ["บุคคลทั่วไป", "นิติบุคคล", "หน่วยงานของรัฐ"];
const underlineColors = ["#0B1F8F", "#3FA9F5", "#EDC458"];

const Tab2 = () => {
  const [active, setActive] = useState(0);
  const underlineColor = underlineColors[active];

  return (
    <div className={styles.container}>
      {/* Tab Navigation */}
      <div
        className={styles.tabNav}
        style={{ "--underline-color": underlineColor }}
      >
        {tabs.map((label, idx) => (
          <div
            key={idx}
            className={`${styles.tab} ${styles[`tab${idx}`]} ${
              active === idx ? styles.active : ""
            }`}
            onClick={() => setActive(idx)}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Form Placeholder based on active tab */}
      {active === 0 && (
        <>
          <div className={styles.formContainer} />
          <div className={styles.formContainer2} />
        </>
      )}
      {active === 1 && (
        <>
          <div className={styles.formContainer} />
          <div className={styles.formContainer2} />
        </>
      )}
      {active === 2 && (
        <>
          <div className={styles.formContainer} />
          <div className={styles.formContainer2} />
        </>
      )}

      {/* Next Button */}
    </div>
  );
};

export default Tab2;
