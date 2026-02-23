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
import { getNewAdditionalComplaintsReport } from "@pages/api/complaintreports/reports";
import { UpdateAssignedRemark } from "@pages/api/complaint/complaint";

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

const FISCAL_YEAR_OPTIONS = [
  { value: "2566", label: "2566" },
  { value: "2567", label: "2567" },
  { value: "2568", label: "2568" },
  { value: "2569", label: "2569" },
  { value: "2570", label: "2570" },
];

// Helper: แปลงวันที่ ISO เป็น "15 ม.ค. 2568"
function formatApiDateThai(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date)) return "-";
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear() + 543;
  return `${day} ${THAI_MONTH_ABBREV[month]} ${year}`;
}

// แปลง filing_type เป็นภาษาไทย
const FILING_TYPE_LABELS = {
  new: "เรื่องร้องเรียนใหม่",
  additional: "เรื่องร้องเรียนเพิ่มเติม",
  committee: "คณะกรรมการ",
};

const Summaryresults = () => {
  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [noteOptions, setNoteOptions] = useState([]);
  const [issueOptions, setIssueOptions] = useState([]);
  const [subIssueOptions, setSubIssueOptions] = useState([]);
  const [currentNoteRow, setCurrentNoteRow] = useState(null);
  const [newNoteText, setNewNoteText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [noteChangesMade, setNoteChangesMade] = useState(false);

  // สรุปค่า filter ล่าสุดที่เลือกไว้ (เพื่อแสดงบนหัว summary)
  const [summaryMonth, setSummaryMonth] = useState("");
  const [summaryFiscalYear, setSummaryFiscalYear] = useState("");
  const [summaryIssueType, setSummaryIssueType] = useState("");

  const router = useRouter();

  // ดึงข้อมูลจาก API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getNewAdditionalComplaintsReport({
          skip: 0,
          limit: 200,
          date_from: "",
          date_to: "",
          department_id: "",
          officer_id: "",
          search: ""
        });

        if (
          response &&
          response.res_code === "0000" &&
          response.res_data &&
          Array.isArray(response.res_data.items)
        ) {
          // แปลงข้อมูลให้อยู่ในโครงสร้างที่ตารางใช้
          const transformed = response.res_data.items.map((item) => ({
            id: item.id,
            claimantName: item.complainant_name || "-",
            // แปลง complaint_type ถ้าเป็น UUID หรือค่าที่ไม่ต้องการ ให้แสดงเป็นชื่อที่อ่านง่าย
            issue: item.complaint_type_name || item.complaint_type || "-",
            // แปลง filing_type เป็นภาษาไทย
            subIssueType: FILING_TYPE_LABELS[item.filing_type] || item.filing_type || "-",
            note: item.remark || "",
            receiveDate: formatApiDateThai(item.received_date),
          }));

          setAllComplaints(transformed);
          setFilteredComplaints(transformed);

          // NOTE_OPTIONS
          const notes = Array.from(
            new Set(transformed.map((c) => c.note).filter(Boolean))
          ).map((note) => ({ value: note, label: note }));
          setNoteOptions([
            ...notes,
            { value: "__add", label: "เพิ่มหมายเหตุ..." },
          ]);
          // ISSUE_TYPE_OPTIONS
          const issues = Array.from(
            new Set(transformed.map((c) => c.issue).filter(Boolean))
          ).map((type) => ({ value: type, label: type }));
          setIssueOptions(issues);
          // SUB_ISSUE_TYPE_OPTIONS
          const subIssues = Array.from(
            new Set(transformed.map((c) => c.subIssueType).filter(Boolean))
          ).map((type) => ({ value: type, label: type }));
          setSubIssueOptions(subIssues);

        } else {
          setAllComplaints([]);
          setFilteredComplaints([]);
          setNoteOptions([{ value: "__add", label: "เพิ่มหมายเหตุ..." }]);
          setIssueOptions([]);
          setSubIssueOptions([]);
        }
      } catch (e) {
        setAllComplaints([]);
        setFilteredComplaints([]);
        setNoteOptions([{ value: "__add", label: "เพิ่มหมายเหตุ..." }]);
        setIssueOptions([]);
        setSubIssueOptions([]);
      }
    };
    fetchData();
    // ตรวจสอบว่ามีข้อมูลที่อัปเดตใน localStorage หรือไม่
    const updatedData = localStorage.getItem("updatedComplaints");
    if (updatedData) {
      try {
        const parsedData = JSON.parse(updatedData);
        setAllComplaints((prev) =>
          prev.map((complaint) => {
            const updatedComplaint = parsedData.find(
              (item) => item.id === complaint.id
            );
            return updatedComplaint
              ? { ...complaint, note: updatedComplaint.note }
              : complaint;
          })
        );
        setFilteredComplaints((prev) =>
          prev.map((complaint) => {
            const updatedComplaint = parsedData.find(
              (item) => item.id === complaint.id
            );
            return updatedComplaint
              ? { ...complaint, note: updatedComplaint.note }
              : complaint;
          })
        );
        localStorage.removeItem("updatedComplaints");
      } catch (e) {
        console.error("เกิดข้อผิดพลาดในการอ่านข้อมูลที่อัปเดต:", e);
      }
    }
  }, []);

  // บันทึกการเปลี่ยนแปลงทั้งหมดและย้อนกลับไปหน้าหลัก
  const handleSaveAllChanges = () => {
    localStorage.setItem(
      "updatedComplaints",
      JSON.stringify(filteredComplaints)
    );
    setHasChanges(false);
    setNoteChangesMade(false);
    window.location.reload();
    // router.push("/admin/document/new-additional-complaints-summary");
  };

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

  const handleNoteChange = (rowId, value) => {
    setFilteredComplaints((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, note: value } : row))
    );
    setAllComplaints((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, note: value } : row))
    );
    setHasChanges(true);
    setNoteChangesMade(true);
  };

  // ให้บันทึกลง API ด้วย
  const handleSaveNote = async () => {
    if (newNoteText.trim() && currentNoteRow) {
      const trimmedNote = newNoteText.trim();
      try {
        // call API
        await UpdateAssignedRemark(currentNoteRow, trimmedNote);

        setFilteredComplaints((prev) =>
          prev.map((row) =>
            row.id === currentNoteRow ? { ...row, note: trimmedNote } : row
          )
        );
        setAllComplaints((prev) =>
          prev.map((row) =>
            row.id === currentNoteRow ? { ...row, note: trimmedNote } : row
          )
        );
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
        setHasChanges(true);
        setNoteChangesMade(true);
      } catch (e) {
        alert("เกิดข้อผิดพลาดในการบันทึกหมายเหตุ กรุณาลองใหม่");
      }
      setModalOpen(false);
      setCurrentNoteRow(null);
      setNewNoteText("");
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setCurrentNoteRow(null);
    setNewNoteText("");
  };

  // ฟังก์ชันค้นหาและอัปเดต summary filter
  const handleSearch = ({
    issueType,
    subIssueType,
    month,
    fiscalYear,
    note,
  }) => {
    let result = allComplaints;

    if (issueType) {
      result = result.filter((item) => item.issue === issueType);
    }
    if (subIssueType) {
      result = result.filter((item) => item.subIssueType === subIssueType);
    }
    if (month) {
      const monthAbbrev = THAI_MONTH_ABBREV[parseInt(month)];
      result = result.filter(
        (item) => item.receiveDate && item.receiveDate.includes(monthAbbrev)
      );
    }
    if (fiscalYear) {
      result = result.filter(
        (item) => item.receiveDate && item.receiveDate.includes(fiscalYear)
      );
    }
    if (note) {
      result = result.filter((item) => item.note === note);
    }
    setFilteredComplaints(result);

    // อัปเดตค่า summary เฉพาะที่เลือก
    setSummaryMonth(month || "");
    setSummaryFiscalYear(fiscalYear || "");
    setSummaryIssueType(issueType || "");
  };

  // สร้างข้อความ summaryDate และ summaryCategory ตาม filter ที่เลือก
  const summaryDate = (() => {
    if (summaryMonth && summaryFiscalYear) {
      const monthObj = MONTH_OPTIONS.find((m) => m.value === summaryMonth);
      return `${monthObj ? monthObj.label : ""} พ.ศ.${summaryFiscalYear}`;
    }
    if (summaryMonth) {
      const monthObj = MONTH_OPTIONS.find((m) => m.value === summaryMonth);
      return `${monthObj ? monthObj.label : ""}`;
    }
    if (summaryFiscalYear) {
      return `พ.ศ.${summaryFiscalYear}`;
    }
    return "";
  })();

  const summaryCategory = summaryIssueType
    ? summaryIssueType
    : "";

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
          summaryDate={summaryDate}
          summaryCategory={summaryCategory}
          onActionClick={handleSummaryByIssueType}
          NOTE_OPTIONS={noteOptions}
          onAddNote={handleAddNote}
          onNoteChange={handleNoteChange}
          filterFields={[
            {
              name: "issueType",
              label: "ประเภทเรื่องหลัก",
              type: "select",
              options: issueOptions,
            },
            {
              name: "subIssueType",
              label: "ประเภทเรื่องย่อย",
              type: "select",
              options: subIssueOptions,
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
            onKeyDown={async (e) => {
              if (e.key === "Enter" && !e.shiftKey && newNoteText.trim()) {
                e.preventDefault();
                await handleSaveNote();
              }
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