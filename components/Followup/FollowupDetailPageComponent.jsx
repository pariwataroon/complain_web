import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
} from "@mui/material";
import { CheckCircle, HelpOutline, HourglassEmpty } from "@mui/icons-material";

import NavbarMain from "@services/navbarMain/navbarMain";
import ComplaintIDService from "@services/ComplaintIDService/ComplaintIDService";
import { GetComplaintOutgoingTracking, GetAssignmentCompleteByAdmin } from "@pages/api/complaint/complaint";
import { showLoading, closeAlert, alertError } from "@utils/Alerts";
import { formatThaiDate } from "@utils/Formats";
import styles from "./FollowupDetailPage.module.scss";

// ====== ขั้นตอนที่แสดงบน UI ======
const STEP_DEFS = [
  { key: "submitted",   label: "รับเรื่องร้องเรียน" },
  { key: "sent",        label: "ส่งหน่วยงาน" },
  { key: "in_progress", label: "อยู่ระหว่างดำเนินการ" },
  { key: "reviewed",    label: "ติดตามผลการพิจารณาจากหน่วยงาน" },
  { key: "resolved",    label: "การดำเนินการเสร็จสิ้น" },
];

// ====== mapping คำสถานะจากหลังบ้าน -> คีย์มาตรฐาน ======
const STATUS_ALIAS = {
  submitted:   ["submitted", "new", "received"],
  sent:        ["sent", "sent_to_agency", "sent_to_external", "forwarded"],
  in_progress: ["in_process", "in_progress", "in_review"],
  reviewed:    [
    "tracking", "reviewed", "awaiting_result",
    "awaiting_consideration", "report_requested",
    "outgoing_report", "outgoing_report1", "outgoing_report2", "outgoing_report3"
  ],
  resolved:    ["completed", "cancelled", "closed", "resolved", "done"],
};

// คำที่ถือว่า “ปิดเรื่องจากผลพิจารณา”
const CLOSED_WORDS = ["ยุติเรื่อง", "ยุติเรื่องได้", "ปิดเรื่อง", "ปิดงาน"];

const normalizeStatus = (status) => {
  const s = String(status || "").trim();
  if (!s) return "submitted";
  const low = s.toLowerCase();
  for (const key of Object.keys(STATUS_ALIAS)) {
    const vals = STATUS_ALIAS[key].map(v => String(v).trim().toLowerCase());
    if (vals.includes(low)) return key;
  }
  return "submitted";
};

const getWhen = (h) => h?.changed_at || h?.changedAt || h?.date || h?.at || "";

const sortByTime = (a, b) => new Date(getWhen(a)).getTime() - new Date(getWhen(b)).getTime();

const liftClosure = (h) => {
  const isOutgoing = h?.type === "outgoing_report" || h?.status === "outgoing_report";
  const resTxt = String(h?.ext?.consideration_result || "").trim();
    const closedByExt =
      h?.ext?.is_closed_by_consideration === true ||
      CLOSED_WORDS.includes(resTxt);
  if (isOutgoing && closedByExt) {
    return { ...h, status: "completed", __closedByConsideration: true };
  }
  return h;
};

const getHighestStepIndex = (mergedHistory) => {
  let maxIdx = 0;
  mergedHistory.forEach((h) => {
    const key = normalizeStatus(h.status);
    const idx = STEP_DEFS.findIndex((s) => s.key === key);
    if (idx > maxIdx) maxIdx = idx;
  });
  return maxIdx;
};

const hasClosureByOutgoing = (mergedHistory) =>
  mergedHistory.some(
    (h) =>
      (h?.type === "outgoing_report" || h?.status === "outgoing_report" || h?.status === "completed") &&
      (h?.ext?.is_closed_by_consideration === true ||
        CLOSED_WORDS.includes(h?.ext?.consideration_result) ||
        h?.__closedByConsideration === true)
  );

const isResolved = (mergedHistory, complaint) => {
  if (hasClosureByOutgoing(mergedHistory)) return true;
  const lastEntry = mergedHistory.filter((h) => h.status).slice(-1)[0];
  const lastStatus = lastEntry?.status || complaint?.status;
  const lastKey = normalizeStatus(lastStatus);
  return lastKey === "resolved";
};

