import React, { useState } from "react";
import styles from "./TabNav.module.scss";
import ComplaintPersonalForm from "@services/ComplaintPersonal/ComplaintPersonalForm";
import ComplaintCustomerForm from "@services/ComplaintCustomer/ComplaintCustomerForm";
import ComplaintMinistryForm from "@services/ComplaintMinistry/ComplaintMinistryForm";

const tabs = ["บุคคลทั่วไป", "นิติบุคคล", "หน่วยงานของรัฐ"];
const underlineColors = ["#0B1F8F", "#3FA9F5", "#EDC458"];

const Tab2 = ({ stepKey, tabData, updateStepData }) => {
  const [active, setActive] = useState(0);

  const handleChange = (type) => (name, value) => {
    const updatedTypeData = {
      ...(tabData[type] || {}),
      [name]: value,
    };

    const updatedData = {
      [type]: updatedTypeData,
      activeType: type,
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

      {/* บุคคลทั่วไป */}
      {active === 0 && (
        <div className={styles.formContainer}>
          <ComplaintPersonalForm
            data={tabData.individual || {}}
            onChange={handleChange("individual")}
            title="ข้อมูลผู้ถูกร้องทุกข์"
            required
          />
        </div>
      )}

      {/* นิติบุคคล */}
      {active === 1 && (
        <div className={styles.formContainer}>
          <ComplaintCustomerForm
            data={tabData.corporate || {}}
            onChange={handleChange("corporate")}
            title="ข้อมูลผู้ถูกร้องทุกข์"
            required
          />
        </div>
      )}

      {/* หน่วยงานของรัฐ */}
      {active === 2 && (
        <div className={styles.formContainer}>
          <ComplaintMinistryForm
            data={tabData.government || {}}
            onChange={handleChange("government")}
            title="ข้อมูลหน่วยงานของรัฐที่ถูกร้องทุกข์"
            required
          />
        </div>
      )}
    </div>
  );
};

export default Tab2;
