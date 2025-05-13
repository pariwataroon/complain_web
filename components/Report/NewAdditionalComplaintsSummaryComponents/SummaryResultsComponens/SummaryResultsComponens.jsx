import React, { useState } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableNewAddCompResults from "@services/TableNewAddCompResults/TableNewAddCompResults";
import { Box, Button, Modal, TextField, Typography } from "@mui/material";

// สำหรับกรองเดือน (คำย่อในวันที่)
const THAI_MONTH_ABBREV = {
  1: "ม.ค.",
  2: "ก.พ.",
  3: "มี.ค.",
  4: "เม.ย.",
  5: "พ.ค.",
  6: "มิ.ย.",
  7: "ก.ค.",
  8: "ส.ค.",
  9: "ก.ย.",
  10: "ต.ค.",
  11: "พ.ย.",
  12: "ธ.ค.",
};

// ตัวเลือกเดือน (สำหรับ SelectField)
const MONTH_OPTIONS = [
  { value: "1", label: "มกราคม" },
  { value: "2", label: "กุมภาพันธ์" },
  { value: "3", label: "มีนาคม" },
  { value: "4", label: "เมษายน" },
  { value: "5", label: "พฤษภาคม" },
  { value: "6", label: "มิถุนายน" },
  { value: "7", label: "กรกฎาคม" },
  { value: "8", label: "สิงหาคม" },
  { value: "9", label: "กันยายน" },
  { value: "10", label: "ตุลาคม" },
  { value: "11", label: "พฤศจิกายน" },
  { value: "12", label: "ธันวาคม" },
];

// ตัวเลือกปีงบประมาณ
const FISCAL_YEAR_OPTIONS = [
  { value: "2566", label: "2566" },
  { value: "2567", label: "2567" },
  { value: "2568", label: "2568" },
  { value: "2569", label: "2569" },
  { value: "2570", label: "2570" },
];

// ─── mock data (4 รายการ ตัวอย่าง) ─────────────────────────────────────────────────
const mockComplaints = [
  {
    id: 1,
    claimantName: "นางสาวดลภัทร มีความสุข",
    issue: "ขอความช่วยเหลือเกี่ยวกับปัญหาหนี้สินในระบบ",
    subIssueType: "หนี้ในระบบ",
    note: "ส่งเรื่องให้ธนาคารพิจารณาเรียบร้อยแล้ว",
  },
  {
    id: 2,
    claimantName: "นางสาวศิริวรา วรานันต์",
    issue: "ขอความช่วยเหลือเกี่ยวกับปัญหาหนี้สินในระบบ",
    subIssueType: "หนี้ในระบบ",
    note: "เจ้าหน้าที่ติดต่อกลับเรียบร้อยแล้ว",
  },
  {
    id: 3,
    claimantName: "นายธีรทัศน์ ฤทธินันท์",
    issue: "ขอความช่วยเหลือเกี่ยวกับปัญหาหนี้สินในระบบ",
    subIssueType: "หนี้ในระบบ",
    note: "อยู่ระหว่างการตรวจสอบเอกสารเพิ่มเติม",
  },
  {
    id: 4,
    claimantName: "นางสาวดลภัทร มีความสุข",
    issue: "ขอความช่วยเหลือเกี่ยวกับปัญหาหนี้สินในระบบ",
    subIssueType: "หนี้ในระบบ",
    note: "ปิดเรื่องและแจ้งผู้ร้องเรียบร้อยแล้ว",
  },
];

// สร้างตัวเลือกหมายเหตุ พร้อมตัวเลือก "เพิ่มหมายเหตุ..."
const NOTE_OPTIONS = Array.from(new Set(mockComplaints.map((c) => c.note)))
  .map((n) => ({ value: n, label: n }))
  .concat({ value: "__add", label: "เพิ่มหมายเหตุ..." });

// สร้างตัวเลือกประเภทเรื่องหลัก/ย่อย
const ISSUE_TYPE_OPTIONS = Array.from(
  new Set(mockComplaints.map((c) => c.issue))
).map((type) => ({ value: type, label: type }));
const SUB_ISSUE_TYPE_OPTIONS = Array.from(
  new Set(mockComplaints.map((c) => c.subIssueType))
).map((sub) => ({ value: sub, label: sub }));

