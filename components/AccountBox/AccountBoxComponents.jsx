import React, { useState } from "react";
import { Box, Typography, Modal, IconButton, TextField } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import SelectMenuService from "@services/SelectMenu/SelectMenu";
import TextfieldService from "@services/TextfieldService/TextfieldService";
/* -------------------------------------------------------------------------- */
/*  breadcrumbs                                                               */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/*  options                                                                   */
/* -------------------------------------------------------------------------- */
const fiscalYearOptions = [
  { label: "2566", value: "2566" },
  { label: "2567", value: "2567" },
  { label: "2568", value: "2568" },
  { label: "2569", value: "2569" },
];

/* -------------------------------------------------------------------------- */
/*  summary cards                                                             */
/* -------------------------------------------------------------------------- */
const summaryCards = [
  { label: "จำนวนเจ้าหน้าที่ทั้งหมด", value: 8, unit: "คน", bg: "#1221B5" },
  {
    label: "เรื่องราวร้องทุกข์ทั้งหมด",
    value: 25,
    unit: "เรื่อง",
    bg: "#2499FF",
  },
  {
    label: "เรื่องราวร้องทุกข์ซ้ำซ้อน",
    value: 15,
    unit: "เรื่อง",
    bg: "#9AD0FF",
  },
  {
    label: "เรื่องราวร้องทุกข์ดำเนินการ",
    value: 10,
    unit: "เรื่อง",
    bg: "#F1CA4B",
  },
];

/* -------------------------------------------------------------------------- */
/*  staff mock data (with example complaints)                                 */
/* -------------------------------------------------------------------------- */
const staffStats = Array.from({ length: 12 }, (_, idx) => ({
  id: idx + 1,
  name: "นายเป็นสุข เป็นสุขจิต",
  role: "เจ้าหน้าที่รับผิดชอบตอบเรื่องร้องทุกข์",
  received: 5,
  backlog: 2,
  done: 3,
  complaints: [
    {
      topic: "พฤติกรรมเจ้าหน้าที่ที่ไม่เหมาะสมขณะปฏิบัติราชการ",
      channel: "เว็บไซต์รับเรื่องร้องทุกข์",
      type: "พฤติกรรมเจ้าหน้าที่",
      code: "000-0000-00000-00",
    },
    {
      topic: "พฤติกรรมเจ้าหน้าที่ที่ไม่เหมาะสมขณะปฏิบัติราชการ",
      channel: "เว็บไซต์รับเรื่องร้องทุกข์",
      type: "พฤติกรรมเจ้าหน้าที่",
      code: "000-0000-00000-01",
    },
    {
      topic: "พฤติกรรมเจ้าหน้าที่ที่ไม่เหมาะสมขณะปฏิบัติราชการ",
      channel: "เว็บไซต์รับเรื่องร้องทุกข์",
      type: "พฤติกรรมเจ้าหน้าที่",
      code: "000-0000-00000-02",
    },
  ],
}));

/* -------------------------------------------------------------------------- */
/*  helper component : ComplaintCard                                           */
/* -------------------------------------------------------------------------- */
const ComplaintCard = ({ complaint, index }) => {
  const bg = index % 2 === 0 ? "#FDEAEA" : "#EAF4FE";

  return (
    <Box mb={3} p={2} bgcolor={bg} borderRadius={2} overflow="hidden">
      <Typography fontWeight={700} mb={2} color="#1120A3">
        เรื่องที่ {index + 1}
      </Typography>

      <Box
        display="grid"
        gridTemplateColumns="160px 1fr"
        rowGap={1}
        columnGap={2}
      >
        <Typography>เรื่อง</Typography>
        <TextfieldService
          size="small"
          fullWidth
          disabled
          value={complaint.topic}
        />

        <Typography>ช่องทางเรื่องร้องเรียน</Typography>
        <TextfieldService
          size="small"
          fullWidth
          disabled
          value={complaint.channel}
        />

        <Typography>ประเภทเรื่องร้องเรียน</Typography>
        <TextfieldService
          size="small"
          fullWidth
          disabled
          value={complaint.type}
        />

        <Typography>เลขรับแจ้ง</Typography>
        <TextfieldService
          size="small"
          fullWidth
          disabled
          value={complaint.code}
        />
      </Box>
    </Box>
  );
};

