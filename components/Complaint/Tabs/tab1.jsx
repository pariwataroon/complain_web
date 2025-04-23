import React, { useState } from "react";
import styles from "./TabNav.module.scss";
import ComplaintPersonalForm from "@services/ComplaintPersonal/ComplaintPersonalForm";

const tabs = ["บุคคลทั่วไป", "นิติบุคคล"];
const underlineColors = ["#0B1F8F", "#3FA9F5"];

const Tab1 = ({ stepKey, tabData, updateStepData }) => {
  const [active, setActive] = useState(0);

  const handleUpdate = (type) => (name, value) => {
    const prev = tabData[type] || {};
    const updated = {
      ...prev,
      [name]: value,
    };

    let updatedData = {};

    if (active === 0) {
      updatedData = {
        general: type === "general" ? updated : tabData.general || {},
        delegate: type === "delegate" ? updated : tabData.delegate || {},
      };
    } else {
      updatedData = {
        corporate: type === "corporate" ? updated : tabData.corporate || {},
        signer: type === "signer" ? updated : tabData.signer || {},
      };
    }

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
              data={tabData.general || {}}
              onChange={handleUpdate("general")}
              required
            />
          </div>
          <div className={styles.formContainer2}>
            <ComplaintPersonalForm
              data={tabData.delegate || {}}
              onChange={handleUpdate("delegate")}
              title="ข้อมูลผู้รับมอบอำนาจร้องทุกข์"
              required
            />
          </div>
        </>
      )}

      {active === 1 && (
        <>
          <div className={styles.formContainer}>
            <ComplaintPersonalForm
              data={tabData.corporate || {}}
              onChange={handleUpdate("corporate")}
              title="ข้อมูลผู้ร้องทุกข์"
              required
            />
          </div>
          <div className={styles.formContainer2}>
            <ComplaintPersonalForm
              data={tabData.signer || {}}
              onChange={handleUpdate("signer")}
              title="ข้อมูลผู้มีอำนาจลงนาม"
              required
            />
          </div>
        </>
      )}

    </div>
  );
};

export default Tab1;
