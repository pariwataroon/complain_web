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
import { GetComplaintMeByID, GetComplaintOutgoingTracking } from "@pages/api/complaint/complaint";
import { showLoading, closeAlert, alertError } from "@utils/Alerts";
import { formatThaiDate } from "@utils/Formats";
import { exportElementToPDF } from "@utils/exportPDF";
import styles from "./FollowupDetailPage.module.scss";

// Canonical steps for display
const STEP_DEFS = [
  { key: "submitted", label: "รับเรื่องร้องเรียน" },
  { key: "sent", label: "ส่งหน่วยงาน" },
  { key: "in_progress", label: "อยู่ระหว่างดำเนินการ" },
  { key: "reviewed", label: "ติดตามผลการพิจารณาจากหน่วยงาน" },
  { key: "resolved", label: "การดำเนินการเสร็จสิ้น" },
];

// Map backend status strings to the above step keys
const STATUS_ALIAS = {
  submitted: ["submitted"],
  sent: ["sent_to_agency"],
  in_progress: ["in_process", "in_review", "sent_to_external"],
  reviewed: ["tracking", "reviewed"],
  resolved: ["completed", "cancelled"],
};

const RESOLVED_STATUSES = ["completed", "cancelled"];

const normalizeStatus = (status) => {
  if (!status) return "submitted";
  const s = String(status);
  for (const key of Object.keys(STATUS_ALIAS)) {
    if (STATUS_ALIAS[key].includes(s)) return key;
  }
  const low = s.toLowerCase();
  for (const key of Object.keys(STATUS_ALIAS)) {
    if (STATUS_ALIAS[key].map((v) => v.toLowerCase()).includes(low)) return key;
  }
  return "submitted";
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

const isResolved = (mergedHistory, complaint) => {
  const lastEntry = mergedHistory.filter(h => h.status).slice(-1)[0];
  const lastStatus = lastEntry?.status || complaint.status;
  // ต้อง normalize ด้วย
  const lastKey = normalizeStatus(lastStatus);
  return lastKey === "resolved";
};

export default function FollowupDetailPage() {
  const router = useRouter();
  const { id } = router.query;

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
          GetComplaintMeByID(id),
          GetComplaintOutgoingTracking(id),
        ]);
        const data = resComplaint?.data ?? resComplaint;
        const comp = data.res_data ?? data;
        setComplaint(comp);

        setOutgoingTracking(
          resTracking?.data?.res_data ?? resTracking?.res_data ?? resTracking
        );
      } catch (err) {
        console.error(err);
        setErrorMsg("ไม่สามารถโหลดข้อมูลได้");
        alertError("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลได้");
      } finally {
        closeAlert();
        setLoading(false);
      }
    })();
  }, [router.isReady, id]);

  //--- รวมสถานะจากทั้ง complaint และ outgoing-tracking
  const { steps, activeStep } = useMemo(() => {
    if (!complaint) return { steps: [], activeStep: 0 };

    const history = complaint.status_history ?? [];
    let otHistory = outgoingTracking?.history ?? [];

    const mergedHistory = [
      ...history,
      ...otHistory.map((h) => ({
        ...h,
        status: h.status || h.type || "reviewed",
        changed_at: h.at,
      })),
    ];

    const resolved = isResolved(mergedHistory, complaint);
    const highestStepIdx = getHighestStepIndex(mergedHistory);

    const built = STEP_DEFS.map((def, idx) => {
      const logs = mergedHistory.filter((h) => normalizeStatus(h.status) === def.key);

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

      // เพิ่มข้อมูลปลายทาง/เจ้าหน้าที่ใน step "ส่งหน่วยงาน"
      let extraInfo = "";
      if (def.key === "sent" && logs.length > 0) {
        const log = logs[0];
        if (log.status === "sent_to_agency") {
          extraInfo = `เจ้าหน้าที่รับเรื่อง: ${log.assigned_to || complaint.assigned_to || "-"}`;
        }
      }

      const description = logs.map((log) => {
        const dateTH = formatThaiDate(log.changed_at || log.changedAt || log.date || log.at);
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

    // activeStep: ให้ stepper ชี้ปัจจุบันที่สูงสุด (หรือสุดท้ายถ้า resolved)
    return { steps: built, activeStep: resolved ? STEP_DEFS.length : highestStepIdx };
  }, [complaint, outgoingTracking]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (errorMsg) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
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
                เรื่อง: {complaint.step3?.general?.subject || complaint.subject || "-"}
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
                  <Typography className={styles.stepLabel}>
                    {step.label}
                  </Typography>
                  {step.extraInfo && (
                    <Typography sx={{ color: "#2499FF", fontWeight: 600 }}>{step.extraInfo}</Typography>
                  )}
                  {/* {step.description.length > 0 && (
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