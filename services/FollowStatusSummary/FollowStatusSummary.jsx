import styles from "./FollowStatusSummary.module.scss";
import React, { useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  LinearProgress,
  Stack,
} from "@mui/material";
import Image from "next/image";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import ImageIcon from "@mui/icons-material/Image";
import CheckIcon from "@mui/icons-material/Check";
import UploadOutlinedIcon from "@mui/icons-material/UploadOutlined";
import ButtonService from "@services/ButtonService/ButtonService";
import { exportElementToPDF } from "@utils/exportPDF";
import {
  formatThaiDate,
  formatThaiDateTime,
  formatPhoneNumber_null,
  formatCitizenId_null,
} from "@utils/Formats";

/* ===== helper ===== */
const normalizeValue = (v, fallback = "-") =>
  v && typeof v === "object"
    ? v.label ?? v.name ?? v.value ?? fallback
    : v ?? fallback;

const Divider = () => (
  <Box
    component="hr"
    sx={{ border: 0, height: 1, bgcolor: "#D7D7D7", my: 2 }}
  />
);

const Section = ({ title, children, dense = false }) => (
  <Box sx={{ mt: dense ? 1 : 2 }}>
    <Typography
      variant="subtitle1"
      fontWeight="bold"
      fontSize={18}
      sx={{ mb: 1 }}
    >
      {title}
    </Typography>
    {children}
    <Divider />
  </Box>
);

const Row = ({ left, right }) => (
  <Grid container spacing={1} sx={{ mb: 0.25 }}>
    <Grid item xs={12} sm={6}>
      <Typography fontSize={15}>
        <Box component="span" fontWeight={700}>
          {left.label}:
        </Box>{" "}
        {normalizeValue(left.value)}
      </Typography>
    </Grid>
    <Grid item xs={12} sm={6}>
      <Typography fontSize={15} textAlign={{ sm: "right" }}>
        <Box component="span" fontWeight={700}>
          {right.label}:
        </Box>{" "}
        {normalizeValue(right.value)}
      </Typography>
    </Grid>
  </Grid>
);

const Labeled = ({ label, value }) => (
  <Typography fontSize={15} sx={{ mb: 0.35 }}>
    <Box component="span" fontWeight={700}>
      {label}:
    </Box>{" "}
    {normalizeValue(value)}
  </Typography>
);

const FileRow = ({ name }) => {
  const ext = (name || "").split(".").pop()?.toLowerCase();
  const Icon =
    ext === "pdf"
      ? PictureAsPdfIcon
      : ["jpg", "jpeg", "png"].includes(ext || "")
      ? ImageIcon
      : DescriptionIcon;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        border: "1px solid #E0E0E0",
        borderRadius: 1,
        px: 1.2,
        py: 0.6,
        mb: 0.75,
      }}
    >
      <Icon fontSize="small" sx={{ color: "#9e9e9e" }} />
      <Typography fontSize={13} sx={{ flex: 1 }}>
        {name || "ไฟล์แนบ"}
      </Typography>
      <Box sx={{ minWidth: 180 }}>
        <LinearProgress variant="determinate" value={100} />
      </Box>
    </Box>
  );
};

