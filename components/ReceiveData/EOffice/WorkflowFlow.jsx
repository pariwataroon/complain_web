/**
 * WorkflowFlow — แสดงผังการไหลของเอกสาร (list_case_org_owner)
 *
 * แสดงหน่วยงานที่เกี่ยวข้องเรียงตามลำดับการส่งต่อ
 * มีเส้นเชื่อมระหว่างแต่ละหน่วยงาน พร้อมสถานะและผลการดำเนินการ
 *
 * Data shape (จาก GetCase API → list_case_org_owner):
 * {
 *   line: 1,
 *   org_text: "สำนักงานปลัดกระทรวงการคลัง",
 *   case_org_status_text: "รับเรื่อง",
 *   case_org_summary_result: "รับเรื่องเข้าระบบ มอบหมายผู้รับผิดชอบ",
 *   updated_by_text: "สำนักงานปลัดกระทรวงการคลัง",
 *   updated: "2026-06-20T09:20:00"
 * }
 */
import React from "react";
import { Box, Typography, Chip, Avatar, useTheme } from "@mui/material";
import { Business as BusinessIcon, ArrowDownward as ArrowIcon } from "@mui/icons-material";
import { formatThaiDate } from "@utils/Formats";
import styles from "./WorkflowFlow.module.scss";

/** แผนผังสีตามสถานะ */
const STATUS_CONFIG = {
  "รับเรื่อง": { color: "#2563eb", bg: "#eff6ff", borderColor: "#bfdbfe" },
  "อยู่ระหว่างดำเนินการ": { color: "#d97706", bg: "#fffbeb", borderColor: "#fde68a" },
  "ดำเนินการแล้วเสร็จ": { color: "#16a34a", bg: "#f0fdf4", borderColor: "#bbf7d0" },
  "ยุติเรื่อง": { color: "#16a34a", bg: "#f0fdf4", borderColor: "#bbf7d0" },
  "ส่งต่อ": { color: "#7c3aed", bg: "#f5f3ff", borderColor: "#ddd6fe" },
  "รับทราบ": { color: "#0891b2", bg: "#ecfeff", borderColor: "#a5f3fc" },
};

const DEFAULT_STATUS = { color: "#6b7280", bg: "#f9fafb", borderColor: "#e5e7eb" };

const getStatusStyle = (statusText) => {
  if (!statusText) return DEFAULT_STATUS;
  // ค้นหาจาก key ที่ตรงที่สุด
  for (const [key, config] of Object.entries(STATUS_CONFIG)) {
    if (statusText.includes(key) || key.includes(statusText)) {
      return config;
    }
  }
  return DEFAULT_STATUS;
};

const WorkflowFlow = ({ orgOwners = [] }) => {
  const theme = useTheme();

  if (orgOwners.length === 0) return null;

  return (
    <Box className={styles.flowContainer}>
      {/* ── Flow Header ── */}
      <Box className={styles.flowHeader}>
        <BusinessIcon sx={{ fontSize: 18, color: "#2563eb" }} />
        <Typography variant="body2" sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}>
          สถานะการดำเนินการ
        </Typography>
      </Box>

      {/* ── Flow Steps ── */}
      <Box className={styles.flowBody}>
        {orgOwners.map((org, idx) => {
          const statusStyle = getStatusStyle(org.case_org_status_text);
          const isLast = idx === orgOwners.length - 1;

          return (
            <React.Fragment key={org.line || idx}>
              {/* ── Step Node ── */}
              <Box className={styles.stepRow}>
                {/* ซ้าย: timeline line + dot */}
                <Box className={styles.timelineCol}>
                  <Box
                    className={styles.stepDot}
                    sx={{
                      backgroundColor: statusStyle.color,
                      borderColor: statusStyle.bg,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "#fff", fontWeight: 700, fontSize: "11px", lineHeight: 1 }}>
                      {org.line || idx + 1}
                    </Typography>
                  </Box>
                  {/* เส้นเชื่อมลงไป — ถ้าไม่ใช่ขั้นสุดท้าย */}
                  {!isLast && (
                    <Box className={styles.stepLine} sx={{ backgroundColor: statusStyle.borderColor }} />
                  )}
                </Box>

                {/* ขวา: card ข้อมูล */}
                <Box
                  className={styles.stepCard}
                  sx={{
                    borderLeftColor: statusStyle.color,
                    backgroundColor: statusStyle.bg,
                  }}
                >
                  {/* แถวบน: ชื่อหน่วยงาน + สถานะ chip */}
                  <Box className={styles.stepCardHeader}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#111827", fontSize: "14px" }}>
                      {org.org_text || "ไม่ระบุหน่วยงาน"}
                    </Typography>
                    <Chip
                      label={org.case_org_status_text || "ไม่ระบุสถานะ"}
                      size="small"
                      sx={{
                        fontSize: "11px",
                        fontWeight: 600,
                        backgroundColor: statusStyle.color,
                        color: "#fff",
                        height: "22px",
                        borderRadius: "6px",
                      }}
                    />
                  </Box>

                  {/* ผลการดำเนินการ */}
                  {org.case_org_summary_result && (
                    <Typography
                      variant="body2"
                      className={styles.stepDetail}
                      sx={{ color: "#374151", fontSize: "13px" }}
                    >
                      {org.case_org_summary_result}
                    </Typography>
                  )}

                  {/* แถวล่าง: ผู้ดำเนินการ + วันที่ */}
                  <Box className={styles.stepFooter}>
                    {org.updated_by_text && (
                      <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "12px" }}>
                        โดย: {org.updated_by_text}
                      </Typography>
                    )}
                    {org.updated && (
                      <Typography variant="caption" sx={{ color: "#9ca3af", fontSize: "12px" }}>
                        {formatThaiDate(org.updated)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* ── Arrow ลูกศรระหว่างขั้น ── */}
              {!isLast && (
                <Box className={styles.arrowRow}>
                  <Box className={styles.arrowSpacer} />
                  <Box className={styles.arrowIcon} sx={{ color: getStatusStyle(orgOwners[idx + 1]?.case_org_status_text).color }}>
                    <ArrowIcon sx={{ fontSize: 14 }} />
                  </Box>
                </Box>
              )}
            </React.Fragment>
          );
        })}
      </Box>
    </Box>
  );
};

export default WorkflowFlow;
