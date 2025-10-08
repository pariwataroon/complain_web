import React, { useState, useEffect, useMemo } from "react";
import { Box, Typography, Modal, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import SelectMenuService from "@services/SelectMenu/SelectMenu";
import TextfieldService from "@services/TextfieldService/TextfieldService";
import { getStaffWorkload } from "@pages/api/statistics/statistics";

const breadcrumbItems = [
  {
    label: "สถิติการทำงานของเจ้าหน้าที่",
    icon: (
      <img
        src="/icons/Bars.png"
        alt="icon"
        style={{ width: 24, height: 24, marginBottom: -8 }}
      />
    ),
  },
];

const getFiscalYearOptions = () => {
  const currentYearBE = new Date().getFullYear() + 543;
  const years = [];
  for (let y = currentYearBE - 2; y <= currentYearBE + 2; y++) {
    years.push({ label: String(y), value: String(y) });
  }
  return years;
};

const fiscalYearOptions = getFiscalYearOptions();

const thaiYearToGregorian = (thaiYearStr) => {
  const y = parseInt(thaiYearStr, 10);
  return Number.isNaN(y) ? new Date().getFullYear() : y - 543;
};

const buildDateRangeOfYear = (gregYear) => ({
  date_from: `${gregYear}-01-01`,
  date_to: `${gregYear}-12-31`,
});

const statusLabel = (s) =>
  ({
    submitted: "รับเรื่อง",
    sent_to_agency: "ส่งหน่วยงาน",
    sent_to_external: "ส่งภายนอก",
    in_process: "กำลังดำเนินการ",
    in_review: "ตรวจสอบ",
    tracking: "ติดตาม",
    reviewed: "ทบทวน",
    completed: "สำเร็จ",
    cancelled: "ยุติ",
  }[s] ?? s);

// ✅ ปี พ.ศ. "ปัจจุบัน" (ไม่ใช่ปีงบฯ)
const getCurrentThaiCalendarYear = () => String(new Date().getFullYear() + 543);

const ComplaintCard = ({ complaint, index, backlog }) => {
  const bg = index < backlog ? "#FDEAEA" : "#EAF4FE";
  return (
    <Box mb={3} p={2} bgcolor={bg} borderRadius={2} overflow="hidden">
      <Typography fontWeight={700} mb={2} color="#1120A3">
        เรื่องที่ {index + 1}
      </Typography>
      <Box
        display="grid"
        gridTemplateColumns={{ xs: "1fr", sm: "160px 1fr" }}
        rowGap={1}
        columnGap={2}
      >
        <Typography>เรื่อง</Typography>
        <TextfieldService size="small" fullWidth disabled value={complaint.topic} />
        <Typography>ช่องทางเรื่องร้องเรียน</Typography>
        <TextfieldService size="small" fullWidth disabled value={complaint.channel} />
        <Typography>ประเภทเรื่องร้องเรียน</Typography>
        <TextfieldService size="small" fullWidth disabled value={complaint.type} />
        <Typography>เลขรับแจ้ง</Typography>
        <TextfieldService size="small" fullWidth disabled value={complaint.code} />
      </Box>
    </Box>
  );
};

const StaffProfile = ({ staff }) => {
  return (
    <>
      <Box
        border="2px solid #0E63D8"
        borderRadius={2}
        p={1.5}
        mb={2}
        sx={{
          width: { xs: 100, sm: 140 },
          height: { xs: 120, sm: 170 },
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <img
          src="/human.png"
          alt="avatar"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </Box>
      <Typography fontSize={{ xs: 18, sm: 24 }} mt={1} fontWeight={600} align="center" color="#FFFFFF">
        {staff.name}
      </Typography>
      <Typography fontSize={{ xs: 14, sm: 18 }} mb={3} align="center" color="#FFFFFF">
        {staff.role}
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "row", md: "column" },
          flexWrap: { xs: "wrap", md: "nowrap" },
          justifyContent: "center",
          gap: { xs: 2, md: 0.5 },
          width: "100%",
        }}
      >
        {[
          { label: "รับงาน", value: staff.received },
          { label: "คงค้าง", value: staff.backlog },
          { label: "สำเร็จ", value: staff.done },
        ].map(({ label, value }) => (
          <Box
            key={label}
            display="flex"
            justifyContent="space-between"
            width={{ xs: "auto", md: "100%" }}
            maxWidth={{ md: 180 }}
            mb={{ md: 0.5 }}
            px={{ xs: 1, md: 0 }}
          >
            <Typography fontSize={{ xs: 16, sm: 18 }} color="#FFFFFF" mr={1}>
              {label}
            </Typography>
            <Typography fontSize={{ xs: 16, sm: 18 }} color="#FFFFFF">
              {value} เรื่อง
            </Typography>
          </Box>
        ))}
      </Box>
    </>
  );
};

