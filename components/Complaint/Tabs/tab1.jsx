import React, { useEffect, useMemo } from "react";
import styles from "./TabNav.module.scss";
import ComplaintPersonalForm from "@services/ComplaintPersonal/ComplaintPersonalForm";

const tabs = ["บุคคลทั่วไป", "นิติบุคคล"];
const underlineColors = ["#0B1F8F", "#3FA9F5"];

const Tab1 = ({
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
      onTabChange('step1', newTab);
    }
  };

  const handleUpdate = useMemo(() => {
    return (type) => (name, value) => {
      const prev = tabData[type] || {};
      const updated = {
        ...prev,
        [name]: value,
      };

      let updatedData = {};

      if (currentTab === 0) {
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
  }, [stepKey, tabData, currentTab, updateStepData]);

  // แยก Logic การรีเซ็ต address fields
  useEffect(() => {
    const resetAddressFields = (type, provinceName) => {
      const currentData = tabData[type] || {};

      if (currentData.province?.value !== provinceName) {
        handleUpdate(type)("districts", "");
        handleUpdate(type)("subdistricts", "");
        handleUpdate(type)("zipcode", "");
      }
    };

    if (currentTab === 0) {
      // บุคคลทั่วไป
      if (tabData.general?.province) {
        resetAddressFields("general", tabData.general.province.value);
      }
      if (tabData.delegate?.province) {
        resetAddressFields("delegate", tabData.delegate.province.value);
      }
    } else {
      // นิติบุคคล
      if (tabData.corporate?.province) {
        resetAddressFields("corporate", tabData.corporate.province.value);
      }
      if (tabData.signer?.province) {
        resetAddressFields("signer", tabData.signer.province.value);
      }
    }
  }, [
    tabData.general?.province?.value,
    tabData.delegate?.province?.value,
    tabData.corporate?.province?.value,
    tabData.signer?.province?.value,
    currentTab,
    handleUpdate
  ]);

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

      {/* ใช้ currentTab แทน active */}
      {currentTab === 0 && (
        <>
          <div className={styles.formContainer}>
            <ComplaintPersonalForm
              data={tabData.general || {}}
              onChange={handleUpdate("general")}
              title="ข้อมูลผู้ร้องทุกข์"
              validationErrors={validationErrors}
              shouldShowValidation={shouldShowValidation}
              fieldPrefix="general"
              formType="mandatory"
            />
          </div>
          <div className={styles.formContainer2}>
            <ComplaintPersonalForm
              data={tabData.delegate || {}}
              onChange={handleUpdate("delegate")}
              title="ข้อมูลผู้รับมอบอำนาจร้องทุกข์"
              validationErrors={validationErrors}
              shouldShowValidation={shouldShowValidation}
              fieldPrefix="delegate"
              formType="optional"
            />
          </div>
        </>
      )}

      {currentTab === 1 && (
        <>
          <div className={styles.formContainer}>
            <ComplaintPersonalForm
              data={tabData.corporate || {}}
              onChange={handleUpdate("corporate")}
              title="ข้อมูลผู้ร้องทุกข์ (นิติบุคคล)"
              validationErrors={validationErrors}
              shouldShowValidation={shouldShowValidation}
              fieldPrefix="corporate"
              formType="mandatory"
            />
          </div>
          <div className={styles.formContainer2}>
            <ComplaintPersonalForm
              data={tabData.signer || {}}
              onChange={handleUpdate("signer")}
              title="ข้อมูลผู้มีอำนาจลงนาม"
              validationErrors={validationErrors}
              shouldShowValidation={shouldShowValidation}
              fieldPrefix="signer"
              formType="optional"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Tab1;