import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableWorkFollow from "@services/TableWorkFollow/TableWorkFollow";
import SelectFieldDepartment from "@services/SelectFieldDepartment/SelectFieldDepartment";
import { getPendingTasksReport, getNewAdditionalComplaintsReport } from "@pages/api/complaintreports/reports";
import { UpdateAssignedRemark } from "@pages/api/complaint/complaint";
import {
  Box,
  Button,
  Modal,
  TextField,
  Typography,
  Paper,
} from "@mui/material";

// แปลง status code เป็นภาษาไทย
const STATUS_LABELS = {
  in_review: "อยู่ระหว่างดำเนินการ",
  tracking: "รอติดตาม",
  done: "เสร็จสิ้น",
  sent_to_external: "ส่งต่อหน่วยงานภายนอก",
};

const FILING_TYPE_LABELS = {
  new: "เรื่องร้องเรียนใหม่",
  additional: "เรื่องร้องเรียนเพิ่มเติม",
  ใหม่: "เรื่องร้องเรียนใหม่",
  เพิ่มเติม: "เรื่องร้องเรียนเพิ่มเติม",
};

const PendingWorkfollowupComponents = () => {
  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [allNewAdditionalComplaints, setAllNewAdditionalComplaints] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // สำหรับจัดการหมายเหตุ
  const [editingNote, setEditingNote] = useState(null);
  const [noteValue, setNoteValue] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [noteChangesMade, setNoteChangesMade] = useState(false);
  // สำหรับจัดการหน่วยงาน
  const [selectedDepartment, setSelectedDepartment] = useState("");

  // โหลดข้อมูล API ทั้งสอง API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // ดึงข้อมูลการติดตามงานค้าง
        const pendingResponse = await getPendingTasksReport();
        const pendingData = pendingResponse || [];

        // ดึงข้อมูลเรื่องเข้าใหม่และร้องเพิ่ม
        const newAddResponse = await getNewAdditionalComplaintsReport({
          skip: 0,
          limit: 1000,
        });

        let newAddData = [];
        if (
          newAddResponse &&
          newAddResponse.res_code === "0000" &&
          newAddResponse.res_data &&
          Array.isArray(newAddResponse.res_data.items)
        ) {
          newAddData = newAddResponse.res_data.items;
        }

        setAllComplaints(pendingData);
        setAllNewAdditionalComplaints(newAddData);

        // ตรวจสอบว่ามีข้อมูลที่อัปเดตใน localStorage หรือไม่
        const updatedData = localStorage.getItem("updatedComplaints");
        if (updatedData) {
          try {
            const parsedData = JSON.parse(updatedData);
            // อัปเดตข้อมูลเฉพาะหมายเหตุ (remark) จากข้อมูลที่อัพเดทแล้ว
            const updatedNewAddData = newAddData.map((complaint) => {
              const updatedComplaint = parsedData.find(
                (item) => item.id === complaint.id
              );
              return updatedComplaint
                ? { ...complaint, remark: updatedComplaint.note }
                : complaint;
            });
            setAllNewAdditionalComplaints(updatedNewAddData);
            localStorage.removeItem("updatedComplaints");
          } catch (e) {
            console.error("เกิดข้อผิดพลาดในการอ่านข้อมูลที่อัปเดต:", e);
          }
        }

        // รวมข้อมูลทั้งสองแหล่งในรูปแบบตาราง
        const combinedData = [...pendingData, ...transformNewAddData(newAddData)];
        setFilteredComplaints(combinedData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setAllComplaints([]);
        setAllNewAdditionalComplaints([]);
        setFilteredComplaints([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, []);

  // ฟังก์ชันแปลงข้อมูลจาก NewAdditionalComplaints ให้ตรงกับรูปแบบของ PendingTasks
  const transformNewAddData = (newAddData) => {
    return newAddData.map((item) => ({
      id: `new_${item.id}`,
      assigned_officer_name: item.assigned_officer_name || "-",
      receive_reference_number: item.complaint_number || "-",
      assigned_date: item.received_date,
      reference_number: item.complaint_number || "-",
      director_submission_date: item.received_date,
      subject: item.complaint_type || "-",
      outside_department_name: item.department_name || "-",
      department_name: item.department_name || "-",
      document_number: item.complaint_number || "-",
      // แปลง filing_type เป็นสถานะ (ภาษาไทย) ถ้ามี, ถ้าไม่มี fallback เป็น status หรือ "-"
      status: item.filing_type
        ? FILING_TYPE_LABELS[item.filing_type] || item.filing_type
        : (item.status || "-"),
      days_in_progress: 0,
      source: "new_additional",
      complainant_name: item.complainant_name || "-",
      filing_type: item.filing_type || "-",
      remark: item.remark || ""
    }));
  };

  // ตัวเลือกเจ้าหน้าที่ (จากข้อมูลทั้งสอง)
  const OFFICER_OPTIONS = useMemo(() => {
    const allData = [...allComplaints, ...allNewAdditionalComplaints];
    const uniqueOfficers = [
      ...new Set(allData.map((item) => item.assigned_officer_name).filter(Boolean)),
    ];
    return uniqueOfficers
      .filter((officer) => officer && officer.trim() !== "" && officer !== "-")
      .sort()
      .map((officer) => ({
        value: officer,
        label: officer,
      }));
  }, [allComplaints, allNewAdditionalComplaints]);

  // ฟังก์ชันจัดการการเลือกหน่วยงาน
  const handleDepartmentChange = (departmentData) => {
    const value = departmentData?.value || "";
    setSelectedDepartment(value);

    // ถ้าค่าว่าง ให้ clear ข้อมูลและรีเซ็ตการกรอง
    if (!value || value === "") {
      const combinedData = [...allComplaints, ...transformNewAddData(allNewAdditionalComplaints)];
      setFilteredComplaints(combinedData);
    }
  };

  // ตัวเลือกประเภทเรื่อง
  const DATA_TYPE_OPTIONS = [
    { value: "new_complaint", label: "เรื่องร้องเรียนใหม่" },
    { value: "additional_complaint", label: "เรื่องร้องเรียนเพิ่มเติม" },
    { value: "department_report", label: "หน่วยงานรายงานผล" },
    { value: "department_decision", label: "ผลการพิจารณาจากหน่วยงาน" },
  ];

  // ฟังก์ชันแปลง string -> Date
  function parseDate(input) {
    if (!input) return null;
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  // ฟิลเตอร์ข้อมูลจาก filterData
  const handleSearch = (filterData) => {
    // รวมข้อมูลทั้งสองแหล่ง
    const combinedData = [...allComplaints, ...transformNewAddData(allNewAdditionalComplaints)];
    let result = [...combinedData];

    // filter วันที่ (assigned_date หรือ received_date)
    if (filterData.receiveDateFrom) {
      const fromDate = parseDate(filterData.receiveDateFrom);
      if (fromDate) {
        result = result.filter((item) => {
          const date = parseDate(item.assigned_date);
          return date && date >= fromDate;
        });
      }
    }
    if (filterData.receiveDateTo) {
      const toDate = parseDate(filterData.receiveDateTo);
      if (toDate) {
        // รวมถึงวันสิ้นสุด
        toDate.setHours(23, 59, 59, 999);
        result = result.filter((item) => {
          const date = parseDate(item.assigned_date);
          return date && date <= toDate;
        });
      }
    }

    // filter เจ้าหน้าที่
    if (filterData.officer && filterData.officer !== "") {
      result = result.filter((item) => item.assigned_officer_name === filterData.officer);
    }

    // filter หน่วยงาน
    if (selectedDepartment && selectedDepartment !== "") {
      result = result.filter((item) =>
        (item.outside_department_name === selectedDepartment) ||
        (item.department_name === selectedDepartment)
      );
    }

    // filter ประเภทเรื่อง
    if (filterData.dataType && filterData.dataType !== "") {
      if (filterData.dataType === "new_complaint") {
        // เรื่องร้องเรียนใหม่ - จากข้อมูล NewAdditional ที่มี filing_type เป็น "new" หรือ "ใหม่"
        result = result.filter((item) =>
          item.source === "new_additional" &&
          (item.filing_type === "ใหม่" || item.filing_type === "new")
        );
      } else if (filterData.dataType === "additional_complaint") {
        // เรื่องร้องเรียนเพิ่มเติม - จากข้อมูล NewAdditional ที่มี filing_type เป็น "เพิ่มเติม" หรือ "additional"
        result = result.filter((item) =>
          item.source === "new_additional" &&
          (item.filing_type === "เพิ่มเติม" || item.filing_type === "additional")
        );
      } else if (filterData.dataType === "department_report") {
        // หน่วยงานรายงานผล - จากข้อมูล PendingTasks ที่มี status เกี่ยวกับการรายงาน
        result = result.filter((item) =>
          item.source !== "new_additional" &&
          (item.status === "tracking" || item.status === "รอติดตาม")
        );
      } else if (filterData.dataType === "department_decision") {
        // ผลการพิจารณาจากหน่วยงาน - จากข้อมูล PendingTasks ที่มี status เกี่ยวกับการพิจารณา
        result = result.filter((item) =>
          item.source !== "new_additional" &&
          (item.status === "in_review" || item.status === "อยู่ระหว่างดำเนินการ")
        );
      }
    }

    setFilteredComplaints(result);
  };

  // จัดการการเลือกรายการ
  const handleSelectItem = (itemId, isSelected) => {
    if (isSelected) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  // จัดการการเลือกทั้งหมด
  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedItems(filteredComplaints.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  // ฟังก์ชันสำหรับการแก้ไขหมายเหตุ
  const handleEditNote = (itemId, currentNote = "") => {
    setEditingNote(itemId);
    setNoteValue(currentNote);
    setModalOpen(true);
  };

  // ฟังก์ชันสำหรับบันทึกหมายเหตุ
  const handleSaveNote = async () => {
    if (editingNote && noteValue.trim()) {
      const trimmedNote = noteValue.trim();
      const originalId = editingNote.replace('new_', '');

      try {
        // เรียก API เพื่อบันทึกลงฐานข้อมูล
        await UpdateAssignedRemark(originalId, trimmedNote);

        // อัปเดตหมายเหตุในข้อมูลท้องถิ่น
        const updatedNewAddData = allNewAdditionalComplaints.map(item => {
          if (item.id == originalId) {
            return { ...item, remark: trimmedNote };
          }
          return item;
        });

        setAllNewAdditionalComplaints(updatedNewAddData);

        // อัปเดตในตาราง
        const updatedFiltered = filteredComplaints.map(item => {
          if (item.id === editingNote) {
            return { ...item, remark: trimmedNote };
          }
          return item;
        });

        setFilteredComplaints(updatedFiltered);
        setNoteChangesMade(true);

        // รีเซ็ตการแก้ไข
        setEditingNote(null);
        setNoteValue("");
        setModalOpen(false);
      } catch (error) {
        console.error('Error saving note:', error);
        alert("เกิดข้อผิดพลาดในการบันทึกหมายเหตุ กรุณาลองใหม่");
      }
    }
  };

  // ฟังก์ชันยกเลิกการแก้ไข
  const handleCancelEdit = () => {
    setEditingNote(null);
    setNoteValue("");
    setModalOpen(false);
  };

  // บันทึกการเปลี่ยนแปลงทั้งหมด
  const handleSaveAllChanges = () => {
    setNoteChangesMade(false);
    window.location.reload();
  };

  // ฟังก์ชันล้างการค้นหา
  const handleClearSearch = () => {
    setSelectedDepartment("");
    // Force re-render of department field
    setTimeout(() => {
      const combinedData = [...allComplaints, ...transformNewAddData(allNewAdditionalComplaints)];
      setFilteredComplaints(combinedData);
    }, 0);
  };

  // เปลี่ยนหน้า summary
  const handleSummaryByIssueType = () => {
    router.push(
      "/admin/document/new-additional-complaints-summary/summaryresults"
    );
  };

  // Map ข้อมูล API ให้ตรงกับ TableWorkFollow
  const tableData = useMemo(() => {
    return filteredComplaints.map((item) => ({
      id: item.id,
      responsibleOfficer: item.assigned_officer_name || "-",
      receiptNumber: item.receive_reference_number || "-",
      receiptDate: item.assigned_date
        ? new Date(item.assigned_date).toLocaleDateString("th-TH")
        : "-",
      referenceNumber: item.reference_number || "-",
      proposeDate: item.director_submission_date
        ? new Date(item.director_submission_date).toLocaleDateString("th-TH")
        : "-",
      complaint: item.subject || "-",
      receiveDate: item.assigned_date
        ? new Date(item.assigned_date).toLocaleDateString("th-TH")
        : "-",
      receiveDateObj: item.assigned_date
        ? new Date(item.assigned_date)
        : undefined,
      agency: item.outside_department_name || item.department_name || "-",
      letterNumber: item.document_number || "-",
      status: STATUS_LABELS[item.status] || item.status || "-",
      elapsedDays: item.days_in_progress,
      issueType: item.subject,
      source: item.source || "pending",
      complainantName: item.complainant_name || "-",
      filingType: item.filing_type || "-",
      remark: item.remark || "",
      isSelected: selectedItems.includes(item.id),
      // สำหรับการแก้ไขหมายเหตุ
      isEditingNote: editingNote === item.id,
      noteValue: editingNote === item.id ? noteValue : (item.remark || ""),
      canEditNote: item.source === "new_additional", // แก้ไขได้เฉพาะข้อมูลจาก NewAdditional API
    }));
  }, [filteredComplaints, selectedItems, editingNote, noteValue]);

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
          },
          { label: "รายงานการติดตามงานค้าง" },
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

      <TableWorkFollow
        data={tableData}
        loading={loading}
        onSearch={handleSearch}
        onSelectItem={handleSelectItem}
        onSelectAll={handleSelectAll}
        selectedItems={selectedItems}
        showCheckboxes={true}
        // สำหรับการแก้ไขหมายเหตุ
        onEditNote={handleEditNote}
        onSaveNote={handleSaveNote}
        onCancelEdit={handleCancelEdit}
        editingNote={editingNote}
        noteValue={noteValue}
        setNoteValue={setNoteValue}
        actionButtonLabel="สรุปตามประเภทเรื่อง"
        onActionClick={handleSummaryByIssueType}
        onClearSearch={handleClearSearch}
        filterFields={[
          {
            name: "receiveDateFrom",
            label: "ตั้งแต่วันที่",
            type: "date",
            placeholder: "เลือกวันที่เริ่มต้น",
          },
          {
            name: "receiveDateTo",
            label: "ถึงวันที่",
            type: "date",
            placeholder: "เลือกวันที่สิ้นสุด",
          },
          {
            name: "officer",
            label: "เจ้าหน้าที่",
            type: "select",
            options: OFFICER_OPTIONS,
            placeholder: "เลือกเจ้าหน้าที่",
          },
          {
            name: "dataType",
            label: "ประเภทเรื่อง",
            type: "select",
            options: DATA_TYPE_OPTIONS,
            placeholder: "เลือกประเภทเรื่อง",
          },
          {
            name: "agency",
            label: "หน่วยงาน",
            type: "department",
            component: (
              <SelectFieldDepartment
                key={`department-${selectedDepartment || 'empty'}`} // บังคับ re-render เมื่อค่าเปลี่ยน
                label="หน่วยงาน"
                value={selectedDepartment}
                onChange={(e) => {
                  const newValue = e.target.value;
                  handleDepartmentChange({ value: newValue });
                }}
                onDepartmentSelect={handleDepartmentChange}
                name="department"
              />
            ),
          },
        ]}
      />

      {/* Modal สำหรับเพิ่ม/แก้ไขหมายเหตุ */}
      <Modal open={modalOpen} onClose={handleCancelEdit}>
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
            แก้ไขหมายเหตุ
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="หมายเหตุ"
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
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
              if (e.key === "Enter" && !e.shiftKey && noteValue.trim()) {
                e.preventDefault();
                await handleSaveNote();
              }
            }}
          />
          <Box mt={2} textAlign="right">
            <Button
              onClick={handleCancelEdit}
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
              disabled={!noteValue.trim()}
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

export default PendingWorkfollowupComponents;