/* -------------------------------------------------------------------------- */
/*  main component                                                             */
/* -------------------------------------------------------------------------- */
const AccountBoxComponents = () => {
  const [fiscalYear, setFiscalYear] = useState(fiscalYearOptions[0].value);
  const [open, setOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const handleYearChange = (_, newValue) => setFiscalYear(newValue);
  const handleOpenModal = (staff) => {
    setSelectedStaff(staff);
    setOpen(true);
  };
  const handleCloseModal = () => {
    setOpen(false);
    setSelectedStaff(null);
  };

  return (
    <Box>
      {/* breadcrumbs */}
      <BreadcrumbsService items={breadcrumbItems} />

      {/* fiscal year selector */}
      <Box display="flex" justifyContent="flex-end" mt={2} px={1}>
        <Box display="flex" flexDirection="column" alignItems="flex-start">
          <Typography color="#1120A3" fontWeight={600} mb={0.5}>
            ปีงบประมาณ
          </Typography>
          <SelectMenuService
            options={fiscalYearOptions}
            value={fiscalYear}
            onChange={handleYearChange}
            name="fiscalYear"
            width="160px"
            placeholder="เลือกปี"
          />
        </Box>
      </Box>

      {/* summary cards */}
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
              {card.value} {card.unit}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* staff performance grid */}
      <Box mt={6} px={1}>
        {/* header */}
        <Box display="flex" alignItems="center" mb={3}>
          <Typography color="#1120A3" fontWeight={700} fontSize={20} mr={2}>
            สถิติการทำงานเจ้าหน้าที่ทั้งหมด
          </Typography>
          <Box flexGrow={1} height={1} bgcolor="#1120A3" opacity={0.2} />
        </Box>

        {/* grid */}
        <Box display="flex" flexWrap="wrap" gap={3}>
          {Array.isArray(staffStats) &&
            staffStats.map((staff) => (
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
                  "&:hover": {
                    transform: "translateY(-4px)",
                  },
                }}
              >
                {/* avatar */}
                <Box mr={2} flexShrink={0}>
                  <img src="/human.png" alt="avatar" width={72} height={90} />
                </Box>

                {/* details */}
                <Box>
                  <Typography fontWeight={600}>{staff.name}</Typography>
                  <Typography fontSize={14} mb={1}>
                    {staff.role}
                  </Typography>

                  <Box
                    display="grid"
                    gridTemplateColumns="80px 1fr"
                    rowGap={0.5}
                  >
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

      {/* staff detail modal */}
      <Modal open={open} onClose={handleCloseModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            maxHeight: "90vh",
            bgcolor: "#FFFFFF",
            borderRadius: 5,
            boxShadow: 24,
            p: 0,
            display: "flex",
            overflow: "hidden",
            border: "none !important",
            outline: "none !important",
          }}
        >
          <Box
            width={320} // ① กว้างขึ้น
            bgcolor="#91CBFF"
            p={3}
            display="flex"
            flexDirection="column"
            alignItems="center"
          >
            {/* ② อวตาร์มีกรอบ */}
            <Box border="2px solid #0E63D8" borderRadius={2} p={1.5} mb={2}>
              <img src="/human.png" alt="avatar" width={140} height={170} />
            </Box>

            {selectedStaff && (
              <>
                <Typography
                  fontSize={24}
                  mt={1}
                  fontWeight={600}
                  align="center"
                  color="#FFFFFF"
                >
                  {selectedStaff.name}
                </Typography>

                <Typography fontSize={18} mb={3} align="center" color="#FFFFFF">
                  {selectedStaff.role}
                </Typography>

                {/* ③ สรุปสถิติ: label ซ้าย / ค่า ขวา */}
                {[
                  { label: "รับงาน", value: selectedStaff.received },
                  { label: "คงค้าง", value: selectedStaff.backlog },
                  { label: "สำเร็จ", value: selectedStaff.done },
                ].map(({ label, value }) => (
                  <Box
                    key={label}
                    display="flex"
                    justifyContent="space-between"
                    width="100%"
                    maxWidth={180}
                    mb={0.5}
                  >
                    <Typography fontSize={18} color="#FFFFFF">
                      {label}
                    </Typography>
                    <Typography fontSize={18} color="#FFFFFF">
                      {value} เรื่อง
                    </Typography>
                  </Box>
                ))}
              </>
            )}
          </Box>

          {/* right panel */}
          <Box flexGrow={1} p={4} overflow="auto" position="relative">
            {/* close button */}
            <IconButton
              onClick={handleCloseModal}
              sx={{ position: "absolute", top: 8, right: 8 }}
            >
              <CloseIcon />
            </IconButton>

            <Typography
              variant="h6"
              fontWeight={700}
              color="#1120A3"
              mb={4}
              textAlign="left"
            >
              เรื่องร้องเรียนที่รับผิดชอบ
            </Typography>

            {selectedStaff?.complaints.map((c, idx) => (
              <ComplaintCard key={idx} complaint={c} index={idx} />
            ))}
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default AccountBoxComponents;
