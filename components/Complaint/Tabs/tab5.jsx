import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import ImageIcon from "@mui/icons-material/Image";
import Image from "next/image";
import {
  formatThaiDate, formatThaiDateTime, formatPhoneNumber_null, formatCitizenId_null
} from "@utils/Formats";

const Tab5 = ({
  stepKey,
  updateStepData,
  onAccepted = () => { },
  formData = {},
  currentTab1 = 0,
  currentTab2 = 0,
}) => {
  const [accepted, setAccepted] = useState(false);

  const {
    step1 = {},
    step2 = {},
    step3 = {},
    step4 = {},
  } = formData;

  // Dynamic select complainant & delegate
  let complainant = {};
  let delegate = {};
  let isComplainantCorporate = false;
  if (currentTab1 === 0) {
    // บุคคลทั่วไป
    complainant = step1.general?.general || {};
    delegate = step1.general?.delegate || {};
    isComplainantCorporate = false;
  } else {
    // นิติบุคคล
    complainant = step1.general?.corporate || {};
    delegate = step1.general?.signer || {};
    isComplainantCorporate = true;
  }

  // Dynamic select respondent
  let respondent = {};
  let respondentType = "";
  if (currentTab2 === 0) {
    respondent = step2.general?.individual || {};
    respondentType = "individual";
  } else if (currentTab2 === 1) {
    respondent = step2.general?.corporate || {};
    respondentType = "corporate";
  } else if (currentTab2 === 2) {
    respondent = step2.general?.government || {};
    respondentType = "government";
  }

  const complaint = step3.general || {};
  const files = complaint.attachment || [];

  const InfoItem = ({ label, value }) => (
    <Grid item xs={12} sm={6}>
      <Typography fontSize={16}>
        <Box component="span" fontWeight="bold">
          {label}:
        </Box>{" "}
        {typeof value === "object"
          ? value?.label || "-"
          : value || "-"}
      </Typography>
    </Grid>
  );

  const getFileIcon = (ext) => {
    switch (ext.toLowerCase()) {
      case ".pdf":
        return <PictureAsPdfIcon sx={{ color: "#d32f2f", mr: 1 }} />;
      case ".doc":
      case ".docx":
        return <DescriptionIcon sx={{ color: "#1976d2", mr: 1 }} />;
      case ".jpg":
      case ".jpeg":
      case ".png":
        return <ImageIcon sx={{ color: "#388e3c", mr: 1 }} />;
      default:
        return <DescriptionIcon sx={{ color: "#757575", mr: 1 }} />;
    }
  };

  const getFileExt = (filename) => {
    return filename.slice(filename.lastIndexOf(".")).toLowerCase();
  };

  const renderRespondentFields = () => {
    if (respondentType === "individual") {
      return (
        <>
          <InfoItem label="หมายเลขบัตรประชาชน" value={formatCitizenId_null(respondent.idCard)} />
          <InfoItem label="ชื่อ - นามสกุล" value={respondent.name} />
          <InfoItem label="ที่อยู่ที่สามารถติดต่อได้" value={respondent.address} />
          <InfoItem label="จังหวัด" value={respondent.province} />
          <InfoItem label="อำเภอ/เขต" value={respondent.districts} />
          <InfoItem label="ตำบล/แขวง" value={respondent.subdistricts} />
          <InfoItem label="รหัสไปรษณีย์" value={respondent.zipcode} />
          <InfoItem label="หมายเลขโทรศัพท์" value={formatPhoneNumber_null(respondent.phone)} />
          <InfoItem label="อีเมล์" value={respondent.email} />
        </>
      );
    }
    if (respondentType === "corporate") {
      return (
        <>
          <InfoItem label="เลขทะเบียนนิติบุคคล" value={respondent.idCard} />
          <InfoItem label="ชื่อบริษัท/องค์กร" value={respondent.companyName} />
          <InfoItem label="ชื่อผู้มีอำนาจลงนาม" value={respondent.signatoryName} />
          <InfoItem label="ที่อยู่บริษัท/องค์กรที่ติดต่อได้" value={respondent.address} />
          <InfoItem label="จังหวัด" value={respondent.province} />
          <InfoItem label="อำเภอ/เขต" value={respondent.districts} />
          <InfoItem label="ตำบล/แขวง" value={respondent.subdistricts} />
          <InfoItem label="รหัสไปรษณีย์" value={respondent.zipcode} />
          <InfoItem label="หมายเลขโทรศัพท์" value={formatPhoneNumber_null(respondent.phone)} />
          <InfoItem label="อีเมล์" value={respondent.email} />
        </>
      );
    }
    if (respondentType === "government") {
      return (
        <>
          <InfoItem label="หมายเลขบัตรประชาชน" value={formatCitizenId_null(respondent.idCard)} />
          <InfoItem label="หน่วยงาน" value={respondent.agencyName} />
          <InfoItem label="ชื่อ - นามสกุล ผู้ติดต่อ" value={respondent.fullName} />
          <InfoItem label="ที่อยู่หน่วยงานที่ติดต่อได้" value={respondent.address} />
          <InfoItem label="จังหวัด" value={respondent.province} />
          <InfoItem label="อำเภอ/เขต" value={respondent.districts} />
          <InfoItem label="ตำบล/แขวง" value={respondent.subdistricts} />
          <InfoItem label="รหัสไปรษณีย์" value={respondent.zipcode} />
          <InfoItem label="หมายเลขโทรศัพท์" value={formatPhoneNumber_null(respondent.phone)} />
          <InfoItem label="อีเมล์" value={respondent.email} />
        </>
      );
    }
    return null;
  };

  return (
    <Box>
      <Box
        sx={{
          height: 40,
          background: "linear-gradient(to right, #EDC458, #FEFAEF)",
          borderTopRightRadius: 8,
          borderTopLeftRadius: 8,
        }}
      />
      <Paper sx={{ mt: -1, p: 4, borderRadius: 2 }}>
        {/* Title */}
        <Box display="flex" alignItems="center" mb={3}>
          <Image
            src="/logo_blue.png"
            alt="โลโก้"
            width={100}
            height={100}
            style={{ objectFit: "contain" }}
          />
          <Typography variant="h6" fontWeight="bold" ml={2}>
            แบบรับคำร้องเรียน / ร้องทุกข์กระทรวงการคลัง
          </Typography>
        </Box>

        {/* ข้อมูลหัวเรื่อง */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12}>
            <InfoItem label="วันที่ร้องทุกข์" value={formatThaiDate()} />
            <InfoItem label="ประเภทเรื่องร้องทุกข์" value={complaint.complaintType} />
            <InfoItem label="เรื่อง" value={complaint.subject} />
            <InfoItem label="ช่องทางเรื่องร้องเรียน" value={complaint.channel} />
          </Grid>
        </Grid>

        <Box component="hr" sx={{ border: "1px solid", height: "1px", backgroundColor: "#999", my: 3 }} />

        {/* ผู้ร้อง */}
        <Typography variant="subtitle1" fontWeight="bold" fontSize={20} gutterBottom>
          ข้อมูลผู้ร้องทุกข์
        </Typography>
        <Grid container spacing={2} mb={3}>
          {!isComplainantCorporate ? (
            <>
              <InfoItem label="หมายเลขประจำตัวประชาชน" value={formatCitizenId_null(complainant.idCard)} />
              <InfoItem label="ชื่อ - นามสกุล" value={complainant.name} />
              <InfoItem label="ที่อยู่ที่ติดต่อได้" value={complainant.address} />
              <InfoItem label="จังหวัด" value={complainant.province} />
              <InfoItem label="อำเภอ/เขต" value={complainant.districts} />
              <InfoItem label="ตำบล/แขวง" value={complainant.subdistricts} />
              <InfoItem label="รหัสไปรษณีย์" value={complainant.zipcode} />
              <InfoItem label="อีเมล์" value={complainant.email} />
              <InfoItem label="หมายเลขโทรศัพท์" value={formatPhoneNumber_null(complainant.phone)} />
            </>
          ) : (
            <>
              <InfoItem label="เลขทะเบียนนิติบุคคล" value={complainant.idCard} />
              <InfoItem label="ชื่อบริษัท/องค์กร" value={complainant.companyName} />
              <InfoItem label="ที่อยู่บริษัท/องค์กรที่ติดต่อได้" value={complainant.address} />
              <InfoItem label="จังหวัด" value={complainant.province} />
              <InfoItem label="อำเภอ/เขต" value={complainant.districts} />
              <InfoItem label="ตำบล/แขวง" value={complainant.subdistricts} />
              <InfoItem label="รหัสไปรษณีย์" value={complainant.zipcode} />
              <InfoItem label="อีเมล์" value={complainant.email} />
              <InfoItem label="หมายเลขโทรศัพท์" value={formatPhoneNumber_null(complainant.phone)} />
            </>
          )}
        </Grid>

        {/* ผู้รับมอบอำนาจร้องเรียน */}
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          ผู้รับมอบอำนาจร้องเรียน
        </Typography>
        <Grid container spacing={2} mb={3}>
          {!isComplainantCorporate ? (
            <>
              <InfoItem label="หมายเลขประจำตัวประชาชน" value={formatCitizenId_null(delegate.idCard)} />
              <InfoItem label="ชื่อ - นามสกุล" value={delegate.name} />
              <InfoItem label="ที่อยู่ที่ติดต่อได้" value={delegate.address} />
              <InfoItem label="จังหวัด" value={delegate.province} />
              <InfoItem label="อำเภอ/เขต" value={delegate.districts} />
              <InfoItem label="ตำบล/แขวง" value={delegate.subdistricts} />
              <InfoItem label="รหัสไปรษณีย์" value={delegate.zipcode} />
              <InfoItem label="อีเมล์" value={delegate.email} />
              <InfoItem label="หมายเลขโทรศัพท์" value={formatPhoneNumber_null(delegate.phone)} />
            </>
          ) : (
            <>
              <InfoItem label="หมายเลขประจำตัวประชาชน" value={formatCitizenId_null(delegate.idCard)} />
              <InfoItem label="ชื่อผู้มีอำนาจลงนาม" value={delegate.signatoryName} />
              <InfoItem label="ที่อยู่ที่ติดต่อได้" value={delegate.address} />
              <InfoItem label="จังหวัด" value={delegate.province} />
              <InfoItem label="อำเภอ/เขต" value={delegate.districts} />
              <InfoItem label="ตำบล/แขวง" value={delegate.subdistricts} />
              <InfoItem label="รหัสไปรษณีย์" value={delegate.zipcode} />
              <InfoItem label="อีเมล์" value={delegate.email} />
              <InfoItem label="หมายเลขโทรศัพท์" value={formatPhoneNumber_null(delegate.phone)} />
            </>
          )}
        </Grid>

        <Box component="hr" sx={{ border: "1px solid", height: "1px", backgroundColor: "#999", my: 3 }} />

        {/* ผู้ถูกร้อง */}
        <Typography variant="subtitle1" fontWeight="bold" fontSize={20} gutterBottom>
          ข้อมูลผู้ถูกร้อง (ข้อมูลจากผู้ร้องทุกข์)
        </Typography>
        <Grid container spacing={2} mb={3}>
          {renderRespondentFields()}
        </Grid>

        <Box component="hr" sx={{ border: "1px solid", height: "1px", backgroundColor: "#999", my: 3 }} />

        {/* ข้อมูลเรื่องร้องทุกข์ */}
        <Typography variant="subtitle1" fontWeight="bold" fontSize={20}>
          ข้อมูลเรื่องร้องทุกข์
        </Typography>
        <Grid container spacing={2} mb={3}>
          <InfoItem label="วันและเวลาที่เกิดเหตุ" value={formatThaiDateTime(complaint.incidentDate)} />
          <Grid item xs={12}>
            <InfoItem label="รายละเอียดเรื่องร้องทุกข์" value={complaint.description} />
          </Grid>
        </Grid>

        {/* ไฟล์แนบ */}
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          เอกสารประกอบการร้องทุกข์
        </Typography>
        <Box mb={3}>
          {files.length > 0 ? (
            files.map((file, index) => {
              const ext = getFileExt(file.name || "");
              return (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    px: 2,
                    py: 1,
                    mb: 1,
                  }}
                >
                  {getFileIcon(ext)}
                  <Typography fontSize={14} color="text.secondary">
                    {file.name || `ไฟล์แนบ ${index + 1}`}
                  </Typography>
                </Box>
              );
            })
          ) : (
            <Typography fontSize={14}>ไม่มีไฟล์แนบ</Typography>
          )}
        </Box>
        <Typography fontSize={16}>ข้าพเจ้าขอรับรองว่าข้อเท็จจริงที่ได้ยื่นเรื่องร้องเรียน/ร้องทุกข์ข้างต้นเป็นความจริงทุกประการ</Typography>
        <Typography fontSize={16}>หมายเหตุ : เอกสารฉบับนี้ไม่สามารถนำไปใช้อ้างอิงเอกสารอื่น</Typography>
        <Box component="hr" sx={{ border: "1px solid", height: "1px", backgroundColor: "#999", my: 3 }} />

        {/* ลงชื่อผู้ร้องทุกข์ */}
        <Grid container spacing={2} mb={3}>
          <InfoItem label="ลงชื่อผู้ร้องทุกข์" value={complainant.name || complainant.companyName} />
          <InfoItem label="ลงชื่อผู้รับมอบอำนาจ" value={delegate.name || delegate.signatoryName} />
          <InfoItem label="วันที่" value={formatThaiDate()} />
          <InfoItem label="วันที่" value={formatThaiDate()} />
        </Grid>
      </Paper>
    </Box>
  );
};

export default Tab5;