/* ===== main component ===== */
const FollowStatusSummary = ({ data = {} }) => {
  const pdfRef = useRef(null);

  const {
    complainant = {},
    delegate = {},
    corporate = {},
    signer = {},
    respondent = {},
    corporateS2 = {},
    government = {},
    complaint = {},
    files = [],
    agencyReports = [],
  } = data;

  // ผู้ร้อง: เลือกทีละฟิลด์ (เหมือน ComplaintSummaryService)
  const left = {
    idCard: complainant.idCard ?? corporate.idCard,
    name: complainant.name ?? corporate.name,
    address: complainant.address ?? corporate.address,
    subdistricts: complainant.subdistricts ?? corporate.subdistricts,
    district: complainant.district ?? corporate.district,
    province: complainant.province ?? corporate.province,
    zipcode: complainant.zipcode ?? corporate.zipcode,
    phone: complainant.phone ?? corporate.phone,
    email: complainant.email ?? corporate.email,
  };

  // ผู้ถูกร้อง/หน่วยงานที่เกี่ยวข้อง
  const right = {
    idCard: respondent.idCard ?? corporateS2.idCard ?? government.idCard,
    name: respondent.name ?? corporateS2.name ?? government.name,
    address: respondent.address ?? corporateS2.address ?? government.address,
    subdistricts:
      respondent.subdistricts ??
      corporateS2.subdistricts ??
      government.subdistricts,
    district:
      respondent.district ?? corporateS2.district ?? government.district,
    province:
      respondent.province ?? corporateS2.province ?? government.province,
    zipcode: respondent.zipcode ?? corporateS2.zipcode ?? government.zipcode,
    phone: respondent.phone ?? corporateS2.phone ?? government.phone,
    email: respondent.email ?? corporateS2.email ?? government.email,
  };

  // ผู้รับมอบอำนาจ (delegate/signer)
  const proxy = {
    idCard: delegate.idCard ?? signer.idCard,
    name: delegate.name ?? signer.name,
    address: delegate.address ?? signer.address,
    subdistricts: delegate.subdistricts ?? signer.subdistricts,
    district: delegate.district ?? signer.district,
    province: delegate.province ?? signer.province,
    zipcode: delegate.zipcode ?? signer.zipcode,
    phone: delegate.phone ?? signer.phone,
    email: delegate.email ?? signer.email,
  };

  // ดึง assignment_form ถ้ามี (เผื่อมาจาก data ตรงๆ)
  const assignment = data?.assignment_form || {};

  // helper ทำวันที่ไทยสั้นๆ ถ้าไม่มีให้เป็น "-"
  const thaiDateOrDash = (d) => (d ? formatThaiDate(d) : "-");

  // รวมเบอร์อ้างอิง/วันที่ที่มีอยู่
  const ref1 = assignment.reference_number || "-";
  const ref1d = thaiDateOrDash(assignment.reference_date);
  const ref2 = assignment.reference_number2 || "-";
  const ref2d = thaiDateOrDash(assignment.reference_date2);
  const ref3 = assignment.reference_number3 || "-";
  const ref3d = thaiDateOrDash(assignment.reference_date3);
  const ref4 = assignment.reference_number4 || "-";
  const ref4d = thaiDateOrDash(assignment.reference_date4);

  // หนังสือส่งหน่วยงาน/ถึงหน่วยงาน (หากระบบคุณเก็บแยก ให้มาใส่ตรงนี้)
  const outDocNo = assignment.document_number || "-";
  const outDocDate = thaiDateOrDash(assignment.document_date);

  // จำนวนการส่ง (ถ้าไม่มีในระบบ ใส่ค่าตามตัวอย่างหรือ 0)
  const sendInCnt = assignment.send_in_count ?? 2; // ตัวอย่าง
  const sendOutCnt = assignment.send_out_count ?? 3; // ตัวอย่าง

  // สถานะไทย (ถ้าแม็ปไว้ใน complaint หรือดึงจาก status_history ล่าสุด)
  const statusThai =
    complaint.status_thai ||
    data?.status_history?.[0]?.status_thai ||
    data?.status ||
    "-";

  // SLA (ถ้าไม่มีใช้ 365 วันตามรูป)
  const slaDays = assignment.sla_days ?? 365;

  // รองรับหลายคีย์เลขรับเรื่อง
  const complaintNumber =
    complaint.complaintNumber ??
    complaint.complaint_no ??
    complaint.number ??
    "-";

  const InfoItem = ({ label, value }) => (
    <Grid item xs={12} sm={6}>
      <Typography fontSize={16}>
        <Box component="span" fontWeight="bold">
          {label}:
        </Box>{" "}
        {typeof value === "object" ? value?.label || "-" : value || "-"}
      </Typography>
    </Grid>
  );
  return (
    <Box>
      <div ref={pdfRef} id="pdfRoot" className={styles.printRoot}>
        {/* ============ PAGE 1 ============ */}
        <Box>
          <div data-pdf-page className={styles.page}>
            <Box
              sx={{
                height: 40,
                background: "linear-gradient(to right, #EDC458, #FEFAEF)",
                borderTopRightRadius: 8,
                borderTopLeftRadius: 8,
              }}
            />
            <Paper
              data-pdf-block
              className={styles.pdfBlock}
              sx={{ mt: -1, p: 4, borderRadius: 2 }}
            >
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
              <Typography variant="h6" fontWeight="bold">
                เรียน ปลัดกระทรวงการคลัง
              </Typography>

              <Grid container spacing={4} mb={2}>
                {/* คอลัมน์ซ้าย */}
                <Grid item xs={12} md={6}>
                  <InfoItem
                    label="วันที่ร้องทุกข์"
                    value={
                      thaiDateOrDash(assignment.registration_date) ||
                      formatThaiDate()
                    }
                  />
                  <InfoItem
                    label="ประเภทเรื่องร้องทุกข์"
                    value={complaint.complaintType}
                  />
                  <InfoItem label="เรื่อง" value={complaint.subject} />
                  <InfoItem
                    label="ประเภทเรื่องร้องเรียน"
                    value={complaint.complaintType}
                  />
                  <InfoItem
                    label="ช่องทางเรื่องร้องเรียน"
                    value={
                      complaint.channel || assignment.complaint_channel_name
                    }
                  />
                  <InfoItem
                    label="กำหนดการกรอกคงเหลือ"
                    value={`${slaDays} วัน ( ${Math.ceil(slaDays / 365)} ปี )`}
                  />
                  <InfoItem label="สถานะเรื่อง" value={statusThai} />
                </Grid>

                {/* คอลัมน์ขวา */}
                <Grid item xs={12} md={6}>
                  <InfoItem label="เลข สป.กค." value={`${ref1} ลว. ${ref1d}`} />
                  <InfoItem label="เลข สป.สร." value={`${ref2} ลว. ${ref2d}`} />
                  <InfoItem label="เลข สปถ." value={`${ref3} ลว. ${ref3d}`} />
                  <InfoItem label="เลข สรร." value={`${ref4} ลว. ${ref4d}`} />
                  <InfoItem
                    label="หนังสือส่งหน่วยงาน / ถึงหน่วยงาน"
                    value={`${outDocNo} ลว. ${outDocDate}`}
                  />
                  <InfoItem
                    label="จำนวนครั้งการส่งหน่วยงาน"
                    value={`${sendInCnt} ครั้ง (อยู่) / ${sendOutCnt} ครั้ง (ไม่อยู่)`}
                  />
                </Grid>
              </Grid>
              <Divider />

              <Section title="ข้อมูลผู้ร้องทุกข์">
                <Grid container spacing={2} mb={3}>
                  <InfoItem
                    label="หมายเลขประจำตัวประชาชน"
                    value={formatCitizenId_null(
                      complainant.idCard || corporate.idCard
                    )}
                  />
                  <InfoItem
                    label="ชื่อ - นามสกุล"
                    value={complainant.name || corporate.name}
                  />
                  <InfoItem
                    label="ที่อยู่ที่ติดต่อได้"
                    value={complainant.address || corporate.address}
                  />
                  <InfoItem
                    label="ตำบล/แขวง"
                    value={complainant.subdistricts || corporate.subdistricts}
                  />
                  <InfoItem
                    label="อำเภอ/เขต"
                    value={complainant.district || corporate.district}
                  />
                  <InfoItem
                    label="จังหวัด"
                    value={complainant.province || corporate.province}
                  />
                  <InfoItem
                    label="รหัสไปรษณีย์"
                    value={complainant.zipcode || corporate.zipcode}
                  />
                  <InfoItem
                    label="อีเมล"
                    value={complainant.email || corporate.email}
                  />
                  <InfoItem
                    label="หมายเลขโทรศัพท์"
                    value={formatPhoneNumber_null(
                      complainant.phone || corporate.phone
                    )}
                  />
                </Grid>
              </Section>

              <Section title="ผู้รับมอบอำนาจร้องเรียน">
                <Grid container spacing={2} mb={3}>
                  <InfoItem
                    label="หมายเลขประจำตัวประชาชน"
                    value={formatCitizenId_null(
                      delegate.idCard || signer.idCard
                    )}
                  />
                  <InfoItem
                    label="ชื่อ - นามสกุล"
                    value={delegate.name || signer.name}
                  />
                  <InfoItem
                    label="ที่อยู่ที่ติดต่อได้"
                    value={delegate.address || signer.address}
                  />
                  <InfoItem
                    label="ตำบล/แขวง"
                    value={delegate.subdistricts || signer.subdistricts}
                  />
                  <InfoItem
                    label="อำเภอ/เขต"
                    value={delegate.district || signer.district}
                  />
                  <InfoItem
                    label="จังหวัด"
                    value={delegate.province || signer.province}
                  />
                  <InfoItem
                    label="รหัสไปรษณีย์"
                    value={delegate.zipcode || signer.zipcode}
                  />
                  <InfoItem
                    label="อีเมล"
                    value={delegate.email || signer.email}
                  />
                  <InfoItem
                    label="หมายเลขโทรศัพท์"
                    value={formatPhoneNumber_null(
                      delegate.phone || signer.phone
                    )}
                  />
                </Grid>
              </Section>

              <Section title="ข้อมูลผู้ถูกร้อง (ข้อมูลจากผู้ร้องทุกข์)">
                <Grid container spacing={2} mb={3}>
                  <InfoItem
                    label="หมายเลขประจำตัวประชาชน"
                    value={formatCitizenId_null(
                      respondent.idCard ||
                        corporateS2.idCard ||
                        government.idCard
                    )}
                  />
                  <InfoItem
                    label="ชื่อ - นามสกุล"
                    value={
                      respondent.name || corporateS2.name || government.name
                    }
                  />
                  <InfoItem
                    label="ที่อยู่ที่ติดต่อได้"
                    value={
                      respondent.address ||
                      corporateS2.address ||
                      government.address
                    }
                  />
                  <InfoItem
                    label="ตำบล/แขวง"
                    value={
                      respondent.subdistricts ||
                      corporateS2.subdistricts ||
                      government.subdistricts
                    }
                  />
                  <InfoItem
                    label="อำเภอ/เขต"
                    value={
                      respondent.district ||
                      corporateS2.district ||
                      government.district
                    }
                  />
                  <InfoItem
                    label="จังหวัด"
                    value={
                      respondent.province ||
                      corporateS2.province ||
                      government.province
                    }
                  />
                  <InfoItem
                    label="รหัสไปรษณีย์"
                    value={
                      respondent.zipcode ||
                      corporateS2.zipcode ||
                      government.zipcode
                    }
                  />
                  <InfoItem
                    label="อีเมล"
                    value={
                      respondent.email || corporateS2.email || government.email
                    }
                  />
                  <InfoItem
                    label="หมายเลขโทรศัพท์"
                    value={formatPhoneNumber_null(
                      respondent.phone || corporateS2.phone || government.phone
                    )}
                  />
                </Grid>
              </Section>

              <Section title="ข้อมูลเรื่องร้องทุกข์">
                <Grid container spacing={2} mb={3}>
                  <InfoItem
                    label="วันและเวลาที่เกิดเหตุ"
                    value={formatThaiDateTime(complaint.incidentDate)}
                  />
                  <Grid item xs={12}>
                    <InfoItem
                      label="รายละเอียดเรื่องร้องทุกข์"
                      value={complaint.description}
                    />
                  </Grid>
                </Grid>
              </Section>

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

              <Typography fontSize={16}>
                ข้าพเจ้าขอรับรองว่าข้อเท็จจริงที่ได้ยื่นเรื่องร้องเรียน/ร้องทุกข์ข้างต้นเป็นความจริงทุกประการ
              </Typography>
              <Typography fontSize={16}>
                หมายเหตุ : เอกสารฉบับนี้ไม่สามารถนำไปใช้อ้างอิงเอกสารอื่น
              </Typography>

              <Divider />
            </Paper>
          </div>
        </Box>
        <Box className={`page-break ${styles.pageBreak}`} />

        {/* ============ PAGE 2 ============ */}
        <div data-pdf-page className={styles.page}>
          <Box
            sx={{
              height: 40,
              background: "linear-gradient(to right, #EDC458, #FEFAEF)",
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
            }}
          />
          <Paper
            data-pdf-block
            className={`${styles.avoidBreak} ${styles.pdfBlock}`}
            sx={{ mt: -1, p: { xs: 2, md: 4 }, borderRadius: 2 }}
          >
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              รายงานผลการพิจารณาจากหน่วยงาน
            </Typography>
            {(Array.isArray(agencyReports) && agencyReports.length > 0
              ? agencyReports
              : [{}]
            ).map((r, idx) => (
              <Grid
                container
                spacing={1}
                data-pdf-block
                className={styles.pdfBlock}
              >
                {/* คอลัมน์ซ้าย */}
                <Grid item xs={12} md={6}>
                  <InfoItem
                    label="หน่วยงานรับเรื่อง"
                    value={r?.agency_name || "-"}
                  />
                  <InfoItem label="สถานะเรื่อง" value={statusThai} />
                  <InfoItem
                    label="ดำเนินการภายใน"
                    value={`${slaDays} วัน ( ${Math.ceil(slaDays / 365)} ปี )`}
                  />
                </Grid>

                {/* คอลัมน์ขวา */}
                <Grid item xs={12} md={6}>
                  <InfoItem
                    label="หนังสือส่งหน่วยงาน / ติดตามผล"
                    value={`${outDocNo} ลว. ${outDocDate}`}
                  />
                  <InfoItem
                    label="จำนวนครั้งการส่งหน่วยงาน"
                    value={`${sendInCnt} ครั้ง (อยู่) / ${sendOutCnt} ครั้ง (ไม่อยู่)`}
                  />
                </Grid>

                <Grid item xs={12} sx={{ mt: 1 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                  >
                    เอกสารขอทราบผลการพิจารณา / ผลความคืบหน้า
                  </Typography>

                  <Box mb={3}>
                    {Array.isArray(r?.attachments) &&
                    r.attachments.length > 0 ? (
                      r.attachments.map((af, j) => {
                        const ext = getFileExt(af?.name || "");
                        return (
                          <Box
                            key={`${idx}-${j}`}
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
                            <Typography
                              fontSize={14}
                              color="text.secondary"
                              sx={{ ml: 1 }}
                            >
                              {af?.name || `ไฟล์แนบ ${j + 1}`}
                            </Typography>
                          </Box>
                        );
                      })
                    ) : (
                      <Typography fontSize={14} color="text.secondary">
                        ไม่มีไฟล์แนบ
                      </Typography>
                    )}
                  </Box>
                  <Typography fontSize={16}>
                    หมายเหตุ : เอกสารฉบับนี้ไม่สามารถนำไปใช้อ้างอิงเอกสารอื่น
                  </Typography>
                </Grid>
                <Grid item xs={12} sx={{ mt: 1 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                  >
                    เอกสารผลการพิจารณาจากหน่วยงาน
                  </Typography>

                  <Box mb={3}>
                    {Array.isArray(r?.attachments) &&
                    r.attachments.length > 0 ? (
                      r.attachments.map((af, j) => {
                        const ext = getFileExt(af?.name || "");
                        return (
                          <Box
                            key={`${idx}-${j}`}
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
                            <Typography
                              fontSize={14}
                              color="text.secondary"
                              sx={{ ml: 1 }}
                            >
                              {af?.name || `ไฟล์แนบ ${j + 1}`}
                            </Typography>
                          </Box>
                        );
                      })
                    ) : (
                      <Typography fontSize={14} color="text.secondary">
                        ไม่มีไฟล์แนบ
                      </Typography>
                    )}
                  </Box>
                  <InfoItem
                    label="ผลการพิจารณาจากหน่วยงาน"
                    value={statusThai}
                  />
                </Grid>
              </Grid>
            ))}

            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, mt: 3 }}>
              รายงานผลการพิจารณาจากหน่วยงาน
            </Typography>
            {(Array.isArray(agencyReports) && agencyReports.length > 0
              ? agencyReports
              : [
                  /** เคสไม่มีข้อมูล: render แถวว่าง 1 แถวที่เป็น "-" ทั้งหมด */ {},
                ]
            ).map((r, idx) => (
              <Grid
                container
                spacing={1}
                data-pdf-block
                className={styles.pdfBlock}
              >
                {/* คอลัมน์ซ้าย */}
                <Grid item xs={12} md={6}>
                  <InfoItem
                    label="หน่วยงานรับเรื่อง"
                    value={r?.agency_name || "-"}
                  />
                  <InfoItem label="สถานะเรื่อง" value={statusThai} />
                  <InfoItem
                    label="ดำเนินการภายใน"
                    value={`${slaDays} วัน ( ${Math.ceil(slaDays / 365)} ปี )`}
                  />
                </Grid>

                {/* คอลัมน์ขวา */}
                <Grid item xs={12} md={6}>
                  <InfoItem
                    label="หนังสือส่งหน่วยงาน / ติดตามผล"
                    value={`${outDocNo} ลว. ${outDocDate}`}
                  />
                  <InfoItem
                    label="จำนวนครั้งการส่งหน่วยงาน"
                    value={`${sendInCnt} ครั้ง (อยู่) / ${sendOutCnt} ครั้ง (ไม่อยู่)`}
                  />
                </Grid>

                <Grid item xs={12} sx={{ mt: 1 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                  >
                    เอกสารขอทราบผลการพิจารณา / ผลความคืบหน้า
                  </Typography>

                  <Box mb={3}>
                    {Array.isArray(r?.attachments) &&
                    r.attachments.length > 0 ? (
                      r.attachments.map((af, j) => {
                        const ext = getFileExt(af?.name || "");
                        return (
                          <Box
                            key={`${idx}-${j}`}
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
                            <Typography
                              fontSize={14}
                              color="text.secondary"
                              sx={{ ml: 1 }}
                            >
                              {af?.name || `ไฟล์แนบ ${j + 1}`}
                            </Typography>
                          </Box>
                        );
                      })
                    ) : (
                      <Typography fontSize={14} color="text.secondary">
                        ไม่มีไฟล์แนบ
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            ))}

            {/* ช่องลงชื่อ */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <Typography fontSize={15} sx={{ mb: 0.5 }}>
                  <Box component="span" fontWeight={700}>
                    ลงชื่อผู้ร้องทุกข์
                  </Box>{" "}
                  : {normalizeValue(left.name)}
                </Typography>
                <Typography fontSize={13} color="text.secondary">
                  วันที่ : {formatThaiDate()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography fontSize={15} sx={{ mb: 0.5 }}>
                  <Box component="span" fontWeight={700}>
                    ลงชื่อผู้รับมอบอำนาจ
                  </Box>{" "}
                  : {normalizeValue(proxy.name)}
                </Typography>
                <Typography fontSize={13} color="text.secondary">
                  วันที่ : {formatThaiDate()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography fontSize={15} sx={{ mb: 0.5 }}>
                  <Box component="span" fontWeight={700}>
                    ลงชื่อเจ้าหน้าที่บันทึกข้อมูล
                  </Box>{" "}
                  : {normalizeValue(left.name)}
                </Typography>
                <Typography fontSize={13} color="text.secondary">
                  วันที่ : {formatThaiDate()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography fontSize={15} sx={{ mb: 0.5 }}>
                  <Box component="span" fontWeight={700}>
                    ลงชื่อเจ้าหน้าที่ผู้รับผิดชอบ
                  </Box>{" "}
                  : {normalizeValue(agencyReports?.[0]?.reporter_name)}
                </Typography>
                <Typography fontSize={13} color="text.secondary">
                  วันที่ :{" "}
                  {normalizeValue(
                    agencyReports?.[0]?.report_date ?? formatThaiDate()
                  )}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </div>
      </div>

      {/* ปุ่ม */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        justifyContent="center"
        alignItems="center"
        sx={{
          mt: 3,
          px: 2,
          py: 1,
          backgroundColor: "#f5f5f5",
          borderRadius: 1,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
        className="no-print"
      >
        <ButtonService
          label="ยืนยัน"
          color="ยืนยัน"
          variant="contained"
          iconRight={<CheckIcon />}
          onClick={() => window.history.back()}
        />
        <ButtonService
          label="ส่งออก"
          color="ส่งออก"
          variant="outlined"
          iconRight={<UploadOutlinedIcon />}
          onClick={() =>
            exportElementToPDF("pdfRoot", "แบบฟอร์มติดตามสถานะ.pdf")
          }
        />
      </Stack>
    </Box>
  );
};

export default FollowStatusSummary;