export default function FollowupDetailPage() {
  const router = useRouter();
  const { id } = router.query || {};

  const [complaint, setComplaint] = useState(null);
  const [outgoingTracking, setOutgoingTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!router.isReady || !id || fetchedRef.current) return;

    fetchedRef.current = true;
    (async () => {
      try {
        showLoading("กำลังโหลดข้อมูลเรื่องร้องทุกข์...");

        const [resComplaint, resTracking] = await Promise.all([
          GetAssignmentCompleteByAdmin(id),
          GetComplaintOutgoingTracking(id),
        ]);

        if (resComplaint?.res_code === "0000" && resComplaint?.res_data?.complaint) {
          const complaintData = {
            ...resComplaint.res_data.complaint,
            options: resComplaint.res_data.options,
            subject: resComplaint.res_data.complaint.subject || "",
            description: resComplaint.res_data.complaint.description || "",
            status_history:
              resComplaint?.res_data?.history ??
              resComplaint?.res_data?.complaint?.status_history ??
              [],
          };
          setComplaint(complaintData);
        } else {
          console.error("Invalid API response structure:", resComplaint);
          setErrorMsg("ไม่สามารถโหลดข้อมูลได้ - รูปแบบข้อมูลไม่ถูกต้อง");
        }

        const trackingData =
          resTracking?.data?.res_data ?? resTracking?.res_data ?? resTracking;
        setOutgoingTracking(trackingData);
      } catch (err) {
        console.error("Fetch Error:", err);
        setErrorMsg("ไม่สามารถโหลดข้อมูลได้");
        alertError("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลได้");
      } finally {
        closeAlert();
        setLoading(false);
      }
    })();
  }, [router.isReady, id]);

  // --- รวมสถานะจาก complaint + outgoing-tracking แล้วสรุปเป็น stepper ---
  const { steps, activeStep } = useMemo(() => {
    if (!complaint) return { steps: [], activeStep: 0 };

    const history = Array.isArray(complaint.status_history)
      ? complaint.status_history
      : [];
    const otHistoryRaw = outgoingTracking?.history ?? [];

    // mapping ให้มีฟิลด์มาตรฐาน แล้ว “ยกเคสยุติเรื่อง”
    const otHistoryMapped = otHistoryRaw.map((h) => {
      // ถ้าเป็น outgoing_report แต่ไม่มี status ให้จัดเข้ากลุ่ม reviewed
      const baseStatus =
        h.status
          ? h.status
          : (h.type === "outgoing_report" ? "outgoing_report" : h.type || "reviewed");
      return {
        ...h,
        status: baseStatus,
        // กัน null time: รองรับ created_at / createdAt ด้วย
        changed_at: h.changed_at || h.at || h.date || h.created_at || h.createdAt || null,
      };
    });

    // รวม  ยกเคสยุติเรื่อง + sort
    const mergedHistory = [...history, ...otHistoryMapped]
      .map(liftClosure)
      .sort(sortByTime);

    const resolved = isResolved(mergedHistory, complaint);
    const highestStepIdx = getHighestStepIndex(mergedHistory);

    const built = STEP_DEFS.map((def, idx) => {
      const logs = mergedHistory.filter(
        (h) => normalizeStatus(h.status) === def.key
      );

      let icon;
      if (resolved) {
        icon = <CheckCircle sx={{ fontSize: 60, color: "#2499FF" }} />;
      } else if (idx < highestStepIdx) {
        icon = <CheckCircle sx={{ fontSize: 60, color: "#2499FF" }} />;
      } else if (idx === highestStepIdx) {
        icon = <HourglassEmpty sx={{ fontSize: 60, color: "#EDC458" }} />;
      } else {
        icon = <HelpOutline sx={{ fontSize: 60, color: "#C4C4C4" }} />;
      }

      // ข้อมูลปลายทาง/เจ้าหน้าที่ใน step "ส่งหน่วยงาน" (เผื่อเปิดใช้)
      let extraInfo = "";
      if (def.key === "sent" && logs.length > 0) {
        const log = logs[0];
        if (log.status === "sent_to_agency") {
          extraInfo = `เจ้าหน้าที่รับเรื่อง: ${log.assigned_to || complaint.assigned_to || "-"}`;
        }
      }

      const description = logs.map((log) => {
        const dateTH = formatThaiDate(getWhen(log));
        const note =
          log.notes ||
          log.note ||
          log.message ||
          log.subject ||
          log.decision_subject ||
          "-";
        return `${note} (${dateTH})`;
      });

      return { label: def.label, icon, description, extraInfo };
    });

    return { steps: built, activeStep: resolved ? STEP_DEFS.length : highestStepIdx };
  }, [complaint, outgoingTracking]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (errorMsg) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography color="error">{errorMsg}</Typography>
      </Box>
    );
  }

  if (!complaint) return null;

  return (
    <>
      <NavbarMain />

      <Container maxWidth="xl">
        <Box className={styles.detailContainer}>
          <Typography className={styles.title}>ติดตามผลการดำเนินการ</Typography>

          <Box className={styles.headerBarBlud} />
          <Box className={styles.headerBarBludGold}>
            <Typography>
              เจ้าหน้าที่ผู้รับผิดชอบ : {complaint.assigned_to || "-"}
            </Typography>
          </Box>

          <Box className={styles.headerBarLightBlue}>
            <Box display="flex" justifyContent="space-between" width="100%">
              <Typography sx={{ color: "#1120A3" }}>
                เรื่อง: {complaint.subject || complaint.step3?.general?.subject || complaint.step3?.subject || "-"}
              </Typography>
              <Typography sx={{ color: "#1120A3" }}>
                วันที่รับเรื่อง : {formatThaiDate(complaint.created_at)}
              </Typography>
            </Box>
          </Box>

          <Stepper
            activeStep={activeStep}
            alternativeLabel
            sx={{
              mt: 5,
              "& .MuiStepConnector-line": {
                borderWidth: "3px",
                maxWidth: "calc(100% - 40px)",
                ml: "auto",
                mr: "auto",
              },
              "& .Mui-active .MuiStepConnector-line": {
                borderColor: "#2499FF",
              },
              "& .Mui-completed .MuiStepConnector-line": {
                borderColor: "#4CAF50",
              },
            }}
          >
            {steps.map((step, idx) => (
              <Step key={idx}>
                <StepLabel
                  icon={step.icon}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                    textAlign: "center",
                  }}
                >
                  <Typography className={styles.stepLabel}>{step.label}</Typography>

                  {/* เปิดใช้ได้ถ้าต้องการรายละเอียดใต้ step */}
                  {/* {step.extraInfo && (
                    <Typography sx={{ color: "#2499FF", fontWeight: 600 }}>
                      {step.extraInfo}
                    </Typography>
                  )}
                  {step.description.length > 0 && (
                    <ul className={styles.stepDescription}>
                      {step.description.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  )} */}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box className={styles.headerBarLightBlue}>
            <Typography sx={{ color: "#1120A3" }}>
              แบบรับคำร้องเรียน / เรียนทุกข์กระทรวงการคลัง
            </Typography>
          </Box>

          <ComplaintIDService complaint={complaint} />
        </Box>
      </Container>
    </>
  );
}