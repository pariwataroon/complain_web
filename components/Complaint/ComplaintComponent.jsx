import React, { useState } from "react";
import NavbarMain from "@services/navbarMain/navbarMain";
import { Container, Box } from "@mui/material";
import ButtonService from "@services/ButtonService/ButtonService";
import StepperComponent from "./StepperComponent";
import Tab1 from "./Tabs/tab1";
import Tab2 from "./Tabs/tab2";
import Tab3 from "./Tabs/tab3";
import Tab4 from "./Tabs/tab4";
import useComplaintForm from "@hooks/user/complaint/useComplaintForm";

const processComponents = [Tab1, Tab2, Tab3, Tab4];
const stepLabels = ["ข้อมูลผู้ร้องทุกข์", "ข้อมูลผู้ถูกร้องทุกข์", "รายละเอียดเรื่องร้องทุกข์"];

export default function ComplaintComponent() {
  const [activeStep, setActiveStep] = useState(0);
  const [acceptSubmit, setAcceptSubmit] = useState(false);
  const StepComponent = processComponents[activeStep];
  const {
    formData,
    updateStepData,
    getStepTabData,
    getFormData,
    handleSubmitForm,
  } = useComplaintForm();

  const handleNext = () => {
    const currentStepKey = `step${activeStep + 1}`;
    const currentTabData = getStepTabData(currentStepKey, "general");

    console.log(`📦 Data in ${currentStepKey}:`, currentTabData);

    setActiveStep((prev) => Math.min(prev + 1, processComponents.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    await handleSubmitForm();
  };

 
  return (
    <>
      <NavbarMain />
      <Box sx={{ backgroundColor: "#eaf5ff", minHeight: "100vh", py: 4 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", gap: 4 }}>
            <Box sx={{ width: 200 }}>
              <StepperComponent
                steps={stepLabels}
                activeStep={activeStep}
                setActiveStep={setActiveStep}
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <StepComponent
                stepKey={`step${activeStep + 1}`}
                tabData={getStepTabData(`step${activeStep + 1}`, "general")}
                updateStepData={updateStepData}
                onAccepted={setAcceptSubmit}
              />

              <Box sx={{ display: "flex", justifyContent: "center", mt: 4, gap: 2 }}>
                {activeStep > 0 && (
                  <ButtonService
                    label="ย้อนกลับ"
                    color="ย้อนกลับ"
                    variant="contained"
                    onClick={handleBack}
                  />
                )}
                <ButtonService
                  label={activeStep === processComponents.length - 1 ? "ส่งเรื่องร้องทุกข์" : "ถัดไป"}
                  color="ถัดไป"
                  variant="contained"
                  onClick={
                    activeStep === processComponents.length - 1
                      ? handleSubmit
                      : handleNext
                  }
                  disabled={
                    activeStep === processComponents.length - 1 && !acceptSubmit
                  }
                />
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
}
