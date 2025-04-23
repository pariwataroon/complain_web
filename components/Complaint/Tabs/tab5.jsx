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
import { formatThaiDate, formatThaiDateTime } from "@utils/Formats";

const Tab5 = ({
  stepKey,
  updateStepData,
  onAccepted = () => { },
  formData = {}
}) => {
  const [accepted, setAccepted] = useState(false);

  const {
    step1 = {},
    step2 = {},
    step3 = {},
    step4 = {},
  } = formData;

  const complainant = step1.general?.general || {};
  const delegate = step1.general?.delegate || {};
  const respondent = step2.general?.individual || {};
  const complaint = step3.general || {};
  const files = complaint.attachment || [];

  console.log({ formData });
  
  const InfoItem = ({ label, value }) => (
    <Grid item xs={12} sm={6}>
      <Typography fontSize={16}>
        <Box component="span" fontWeight="bold">
          {label}:
        </Box>{" "}
        {value || "-"}
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
          <Typography variant="h6" fontWeight="bold"  ml={2}>
            แบบรับคำร้องเรียน / ร้องทุกข์กระทรวงการคลัง
          </Typography>
        </Box>


        {/* ข้อมูลหัวเรื่อง */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12}>
            <InfoItem
              label="วันที่ร้องทุกข์"
              value={formatThaiDate()}
            />
            <InfoItem label="ประเภทเรื่องร้องทุกข์" value={complaint.complaintType} />
            <InfoItem label="เรื่อง" value={complaint.subject} />
            <InfoItem label="ช่องทางเรื่องร้องเรียน" value={complaint.channel} />
          </Grid>
        </Grid>

        <Box
          component="hr"
          sx={{
            border: "1px solid",
            height: "1px",
            backgroundColor: "#999",
            my: 3,
          }}
        />

        {/* ผู้ร้อง */}
        <Typography variant="subtitle1" fontWeight="bold" fontSize={20}  gutterBottom>
          ข้อมูลผู้ร้องทุกข์
        </Typography>
        <Grid container spacing={2} mb={3}>
          <InfoItem label="หมายเลขประจำตัวประชาชน" value={complainant.name} />
          <InfoItem label="ชื่อ - นามสกุล" value={complainant.name} />
          <InfoItem label="ที่อยู่ที่ติดต่อได้" value={complainant.name} />
          <InfoItem label="ตำบล/แขวง" value={complainant.representative} />
          <InfoItem label="อำเภอ/เขต" value={complainant.representative} />
          <InfoItem label="จังหวัด" value={complainant.representative} />
          <InfoItem label="รหัสไปรษณีย์" value={complainant.representative} />
          <InfoItem label="อีเมล์" value={complainant.representative} />
          <InfoItem label="หมายเลขโทรศัพท์" value={complainant.representative} />
        </Grid>

        {/* ผู้รับมอบอำนาจร้องเรียน */}
        <Typography variant="subtitle1" fontWeight="bold" Tab5 gutterBottom>
          ผู้รับมอบอำนาจร้องเรียน
        </Typography>
        <Grid container spacing={2} mb={3}>
          <InfoItem label="หมายเลขประจำตัวประชาชน" value={delegate.name} />
          <InfoItem label="ชื่อ - นามสกุล" value={delegate.name} />
          <InfoItem label="ที่อยู่ที่ติดต่อได้" value={delegate.name} />
          <InfoItem label="ตำบล/แขวง" value={delegate.representative} />
          <InfoItem label="อำเภอ/เขต" value={delegate.representative} />
          <InfoItem label="จังหวัด" value={delegate.representative} />
          <InfoItem label="รหัสไปรษณีย์" value={delegate.representative} />
          <InfoItem label="อีเมล์" value={delegate.representative} />
          <InfoItem label="หมายเลขโทรศัพท์" value={delegate.representative} />
        </Grid>

        <Box
          component="hr"
          sx={{
            border: "1px solid",
            height: "1px",
            backgroundColor: "#999",
            my: 3,
          }}
        />

        {/* ผู้ถูกร้อง */}
        <Typography variant="subtitle1" fontWeight="bold" fontSize={20} gutterBottom>
          ข้อมูลผู้ถูกร้อง (ข้อมูลจากผู้ร้องทุกข์)
        </Typography>
        <Grid container spacing={2} mb={3}>
          <InfoItem label="หมายเลขประจำตัวประชาชน" value={respondent.name} />
          <InfoItem label="ชื่อ - นามสกุล" value={respondent.name} />
          <InfoItem label="ที่อยู่ที่ติดต่อได้" value={respondent.name} />
          <InfoItem label="ตำบล/แขวง" value={respondent.representative} />
          <InfoItem label="อำเภอ/เขต" value={respondent.representative} />
          <InfoItem label="จังหวัด" value={respondent.representative} />
          <InfoItem label="รหัสไปรษณีย์" value={respondent.representative} />
          <InfoItem label="อีเมล์" value={respondent.representative} />
          <InfoItem label="หมายเลขโทรศัพท์" value={respondent.representative} />
        </Grid>

        <Box
          component="hr"
          sx={{
            border: "1px solid",
            height: "1px",
            backgroundColor: "#999",
            my: 3,
          }}
        />

        {/* ข้อมูลเรื่องร้องทุกข์ */}
        <Typography variant="subtitle1" fontWeight="bold" fontSize={20}>
          ข้อมูลเรื่องร้องทุกข์
        </Typography>
        <Grid container spacing={2} mb={3}>
          <InfoItem
            label="วันและเวลาที่เกิดเหตุ"
            value={formatThaiDateTime(complaint.incidentDate)}
          />
          <Grid item xs={12}>
            <InfoItem label="รายละเอียดเรื่องร้องทุกข์" value={complaint.description} />
          </Grid>
        </Grid>

        {/* ไฟล์แนบ */}
        <Typography variant="subtitle1" fontWeight="bold"  gutterBottom>
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
        <Box
          component="hr"
          sx={{
            border: "1px solid",
            height: "1px",
            backgroundColor: "#999",
            my: 3,
          }}
        />

        {/* ลงชื่อผู้ร้องทุกข์ */}
        <Grid container spacing={2} mb={3}>
          <InfoItem label="ลงชื่อผู้ร้องทุกข์" value={complainant.name} />
          <InfoItem label="ลงชื่อผู้รับมอบอำนาจ" value={delegate.name} />
          <InfoItem
            label="วันที่"
            value={formatThaiDate()}
          />          
          <InfoItem
            label="วันที่"
            value={formatThaiDate()}
          />
         
        </Grid>
      </Paper>
    </Box>
  );
};

export default Tab5;
