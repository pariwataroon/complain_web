import React, { useState } from "react";
import styles from "./TabNav.module.scss";
import ComplaintPersonalForm from "@services/ComplaintPersonal/ComplaintPersonalForm";

const tabs = ["บุคคลทั่วไป", "นิติบุคคล"];
const underlineColors = ["#0B1F8F", "#3FA9F5"];

const Tab1 = ({ stepKey, tabData, updateStepData }) => {
  const [active, setActive] = useState(0);

  const handleChange = (type) => (name, value) => {
    const prev = tabData[type] || {};
    const updatedData = {
      ...tabData,
      [type]: {
        ...prev,
        [name]: value,
      },
    };
    updateStepData(stepKey, "general", updatedData);
  };


  return (
    <div className={styles.container}>
      <div className={styles.tabNav}>
        {tabs.map((label, idx) => (
          <div
            key={idx}
            className={`${styles.tab} ${styles[`tab${idx}`]} ${active === idx ? styles.active : ""}`}
            onClick={() => setActive(idx)}
          >
            {label}
          </div>
        ))}
        <div
          className={styles.underlineBar}
          style={{ backgroundColor: underlineColors[active] }}
        />
      </div>

      {active === 0 && (
        <>
          <div className={styles.formContainer}>
            <ComplaintPersonalForm
              data={tabData.general}
              onChange={(name, value) => {
                const updated = { ...tabData.general, [name]: value };
                updateStepData(stepKey, "general", {
                  ...tabData,
                  general: updated,
                });
              }}
            />

          </div>
          <div className={styles.formContainer2}>
            <ComplaintPersonalForm
              data={tabData.delegate || {}}
              onChange={handleChange("delegate")}
              title="ข้อมูลผู้รับมอบอำนาจร้องทุกข์"
            />
          </div>
        </>
      )}

      {active === 1 && (
        <>
          <div className={styles.formContainer}>
            <ComplaintPersonalForm
              data={tabData.corporate || {}}
              onChange={handleChange("corporate")}
              title="ข้อมูลผู้ร้องทุกข์"
            />
          </div>
          <div className={styles.formContainer2}>
            <ComplaintPersonalForm
              data={tabData.signer || {}}
              onChange={handleChange("signer")}
              title="ข้อมูลผู้มีอำนาจลงนาม"
            />
          </div>
        </>
      )}

    </div>
  );
};

export default Tab1;