const Summaryresults = () => {
  const [allComplaints] = useState(mockComplaints);
  const [filteredComplaints, setFilteredComplaints] = useState(mockComplaints);

  // state สำหรับ Modal เพิ่ม/แก้ไขหมายเหตุ
  const [currentNoteRow, setCurrentNoteRow] = useState(null);
  const [newNoteText, setNewNoteText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const router = useRouter();

  // ไปหน้าสรุปตามประเภทเรื่อง
  const handleSummaryByIssueType = () => {
    router.push(
      "/admin/document/new-additional-complaints-summary/summaryresults"
    );
  };

  // เมื่อ select หมายเหตุเปลี่ยน - นี่คือฟังก์ชันที่จะถูกเรียกเมื่อมีการกด "เพิ่มหมายเหตุ..."
  const handleAddNote = (rowId) => {
    setCurrentNoteRow(rowId);
    setNewNoteText("");
    setModalOpen(true);
  };

  // อัพเดทค่าหมายเหตุ
  const handleNoteChange = (rowId, value) => {
    setFilteredComplaints((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, note: value } : row))
    );
  };

  // บันทึกจาก Modal
  const handleSaveNote = () => {
    setFilteredComplaints((prev) =>
      prev.map((row) =>
        row.id === currentNoteRow ? { ...row, note: newNoteText } : row
      )
    );
    setModalOpen(false);
  };

  // ค้นหาตาม filters
  const handleSearch = ({
    issueType,
    subIssueType,
    month,
    fiscalYear,
    note,
  }) => {
    let result = allComplaints;
    if (issueType) result = result.filter((i) => i.issue === issueType);
    if (subIssueType)
      result = result.filter((i) => i.subIssueType === subIssueType);
    if (month)
      result = result.filter((i) =>
        i.receiveDate?.includes(THAI_MONTH_ABBREV[month])
      );
    if (fiscalYear)
      result = result.filter((i) => i.receiveDate?.endsWith(fiscalYear));
    if (note) result = result.filter((i) => i.note === note);
    setFilteredComplaints(result);
  };

  return (
    <>
      <BreadcrumbsService
        items={[
          {
            label: "เมนูรายงาน",
            icon: (
              <img
                src="/icons/Cube.png"
                alt="cube"
                style={{ width: 24, height: 24, marginBottom: -8 }}
              />
            ),
            url: "/admin",
          },
          {
            label: "รายงานสรุปเรื่องเข้าใหม่และร้องเพิ่ม",
            url: "/admin/document/new-additional-complaints-summary",
          },
          { label: "สรุปผลตามประเภทเรื่อง" },
        ]}
      />

      <TableNewAddCompResults
        data={filteredComplaints}
        title="สรุปผลตามประเภทเรื่อง"
        onSearch={handleSearch}
        summaryTitle="รายละเอียดสรุปผลการดำเนินงานเรื่องร้องเรียน"
        summaryDate="31 มกราคม พ.ศ.2568"
        summaryCategory="ประเภทหนี้สิน / การกู้ยืม / การปรับโครงสร้างหนี้"
        onActionClick={handleSummaryByIssueType}
        NOTE_OPTIONS={NOTE_OPTIONS}
        onAddNote={handleAddNote} // เปลี่ยนจาก onNoteSelect เป็น onAddNote
        onNoteChange={handleNoteChange} // เพิ่ม prop สำหรับการเปลี่ยนค่าหมายเหตุ
        filterFields={[
          {
            name: "issueType",
            label: "ประเภทเรื่องหลัก",
            type: "select",
            options: ISSUE_TYPE_OPTIONS,
          },
          {
            name: "subIssueType",
            label: "ประเภทเรื่องย่อย",
            type: "select",
            options: SUB_ISSUE_TYPE_OPTIONS,
          },
          {
            name: "month",
            label: "เดือน",
            type: "select",
            options: MONTH_OPTIONS,
          },
          {
            name: "fiscalYear",
            label: "ปีงบประมาณ",
            type: "select",
            options: FISCAL_YEAR_OPTIONS,
          },
          {
            name: "note",
            label: "หมายเหตุ",
            type: "select",
            options: NOTE_OPTIONS,
          },
        ]}
      />

      {/* Modal สำหรับเพิ่ม/แก้ไขหมายเหตุ */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "white",
            p: 4,
            borderRadius: 1,
            width: 400,
            maxWidth: "90%",
          }}
        >
          <Typography variant="h6" mb={2}>
            เพิ่ม/แก้ไขหมายเหตุ
          </Typography>
          <TextField
            fullWidth
            label="หมายเหตุใหม่"
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
          />
          <Box mt={2} textAlign="right">
            <Button onClick={() => setModalOpen(false)} sx={{ mr: 1 }}>
              ยกเลิก
            </Button>
            <Button variant="contained" onClick={handleSaveNote}>
              บันทึก
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default Summaryresults;
