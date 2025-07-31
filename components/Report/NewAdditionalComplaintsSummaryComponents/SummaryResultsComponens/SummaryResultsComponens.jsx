import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableNewAddCompResults from "@services/TableNewAddCompResults/TableNewAddCompResults";
import {
  Box,
  Button,
  Modal,
  TextField,
  Typography,
  Paper,
} from "@mui/material";

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

// ─── mock data (20 รายการ หลากหลาย) พร้อม receiveDate ─────────────────────────────────────────────────
const mockComplaints = [
  {
    id: 1,
    claimantName: "นางสาวดลภัทร มีความสุข",
    issue: "ขอความช่วยเหลือเกี่ยวกับปัญหาหนี้สินในระบบ",
    subIssueType: "หนี้ในระบบ",
    note: "ส่งเรื่องให้ธนาคารกรุงไทยพิจารณาเรียบร้อยแล้ว",
    receiveDate: "15 ม.ค. 2568",
  },
  // ... [other mock data remains the same]
];

// ← สร้าง NOTE_OPTIONS จาก mockComplaints
const INITIAL_NOTE_OPTIONS = Array.from(
  new Set(mockComplaints.map((complaint) => complaint.note))
).map((note) => ({ value: note, label: note }));

// สร้างตัวเลือกประเภทเรื่องหลัก/ย่อย จาก mockComplaints
const ISSUE_TYPE_OPTIONS = Array.from(
  new Set(mockComplaints.map((c) => c.issue))
).map((type) => ({ value: type, label: type }));

const SUB_ISSUE_TYPE_OPTIONS = Array.from(
  new Set(mockComplaints.map((c) => c.subIssueType))
).map((sub) => ({ value: sub, label: sub }));

