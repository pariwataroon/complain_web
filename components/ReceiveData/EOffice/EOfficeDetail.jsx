/**
 * EOfficeDetail — รายละเอียดร้องทุกข์จากเว็บไซต์ Mof_EOffice
 *
 * ทำงานเหมือน Opm1111/SearchComplaints.jsx แต่ดึงข้อมูลจาก eofficer REST API (JSON)
 * แสดงข้อมูลเรื่องร้องทุกข์, ผู้ร้อง, ผู้ถูกร้อง, ไฟล์แนบ, ประวัติการดำเนินการ
 */
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Chip,
  Avatar,
  IconButton,
  Paper,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  AttachFile as AttachFileIcon,
  History as HistoryIcon,
  PictureAsPdf as PdfIcon,
  ImageOutlined as ImageIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import ButtonSent from "@services/ButtonSent/ButtonSent";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import { showLoading, closeAlert, alertError } from "@utils/Alerts";
import {
  GetEOfficeCaseDetail,
  GetEOfficeOperatings,
  GetEOfficeAttachments,
} from "@pages/api/eoffice/eoffice";
import useDetailEOfficeData from "@hooks/admin/eoffice/useDetailEOfficeData";
import styles from "./EOfficeDetail.module.scss";

const EOfficeDetail = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { id: caseId } = router.query;

  const [caseDetail, setCaseDetail] = useState(null);
  const [operatings, setOperatings] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Hook สำหรับ auto-create complaint เข้าคลังเอกสาร (เหมือน OPM1111) ──
  const {
    isCreating: isAutoCreating,
    autoCreateAttempted,
  } = useDetailEOfficeData({
    caseDetail,
    attachments,
    operatings,
  });

  // ── โหลดข้อมูลรายละเอียดเรื่องร้องทุกข์ ──
  useEffect(() => {
    const fetchDetail = async () => {
      if (!caseId) return;
      try {
        showLoading("กำลังโหลดข้อมูลรายละเอียด...");

        // TODO: เรียก API จริง
        const detail = await GetEOfficeCaseDetail(caseId);
        const ops = await GetEOfficeOperatings(caseId);
        const atts = await GetEOfficeAttachments(caseId);

        setCaseDetail(detail);
        setOperatings(ops || []);
        setAttachments(atts || []);
        closeAlert();
      } catch (error) {
        console.error("Error fetching EOffice case detail:", error);
        closeAlert();
        alertError("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลรายละเอียดได้");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [caseId]);

  const handleBack = () => router.push("/admin/edit/eoffice");
  const handleSendResult = () => router.push(`/admin/edit/eoffice/send?case_id=${caseId}`);

  const getStatusColor = (status) => {
    switch (status) {
      case "new": return "#16a34a";
      case "in_progress": return "#f59e0b";
      case "completed": return "#6b7280";
      case "rejected": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case "new": return "#dcfce7";
      case "in_progress": return "#fef3c7";
      case "completed": return "#f3f4f6";
      case "rejected": return "#fee2e2";
      default: return "#f3f4f6";
    }
  };

  if (loading) return null;

  // ── ไม่มีข้อมูล ──
  if (!caseDetail) {
    return (
      <div>
        <BreadcrumbsService
          items={[
            { label: "จัดการข้อมูลในระบบ", url: "/admin/dashboard" },
            { label: "เรื่องราวร้องทุกข์ช่องทางเว็บไซต์ Mof_EOffice", url: "/admin/edit/eoffice" },
            { label: String(caseId || "...") },
          ]}
        />
        <Box className={styles.emptyStateCard} sx={{ mt: 3 }}>
          <Typography variant="h5" sx={{ color: "#6b7280", mb: 2, fontWeight: 600 }}>
            📭 ไม่พบข้อมูลเรื่องร้องทุกข์
          </Typography>
          <Typography variant="body2" sx={{ color: "#9ca3af", mb: 4 }}>
            เลขที่เรื่อง: {caseId} — อาจเป็นเพราะ API จาก eofficer ยังไม่เชื่อม
          </Typography>
          <ButtonSent label="ย้อนกลับ" onClick={handleBack} />
        </Box>
      </div>
    );
  }

  const complainant = caseDetail.complainant || {};
  const respondent = caseDetail.respondent || {};
  const organizations = caseDetail.organizations || [];

  // ── Helper: render field grid ──
  const renderFields = (fields, cols = { xs: 12, sm: 6, md: 4 }) => (
    <Grid container spacing={2}>
      {fields.map((field, idx) => (
        <Grid item {...cols} key={idx}>
          <Box className={styles.detailField}>
            <Typography variant="caption" sx={{ color: "#9ca3af", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {field.label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, color: "#1f2937", mt: 0.3 }}>
              {field.value || "-"}
            </Typography>
          </Box>
        </Grid>
      ))}
    </Grid>
  );

  // ── Helper: section card ──
  const SectionCard = ({ icon, iconBg, title, badge, children }) => (
    <Card className={styles.infoCard}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box className={styles.sectionHeader}>
          <Avatar sx={{ bgcolor: iconBg, width: 44, height: 44, boxShadow: `0 4px 12px ${iconBg}40` }}>
            {icon}
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#1120a3", fontSize: { xs: "15px", md: "17px" } }}>
            {title}
          </Typography>
          {badge && <Box sx={{ ml: "auto" }}>{badge}</Box>}
        </Box>
        <Divider sx={{ mb: 2, borderColor: "#e8ecf4" }} />
        {children}
      </CardContent>
    </Card>
  );

  return (
    <div>
      <BreadcrumbsService
        items={[
          { label: "จัดการข้อมูลในระบบ", url: "/admin/dashboard" },
          { label: "เรื่องราวร้องทุกข์ช่องทางเว็บไซต์ Mof_EOffice", url: "/admin/edit/eoffice" },
          { label: caseDetail.case_code || caseDetail.case_id },
        ]}
      />

      {/* ── Action Buttons ── */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mb: 2.5, mt: 1 }}>
        <ButtonSent label="ย้อนกลับ" onClick={handleBack} />
        <ButtonSent label="ส่งผลพิจารณา" onClick={handleSendResult} />
      </Box>

      <Grid container spacing={2.5}>
        {/* ══════════════════════════════════════════ */}
        {/* 1. ข้อมูลหลัก (Main Information)          */}
        {/* ══════════════════════════════════════════ */}
        <Grid item xs={12}>
          <SectionCard
            icon={<AssignmentIcon />}
            iconBg="#2563eb"
            title="ข้อมูลหลัก"
            badge={
              <Chip
                label={caseDetail.status_name || caseDetail.status}
                sx={{
                  backgroundColor: getStatusBg(caseDetail.status),
                  color: getStatusColor(caseDetail.status),
                  fontWeight: 700,
                  fontSize: "12px",
                  px: 1,
                }}
              />
            }
          >
            {renderFields([
              { label: "เลขที่รับเรื่อง", value: caseDetail.case_code || caseDetail.case_id },
              { label: "ชื่อเรื่อง", value: caseDetail.subject },
              { label: "ประเภทเรื่อง", value: caseDetail.type_name },
              { label: "ช่องทาง", value: caseDetail.channel_name },
              { label: "ความเร่งด่วน", value: caseDetail.priority },
              { label: "ระดับความรุนแรง", value: caseDetail.severity },
              { label: "ความลับ", value: caseDetail.confidentiality },
              { label: "วันที่รับเรื่อง", value: caseDetail.date_received },
              { label: "วันที่อัปเดทล่าสุด", value: caseDetail.date_updated },
              ...(caseDetail.reference_no ? [{ label: "เลขอ้างอิง", value: caseDetail.reference_no }] : []),
            ])}

            {caseDetail.description && (
              <>
                <Divider sx={{ my: 2.5, borderColor: "#e8ecf4" }} />
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: "#1120a3", fontSize: "14px" }}>
                  📝 รายละเอียดเรื่องร้องทุกข์
                </Typography>
                <Paper sx={{ p: 2.5, background: "linear-gradient(135deg, #f0f4ff 0%, #e8ecf4 100%)", borderRadius: 3, border: "1px solid #dbeafe" }}>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 2, color: "#374151" }}>
                    {caseDetail.description}
                  </Typography>
                </Paper>
              </>
            )}
          </SectionCard>
        </Grid>

        {/* ══════════════════════════════════════════ */}
        {/* 2. ผู้ร้องทุกข์ (Complainant)               */}
        {/* ══════════════════════════════════════════ */}
        <Grid item xs={12} md={6}>
          <SectionCard icon={<PersonIcon />} iconBg="#16a34a" title="ผู้ร้องทุกข์">
            {renderFields([
              { label: "คำนำหน้า", value: complainant.title },
              { label: "ชื่อ-นามสกุล", value: `${complainant.first_name || ""} ${complainant.last_name || ""}`.trim() },
              { label: "เลขบัตรประชาชน", value: complainant.citizen_id },
              { label: "เพศ", value: complainant.gender },
              { label: "เบอร์โทร", value: complainant.phone },
              { label: "อีเมล", value: complainant.email },
            ], { xs: 12, sm: 6 })}
            {complainant.address && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ color: "#9ca3af", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  ที่อยู่
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.3, color: "#374151" }}>
                  {complainant.address}
                </Typography>
              </Box>
            )}
          </SectionCard>
        </Grid>

        {/* ══════════════════════════════════════════ */}
        {/* 3. ผู้ถูกร้องทุกข์ (Respondent)             */}
        {/* ══════════════════════════════════════════ */}
        <Grid item xs={12} md={6}>
          <SectionCard icon={<BusinessIcon />} iconBg="#ef4444" title="ผู้ถูกร้องทุกข์">
            {renderFields([
              { label: "ประเภท", value: respondent.type },
              { label: "ชื่อ", value: respondent.name },
              { label: "หน่วยงาน", value: respondent.department },
              { label: "ตำแหน่ง", value: respondent.position },
              { label: "เบอร์โทร", value: respondent.phone },
            ], { xs: 12, sm: 6 })}
          </SectionCard>
        </Grid>

        {/* ══════════════════════════════════════════ */}
        {/* 4. หน่วยงานที่เกี่ยวข้อง                    */}
        {/* ══════════════════════════════════════════ */}
        {organizations.length > 0 && (
          <Grid item xs={12}>
            <SectionCard icon={<BusinessIcon />} iconBg="#f59e0b" title={`หน่วยงานที่เกี่ยวข้อง (${organizations.length})`}>
              <Grid container spacing={2}>
                {organizations.map((org, idx) => (
                  <Grid item xs={12} sm={6} md={4} key={org.org_id || idx}>
                    <Paper sx={{ p: 2, border: "1px solid #e8ecf4", borderRadius: 3, background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", transition: "all 0.2s", "&:hover": { borderColor: "#f59e0b", boxShadow: "0 4px 12px rgba(245,158,11,0.15)" } }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#92400e" }}>
                        {org.org_name}
                      </Typography>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1.5 }}>
                        <Chip label={org.status} size="small" sx={{ fontSize: "11px", fontWeight: 600, backgroundColor: "#dcfce7", color: "#16a34a" }} />
                        <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                          {org.assigned_date}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </SectionCard>
          </Grid>
        )}

        {/* ══════════════════════════════════════════ */}
        {/* 5. ไฟล์แนบ                                 */}
        {/* ══════════════════════════════════════════ */}
        {attachments.length > 0 && (
          <Grid item xs={12}>
            <SectionCard icon={<AttachFileIcon />} iconBg="#8b5cf6" title={`ไฟล์แนบ (${attachments.length})`}>
              <List dense>
                {attachments.map((att, idx) => (
                  <ListItem
                    key={att.id || idx}
                    className={styles.attachmentItem}
                    sx={{ border: "1px solid #e8ecf4", borderRadius: 2, mb: 1, background: "#fafbff" }}
                    secondaryAction={
                      <IconButton edge="end" size="small" sx={{ color: "#2563eb" }}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {att.file_type?.includes("pdf") ? (
                        <PdfIcon sx={{ color: "#ef4444" }} />
                      ) : (
                        <ImageIcon sx={{ color: "#2563eb" }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{att.file_name}</Typography>}
                      secondary={`${att.uploaded_date || ""} | ${((att.file_size || 0) / 1024).toFixed(1)} KB`}
                    />
                  </ListItem>
                ))}
              </List>
            </SectionCard>
          </Grid>
        )}

        {/* ══════════════════════════════════════════ */}
        {/* 6. ประวัติการดำเนินการ                      */}
        {/* ══════════════════════════════════════════ */}
        <Grid item xs={12}>
          <SectionCard icon={<HistoryIcon />} iconBg="#7c3aed" title={`ประวัติการดำเนินการ (${operatings.length})`}>
            {operatings.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                  ยังไม่มีประวัติการดำเนินการ
                </Typography>
              </Box>
            ) : (
              <Timeline position="right" sx={{ [`& .MuiTimelineItem-root`]: { minHeight: "auto" }, p: 0 }}>
                {operatings.map((op, idx) => (
                  <TimelineItem key={op.id || idx}>
                    <TimelineSeparator>
                      <TimelineDot sx={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)", width: 16, height: 16, boxShadow: "0 3px 10px rgba(37,99,235,0.3)" }} />
                      {idx < operatings.length - 1 && <TimelineConnector sx={{ background: "linear-gradient(to bottom, #c7d2fe, #e8ecf4)", width: 2 }} />}
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: 0, px: 2, mb: 3 }}>
                      <Paper sx={{ p: 2.5, background: "linear-gradient(135deg, #f0f4ff 0%, #e8ecf4 100%)", borderRadius: 3, border: "1px solid #dbeafe" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
                          <Chip
                            label={op.status || `ขั้นตอนที่ ${op.step_no}`}
                            size="small"
                            sx={{ fontWeight: 700, background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "white", fontSize: "11px" }}
                          />
                          <Typography variant="caption" sx={{ color: "#9ca3af", fontWeight: 500 }}>
                            {op.operating_date}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mb: 1.5, whiteSpace: "pre-wrap", lineHeight: 1.8, color: "#374151" }}>
                          {op.detail}
                        </Typography>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 500 }}>
                            โดย: {op.operating_by}
                          </Typography>
                          {op.org_name && (
                            <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                              หน่วยงาน: {op.org_name}
                            </Typography>
                          )}
                        </Box>
                        {op.attachments?.length > 0 && (
                          <Box sx={{ mt: 1.5, display: "flex", gap: 1, flexWrap: "wrap" }}>
                            {op.attachments.map((a, aIdx) => (
                              <Chip
                                key={aIdx}
                                icon={a.file_type?.includes("pdf") ? <PdfIcon /> : <ImageIcon />}
                                label={a.file_name}
                                size="small"
                                variant="outlined"
                                className={styles.attachmentChip}
                                onClick={() => {}}
                                sx={{ cursor: "pointer" }}
                              />
                            ))}
                          </Box>
                        )}
                      </Paper>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            )}
          </SectionCard>
        </Grid>
      </Grid>
    </div>
  );
};

export default EOfficeDetail;
