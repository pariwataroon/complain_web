import { useRef } from "react";
import { Box, Paper, Typography, Grid, CircularProgress } from "@mui/material";
import ButtonService from "@services/ButtonService/ButtonService";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import ImageIcon from "@mui/icons-material/Image";
import DownloadIcon from "@mui/icons-material/Download";
import Image from "next/image";
import {
  formatThaiDate,
  formatThaiDateTime,
  formatPhoneNumber_null,
  formatCitizenId_null,
} from "@utils/Formats";
import { exportElementToPDF } from "@utils/exportPDF";
import UploadOutlinedIcon from "@mui/icons-material/UploadOutlined";

const ComplaintIDService = ({ complaint }) => {
  if (!complaint)
    return (
      <Box display="flex" justifyContent="center" my={5}>
        <CircularProgress />
      </Box>
    );

  const step1 = complaint.step1?.general ?? {};
  const generalMain = step1.general ?? {};
  let complainant = {};
  let complainantType = "individual";
  if (generalMain.corporate) {
    // new API: step1.general.general.corporate
    complainant = generalMain.corporate;
    complainantType = "corporate";
  } else {
    complainant = generalMain;
    complainantType = "individual";
  }
  // delegate/ผู้รับมอบอำนาจ
  const delegate = step1.delegate || generalMain.signer || {};

  // ====== STEP2: Dynamic respondent (individual/corporate/government) ======
  const step2 = complaint.step2?.general ?? {};
  const respondentType =
    step2.activeType ||
    (step2.individual
      ? "individual"
      : step2.corporate
      ? "corporate"
      : step2.government
      ? "government"
      : "");
  let respondent = {};
  if (respondentType === "corporate") {
    respondent = step2.corporate || {};
  } else if (respondentType === "government") {
    respondent = step2.government || {};
  } else {
    respondent = step2.individual || {};
  }
  // respondent email: on step2.general.email
  const respondentEmail = step2.email || respondent.email || "-";

  // ====== STEP3: Complaint Detail ======
  const step3 = complaint.step3?.general ?? {};
  const files = step3.attachment ?? [];

  const label = (obj) =>
    typeof obj === "object" ? obj?.label || "-" : obj || "-";

  const pdfRef = useRef();

  const InfoItem = ({ labelText, value }) => (
    <Grid item xs={12} sm={6}>
      <Typography fontSize={16}>
        <Box component="span" fontWeight="bold">
          {labelText}:
        </Box>{" "}
        {value}
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

  const getFileExt = (filename) =>
    (filename || "").slice((filename || "").lastIndexOf(".")).toLowerCase();

  // Join base and path safely
  const joinUrl = (base, path) => {
    if (!base) return path;
    const b = base.replace(/\/$/, "");
    const p = (path || "").startsWith("/") ? path : `/${path || ""}`;
    return `${b}${p}`;
  };

  const resolveFileUrl = (raw) => {
    const url =
      raw?.fileUrl ||
      raw?.url ||
      raw?.file_url ||
      raw?.path ||
      raw?.file_path ||
      raw?.file ||
      raw; // allow raw string

    if (!url) return "";
    const s = typeof url === "string" ? url : String(url);
    if (/^https?:\/\//i.test(s)) return s;
    // Prefer API base for static uploads
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (apiBase) return joinUrl(apiBase, s);
    // Fallback to current origin
    if (typeof window !== "undefined") return joinUrl(window.location.origin, s);
    return s;
  };

  // ฟังก์ชันสำหรับดาวน์โหลดไฟล์
  const handleDownloadFile = (fileInput, fileName) => {
    const downloadUrl = resolveFileUrl(fileInput);
    if (!downloadUrl) return;

    try {
      const link = document.createElement("a");
      link.href = downloadUrl;
      // Keep default filename if server sets it; otherwise hint
      if (fileName) link.download = fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      // graceful fallback: open new tab
      window.open(downloadUrl, "_blank");
    }
  };

  // ====== Render Respondent By Type ======
  const renderRespondentFields = () => {
    if (respondentType === "individual") {
      return (
        <>
          <InfoItem
            labelText="หมายเลขบัตรประชาชน"
            value={formatCitizenId_null(respondent.idCard)}
          />
          <InfoItem labelText="ชื่อ - นามสกุล" value={respondent.name} />
          <InfoItem
            labelText="ที่อยู่ที่สามารถติดต่อได้"
            value={respondent.address}
          />
          <InfoItem labelText="จังหวัด" value={label(respondent.province)} />
          <InfoItem labelText="อำเภอ/เขต" value={label(respondent.districts)} />
          <InfoItem
            labelText="ตำบล/แขวง"
            value={label(respondent.subdistricts)}
          />
          <InfoItem
            labelText="รหัสไปรษณีย์"
            value={respondent.zipcode?.label || "-"}
          />
          <InfoItem
            labelText="หมายเลขโทรศัพท์"
            value={formatPhoneNumber_null(respondent.phone)}
          />
          <InfoItem labelText="อีเมล" value={respondentEmail} />
        </>
      );
    }
    if (respondentType === "corporate") {
      return (
        <>
          <InfoItem labelText="เลขทะเบียนนิติบุคคล" value={respondent.idCard} />
          <InfoItem
            labelText="ชื่อบริษัท/องค์กร"
            value={respondent.companyName}
          />
          <InfoItem
            labelText="ชื่อผู้มีอำนาจลงนาม"
            value={respondent.signatoryName}
          />
          <InfoItem
            labelText="ที่อยู่บริษัท/องค์กรที่ติดต่อได้"
            value={respondent.address}
          />
          <InfoItem labelText="จังหวัด" value={label(respondent.province)} />
          <InfoItem labelText="อำเภอ/เขต" value={label(respondent.districts)} />
          <InfoItem
            labelText="ตำบล/แขวง"
            value={label(respondent.subdistricts)}
          />
          <InfoItem
            labelText="รหัสไปรษณีย์"
            value={respondent.zipcode?.label || "-"}
          />
          <InfoItem
            labelText="หมายเลขโทรศัพท์"
            value={formatPhoneNumber_null(respondent.phone)}
          />
          <InfoItem labelText="อีเมล" value={respondentEmail} />
        </>
      );
    }
    if (respondentType === "government") {
      return (
        <>
          <InfoItem
            labelText="หมายเลขบัตรประชาชน"
            value={formatCitizenId_null(respondent.idCard)}
          />
          <InfoItem labelText="หน่วยงาน" value={respondent.agencyName} />
          <InfoItem
            labelText="ชื่อ - นามสกุล ผู้ติดต่อ"
            value={respondent.fullName}
          />
          <InfoItem
            labelText="ที่อยู่หน่วยงานที่ติดต่อได้"
            value={respondent.address}
          />
          <InfoItem labelText="จังหวัด" value={label(respondent.province)} />
          <InfoItem labelText="อำเภอ/เขต" value={label(respondent.districts)} />
          <InfoItem
            labelText="ตำบล/แขวง"
            value={label(respondent.subdistricts)}
          />
          <InfoItem
            labelText="รหัสไปรษณีย์"
            value={respondent.zipcode?.label || "-"}
          />
          <InfoItem
            labelText="หมายเลขโทรศัพท์"
            value={formatPhoneNumber_null(respondent.phone)}
          />
          <InfoItem labelText="อีเมล" value={respondentEmail} />
        </>
      );
    }
    return null;
  };

  // ====== Render Complainant By Type ======
  const renderComplainantFields = () => {
    if (complainantType === "corporate") {
      return (
        <>
          <InfoItem
            labelText="เลขทะเบียนนิติบุคคล"
            value={complainant.idCard}
          />
          <InfoItem labelText="ชื่อบริษัท/องค์กร" value={complainant.name} />
          <InfoItem labelText="ที่อยู่นิติบุคคล" value={complainant.address} />
          <InfoItem labelText="จังหวัด" value={label(complainant.province)} />
          <InfoItem
            labelText="อำเภอ/เขต"
            value={label(complainant.districts)}
          />
          <InfoItem
            labelText="ตำบล/แขวง"
            value={label(complainant.subdistricts)}
          />
          <InfoItem
            labelText="รหัสไปรษณีย์"
            value={complainant.zipcode?.label || "-"}
          />
          <InfoItem labelText="อีเมล" value={complainant.email} />
          <InfoItem
            labelText="หมายเลขโทรศัพท์"
            value={formatPhoneNumber_null(complainant.phone)}
          />
        </>
      );
    }
    // individual/default
    return (
      <>
        <InfoItem
          labelText="หมายเลขประจำตัวประชาชน"
          value={formatCitizenId_null(complainant.idCard)}
        />
        <InfoItem labelText="ชื่อ - นามสกุล" value={complainant.name} />
        <InfoItem
          labelText="ที่อยู่ที่สามารถติดต่อได้"
          value={complainant.address}
        />
        <InfoItem labelText="จังหวัด" value={label(complainant.province)} />
        <InfoItem labelText="อำเภอ/เขต" value={label(complainant.districts)} />
        <InfoItem
          labelText="ตำบล/แขวง"
          value={label(complainant.subdistricts)}
        />
        <InfoItem
          labelText="รหัสไปรษณีย์"
          value={complainant.zipcode?.label || "-"}
        />
        <InfoItem labelText="อีเมล" value={complainant.email} />
        <InfoItem
          labelText="หมายเลขโทรศัพท์"
          value={formatPhoneNumber_null(complainant.phone)}
        />
      </>
    );
  };

  // ====== Render Delegate (ใช้ได้ทั้งบุคคล/นิติบุคคล) ======
  const renderDelegateFields = () => {
    // show only if at least 1 field exists
    const hasData = delegate && Object.keys(delegate).some((k) => delegate[k]);
    if (!hasData) return null;
    return (
      <>
        <Section title="ผู้รับมอบอำนาจร้องเรียน">
          <Grid container spacing={2} mb={3}>
            <InfoItem
              labelText="หมายเลขประจำตัวประชาชน"
              value={formatCitizenId_null(delegate.idCard)}
            />
            <InfoItem
              labelText="ชื่อ - นามสกุล"
              value={delegate.name || delegate.signatoryName}
            />
            <InfoItem labelText="ที่อยู่" value={delegate.address} />
            <InfoItem labelText="จังหวัด" value={label(delegate.province)} />
            <InfoItem labelText="อำเภอ/เขต" value={label(delegate.districts)} />
            <InfoItem
              labelText="ตำบล/แขวง"
              value={label(delegate.subdistricts)}
            />
            <InfoItem
              labelText="รหัสไปรษณีย์"
              value={delegate.zipcode?.label || "-"}
            />
            <InfoItem labelText="อีเมล" value={delegate.email} />
            <InfoItem
              labelText="โทรศัพท์"
              value={formatPhoneNumber_null(delegate.phone)}
            />
          </Grid>
        </Section>
      </>
    );
  };

  return (
    <Box>
      <div ref={pdfRef}>
        <Box
          sx={{
            height: 40,
            background: "linear-gradient(to right, #EDC458, #FEFAEF)",
            borderTopRightRadius: 8,
            borderTopLeftRadius: 8,
          }}
        />
        <Paper sx={{ mt: -1, p: 4, borderRadius: 2 }}>
          {/* Header & Logo */}
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

          {/* ข้อมูลคำร้อง */}
          <Grid container spacing={2} mb={3}>
            <InfoItem
              labelText="วันที่ร้องทุกข์"
              value={formatThaiDate(complaint.created_at)}
            />
            <InfoItem
              labelText="เลขที่คำร้อง"
              value={complaint.complaint_number || "-"}
            />
            <InfoItem
              labelText="ประเภทเรื่องร้องทุกข์"
              value={step3.complaintType || "-"}
            />
            <InfoItem labelText="เรื่อง" value={step3.subject || "-"} />
            <InfoItem
              labelText="วันเวลาที่เกิดเหตุ"
              value={
                step3.incidentDate
                  ? formatThaiDateTime(step3.incidentDate)
                  : "-"
              }
            />
          </Grid>
          <Divider />

          {/* ผู้ร้องทุกข์ */}
          <Section title="ข้อมูลผู้ร้องทุกข์">
            <Grid container spacing={2} mb={3}>
              {renderComplainantFields()}
            </Grid>
          </Section>

          {/* ผู้รับมอบอำนาจ (ถ้ามี) */}
          {renderDelegateFields()}

          {/* ผู้ถูกร้องทุกข์ */}
          <Section title="ข้อมูลผู้ถูกร้องทุกข์">
            <Grid container spacing={2} mb={3}>
              {renderRespondentFields()}
            </Grid>
          </Section>

          {/* รายละเอียดเรื่องร้องทุกข์ */}
          <Section title="รายละเอียดเรื่องร้องทุกข์">
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12}>
                <Typography>{step3.description || "-"}</Typography>
              </Grid>
            </Grid>
          </Section>

          {/* เอกสารแนบ */}
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            เอกสารประกอบการร้องทุกข์
          </Typography>
          <Box mb={3}>
            {files.length > 0 ? (
              files.map((file, idx) => {
                const fileName = file?.fileName || file?.name || `ไฟล์แนบ ${idx + 1}`;
                const fileUrl = resolveFileUrl(file);
                const ext = getFileExt(fileName);

                return (
                  <Box
                    key={idx}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      px: 2,
                      py: 1,
                      mb: 1,
                      cursor: file.fileUrl ? "pointer" : "default",
                      "&:hover": file.fileUrl
                        ? {
                            backgroundColor: "#f5f5f5",
                            borderColor: "#999",
                          }
                        : {},
                    }}
                    onClick={() => fileUrl && handleDownloadFile(fileUrl, fileName)}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", flex: 1 }}
                    >
                      {getFileIcon(ext)}
                      <Typography fontSize={14} color="text.secondary">
                        {fileName}
                      </Typography>
                    </Box>

                    {fileUrl && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", ml: 2 }}
                      >
                        <DownloadIcon
                          sx={{
                            color: "#1976d2",
                            fontSize: 20,
                            "&:hover": {
                              color: "#1565c0",
                            },
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                );
              })
            ) : (
              <Typography fontSize={14} color="text.secondary">
                ไม่มีไฟล์แนบ
              </Typography>
            )}
          </Box>

          {/* รับรอง */}
          <Typography fontSize={16} mb={1}>
            ข้าพเจ้าขอรับรองว่าข้อเท็จจริงที่ได้ยื่นเรื่องร้องเรียน/ร้องทุกข์ข้างต้นเป็นความจริงทุกประการ
          </Typography>
          <Typography fontSize={16} mb={3}>
            หมายเหตุ : เอกสารฉบับนี้ไม่สามารถนำไปใช้อ้างอิงเอกสารอื่น
          </Typography>

          <Divider />

          {/* ลายเซ็น */}
          <Grid container spacing={2} mb={3}>
            <InfoItem
              labelText="ลงชื่อผู้ร้องทุกข์"
              value={complainant.name || complainant.companyName || "-"}
            />
            <InfoItem
              labelText="ลงชื่อผู้รับมอบอำนาจ"
              value={delegate.name || delegate.signatoryName || "-"}
            />
            <InfoItem labelText="วันที่" value={formatThaiDate()} />
            <InfoItem labelText="วันที่" value={formatThaiDate()} />
          </Grid>
        </Paper>
      </div>

      {/* ปุ่ม Action */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4, gap: 2 }}>
        <ButtonService
          label="ส่งออก"
          color="ส่งออก"
          variant="outlined"
          onClick={() => exportElementToPDF(pdfRef, "แบบฟอร์มร้องทุกข์.pdf")}
          iconRight={<UploadOutlinedIcon />}
        />
      </Box>
    </Box>
  );
};

const Section = ({ title, children }) => (
  <>
    <Typography
      variant="subtitle1"
      fontWeight="bold"
      fontSize={20}
      gutterBottom
    >
      {title}
    </Typography>
    {children}
    <Divider />
  </>
);

const Divider = () => (
  <Box
    component="hr"
    sx={{ border: "1px solid", height: "1px", backgroundColor: "#999", my: 3 }}
  />
);

export default ComplaintIDService;
