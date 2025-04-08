import React from "react";
import { Box, Paper, Typography, TextField } from "@mui/material";

const ComplainantInfoSection = ({ isLegalEntity = false }) => (
  <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
    <Typography variant="h6" gutterBottom>
      {isLegalEntity ? "ข้อมูลนิติบุคคล" : "ข้อมูลผู้ร้องทุกข์"}
    </Typography>
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Typography variant="subtitle2">
          {isLegalEntity ? "เลขทะเบียนนิติบุคคล" : "เลขประจำตัวประชาชน"}
        </Typography>
        <Typography variant="body2">0-0000-00000-00-0</Typography>
      </Box>
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
      {isLegalEntity ? "ข้อมูลผู้รับมอบอำนาจ" : "ข้อมูลผู้รับมอบอำนาจร้องทุกข์"}
    </Typography>
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Typography variant="subtitle2">
          {isLegalEntity ? "เลขทะเบียนนิติบุคคล" : "เลขประจำตัวประชาชน"}
        </Typography>
        <Typography variant="body2">0-0000-00000-00-0</Typography>
      </Box>
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

const FormComponent = ({ activeStep }) => {
  return (
    <>
      {/* Form Sections Based on Active Step */}
      {activeStep === 0 && (
        <>
          <ComplainantInfoSection />
          <ContactSection />
        </>
      )}
      {activeStep === 1 && (
        <>
          <AttorneyInfoSection />
          <ContactSection />
        </>
      )}
      {activeStep === 2 && (
        <>
          <ComplainantInfoSection isLegalEntity />
          <ContactSection />
        </>
      )}
    </>
  );
};

export default FormComponent;
