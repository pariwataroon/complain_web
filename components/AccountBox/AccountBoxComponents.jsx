import React, { useState } from "react";
import { Box, Typography, Modal, IconButton } from "@mui/material";
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
  { label: "เรื่องราวร้องทุกข์ยุติ", value: 15, unit: "เรื่อง", bg: "#9AD0FF" },
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
    {
      topic: "พฤติกรรมเจ้าหน้าที่ที่ไม่เหมาะสมขณะปฏิบัติราชการ",
      channel: "เว็บไซต์รับเรื่องร้องทุกข์",
      type: "พฤติกรรมเจ้าหน้าที่",
      code: "000-0000-00000-03",
    },
    {
      topic: "พฤติกรรมเจ้าหน้าที่ที่ไม่เหมาะสมขณะปฏิบัติราชการ",
      channel: "เว็บไซต์รับเรื่องร้องทุกข์",
      type: "พฤติกรรมเจ้าหน้าที่",
      code: "000-0000-00000-04",
    },
  ],
}));

/* -------------------------------------------------------------------------- */
/*  helper component : ComplaintCard                                           */
/* -------------------------------------------------------------------------- */
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
/*  Staff Profile Component for Modal                                          */
/* -------------------------------------------------------------------------- */
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

      <Typography
        fontSize={{ xs: 18, sm: 24 }}
        mt={1}
        fontWeight={600}
        align="center"
        color="#FFFFFF"
      >
        {staff.name}
      </Typography>

      <Typography
        fontSize={{ xs: 14, sm: 18 }}
        mb={3}
        align="center"
        color="#FFFFFF"
      >
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
      <BreadcrumbsService items={breadcrumbItems} />
      <Box display="flex" justifyContent="flex-end" mt={2} px={1}>
        <Typography color="#1120A3" fontWeight={600} mb={0.5} mr={2}>
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
                  {staff.role}
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

      {/* Responsive Modal */}
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
              {/* Fixed Profile Section - ส่วนที่ไม่ให้เลื่อน */}
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

                <Typography
                  fontSize={{ xs: 18, sm: 24 }}
                  mt={1}
                  fontWeight={600}
                  align="center"
                  color="#FFFFFF"
                >
                  {selectedStaff.name}
                </Typography>

                <Typography
                  fontSize={{ xs: 14, sm: 18 }}
                  mb={3}
                  align="center"
                  color="#FFFFFF"
                >
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
                      <Typography
                        fontSize={{ xs: 16, sm: 18 }}
                        color="#FFFFFF"
                        mr={1}
                      >
                        {label}
                      </Typography>
                      <Typography fontSize={{ xs: 16, sm: 18 }} color="#FFFFFF">
                        {value} เรื่อง
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Scrollable Content Section - ส่วนที่สามารถเลื่อนได้ */}
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
                  <ComplaintCard
                    key={idx}
                    complaint={c}
                    index={idx}
                    backlog={selectedStaff.backlog}
                  />
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
