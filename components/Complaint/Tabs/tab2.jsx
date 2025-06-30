import React, { useEffect } from "react";
import styles from "./TabNav.module.scss";
import ComplaintPersonalForm from "@services/ComplaintPersonalTab2/ComplaintPersonalForm";
import ComplaintCustomerForm from "@services/ComplaintCustomer/ComplaintCustomerForm";
import ComplaintMinistryForm from "@services/ComplaintMinistry/ComplaintMinistryForm";

const tabs = ["บุคคลทั่วไป", "นิติบุคคล", "หน่วยงานของรัฐ"];
const underlineColors = ["#0B1F8F", "#3FA9F5", "#EDC458"];

const Tab2 = ({
  stepKey,
  tabData,
  updateStepData,
  validationErrors = {},
  shouldShowValidation = false,
  onTabChange,
  currentTab = 0 
}) => {

  const handleTabChange = (newTab) => {
    if (onTabChange) {
      onTabChange('step2', newTab);
    }
  };

  const handleChange = (type) => (name, value) => {
    const updatedTypeData = {
      ...(tabData[type] || {}),
      [name]: value,
    };

    const updatedData = {
      ...tabData,
      [type]: updatedTypeData,
      activeType: type,
    };

    updateStepData(stepKey, "general", updatedData);
  };

  useEffect(() => {
    const typeMap = ["individual", "corporate", "government"];
    const activeType = typeMap[currentTab];

    if (activeType && tabData.activeType !== activeType) {
      const updatedData = {
        ...tabData,
        activeType: activeType,
      };
      updateStepData(stepKey, "general", updatedData);

    }
  }, [currentTab, stepKey, tabData, updateStepData]);

  const getCurrentType = () => {
    const typeMap = ["individual", "corporate", "government"];
    return typeMap[currentTab];
  };

  return (
    <div className={styles.container}>
      <div className={styles.tabNav}>
        {tabs.map((label, idx) => (
          <div
            key={idx}
            className={`${styles.tab} ${styles[`tab${idx}`]} ${currentTab === idx ? styles.active : ""}`}
            onClick={() => handleTabChange(idx)}
          >
            {label}
          </div>
        ))}
        <div
          className={styles.underlineBar}
          style={{ backgroundColor: underlineColors[currentTab] }}
        />
      </div>

      {/* บุคคลทั่วไป */}
      {currentTab === 0 && (
        <div className={styles.formContainer}>
          <ComplaintPersonalForm
            data={tabData.individual || {}}
            onChange={handleChange("individual")}
            title="ข้อมูลผู้ถูกร้องทุกข์"
            validationErrors={validationErrors}
            shouldShowValidation={shouldShowValidation}
            fieldPrefix="individual"
            formType="mandatory"
          />
        </div>
      )}

      {/* นิติบุคคล */}
      {currentTab === 1 && (
        <div className={styles.formContainer}>
          <ComplaintCustomerForm
            data={tabData.corporate || {}}
            onChange={handleChange("corporate")}
            title="ข้อมูลผู้ถูกร้องทุกข์ (นิติบุคคล)"
            validationErrors={validationErrors}
            shouldShowValidation={shouldShowValidation}
            fieldPrefix="corporate"
            formType="mandatory"
          />
        </div>
      )}

      {/* หน่วยงานของรัฐ */}
      {currentTab === 2 && (
        <div className={styles.formContainer}>
          <ComplaintMinistryForm
            data={tabData.government || {}}
            onChange={handleChange("government")}
            title="ข้อมูลหน่วยงานของรัฐที่ถูกร้องทุกข์"
            validationErrors={validationErrors}
            shouldShowValidation={shouldShowValidation}
            fieldPrefix="government"
            formType="mandatory"
          />
        </div>
      )}
    </div>
  );
};

export default Tab2;