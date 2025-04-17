import React, { useState } from "react";
import NavbarMain from "@services/navbarMain/navbarMain";
import { Container, Box } from "@mui/material";
import ButtonService from "@services/ButtonService/ButtonService";
import StepperComponent from "./StepperComponent";
import Tab1 from "./Tabs/tab1";
import Tab2 from "./Tabs/tab2";
import Tab3 from "./Tabs/tab3";
import Tab4 from "./Tabs/tab4";

// Components per step, including Tab4 (no stepper on 4th)
const processComponents = [Tab1, Tab2, Tab3, Tab4];
// Step labels for the first three steps
const stepLabels = ["กระบวนการทั่วไป", "กระบวนการพิเศษ", "ขั้นตอนราชการ"];

function ComplaintComponent() {
  const [activeStep, setActiveStep] = useState(0);
  const StepComponent = processComponents[activeStep];

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, processComponents.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    // TODO: implement submit logic
    console.log("Submitting complaint...");
  };

  // show stepper/navigation for first 3 steps only
  const showNavigation = activeStep < stepLabels.length;

  return (
    <>
      <NavbarMain />
      <Box sx={{ backgroundColor: "#eaf5ff", minHeight: "100vh", py: 4 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", gap: 4 }}>
            {showNavigation && (
              <Box sx={{ width: 200 }}>
                <StepperComponent
                  steps={stepLabels}
                  activeStep={activeStep}
                  setActiveStep={setActiveStep}
                />
              </Box>
            )}

            <Box sx={{ flex: 1 }}>
              {/* Render the current tab component, passing navigation props on Tab4 */}
              {activeStep < 3 ? (
                <StepComponent activeStep={activeStep} />
              ) : (
                <StepComponent onBack={handleBack} onSubmit={handleSubmit} />
              )}

              {showNavigation && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    mt: 4,
                    gap: 2,
                    width: "fit-content",
                    mx: "auto",
                  }}
                >
                  {activeStep > 0 && (
                    <ButtonService
                      label="ย้อนกลับ"
                      variant="outlined"
                      onClick={handleBack}
                      color="#EDC458"
                      sx={{ width: "auto" }}
                    />
                  )}
                  <ButtonService
                    label={
                      activeStep === processComponents.length - 1
                        ? "เสร็จสิ้น"
                        : "ถัดไป"
                    }
                    variant="contained"
                    onClick={
                      activeStep === stepLabels.length
                        ? handleSubmit
                        : handleNext
                    }
                    color="#EDC458"
                    disabled={activeStep === stepLabels.length}
                    sx={{ width: "auto" }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
}

export default ComplaintComponent;