const Summaryresults = () => {
  const [allComplaints, setAllComplaints] = useState(mockComplaints);
  const [filteredComplaints, setFilteredComplaints] = useState(mockComplaints);
  const [hasChanges, setHasChanges] = useState(false); // เพิ่ม state เพื่อติดตามการเปลี่ยนแปลง

  // ← ใช้ INITIAL_NOTE_OPTIONS ที่สร้างจาก mockComplaints
  const [noteOptions, setNoteOptions] = useState([
    ...INITIAL_NOTE_OPTIONS,
    { value: "__add", label: "เพิ่มหมายเหตุ..." },
  ]);

  // state สำหรับ Modal เพิ่ม/แก้ไขหมายเหตุ
  const [currentNoteRow, setCurrentNoteRow] = useState(null);
  const [newNoteText, setNewNoteText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [noteChangesMade, setNoteChangesMade] = useState(false);

  const router = useRouter();

  // บันทึกการเปลี่ยนแปลงทั้งหมดและย้อนกลับไปหน้าหลัก
  const handleSaveAllChanges = () => {
    // บันทึกข้อมูลที่เปลี่ยนแปลงลงใน localStorage
    localStorage.setItem(
      "updatedComplaints",
      JSON.stringify(filteredComplaints)
    );
    setHasChanges(false);
    // กลับไปยังหน้าหลัก
    router.push("/admin/document/new-additional-complaints-summary");
  };

  // ไปหน้าสรุปตามประเภทเรื่อง
  const handleSummaryByIssueType = () => {
    router.push(
      "/admin/document/new-additional-complaints-summary/summaryresults"
    );
  };

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
    setAllComplaints((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, note: value } : row))
    );
    setHasChanges(true); // ระบุว่ามีการเปลี่ยนแปลง
    setNoteChangesMade(true);
  };

  // บันทึกจาก Modal และเพิ่ม option ใหม่
  const handleSaveNote = () => {
    if (newNoteText.trim()) {
      const trimmedNote = newNoteText.trim();

      // อัปเดตข้อมูลในตาราง
      setFilteredComplaints((prev) =>
        prev.map((row) =>
          row.id === currentNoteRow ? { ...row, note: trimmedNote } : row
        )
      );

      // อัปเดตข้อมูลในตารางหลักด้วย
      setAllComplaints((prev) =>
        prev.map((row) =>
          row.id === currentNoteRow ? { ...row, note: trimmedNote } : row
        )
      );

      // เพิ่มหมายเหตุใหม่เข้าไปใน noteOptions ถ้ายังไม่มี
      setNoteOptions((prev) => {
        const exists = prev.some((option) => option.value === trimmedNote);
        if (!exists) {
          const newOption = { value: trimmedNote, label: trimmedNote };
          const withoutAdd = prev.filter((opt) => opt.value !== "__add");
          return [
            ...withoutAdd,
            newOption,
            { value: "__add", label: "เพิ่มหมายเหตุ..." },
          ];
        }
        return prev;
      });

      setHasChanges(true); // ระบุว่ามีการเปลี่ยนแปลง
      setNoteChangesMade(true);
    }
    setModalOpen(false);
    setCurrentNoteRow(null);
    setNewNoteText("");
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setCurrentNoteRow(null);
    setNewNoteText("");
  };

  // ← แก้ไขฟังก์ชัน handleSearch ให้ค้นหาจากเดือนและปีงบประมาณได้
  const handleSearch = ({
    issueType,
    subIssueType,
    month,
    fiscalYear,
    note,
  }) => {
    let result = allComplaints;

    // กรองตามประเภทเรื่องหลัก
    if (issueType) {
      result = result.filter((item) => item.issue === issueType);
    }

    // กรองตามประเภทเรื่องย่อย
    if (subIssueType) {
      result = result.filter((item) => item.subIssueType === subIssueType);
    }

    // ← กรองตามเดือน (ค้นหาจากคำย่อเดือนใน receiveDate)
    if (month) {
      const monthAbbrev = THAI_MONTH_ABBREV[parseInt(month)];
      result = result.filter(
        (item) => item.receiveDate && item.receiveDate.includes(monthAbbrev)
      );
    }

    // ← กรองตามปีงบประมาณ (ค้นหาจากปี พ.ศ. ใน receiveDate)
    if (fiscalYear) {
      result = result.filter(
        (item) => item.receiveDate && item.receiveDate.includes(fiscalYear)
      );
    }

    // กรองตามหมายเหตุ
    if (note) {
      result = result.filter((item) => item.note === note);
    }

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

      {/* แสดงปุ่มบันทึกเมื่อมีการเปลี่ยนแปลงหมายเหตุ */}
      {noteChangesMade && (
        <Paper
          elevation={2}
          sx={{
            p: 2,
            mb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "#f8f9fa",
            borderLeft: "4px solid #1120A3",
          }}
        >
          <Typography variant="body1">
            คุณได้แก้ไขหมายเหตุของรายการ กรุณาบันทึกการเปลี่ยนแปลง
          </Typography>
          <Button
            variant="contained"
            onClick={handleSaveAllChanges}
            sx={{
              bgcolor: "#1120A3",
              "&:hover": { bgcolor: "#0b1580" },
            }}
          >
            บันทึกการเปลี่ยนแปลง
          </Button>
        </Paper>
      )}

      <Box sx={{ width: "100%", overflowX: "auto" }}>
      <TableNewAddCompResults
        data={filteredComplaints}
        title="สรุปผลตามประเภทเรื่อง"
        onSearch={handleSearch}
        summaryTitle="รายละเอียดสรุปผลการดำเนินงานเรื่องร้องเรียน"
        summaryDate="8 มิถุนายน พ.ศ.2568"
        summaryCategory="ประเภทหนี้สิน / การกู้ยืม / การปรับโครงสร้างหนี้"
        onActionClick={handleSummaryByIssueType}
        NOTE_OPTIONS={noteOptions}
        onAddNote={handleAddNote}
        onNoteChange={handleNoteChange}
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
            options: noteOptions.filter((opt) => opt.value !== "__add"),
          },
        ]}
      />
      </Box>

      {/* Modal สำหรับเพิ่ม/แก้ไขหมายเหตุ */}
      <Modal open={modalOpen} onClose={handleModalClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "white",
            p: 4,
            borderRadius: 2,
            width: 400,
            maxWidth: "90%",
            boxShadow: 24,
          }}
        >
          <Typography variant="h6" mb={2} color="#1120A3">
            เพิ่ม/แก้ไขหมายเหตุ
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="หมายเหตุใหม่"
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="กรุณาใส่หมายเหตุที่ต้องการ..."
            sx={{
              "& .MuiOutlinedInput-root": {
                "&:hover fieldset": {
                  borderColor: "#1120A3",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#1120A3",
                },
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#1120A3",
              },
            }}
          />
          <Box mt={2} textAlign="right">
            <Button
              onClick={handleModalClose}
              sx={{
                mr: 1,
                color: "#666",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              ยกเลิก
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveNote}
              disabled={!newNoteText.trim()}
              sx={{
                bgcolor: "#1120A3",
                "&:hover": { bgcolor: "#0b1580" },
                "&.Mui-disabled": {
                  bgcolor: "#ccc",
                  color: "#999",
                },
              }}
            >
              บันทึก
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default Summaryresults;