const AccountBoxComponents = () => {
  // ✅ ใช้ปี พ.ศ. ปัจจุบันเป็นค่าเริ่มต้น
  const [fiscalYear, setFiscalYear] = useState(() => {
    const fy = getCurrentThaiCalendarYear();
    const exists = fiscalYearOptions.some((o) => o.value === fy);
    return exists ? fy : fiscalYearOptions[0].value;
  });
  const handleYearChange = (e) => {
    setFiscalYear(e.target.value);
  };

  const [open, setOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const handleOpenModal = (staff) => {
    setSelectedStaff(staff);
    setOpen(true);
  };
  const handleCloseModal = () => {
    setOpen(false);
    setSelectedStaff(null);
  };

  const [loading, setLoading] = useState(false);
  const [summaryState, setSummaryState] = useState({
    total_staff: 0,
    total_complaints: 0,
    in_progress_cases: 0, // รวม 7 สถานะที่ยังไม่ปิด
    closed_cases: 0,       // completed + cancelled
  });
  const [staffStats, setStaffStats] = useState([]);

  const summaryCards = useMemo(
    () => [
      { label: "จำนวนเจ้าหน้าที่ทั้งหมด", value: summaryState.total_staff, unit: "คน", bg: "#1221B5" },
      { label: "เรื่องราวร้องทุกข์ทั้งหมด", value: summaryState.total_complaints, unit: "เรื่อง", bg: "#2499FF" },
      { label: "เรื่องราวร้องทุกข์ยุติ", value: summaryState.closed_cases, unit: "เรื่อง", bg: "#9AD0FF" },
      { label: "เรื่องราวร้องทุกข์ดำเนินการ", value: summaryState.in_progress_cases, unit: "เรื่อง", bg: "#F1CA4B" },
    ],
    [summaryState]
  );

  const fetchData = async (thaiYearStr) => {
    try {
      setLoading(true);
      const year = thaiYearToGregorian(thaiYearStr);
      const { date_from, date_to } = buildDateRangeOfYear(year);
      const data = await getStaffWorkload({ skip: 0, limit: 10000, date_from, date_to, year });

      const apiSummary = data?.summary ?? {};
      const sc = apiSummary?.status_counts ?? {};

      const completed = Number(sc.completed ?? 0);
      const cancelled = Number(sc.cancelled ?? 0);
      const closedSum = completed + cancelled;

      // ✅ รวม 7 สถานะที่ยังไม่ปิด (เพิ่ม sent_to_external)
      const inProgressSum =
        Number(sc.submitted ?? 0) +
        Number(sc.sent_to_agency ?? 0) +
        Number(sc.sent_to_external ?? 0) +
        Number(sc.in_process ?? 0) +
        Number(sc.in_review ?? 0) +
        Number(sc.tracking ?? 0) +
        Number(sc.reviewed ?? 0);

      setSummaryState({
        total_staff: Number(apiSummary.total_staff ?? 0),
        total_complaints: Number(apiSummary.total_complaints ?? 0),
        in_progress_cases: inProgressSum,
        closed_cases: closedSum,
      });

      const rawStaff = Array.isArray(data?.staff_data) ? data.staff_data : [];
      const uniqueStaff = rawStaff.filter(
        (row, idx, self) =>
          row?.staff_info?.id &&
          idx === self.findIndex((r) => r?.staff_info?.id === row?.staff_info?.id)
      );

      const nextStaff = uniqueStaff.map((row, idx) => {
        const info = row?.staff_info ?? {};
        const wl = row?.workload ?? {};
        const wsc = wl?.status_counts ?? {};

        // ✅ คงค้าง (รวม 7 สถานะ และเพิ่ม sent_to_external)
        const backlog =
          Number(wsc.submitted ?? 0) +
          Number(wsc.sent_to_agency ?? 0) +
          Number(wsc.sent_to_external ?? 0) +
          Number(wsc.in_process ?? 0) +
          Number(wsc.in_review ?? 0) +
          Number(wsc.tracking ?? 0) +
          Number(wsc.reviewed ?? 0);

        // ✅ สำเร็จ (completed + cancelled)
        const done =
          Number(wsc.completed ?? 0) + Number(wsc.cancelled ?? 0);

        // จำนวนที่รับงาน (เชื่อถือ total_assigned ก่อน ถ้าไม่มีให้คำนวณ)
        const received = Number(
          wl.total_assigned ?? backlog + done
        );

        const complaints = Array.isArray(row?.latest_complaints)
          ? row.latest_complaints.map((c) => ({
              topic: c.subject ?? "-",
              channel: "เว็บไซต์รับเรื่องร้องทุกข์",
              type: statusLabel(c.status),
              code: c.complaint_number ?? "-",
            }))
          : [];

        return {
          id: info.id ?? idx + 1,
          name: info.name ?? "ไม่ระบุชื่อ",
          role: info.position || "",
          role_name:
            Array.isArray(info.roles) && info.roles.length > 0
              ? info.roles[0].role_name
              : "-",
          received,
          backlog,
          done,
          complaints,
        };
      });

      setStaffStats(nextStaff);
    } catch (err) {
      console.error(err);
      setSummaryState({
        total_staff: 0,
        total_complaints: 0,
        in_progress_cases: 0,
        closed_cases: 0,
      });
      setStaffStats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(fiscalYear);
  }, [fiscalYear]);

  return (
    <Box>
      <BreadcrumbsService items={breadcrumbItems} />
      <Box display="flex" justifyContent="flex-end" mt={2} px={1}>
        <Typography color="#1120A3" fontWeight={600} mb={0.5} mr={2}>
          ปีงบประมาณ
        </Typography>
        <SelectMenuService
          options={fiscalYearOptions}
          value={fiscalYear}
          handleChange={handleYearChange}
          name="fiscalYear"
          width="160px"
          placeholder="เลือกปี"
        />
      </Box>

      <Box display="flex" flexWrap="wrap" gap={3} mt={4} px={1}>
        {summaryCards.map((card) => (
          <Box
            key={card.label}
            sx={{
              flex: "1 1 240px",
              minWidth: 200,
              maxWidth: 400,
              backgroundColor: card.bg,
              color: "#FFFFFF",
              borderRadius: 2,
              px: 3,
              py: 2,
              boxShadow: 2,
            }}
          >
            <Typography fontSize={14} fontWeight={500} mb={1}>
              {card.label}
            </Typography>
            <Typography fontSize={28} fontWeight={700}>
              {loading ? "…" : card.value} {card.unit}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box mt={6} px={1}>
        <Box display="flex" alignItems="center" mb={3}>
          <Typography color="#1120A3" fontWeight={700} fontSize={20} mr={2}>
            สถิติการทำงานเจ้าหน้าที่ทั้งหมด
          </Typography>
          <Box flexGrow={1} height={1} bgcolor="#1120A3" opacity={0.2} />
        </Box>

        <Box display="flex" flexWrap="wrap" gap={3}>
          {staffStats.map((staff) => (
            <Box
              key={staff.id}
              onClick={() => handleOpenModal(staff)}
              sx={{
                flex: "1 1 300px",
                minWidth: 260,
                maxWidth: 400,
                backgroundColor: "#FFFFFF",
                border: "2px solid #1D7AD3",
                borderRadius: 2,
                px: 3,
                py: 2,
                display: "flex",
                alignItems: "flex-start",
                boxShadow: 1,
                color: "#1120A3",
                cursor: "pointer",
                transition: "transform .15s",
                "&:hover": { transform: "translateY(-4px)" },
              }}
            >
              <Box mr={2} flexShrink={0}>
                <img src="/human.png" alt="avatar" width={72} height={90} />
              </Box>

              <Box>
                <Typography fontWeight={600}>{staff.name}</Typography>
                <Typography fontSize={14} mb={1}>
                  {staff.role ? (
                    <>
                      <Typography fontSize={14} mb={0.5}>
                        {staff.role}
                      </Typography>
                      <Typography fontSize={14} mb={1}>
                        {staff.role_name}
                      </Typography>
                    </>
                  ) : (
                    <Typography fontSize={14} mb={1}>
                      {staff.role_name}
                    </Typography>
                  )}
                </Typography>

                <Box display="grid" gridTemplateColumns="80px 1fr" rowGap={0.5}>
                  <Typography>รับงาน</Typography>
                  <Typography>{staff.received} เรื่อง</Typography>
                  <Typography>คงค้าง</Typography>
                  <Typography>{staff.backlog} เรื่อง</Typography>
                  <Typography>สำเร็จ</Typography>
                  <Typography>{staff.done} เรื่อง</Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Modal
        open={open}
        onClose={handleCloseModal}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: { xs: "95%", sm: "90%", md: "80%", lg: "70%" },
            maxWidth: 1200,
            maxHeight: { xs: "90vh", sm: "85vh" },
            bgcolor: "#FFFFFF",
            borderRadius: 2,
            boxShadow: 24,
            p: 0,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <IconButton
            onClick={handleCloseModal}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 10,
              color: "#000000",
              bgcolor: "rgba(255,255,255,0.7)",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.9)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>

          {selectedStaff && (
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                height: { xs: "auto", md: "85vh" },
              }}
            >
              <Box
                sx={{
                  width: { xs: "100%", md: 320 },
                  bgcolor: "#91CBFF",
                  p: { xs: 2, sm: 3 },
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flexShrink: 0,
                  height: { md: "100%" },
                  position: { md: "sticky" },
                  top: 0,
                }}
              >
                <Box
                  border="2px solid #0E63D8"
                  borderRadius={2}
                  p={1.5}
                  mb={2}
                  sx={{
                    width: { xs: 100, sm: 140 },
                    height: { xs: 120, sm: 170 },
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <img
                    src="/human.png"
                    alt="avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                </Box>

                <Typography fontSize={{ xs: 18, sm: 24 }} mt={1} fontWeight={600} align="center" color="#FFFFFF">
                  {selectedStaff.name}
                </Typography>
                <Typography fontSize={{ xs: 14, sm: 18 }} mb={3} align="center" color="#FFFFFF">
                  {selectedStaff.role}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "row", md: "column" },
                    flexWrap: { xs: "wrap", md: "nowrap" },
                    justifyContent: "center",
                    gap: { xs: 2, md: 0.5 },
                    width: "100%",
                  }}
                >
                  {[
                    { label: "รับงาน", value: selectedStaff.received },
                    { label: "คงค้าง", value: selectedStaff.backlog },
                    { label: "สำเร็จ", value: selectedStaff.done },
                  ].map(({ label, value }) => (
                    <Box
                      key={label}
                      display="flex"
                      justifyContent="space-between"
                      width={{ xs: "auto", md: "100%" }}
                      maxWidth={{ md: 180 }}
                      mb={{ md: 0.5 }}
                      px={{ xs: 1, md: 0 }}
                    >
                      <Typography fontSize={{ xs: 16, sm: 18 }} color="#FFFFFF" mr={1}>
                        {label}
                      </Typography>
                      <Typography fontSize={{ xs: 16, sm: 18 }} color="#FFFFFF">
                        {value} เรื่อง
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box
                sx={{
                  flexGrow: 1,
                  p: { xs: 2, sm: 3, md: 4 },
                  overflow: "auto",
                  height: { xs: "60vh", md: "85vh" },
                  width: { md: "calc(100% - 320px)", xs: "100%" },
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight={700}
                  color="#1120A3"
                  mb={4}
                  sx={{ fontSize: { xs: 18, sm: 20 }, mt: { xs: 1, md: 0 } }}
                >
                  เรื่องร้องเรียนที่รับผิดชอบ
                </Typography>
                {selectedStaff.complaints.map((c, idx) => (
                  <ComplaintCard key={idx} complaint={c} index={idx} backlog={selectedStaff.backlog} />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default AccountBoxComponents;
