import React, { useState } from "react";
import NavbarMain from "@services/navbarMain/navbarMain";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Tab,
  Tabs,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";

const ComplaintComponent = () => {
  const [tabValue, setTabValue] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    "ข้อมูลผู้ร้องทุกข์",
    "ข้อมูลผู้ถูกร้องทุกข์",
    "รายละเอียดเรื่องที่ร้องทุกข์",
  ];

  // Stepper section
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  // Form sections
  const ComplainantInfoSection = ({ isLegalEntity = false }) => (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {isLegalEntity ? "ข้อมูลนิติบุคคล" : "ข้อมูลผู้ร้องทุกข์"}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label={isLegalEntity ? "ชื่อนิติบุคคล" : "ชื่อ - นามสกุล"}
          fullWidth
          required
          variant="outlined"
        />
        <TextField
          label="หมายเลขโทรศัพท์"
          fullWidth
          required
          type="tel"
          variant="outlined"
        />
        <TextField
          label="อีเมล"
          fullWidth
          required
          type="email"
          variant="outlined"
        />
      </Box>
    </Paper>
  );

  const AttorneyInfoSection = ({ isLegalEntity = false }) => (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {isLegalEntity
          ? "ข้อมูลผู้รับมอบอำนาจ"
          : "ข้อมูลผู้รับมอบอำนาจร้องทุกข์"}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label={isLegalEntity ? "ชื่อผู้รับมอบอำนาจ" : "ชื่อ - นามสกุล"}
          fullWidth
          required
          variant="outlined"
        />
        <TextField
          label="หมายเลขโทรศัพท์"
          fullWidth
          required
          type="tel"
          variant="outlined"
        />
        <TextField
          label="อีเมล"
          fullWidth
          required
          type="email"
          variant="outlined"
        />
      </Box>
    </Paper>
  );

  const ContactSection = () => (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        ที่อยู่ที่สามารถติดต่อได้
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <TextField label="ตำบล/แขวง" fullWidth required variant="outlined" />
        <TextField label="อำเภอ/เขต" fullWidth required variant="outlined" />
        <TextField label="จังหวัด" fullWidth required variant="outlined" />
        <TextField
          label="รหัสไปรษณีย์"
          fullWidth
          required
          type="number"
          variant="outlined"
        />
      </Box>
    </Paper>
  );

  return (
    <div>
      <NavbarMain />
      <Container maxWidth="md" sx={{ my: 4 }}>
        {/* Tabs for individual and legal entity */}
        <Box sx={{ mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={(event, newTabValue) => setTabValue(newTabValue)}
            indicatorColor="primary"
            textColor="primary"
            centered
          >
            <Tab label="บุคคลทั่วไป" />
            <Tab label="นิติบุคคล" />
          </Tabs>
        </Box>

        {/* Container for stepper and form */}
        <Box sx={{ display: "flex", gap: 3 }}>
          {/* Stepper - on the left side */}
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Stepper
              activeStep={activeStep}
              alternativeLabel
              orientation="vertical"
              sx={{
                width: "100%",
                "& .MuiStepConnector-root": {
                  borderColor: "#2499FF", // Connector line color
                },
                "& .MuiStepIcon-root": {
                  border: "2px solid #2499FF", // Border around step number
                  color: "#fff", // Text color inside step circle
                  backgroundColor: "#D9E5FF", // Default step circle color
                },
                "& .MuiStepIcon-active": {
                  backgroundColor: "#2499FF", // Active step circle color
                  color: "#fff", // Active step number color
                },
                "& .MuiStepIcon-completed": {
                  backgroundColor: "#FFD700", // Completed step circle color
                  color: "#fff", // Completed step number color
                },
              }}
            >
              {steps.map((label, index) => (
                <Step key={index}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Form - on the right side */}
          <Box sx={{ flex: 3, minWidth: 400 }}>
            {/* Form Sections Based on Active Step */}
            {activeStep === 0 && (
              <>
                <ComplainantInfoSection isLegalEntity={tabValue === 1} />
                <ContactSection />
              </>
            )}
            {activeStep === 1 && (
              <>
                <AttorneyInfoSection isLegalEntity={tabValue === 1} />
                <ContactSection />
              </>
            )}
            {activeStep === 2 && (
              <>
                <ComplainantInfoSection isLegalEntity={tabValue === 1} />
                <ContactSection />
              </>
            )}

            {/* Navigation Buttons */}
            <Box sx={{ textAlign: "center", mt: 4 }}>
              <Button
                onClick={handleBack}
                variant="outlined"
                disabled={activeStep === 0}
                sx={{ mr: 2 }}
              >
                ย้อนกลับ
              </Button>
              <Button
                onClick={handleNext}
                variant="contained"
                sx={{ bgcolor: "#2499FF", "&:hover": { opacity: 0.9 } }}
              >
                {activeStep === steps.length - 1 ? "เสร็จสิ้น" : "ถัดไป"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>
    </div>
  );
};

export default ComplaintComponent;
