import React, { useRef, useEffect, useState   } from "react";
import {
    Box,
    Paper,
    Typography,
    Grid,
} from "@mui/material";
import { useRouter } from "next/router";
import ButtonService from "@services/ButtonService/ButtonService";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import ImageIcon from "@mui/icons-material/Image";
import Image from "next/image";
import {
  formatThaiDate,
  formatThaiDateTime,
  formatPhoneNumber_null,
  formatCitizenId_null,
} from "@utils/Formats";
import { exportElementToPDF2 } from "@utils/exportPDF2";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CheckIcon from "@mui/icons-material/Check";
import UploadOutlinedIcon from "@mui/icons-material/UploadOutlined";

const ComplaintSummaryService = ({ data = {}, handleSubmit = {}, onRefresh }) => {
  const router = useRouter();
  const [complaintId, setComplaintId] = useState(null);

  // Log ข้อมูลที่รับเข้ามา
  console.log("ComplaintSummaryService received data:", data);
  console.log("Complainant:", data?.complainant);
  console.log("Delegate:", data?.delegate);
  console.log("Respondent:", data?.respondent);

  // เช็คว่ามี 'complaint.id' ใน data หรือไม่
  useEffect(() => {
    if (data?.complaint?.id) {
      setComplaintId(data?.complaint?.id); // ใช้ complaint.id
    } else {
      // console.error("Complaint ID is missing in the data.");
    }
  }, [data]);

  const handleEdit = () => {
    if (complaintId) {
      console.log("Navigating to:", `/admin/edit/website-complaints/${complaintId}`);
      router.push(`/admin/edit/website-complaints/${complaintId}`);
    } else {
      console.error("Complaint ID is missing.");
    }
  };

  const handleConfirm = () => {
    // รีเฟรชข้อมูลก่อนกลับ
    if (onRefresh) {
      onRefresh();
    }
    router.back();
  };
  const pdfRef = useRef();

  // แก้กรณีวันที่รูปแบบมี microseconds 6 หลัก (เช่น 2025-09-11T09:23:42.007000)
  // ให้ตัดให้เหลือ 3 หลัก เพื่อให้ dayjs อ่านได้ และใช้ฟังก์ชันรูปแบบวันที่ที่ตั้งค่าโซนเวลาเป็น Asia/Bangkok
  const normalizeIso = (value) => {
    if (!value) return "";
    return String(value).replace(/(\.\d{3})\d+$/, "$1");
  };
  
  // ใช้ข้อมูลที่ map มาแล้วจาก data (+ fallback จาก payload ตรง ๆ)
  const complainant = data?.complainant || data?.step1?.general?.general || {};
  const delegate = data?.delegate || data?.step1?.general?.delegate || {};
  const respondent =
    data?.respondent || data?.step2?.general?.[data?.step2?.general?.activeType || "individual"] || {};
  const complaint = data?.complaint || data?.step3?.general || {};
  const assignmentForm = data?.assignment_form || {};

  const resolvedComplaintTypeName = (
    assignmentForm.complaint_type_name ||
    complaint.complaintTypeName ||
    complaint.complaintType ||
    assignmentForm.complaint_type ||
    ''
  );
  const resolvedComplaintTypeId = (
    assignmentForm.complaint_type_id ||
    complaint.complaintTypeId ||
    assignmentForm.complaint_type ||
    ''
  );
  const resolvedComplaintTypeDisplay = resolvedComplaintTypeName || resolvedComplaintTypeId || '-';

  const resolvedComplaintSubtypeName = (
    assignmentForm.complaint_subtype_name ||
    complaint.complaintSubtypeName ||
    complaint.complaintSubtype ||
    complaint.complaint_subtype_name ||
    complaint.complaint_subtype_data?.name ||
    assignmentForm.complaint_subtype ||
    ''
  );
  const resolvedComplaintSubtypeId = (
    assignmentForm.complaint_subtype_id ||
    complaint.complaintSubtypeId ||
    assignmentForm.complaint_subtype ||
    ''
  );
  const resolvedComplaintSubtypeDisplay = resolvedComplaintSubtypeName || resolvedComplaintSubtypeId || '-';

  const resolvedAssignedTo = assignmentForm.assigned_to || data?.assigned_to || '-';
  const resolvedAssignedDate = assignmentForm.assigned_date || data?.assigned_date || '';

  if (typeof window !== 'undefined') {
    console.debug('Resolved fields:', {
      complaintTypeName: resolvedComplaintTypeName,
      complaintTypeId: resolvedComplaintTypeId,
      complaintSubtypeName: resolvedComplaintSubtypeName,
      complaintSubtypeId: resolvedComplaintSubtypeId,
      assigned_to: resolvedAssignedTo,
      assigned_date: resolvedAssignedDate,
    });
  }
  // รวมไฟล์แนบจากหลายรูปแบบเข้าเป็นโครงสร้างเดียว
  const rawFiles =
    data?.files || complaint?.attachment || data?.step3?.general?.attachment || [];

  // ข้อมูลเดิมสำหรับ backward compatibility (ถ้ามี)
  const {
    corporate = {},
    signer = {},
    corporateS2 = {},
    government = {},
  } = data;

  // Helper function เพื่อตรวจสอบว่ามีข้อมูลหรือไม่
  const hasData = (obj) => {
    return obj && Object.values(obj).some(value => value && value !== "");
  };

  // กำหนดประเภทผู้ร้องทุกข์
  const complainantType = hasData(complainant) ? 'complainant' : hasData(government) ? 'government' : hasData(corporate) ? 'corporate' : 'individual';
  const delegateType = hasData(delegate) ? 'delegate' : hasData(signer) ? 'signer' : 'none';
  const respondentType = hasData(respondent) ? 'respondent' : hasData(government) ? 'government' : hasData(corporateS2) ? 'corporate' : 'individual';

  console.log('Data types detected:', { complainantType, delegateType, respondentType });
  console.log('Mapped data received:', { complainant, delegate, respondent, complaint });
  console.log('Original data:', data);

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

  const getFileExt = (filename = "") => {
    if (!filename) return "";
    const q = filename.split("?")[0];
    const dot = q.lastIndexOf(".");
    return dot >= 0 ? q.slice(dot).toLowerCase() : "";
  };

  const fixAttachmentUrl = (url = "") => {
    if (!url) return "";
    // if already absolute with http(s) leave it
    if (/^https?:\/\//i.test(url)) return url;
    // ensure leading slash
    let u = url.startsWith('/') ? url : '/' + url;
    // if missing /api prefix for uploads, add it
    if (/^\/uploads\//.test(u)) {
      u = '/api' + u; // now /api/uploads/...
    }
    return u;
  };

  // แปลงไฟล์แนบให้มีฟิลด์มาตรฐาน { name, url, type, size }
  const normalizeFiles = (arr = []) =>
    (Array.isArray(arr) ? arr : []).map((f, i) => {
      const rawName = f.name || f.fileName || f.filename || `ไฟล์แนบ ${i + 1}`;
      const rawUrl = f.url || f.fileUrl || f.path || "";
      const fixedUrl = fixAttachmentUrl(rawUrl);
      const type = f.type || f.fileType || getFileExt(f.fileName || f.name || f.url);
      const size = f.size || f.fileSize || undefined;
      return { name: rawName, url: fixedUrl, type, size };
    });

  const files = normalizeFiles(rawFiles);

    // const router = useRouter();

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

          <Grid container spacing={2} mb={3}>
            <Grid item xs={12}>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Box flex={1} minWidth={280}>
                  <InfoItem label="วันที่ร้องทุกข์" value={formatThaiDate()} />
                </Box>
                <Box flex={1} minWidth={280}>
                  <InfoItem
                    label="ช่องทางเรื่องร้องเรียน"
                    value={complaint.channel || data?.assignment_form?.complaint_channel_name}
                  />
                </Box>
              </Box>
              <InfoItem
                label="ประเภทเรื่องร้องทุกข์"
                value={resolvedComplaintTypeDisplay}
              />
              <InfoItem
                label="ประเภทย่อยเรื่องร้องเรียน"
                value={resolvedComplaintSubtypeDisplay}
              />
              <InfoItem label="เรื่อง" value={complaint.subject} />
              <Typography fontSize={16} fontWeight="bold">
                เรียนปลัดกระทรวงการคลัง
              </Typography>
            </Grid>
          </Grid>

          <Divider />

          <Section title="ข้อมูลผู้ร้องทุกข์">
            <Grid container spacing={2} mb={3}>
              <InfoItem
                label="หมายเลขประจำตัวประชาชน"
                value={formatCitizenId_null(
                  complainant.idCard || corporate.idCard || government.idCard
                )}
              />
              <InfoItem
                label="ชื่อ - นามสกุล"
                value={complainant.name || corporate.name || government.name}
              />
              <InfoItem
                label="ที่อยู่ที่ติดต่อได้"
                value={complainant.address || corporate.address || government.address}
              />
              <InfoItem
                label="ตำบล/แขวง"
                value={complainant.subdistricts || corporate.subdistricts || government.subdistricts}
              />
              <InfoItem
                label="อำเภอ/เขต"
                value={complainant.district || corporate.district || government.district}
              />
              <InfoItem
                label="จังหวัด"
                value={complainant.province || corporate.province || government.province}
              />
              <InfoItem
                label="รหัสไปรษณีย์"
                value={complainant.zipcode || corporate.zipcode || government.zipcode}
              />
              <InfoItem
                label="อีเมล"
                value={complainant.email || corporate.email || government.email}
              />
              <InfoItem
                label="หมายเลขโทรศัพท์"
                value={formatPhoneNumber_null(
                  complainant.phone || corporate.phone || government.phone
                )}
              />
            </Grid>
          </Section>

          <Section title="ผู้รับมอบอำนาจร้องเรียน">
            {hasData(delegate) || hasData(signer) ? (
              <Grid container spacing={2} mb={3}>
                <InfoItem
                  label="หมายเลขประจำตัวประชาชน"
                  value={formatCitizenId_null(delegate.idCard || signer.idCard)}
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
                <InfoItem label="อีเมล" value={delegate.email || signer.email} />
                <InfoItem
                  label="หมายเลขโทรศัพท์"
                  value={formatPhoneNumber_null(delegate.phone || signer.phone)}
                />
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', p: 2 }}>
                ไม่มีข้อมูลผู้รับมอบอำนาจ
              </Typography>
            )}
          </Section>

          <Section title="ข้อมูลผู้ถูกร้อง (ข้อมูลจากผู้ร้องทุกข์)">
            {hasData(respondent) || hasData(corporateS2) || hasData(government) ? (
              <Grid container spacing={2} mb={3}>
                <InfoItem
                  label="หมายเลขประจำตัวประชาชน"
                  value={formatCitizenId_null(
                    respondent.idCard || corporateS2.idCard || government.idCard
                  )}
                />
                <InfoItem
                  label="ชื่อ - นามสกุล"
                  value={respondent.name || corporateS2.name || government.name}
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
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', p: 2 }}>
                ไม่มีข้อมูลผู้ถูกร้องเรียน
              </Typography>
            )}
          </Section>
          
          <Box id="complaint-info-section" data-pdf-section="complaint-info-section">
          <Section title="ข้อมูลเรื่องร้องทุกข์">
            <Grid container spacing={2} mb={3}>
              <InfoItem
                label="วันและเวลาที่เกิดเหตุ"
                value={formatThaiDateTime(complaint.incidentDate)}
              />
            </Grid>
          </Section>
          </Box>

          {/* รายละเอียดเรื่องร้องทุกข์ - ขึ้นหน้าใหม่ */}
          <Box
            id="complaint-detail-section"
            data-pdf-section="complaint-detail-section"
            sx={{
              breakInside: "avoid",
              pageBreakInside: "avoid",
              // pageBreakBefore: "always",
              // "@media print": {
              //   breakInside: "avoid",
              //   pageBreakInside: "avoid",
              //   pageBreakBefore: "always"
              // },
            }}
          >
            <Grid container spacing={2} mb={3}>
              <Grid
                item
                xs={12}
                id="complaint-detail"
                data-pdf-section="complaint-detail"
                sx={{
                  breakInside: "avoid",
                  pageBreakInside: "avoid",
                  "@media print": {
                    breakInside: "avoid",
                    pageBreakInside: "avoid"
                  },
                }}
              >
                <Typography fontSize={16}>
                  <Box component="span" fontWeight="bold">รายละเอียดเรื่องร้องทุกข์:</Box>
                </Typography>

                <Typography
                  fontSize={16}
                  sx={{
                    mt: 1,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                    lineHeight: 1.8,
                    textAlign: "justify",
                  }}
                >
                  {complaint.description || "-"}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* เอกสารประกอบการร้องทุกข์ */}
          <Box
            id="attachments-section"
            data-pdf-section="attachments-section"
            sx={{
              breakInside: "avoid",
              pageBreakInside: "avoid",
              "@media print": { breakInside: "avoid", pageBreakInside: "avoid" },
            }}
            mb={3}
          >
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              เอกสารประกอบการร้องทุกข์
            </Typography>

            <Box>
              {files.length > 0 ? (
                files.map((file, index) => {
                  const ext = getFileExt(file.name || file.url);
                  const href = file.url || "";
                  return (
                    <a
                      key={index}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "none" }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          border: "1px solid #ccc",
                          borderRadius: "8px",
                          px: 2,
                          py: 1,
                          mb: 1,
                          transition: "background 0.2s",
                          "&:hover": { background: "#f8f9fa" },
                          breakInside: "avoid",            // ✅ ไม่ตัดกลางการ์ดไฟล์
                          pageBreakInside: "avoid",
                        }}
                      >
                        {getFileIcon(ext)}
                        <Typography fontSize={14} color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                          {file.name}
                        </Typography>
                      </Box>
                    </a>
                  );
                })
              ) : (
                <Typography fontSize={14}>ไม่มีไฟล์แนบ</Typography>
              )}
            </Box>
          </Box>


          <Box
            id="declaration-section"
            data-pdf-section="declaration-section"
            sx={{
              breakInside: "avoid",
              pageBreakInside: "avoid",
              "@media print": { breakInside: "avoid", pageBreakInside: "avoid" },
            }}
            mb={3}
          >
            <Typography fontSize={16} mb={2}>
              ข้าพเจ้าขอรับรองว่าข้อเท็จจริงที่ได้ยื่นเรื่องร้องเรียน/ร้องทุกข์ข้างต้นเป็นความจริงทุกประการ
            </Typography>
            <Typography fontSize={16}>
              หมายเหตุ : เอกสารฉบับนี้ไม่สามารถนำไปใช้อ้างอิงเอกสารอื่น
            </Typography>
          </Box>


          <Divider />

                <Box
                  id="signature-section"
                  data-pdf-section="signature-section"
                  sx={{
                    breakInside: "avoid",
                    pageBreakInside: "avoid",
                    "@media print": { breakInside: "avoid", pageBreakInside: "avoid" },
                  }}
                >
                  <Grid container spacing={2} mb={3}>
                    <InfoItem label="ลงชื่อผู้ร้องทุกข์" value={complainant.name} />
                    <InfoItem label="ลงชื่อผู้รับมอบอำนาจ" value={delegate.name} />
                    <InfoItem
                      label="วันที่ผู้ร้องลงนาม"
                      value={formatThaiDate(normalizeIso(data?.created_at || data?.updated_at || new Date().toISOString()))}
                    />
                    <InfoItem
                      label="วันที่ผู้รับมอบลงนาม"
                      value={formatThaiDate(normalizeIso(data?.created_at || data?.updated_at || new Date().toISOString()))}
                    />
                  </Grid>

                  <Grid container spacing={2} mb={3}>
                    <InfoItem label="เจ้าหน้าที่ผู้รับผิดชอบ" value={resolvedAssignedTo} />
                    <InfoItem
                      label="วันที่รับงาน"
                      value={resolvedAssignedDate ? formatThaiDateTime(normalizeIso(resolvedAssignedDate)) : "-"}
                    />
                  </Grid>
                </Box>

            </Paper>
            </div>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 4,
                gap: 2,
                flexDirection: { xs: "column", sm: "row" }, 
                alignItems: "center",
                width: "100%",
                maxWidth: "100%",
                overflowX: "auto", 
              }}
            >
              <ButtonService
                label="แก้ไข"
                color="แก้ไข"
                variant="outlined"
                onClick={handleEdit}
                iconLeft={<EditOutlinedIcon />}
                sx={{ width: { xs: "100%", sm: "auto" } }} 
              />
              <ButtonService
                label="ยืนยัน"
                color="ยืนยัน"
                variant="contained"
                onClick={handleConfirm}
                iconRight={<CheckIcon />}
                sx={{ width: { xs: "100%", sm: "auto" } }} 
              />
              <ButtonService
                label="ส่งออก"
                color="ส่งออก"
                variant="outlined"
                onClick={() =>
                  exportElementToPDF2(pdfRef, "แบบฟอร์มร้องทุกข์.pdf", {
                    marginTop: 7,
                    marginBottom: 10,
                    marginLeft: 4,
                    marginRight: 4,
                    // ✅ บังคับเริ่มหน้าใหม่ที่ "ข้อมูลเรื่องร้องทุกข์"
                    pageBreakBeforeSelectors: ["#complaint-info-section"],
                    // กันการผ่ากลางรายละเอียดฯ ตามเดิม
                    forcePageBreakSelectors: [
                      "#complaint-detail",
                      "#attachments-section",
                      "#declaration-section",
                      "#signature-section",
                    ],
                  })
                }
                iconRight={<UploadOutlinedIcon />}
                sx={{ width: { xs: "100%", sm: "auto" } }} 
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

export default ComplaintSummaryService;
