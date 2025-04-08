import React from "react";
import { Stepper, Step, StepLabel, Box } from "@mui/material";

const StepperComponent = ({ activeStep, setActiveStep }) => {
  const steps = [
    "ข้อมูลผู้ร้องทุกข์",
    "ข้อมูลผู้ถูกร้องทุกข์",
    "รายละเอียดเรื่องที่ร้องทุกข์",
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Stepper
        activeStep={activeStep}
        alternativeLabel
        orientation="vertical"
        sx={{ width: "100%" }}
      >
        {steps.map((label, index) => (
          <Step key={index}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default StepperComponent;
