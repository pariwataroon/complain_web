import React, { useState, useEffect } from "react";
import styles from "./TabNav.module.scss";
import ComplaintPersonalForm from "@services/ComplaintPersonal/ComplaintPersonalForm";

const tabs = ["บุคคลทั่วไป", "นิติบุคคล"];
const underlineColors = ["#0B1F8F", "#3FA9F5"];

const Tab1 = ({
  stepKey,
  tabData,
  updateStepData,
  validationErrors = {},
  shouldShowValidation = false
}) => {
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

  const getFieldError = (fieldType, fieldName) => {
    const errorKey = `${fieldType}.${fieldName}`;
    return shouldShowValidation ? validationErrors[errorKey] : "";
  };

  const hasFieldError = (fieldType, fieldName) => {
    return shouldShowValidation && !!getFieldError(fieldType, fieldName);
  };

  useEffect(() => {
    const general = tabData.general || {};
    const delegate = tabData.delegate || {};

    if (general.province) {
      if (!general.districts || general.districts.value !== general.province.value) {
        handleUpdate("general")("districts", "");
        handleUpdate("general")("subdistricts", "");
        handleUpdate("general")("zipcode", "");
      }
    }

    if (delegate.province) {
      if (!delegate.districts || delegate.districts.value !== delegate.province.value) {
        handleUpdate("delegate")("districts", "");
        handleUpdate("delegate")("subdistricts", "");
        handleUpdate("delegate")("zipcode", "");
      }
    }
  }, [tabData.general?.province?.value, tabData.delegate?.province?.value]);

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

      {active === 1 && (
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