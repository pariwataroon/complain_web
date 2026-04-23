import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableWorkFollow from "@services/TableWorkFollow/TableWorkFollow";
import SelectFieldDepartmentoutside from "@services/SelectFieldDepartmentoutside/SelectFieldDepartmentoutside";
import { getPendingTasksReport } from "@pages/api/complaintreports/reports";
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
  submitted: "ส่งคำร้อง",
  sent_to_agency: "มอบหมายเจ้าหน้าที่",
  sent_to_external: "ส่งต่อหน่วยงานภายนอก",
  in_process: "อยู่ระหว่างดำเนินการ",
  in_review: "อยู่ระหว่างดำเนินการ",
  tracking: "รอติดตาม",
  reviewed: "แจ้งผลการพิจารณา",
  completed: "เสร็จสิ้น",
  done: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
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
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // สำหรับจัดการหมายเหตุ
  const [currentNoteRow, setCurrentNoteRow] = useState(null);
  const [newNoteText, setNewNoteText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [noteChangesMade, setNoteChangesMade] = useState(false);
  // สำหรับจัดการหน่วยงาน
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedDepartmentLabel, setSelectedDepartmentLabel] = useState("");

  // โหลดข้อมูล API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // ดึงข้อมูลการติดตามงานค้าง - ส่ง all_officers=true เพื่อดึงข้อมูลทุกเจ้าหน้าที่
        const response = await getPendingTasksReport({ all_officers: true });
        const complaintsData = response || [];

        setAllComplaints(complaintsData);

        // แปลงข้อมูลให้ตรงกับรูปแบบตาราง
        const transformedData = transformComplaintsData(complaintsData);
        setFilteredComplaints(transformedData);

        if (complaintsData.length > 0) {
          console.log('Sample API item (first):', complaintsData[0]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setAllComplaints([]);
        setFilteredComplaints([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, []);

  // ฟังก์ชันแปลงข้อมูลจาก PendingTasks API ให้ตรงกับรูปแบบตาราง
  const transformComplaintsData = (complaintsData) => {
    return complaintsData.map((item) => {
      // ตรวจสอบว่างานเสร็จแล้วหรือยัง (จาก status ของ complaint)
      const isCompleted = ["completed", "done", "reviewed", "cancelled"].includes(
        (item.status || "").toLowerCase()
      );

      // คำนวณจำนวนวันตั้งแต่เสร็จ
      let completedDays = null;
      if (isCompleted && item.updated_at) {
        const completedDate = new Date(item.updated_at);
        const now = new Date();
        completedDays = Math.floor((now - completedDate) / (1000 * 60 * 60 * 24));
      }

      // ขั้นตอนปัจจุบัน จาก status ของ complaint
      const statusStep = STATUS_TRANSLATION[(item.status || "").toLowerCase()] || item.status || "-";

      // กำหนดค่า agency ตามประเภทเรื่อง
      // ถ้าเป็น "ผลการพิจารณาจากหน่วยงาน" (status = tracking/reviewed) ให้ใช้หน่วยงานภายนอก (outside_department_name)
      // ถ้าเป็น "เรื่องร้องเรียนใหม่/เพิ่มเติม" ให้ใช้หน่วยงานในสังกัด (department_name)
      const statusLower = (item.status || "").toLowerCase();
      const isDepartmentDecision = statusLower === "tracking" || statusLower === "reviewed";

      let agency = "-";
      if (isDepartmentDecision) {
        // ผลการพิจารณาจากหน่วยงาน - ใช้หน่วยงานภายนอก
        agency = item.outside_department_name || "-";
      } else {
        // เรื่องร้องเรียนใหม่/เพิ่มเติม - ใช้หน่วยงานในสังกัด
        agency = item.department_name || "-";
      }

      return {
        id: item.id,
        complaint_id: item.complaint_id,
        assigned_officer_name: item.assigned_officer_name || "-",
        receive_reference_number: item.receive_reference_number || "-",
        complaint_number: item.complaint_number || item.receive_reference_number || "-",
        parent_complaint_number: item.parent_complaint_number || "-",
        assigned_date: item.assigned_date,
        reference_number: item.reference_number || "-",
        director_submission_date: item.director_submission_date,
        subject: item.subject || "-",
        // หน่วยงาน
        outside_department_name: item.outside_department_name || null,
        department_name: item.department_name || null,
        agency,
        _rawAgency: agency,
        document_number: item.document_number || "-",
        status: STATUS_LABELS[(item.status || "").toLowerCase()] || item.status || "-",
        status_original: item.status,
        days_in_progress: item.days_in_progress || 0,
        source: "pending_tasks",
        complainant_name: item.complainant_name || "-",
        filing_type: item.filing_type || "-",
        filing_type_original: item.filing_type,
        remark: item.assigned_remark || item.remark || "",
        // --- ข้อมูลจาก complaint โดยตรง ---
        statusStep,
        isCompleted,
        completedDays,
        updated_at: item.updated_at,
      };
    });
  };

  // แปลง status เป็นภาษาไทย สำหรับแสดงขั้นตอน
  const STATUS_TRANSLATION = {
    submitted: "ส่งคำร้อง",
    sent_to_agency: "มอบหมายเจ้าหน้าที่",
    sent_to_external: "ส่งหน่วยงานภายนอก",
    in_process: "อยู่ระหว่างดำเนินการ",
    in_review: "อยู่ระหว่างการพิจารณา",
    tracking: "ติดตามผลการพิจารณา",
    reviewed: "แจ้งผลการพิจารณา",
    completed: "เสร็จสิ้น",
    cancelled: "ยกเลิก",
    new: "เรื่องร้องเรียนใหม่",
    additional: "เรื่องร้องเรียนเพิ่มเติม",
  };

  // ตัวเลือกเจ้าหน้าที่
  const OFFICER_OPTIONS = useMemo(() => {
    const uniqueOfficers = [
      ...new Set(allComplaints.map((item) => item.assigned_officer_name).filter(Boolean)),
    ];
    return uniqueOfficers
      .filter((officer) => officer && officer.trim() !== "" && officer !== "-")
      .sort()
      .map((officer) => ({
        value: officer,
        label: officer,
      }));
  }, [allComplaints]);

  // ฟังก์ชัน helper สำหรับการค้นหาหน่วยงาน
  const matchDepartment = (item, searchTerm) => {
    if (!searchTerm || searchTerm === "") return true;

    const outsideDeptName = (item.outside_department_name || "").toLowerCase().trim();
    const deptName = (item.department_name || "").toLowerCase().trim();
    const searchTermLower = searchTerm.toLowerCase().trim();

    // ลบช่องว่างและเครื่องหมายพิเศษออกเพื่อการค้นหาที่ยืดหยุ่น
    const normalizeText = (text) => text.replace(/\s+/g, '').replace(/[^\u0E00-\u0E7Fa-zA-Z0-9]/g, '');
    const normalizedOutsideDept = normalizeText(outsideDeptName);
    const normalizedDept = normalizeText(deptName);
    const normalizedSearch = normalizeText(searchTermLower);

    // เพิ่มการค้นหาแบบ keywords
    const searchKeywords = searchTermLower.split(/\s+/).filter(word => word.length > 0);
    const outsideKeywords = outsideDeptName.split(/\s+/).filter(word => word.length > 0);
    const deptKeywords = deptName.split(/\s+/).filter(word => word.length > 0);

    // ตรวจสอบว่าทุก keyword ใน search มีอยู่ในชื่อหน่วยงาน
    const matchesAllKeywords = (targetKeywords) => {
      return searchKeywords.every(searchKeyword =>
        targetKeywords.some(targetKeyword => targetKeyword.includes(searchKeyword))
      );
    };

    const isMatch = outsideDeptName.includes(searchTermLower) ||
           deptName.includes(searchTermLower) ||
           normalizedOutsideDept.includes(normalizedSearch) ||
           normalizedDept.includes(normalizedSearch) ||
           outsideDeptName === searchTerm ||
           deptName === searchTerm ||
           matchesAllKeywords(outsideKeywords) ||
           matchesAllKeywords(deptKeywords);

    // Debug logging เพื่อตรวจสอบการค้นหา
    if (searchTermLower.includes('ศูนย์') || searchTermLower.includes('ปฏิบัติการ')) {
      console.log('Debug Department Match:', {
        searchTerm,
        outsideDeptName,
        deptName,
        isMatch,
        item
      });
    }

    return isMatch;
  };

  // ฟังก์ชันจัดการการเลือกหน่วยงาน
  const handleDepartmentChange = (departmentData) => {
    const value = departmentData?.value || "";
    const label = departmentData?.label || "";
    setSelectedDepartment(value);
    setSelectedDepartmentLabel(label);

    // ถ้าค่าว่าง ให้ clear ข้อมูลและรีเซ็ตการกรอง
    if (!value || value === "") {
      const transformedData = transformComplaintsData(allComplaints);
      setFilteredComplaints(transformedData);
    } else {
      // กรองข้อมูลทันทีเมื่อเลือกหน่วยงาน - ต้องใช้ label ที่ได้จาก departmentData
      // เก็บ filters ปัจจุบันจาก TableWorkFollow โดยไม่เพิ่ม agency เข้าไปใน filters
      // เพราะ agency ถูกกรองแยกผ่าน selectedDepartmentLabel อยู่แล้ว
      applyFiltersWithDepartment(label);
    }
  };

  // ตัวเลือกประเภทเรื่อง
  const DATA_TYPE_OPTIONS = [
    { value: "new_complaint", label: "เรื่องร้องเรียนใหม่" },
    { value: "additional_complaint", label: "เรื่องร้องเรียนเพิ่มเติม" },
    { value: "department_decision", label: "ผลการพิจารณาจากหน่วยงาน" },
  ];

  // ฟังก์ชันแปลง string -> Date
  function parseDate(input) {
    if (!input) return null;
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  // ฟังก์ชันกรองข้อมูลหลัก - รองรับ departmentLabel แบบส่งผ่านพารามิเตอร์
  const applyFilters = (filterData, departmentLabel) => {
    // แปลงข้อมูลและใช้เป็นฐานการกรอง
    const transformedData = transformComplaintsData(allComplaints);
    let result = [...transformedData];

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

    // filter หน่วยงาน (ใช้ค่าที่ส่งมาจากพารามิเตอร์)
    const deptLabel = departmentLabel || "";
    if (deptLabel !== "") {
      result = result.filter((item) => matchDepartment(item, deptLabel));
    }

    // filter ประเภทเรื่อง - แก้ไขให้ตรงกับค่าที่ API ส่งมา
    if (filterData.dataType && filterData.dataType !== "") {
      if (filterData.dataType === "new_complaint") {
        result = result.filter((item) => {
          const ft = (item.filing_type_original || "").toString().toLowerCase();
          return ft === "new";
        });
      } else if (filterData.dataType === "additional_complaint") {
        result = result.filter((item) => {
          const ft = (item.filing_type_original || "").toString().toLowerCase();
          return ft === "additional";
        });
      } else if (filterData.dataType === "department_decision") {
        result = result.filter((item) => {
          const st = (item.status_original || "").toString().toLowerCase();
          const ft = (item.filing_type_original || "").toString().toLowerCase();
          return (st === "tracking" || st === "reviewed") && ft !== "additional";
        });
      }
    }

    setFilteredComplaints(result);
  };

  // ฟิลเตอร์ข้อมูลจาก filterData (ถูกเรียกจาก TableWorkFollow search button)
  const handleSearch = (filterData) => {
    applyFilters(filterData, selectedDepartmentLabel);
  };

  // ฟิลเตอร์ข้อมูลเมื่อเลือกหน่วยงาน (กรองทันที)
  const applyFiltersWithDepartment = (departmentLabel) => {
    // ใช้ filters ปัจจุบันจาก TableWorkFollow
    // เนื่องจาก filters อยู่ใน TableWorkFollow component เราต้องกรองจาก allComplaints ใหม่
    // โดยใช้ departmentLabel ที่ส่งมา
    const transformedData = transformComplaintsData(allComplaints);
    let result = [...transformedData];

    // filter เฉพาะหน่วยงาน
    if (departmentLabel && departmentLabel !== "") {
      result = result.filter((item) => matchDepartment(item, departmentLabel));
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
    setCurrentNoteRow(itemId);
    setNewNoteText(currentNote);
    setModalOpen(true);
  };

  // ฟังก์ชันสำหรับบันทึกหมายเหตุ (ปรับปรุงใหม่)
  const handleSaveNote = async () => {
    if (newNoteText.trim() && currentNoteRow) {
      const trimmedNote = newNoteText.trim();
      try {
        // เรียก API เพื่อบันทึกลงฐานข้อมูล
        const result = await UpdateAssignedRemark(currentNoteRow, trimmedNote);

        console.log('API Response:', result); // เพื่อ debug

        // ใช้หมายเหตุจาก API response ถ้ามี ไม่งั้นใช้ค่าที่ส่งไป
        const updatedRemark = result?.res_data?.assigned_remark || trimmedNote;

        // อัปเดตหมายเหตุในข้อมูลท้องถิ่น
        const updatedComplaints = allComplaints.map(item => {
          if (item.id === currentNoteRow) {
            return {
              ...item,
              remark: updatedRemark,
              assigned_remark: updatedRemark
            };
          }
          return item;
        });

        setAllComplaints(updatedComplaints);

        // อัปเดตในตาราง
        const updatedFiltered = filteredComplaints.map(item => {
          if (item.id === currentNoteRow) {
            return { ...item, remark: updatedRemark };
          }
          return item;
        });

        setFilteredComplaints(updatedFiltered);
        setNoteChangesMade(true);

        // แสดงข้อความสำเร็จพร้อมข้อมูลจาก API
        let successMessage = "บันทึกหมายเหตุเรียบร้อยแล้ว";

        if (result?.res_data?.message) {
          successMessage = result.res_data.message;
        }

        // เพิ่มข้อมูลการเปลี่ยนแปลงถ้ามี
        if (result?.res_data?.changes && Array.isArray(result.res_data.changes)) {
          const changes = result.res_data.changes.join('\n');
          successMessage += `\n\nการเปลี่ยนแปลง:\n${changes}`;
        }

        alert(successMessage);

        // รีเฟรชข้อมูลจาก API เพื่อให้แน่ใจว่าข้อมูลล่าสุด
        setTimeout(async () => {
          try {
            const response = await getPendingTasksReport({ all_officers: true });
            const complaintsData = response || [];

            // แปลงข้อมูล pendingData ให้มี remark จาก assigned_remark
            const transformedPendingData = complaintsData.map(item => ({
              ...item,
              remark: item.assigned_remark || item.remark || ""
            }));

            setAllComplaints(transformedPendingData);

            // อัปเดตตาราง
            const transformedData = transformComplaintsData(transformedPendingData);
            setFilteredComplaints(transformedData);
          } catch (refreshError) {
            console.error('Error refreshing data:', refreshError);
          }
        }, 1000); // รอ 1 วินาทีเพื่อให้ server อัปเดตข้อมูลเสร็จ

      } catch (error) {
        console.error('Error saving note:', error);

        // แสดงข้อความ error ที่ชัดเจนขึ้น
        let errorMessage = "เกิดข้อผิดพลาดในการบันทึกหมายเหตุ";

        if (error.response?.data?.res_message) {
          errorMessage = `เกิดข้อผิดพลาด: ${error.response.data.res_message}`;
        } else if (error.message) {
          errorMessage = `เกิดข้อผิดพลาด: ${error.message}`;
        }

        alert(errorMessage);
      }

      // รีเซ็ตการแก้ไข
      setModalOpen(false);
      setCurrentNoteRow(null);
      setNewNoteText("");
    }
  };

  // ฟังก์ชันยกเลิกการแก้ไข
  const handleCancelEdit = () => {
    setModalOpen(false);
    setCurrentNoteRow(null);
    setNewNoteText("");
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
      const transformedData = transformComplaintsData(allComplaints);
      setFilteredComplaints(transformedData);
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
      receiptNumber: item.complaint_number || item.receive_reference_number || "-",
      receiptDate: item.assigned_date
        ? new Date(item.assigned_date).toLocaleDateString("th-TH")
        : "-",
      referenceNumber: item.parent_complaint_number || item.reference_number || "-",
      proposeDate: (() => {
        // สำหรับ status = "tracking" (ยังรอผลจากหน่วยงาน = งานยังไม่เสร็จ) ให้แสดง "-"
        // เพราะ director_submission_date เป็นวันที่จากขั้นตอนก่อนหน้า ไม่ใช่วันที่เกี่ยวกับผลจากหน่วยงาน
        const st = (item.status_original || "").toString().toLowerCase();
        if (st === "tracking") return "-";
        return item.director_submission_date
          ? new Date(item.director_submission_date).toLocaleDateString("th-TH")
          : "-";
      })(),
      complaint: item.subject || "-",
      receiveDate: item.assigned_date
        ? new Date(item.assigned_date).toLocaleDateString("th-TH")
        : "-",
      receiveDateObj: item.assigned_date
        ? new Date(item.assigned_date)
        : undefined,
      agency: item._rawAgency || item.outside_department_name || item.department_name || "-",
      letterNumber: item.document_number || "-",
      status: STATUS_LABELS[(item.status || "").toLowerCase()] || item.status || "-",
      elapsedDays: item.days_in_progress,
      issueType: item.subject,
      source: item.source || "pending",
      complainantName: item.complainant_name || "-",
      filingType: item.filing_type || "-",
      remark: item.remark || "",
      isSelected: selectedItems.includes(item.id),
      // สำหรับการแก้ไขหมายเหตุ
      isEditingNote: currentNoteRow === item.id,
      noteValue: currentNoteRow === item.id ? newNoteText : (item.remark || ""),
      canEditNote: true,
      // --- ข้อมูลจาก complaint โดยตรง ---
      statusStep: item.statusStep || "-",
      isCompleted: item.isCompleted || false,
      completedDays: item.completedDays ?? null,
    }));
  }, [filteredComplaints, selectedItems, currentNoteRow, newNoteText]);

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
        editingNote={currentNoteRow}
        noteValue={newNoteText}
        setNoteValue={setNewNoteText}
        // actionButtonLabel="สรุปตามประเภทเรื่อง"
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
              <SelectFieldDepartmentoutside
                key={`department-${selectedDepartment || 'empty'}`} // บังคับ re-render เมื่อค่าเปลี่ยน
                label="หน่วยงาน"
                value={selectedDepartment}
                onChange={(e) => {
                  const newValue = e.target.value;
                  // ถ้าค่าว่าง = clear ให้ reset ทั้ง value และ label
                  if (!newValue) {
                    handleDepartmentChange(null);
                  }
                  // ถ้ามีค่า จะจัดการผ่าน onDepartmentSelect แทน (จะได้ label ด้วย)
                }}
                onDepartmentSelect={(departmentData) => {
                  if (!departmentData) {
                    // clear
                    handleDepartmentChange(null);
                  } else {
                    // เลือกหน่วยงาน - ส่งทั้ง value และ label
                    handleDepartmentChange(departmentData);
                  }
                }}
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

export default PendingWorkfollowupComponents;