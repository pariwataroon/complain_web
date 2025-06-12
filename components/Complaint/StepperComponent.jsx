import React from "react";
import styles from "./StepperComponent.module.scss";

const steps = [
  "ข้อมูลผู้ร้องทุกข์",
  "ข้อมูลผู้ถูกร้องทุกข์",
  "รายละเอียดเรื่องที่ร้องทุกข์",
];

function StepperComponent({ activeStep, setActiveStep }) {
  return (
    <div className={styles.stepper}>
      <div className={styles.pillar}>
        {steps.map((_, idx) => (
          <button
            key={idx}
            type="button"
            className={`${styles.icon} ${
              activeStep === idx ? styles.activeIcon : ""
            }`}
            onClick={() => setActiveStep(idx)}
          >
            {idx + 1}
          </button>
        ))}
      </div>
      <div className={styles.labels}>
        {steps.map((label, idx) => (
          <div
            key={idx}
            className={`${styles.label} ${
              activeStep === idx ? styles.activeLabel : ""
            }`}
            onClick={() => setActiveStep(idx)}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default StepperComponent;