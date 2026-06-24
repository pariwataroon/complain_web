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
  Grid,
  Chip,
  IconButton,
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
} from "@mui/icons-material";
import ButtonSent from "@services/ButtonSent/ButtonSent";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import { showLoading, closeAlert, alertError } from "@utils/Alerts";
import {
  GetEOfficeCaseDetail,
  GetEOfficeOperatings,
  GetEOfficeAttachments,
} from "@pages/api/eoffice/eoffice";
import { formatThaiDate } from "@utils/Formats";
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
    if (!caseId) return;

    let cancelled = false;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        showLoading("กำลังโหลดข้อมูลรายละเอียด...");

        const detailRes = await GetEOfficeCaseDetail(caseId);
        if (cancelled) return;
        const detail = detailRes.data || detailRes;

        const mapped = {
          ...detail,
          case_code: detail.content_no || `${detail.content_year}/${detail.id}`,
          case_id: detail.id,
          subject: detail.subject || detail.title || detail.content_title || detail.description || "-",
          status: detail.finish_flag === 1 ? "completed" : "in_progress",
          status_name: detail.finish_flag === 1 ? "เสร็จสิ้น" : "อยู่ระหว่างดำเนินการ",
          date_received: detail.content_date || detail.book_date || detail.created_date,
          date_updated: detail.updated_date,
          priority: detail.priority === 1 ? "ปกติ" : detail.priority === 4 ? "ด่วน" : "ปกติ",
          complainant: { org: detail.from_org, name: detail.owner_name },
          respondent: { name: detail.to_org },
        };

        const opsRes = await GetEOfficeOperatings(caseId);
        if (cancelled) return;
        const attsRes = await GetEOfficeAttachments(caseId);
        if (cancelled) return;

        const ops = Array.isArray(opsRes?.data) ? opsRes.data : (Array.isArray(opsRes) ? opsRes : []);
        const atts = Array.isArray(attsRes?.data) ? attsRes.data : (Array.isArray(attsRes) ? attsRes : []);

        setCaseDetail(mapped);
        setOperatings(ops);
        setAttachments(atts);
        closeAlert();
      } catch (error) {
        if (cancelled) return;
        console.error("Error fetching EOffice case detail:", error);
        closeAlert();
        alertError("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลรายละเอียดได้");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDetail();

    return () => { cancelled = true; };
  }, [caseId]);

  const handleBack = () => router.push("/admin/edit/eoffice");
  const handleSendResult = () => router.push(`/admin/edit/eoffice/send?case_id=${caseId}`);

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

  // ── Helper: render field rows (label : value) ──
  const renderRows = (fields) => (
    <Box>
      {fields.map((field, idx) => (
        <Box className={styles.fieldRow} key={idx}>
          <Typography className={styles.fieldLabel}>{field.label}</Typography>
          <Typography className={styles.fieldValue}>{field.value || "-"}</Typography>
        </Box>
      ))}
    </Box>
  );

  // ── Helper: render field rows in 2-col grid ──
  const renderGrid = (fields) => (
    <Box className={styles.fieldGrid}>
      {fields.map((field, idx) => (
        <Box className={styles.fieldRow} key={idx}>
          <Typography className={styles.fieldLabel}>{field.label}</Typography>
          <Typography className={styles.fieldValue}>{field.value || "-"}</Typography>
        </Box>
      ))}
    </Box>
  );

  // ── Helper: Section Card (clean, no gradient) ──
  const SectionCard = ({ icon, title, badge, children }) => (
    <Card className={styles.infoCard}>
      <Box className={styles.sectionHeader}>
        <Box sx={{ color: "#2563eb", display: "flex" }}>{icon}</Box>
        <Typography variant="h6">{title}</Typography>
        {badge && <Box className={styles.sectionBadge}>{badge}</Box>}
      </Box>
      <Box className={styles.sectionContent}>
        {children}
      </Box>
    </Card>
  );

  // ── Status chip ──
  const statusColor = caseDetail.status === "completed" ? "#16a34a" : "#d97706";
  const statusBg = caseDetail.status === "completed" ? "#f0fdf4" : "#fffbeb";

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
      <Box className={styles.actionBar}>
        <ButtonSent label="ย้อนกลับ" onClick={handleBack} />
        <ButtonSent label="ส่งผลพิจารณา" onClick={handleSendResult} />
      </Box>

      <Grid container spacing={2}>
        {/* ══════════════════════════════════════════ */}
        {/* 1. ข้อมูลหลัก                             */}
        {/* ══════════════════════════════════════════ */}
        <Grid item xs={12}>
          <SectionCard
            icon={<AssignmentIcon />}
            title="ข้อมูลหลัก"
            badge={
              <Chip
                label={caseDetail.status_name || caseDetail.status}
                size="small"
                sx={{ backgroundColor: statusBg, color: statusColor, fontWeight: 600, fontSize: "12px" }}
              />
            }
          >
            {renderGrid([
              { label: "เลขที่รับเรื่อง", value: caseDetail.case_code || caseDetail.id },
              { label: "ปี พ.ศ.", value: caseDetail.content_year || "-" },
              { label: "เรื่อง", value: caseDetail.subject },
              { label: "เลขที่หนังสือ", value: caseDetail.book_no || "-" },
              { label: "ลำดับความสำคัญ", value: caseDetail.priority === 4 ? "ด่วน" : caseDetail.priority === 1 ? "ปกติ" : `${caseDetail.priority}` },
              { label: "ชั้นความลับ", value: caseDetail.classification === 1 ? "ลับ" : caseDetail.classification === 2 ? "ลับมาก" : "ปกติ" },
              { label: "วันที่รับเรื่อง", value: formatThaiDate(caseDetail.date_received) },
              { label: "วันที่หนังสือ", value: formatThaiDate(caseDetail.book_date) },
              { label: "", value: "" }, // spacer
              { label: "วันที่อัปเดทล่าสุด", value: formatThaiDate(caseDetail.date_updated) },
            ])}

            {caseDetail.description && (
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ fontWeight: 600, color: "#374151", fontSize: "13px", mb: 1 }}>
                  รายละเอียดเรื่องร้องทุกข์
                </Typography>
                <Box className={styles.descriptionBox}>
                  {caseDetail.description}
                </Box>
              </Box>
            )}
          </SectionCard>
        </Grid>

        {/* ══════════════════════════════════════════ */}
        {/* 2. จาก (ผู้ส่ง)                            */}
        {/* ══════════════════════════════════════════ */}
        <Grid item xs={12} md={6}>
          <SectionCard icon={<PersonIcon />} title="จาก (ผู้ส่ง)">
            {(() => {
              const fromOrg = complainant.org || caseDetail.from_org;
              const ownerName = complainant.name || caseDetail.owner_name;
              const fields = [];
              if (fromOrg) fields.push({ label: "รายชือผู้ส่ง", value: fromOrg });
              if (ownerName && ownerName !== fromOrg) fields.push({ label: "ชื่อเจ้าของเรื่อง", value: ownerName });
              return fields.length > 0
                ? renderRows(fields)
                : <Typography variant="body2" sx={{ color: "#9ca3af" }}>-</Typography>;
            })()}
          </SectionCard>
        </Grid>

        {/* ══════════════════════════════════════════ */}
        {/* 3. ถึง (ผู้รับ)                            */}
        {/* ══════════════════════════════════════════ */}
        <Grid item xs={12} md={6}>
          <SectionCard icon={<BusinessIcon />} title="ถึง (ผู้รับ)">
            {renderRows([
              { label: "หน่วยงานที่รับ", value: respondent.name || caseDetail.to_org },
            ])}
          </SectionCard>
        </Grid>

        {/* ══════════════════════════════════════════ */}
        {/* 4. หน่วยงานที่เกี่ยวข้อง                    */}
        {/* ══════════════════════════════════════════ */}
        {organizations.length > 0 && (
          <Grid item xs={12}>
            <SectionCard icon={<BusinessIcon />} title={`หน่วยงานที่เกี่ยวข้อง (${organizations.length})`}>
              <Grid container spacing={1.5}>
                {organizations.map((org, idx) => (
                  <Grid item xs={12} sm={6} md={4} key={org.org_id || idx}>
                    <Box sx={{
                      p: 2,
                      borderRadius: 2,
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#111827" }}>
                        {org.org_name}
                      </Typography>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                        <Chip label={org.status} size="small" sx={{ fontSize: "11px", fontWeight: 600, backgroundColor: "#f0fdf4", color: "#16a34a" }} />
                        <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                          {org.assigned_date}
                        </Typography>
                      </Box>
                    </Box>
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
            <SectionCard icon={<AttachFileIcon />} title={`ไฟล์แนบ (${attachments.length})`}>
              <List dense>
                {attachments.map((att, idx) => (
                  <ListItem
                    key={att.id || idx}
                    className={styles.attachmentItem}
                    sx={{ border: "1px solid #e5e7eb", borderRadius: 1.5, mb: 1, background: "#ffffff" }}
                    secondaryAction={
                      <IconButton edge="end" size="small" sx={{ color: "#2563eb" }}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {att.file_type?.includes("pdf") ? (
                        <PdfIcon sx={{ color: "#ef4444", fontSize: 20 }} />
                      ) : (
                        <ImageIcon sx={{ color: "#2563eb", fontSize: 20 }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="body2" sx={{ fontWeight: 500, fontSize: "13px" }}>{att.file_name}</Typography>}
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
          <SectionCard icon={<HistoryIcon />} title={`ประวัติการดำเนินการ (${operatings.length})`}>
            {operatings.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                  ยังไม่มีประวัติการดำเนินการ
                </Typography>
              </Box>
            ) : (
              <Timeline position="right" sx={{ [`& .MuiTimelineItem-root`]: { minHeight: "auto" }, p: 0 }}>
                {operatings.map((op, idx) => (
                  <TimelineItem key={op.id || idx}>
                    <TimelineSeparator>
                      <TimelineDot sx={{ bgcolor: "#2563eb", width: 12, height: 12 }} />
                      {idx < operatings.length - 1 && <TimelineConnector sx={{ bgcolor: "#e5e7eb", width: 2 }} />}
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: 0, px: 2, mb: 3 }}>
                      <Box sx={{
                        p: 2,
                        borderRadius: 2,
                        background: "#f9fafb",
                        border: "1px solid #e5e7eb",
                      }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1, flexWrap: "wrap", gap: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: "#2563eb", fontSize: "12px" }}>
                            {op.status || `ขั้นตอนที่ ${op.step_no}`}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                            {op.operating_date}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mb: 1, whiteSpace: "pre-wrap", lineHeight: 1.7, color: "#374151", fontSize: "13px" }}>
                          {op.detail}
                        </Typography>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography variant="caption" sx={{ color: "#6b7280" }}>
                            โดย: {op.operating_by}
                          </Typography>
                          {op.org_name && (
                            <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                              หน่วยงาน: {op.org_name}
                            </Typography>
                          )}
                        </Box>
                        {op.attachments?.length > 0 && (
                          <Box sx={{ mt: 1, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                            {op.attachments.map((a, aIdx) => (
                              <Chip
                                key={aIdx}
                                icon={a.file_type?.includes("pdf") ? <PdfIcon sx={{ fontSize: 16 }} /> : <ImageIcon sx={{ fontSize: 16 }} />}
                                label={a.file_name}
                                size="small"
                                variant="outlined"
                                onClick={() => {}}
                                sx={{ cursor: "pointer", fontSize: "11px" }}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
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
