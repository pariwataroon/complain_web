// Tab2.jsx
import React, { useEffect, useCallback } from "react";
import styles from "./TabNav.module.scss";
import ComplaintPersonalForm from "@services/ComplaintPersonalTab2/ComplaintPersonalForm";
import ComplaintCustomerForm from "@services/ComplaintCustomer/ComplaintCustomerForm";
import ComplaintMinistryForm from "@services/ComplaintMinistry/ComplaintMinistryForm";
import ButtonService from "@services/ButtonService/ButtonService";

const tabs = ["บุคคลทั่วไป", "นิติบุคคล", "หนังสือร้องเรียนถึง กค."];
const underlineColors = ["#0B1F8F", "#3FA9F5", "#EDC458"];

const Tab2 = ({
  stepKey,
  tabData,
  updateStepData,
  validationErrors = {},
  shouldShowValidation = false,
  onTabChange,
  currentTab = 0,
  onNextGovernment, // ⬅️ เพิ่ม callback
}) => {
  const handleTabChange = (newTab) => {
    onTabChange?.("step2", newTab);
  };

  const handleChange = useCallback(
    (type) => (name, value) => {
      const prevSection = tabData[type] || {};
      const nextSection = { ...prevSection, [name]: value };
      if (JSON.stringify(prevSection) === JSON.stringify(nextSection)) return;
      const nextContainer = { ...tabData, [type]: nextSection, activeType: type };
      updateStepData(stepKey, "general", nextContainer);
    },
    [tabData, stepKey, updateStepData]
  );

  useEffect(() => {
    const typeMap = ["individual", "corporate", "government"];
    const activeType = typeMap[currentTab];
    if (activeType && tabData.activeType !== activeType) {
      updateStepData(stepKey, "general", { ...tabData, activeType });
    }
  }, [currentTab, stepKey, tabData, updateStepData]);

  const handleNextFromGovernment = () => {
    // เก็บสถานะว่าอยู่ government ก่อน
    updateStepData(stepKey, "general", { ...tabData, activeType: "government" });
    // ให้ parent เปลี่ยนหน้าเป็น tab3-1
    onNextGovernment?.();
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
        <div className={styles.underlineBar} style={{ backgroundColor: underlineColors[currentTab] }} />
      </div>

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

      {currentTab === 2 && (
        <>
          <div className={styles.formContainer}>
            <ComplaintMinistryForm
              data={tabData.government || {}}
              onChange={handleChange("government")}
              title="ข้อมูลผู้ถูกร้องทุกข์ (หนังสือร้องเรียนถึง กค.)"
              validationErrors={validationErrors}
              shouldShowValidation={shouldShowValidation}
              fieldPrefix="government"
              formType="mandatory"
            />
          </div>

          {/* ปุ่มอยู่ตำแหน่งเดียวกับปุ่มสีส้มเดิม
          <div className={styles.actionButtons}>
            <ButtonService
              label="ย้อนกลับ"
              color="ล้าง"
              variant="outlined"
              onClick={() => onTabChange?.("step2", 1)}
            />
            <ButtonService
              label="ถัดไป"
              color="ยืนยัน"
              variant="contained"
              onClick={handleNextFromGovernment}
            />
          </div> */}
        </>
      )}
    </div>
  );
};

export default Tab2;