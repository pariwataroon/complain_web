import React, { useState, useMemo, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { useRouter } from "next/router";
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Container,
  IconButton,
  Collapse,
  useMediaQuery,
  useTheme,
  TextField,
  Tooltip,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  SearchOff as SearchOffIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";

import styles from "./TableWorkFollow.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import ButtonService from "@services/ButtonService/ButtonService";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import { exportElementToPDF } from "@utils/exportPDF";
import { exportExcel } from "@utils/exportExcel";
import * as XLSX from "xlsx-js-style";
// --- Thai Date formatter helper (full month) ---
function formatThaiDate(date) {
  if (!date) return "-";
  let d = date;
  if (typeof date === "string" && !/^\d+$/.test(date)) {
    const parsed = new Date(date);
    if (!isNaN(parsed)) d = parsed;
    else return date;
  }
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}/.test(d)) {
    d = new Date(d);
  }
  if (!(d instanceof Date) || isNaN(d)) return "-";
  const day = d.getDate();
  const month = d.toLocaleString("th-TH", { month: "long" });
  const year = d.getFullYear() + 543;
  return `${day} ${month} ${year}`;
}

// --- Thai Date formatter helper (abbreviated month for Excel) ---
function formatThaiDateShort(date) {
  if (!date) return "-";
  let d = date;
  if (typeof date === "string" && !/^\d+$/.test(date)) {
    const parsed = new Date(date);
    if (!isNaN(parsed)) d = parsed;
    else return date;
  }
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}/.test(d)) {
    d = new Date(d);
  }
  if (typeof d === "string" && /^\d+$/.test(d)) {
    // timestamp number
    d = new Date(Number(d));
  }
  if (!(d instanceof Date) || isNaN(d)) return "-";
  const day = d.getDate();
  const month = d.toLocaleString("th-TH", { month: "short" });
  const year = d.getFullYear() + 543;
  return `${day} ${month} ${year}`;
}

// --- Extract number from receipt number (remove "mof" prefix etc.) ---
function extractReceiptNumber(val) {
  if (!val || val === "-") return "";
  // ถ้าเป็น string ให้เอาเฉพาะตัวเลขและ / และ -
  const str = String(val);
  const match = str.match(/(\d[\d\-\/]*)/);
  return match ? match[1] : str;
}

// --- สถานะแปลภาษาไทยสำหรับ Excel ---
const EXPORT_STATUS_TRANSLATION = {
  submitted: "ส่งคำร้อง",
  sent_to_agency: "มอบหมายเจ้าหน้าที่",
  sent_to_external: "ส่งหน่วยงานภายนอก",
  in_process: "อยู่ระหว่างดำเนินการ",
  in_review: "อยู่ระหว่างดำเนินการ",
  tracking: "รอติดตาม",
  reviewed: "แจ้งผลการพิจารณา",
  completed: "เสร็จสิ้น",
  done: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
  new: "เรื่องร้องเรียนใหม่",
  additional: "เรื่องร้องเรียนเพิ่มเติม",
  // Thai translations for already-translated statuses (pass through)
  "อยู่ระหว่างดำเนินการ": "อยู่ระหว่างดำเนินการ",
  "รอติดตาม": "รอติดตาม",
  "เสร็จสิ้น": "เสร็จสิ้น",
  "ส่งต่อหน่วยงานภายนอก": "ส่งต่อหน่วยงานภายนอก",
  "แจ้งผลการพิจารณา": "แจ้งผลการพิจารณา",
  "ยกเลิก": "ยกเลิก",
  "ส่งคำร้อง": "ส่งคำร้อง",
  "มอบหมายเจ้าหน้าที่": "มอบหมายเจ้าหน้าที่",
};

function translateStatusForExport(status) {
  if (!status || status === "-") return "";
  return EXPORT_STATUS_TRANSLATION[status] || EXPORT_STATUS_TRANSLATION[status?.toLowerCase()] || status;
}

// สถานะแปลภาษาไทย (ครอบคลุมทุกค่า)
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
  ใหม่: "เรื่องร้องเรียนใหม่",
  เพิ่มเติม: "เรื่องร้องเรียนเพิ่มเติม",
};

const TableWorkFollow = ({
  data = [],
  filterFields = [],
  onSearch = () => {},
  navigateTo = "",
  // ฟีเจอร์ checkbox
  showCheckboxes = false,
  selectedItems = [],
  onSelectItem = () => {},
  onSelectAll = () => {},
  // ฟีเจอร์แก้ไขหมายเหตุ
  onEditNote = () => {},
  onSaveNote = () => {},
  onCancelEdit = () => {},
  editingNote = null,
  noteValue = "",
  setNoteValue = () => {},
  // ปุ่มเพิ่มเติม
  actionButtonLabel = "",
  onActionClick = () => {},
  // ฟังก์ชันล้างการค้นหา
  onClearSearch = () => {},
}) => {
  const router = useRouter();
  const pdfRef = useRef();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const isSm = useMediaQuery(theme.breakpoints.down("md"));
  const isBelow1100 = useMediaQuery("(max-width:1100px)");

  // Mount state for date picker
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const style = document.createElement("style");
    style.textContent = `
      .MuiPopper-root, .MuiDialog-root, .MuiModal-root, .MuiPickersPopper-root,
      .MuiDateCalendar-root, .MuiPickersDay-root, .MuiPickersCalendarHeader-root,
      .MuiPickersYear-root, .MuiPickersMonth-root, .MuiDatePicker-root,
      .MuiPaper-root.MuiPickersPopper-paper {
        z-index: 99999 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) document.head.removeChild(style);
    };
  }, []);

  // Group data by responsibleOfficer
  const groupedData = useMemo(
    () =>
      data.reduce((acc, item) => {
        const key = item.responsibleOfficer || "ไม่ระบุ";
        acc[key] = acc[key] || [];
        acc[key].push(item);
        return acc;
      }, {}),
    [data]
  );
  const groupKeys = Object.keys(groupedData);

  // Collapse state for each group
  const [expandedGroups, setExpandedGroups] = useState({});
  const toggleGroup = (key) =>
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  // Initial filters and handlers
  const initialFilters = filterFields.reduce((acc, f) => {
    acc[f.name] = "";
    return acc;
  }, {});
  const [filters, setFilters] = useState(initialFilters);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const flatData = groupKeys.flatMap((key) => groupedData[key]);
  const pagedGroups = groupKeys.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  const handlePageChange = (_, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(+e.target.value);
    setPage(0);
  };
  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setFilters((prev) => ({ ...prev, [field]: value }));
  };
  const handleDateChange = (field) => (selectedDate) => {
    setFilters((prev) => ({ ...prev, [field]: selectedDate }));
  };
  const handleSearchClick = () => {
    setPage(0);
    onSearch(filters);
  };
  const handleClearSearch = () => {
    setFilters(initialFilters);
    setPage(0);
    onSearch(initialFilters);
    // เรียกฟังก์ชันล้างจาก parent component
    onClearSearch();
  };

  // Columns for display & export (add field mapping for export)
  const baseColumns = [
    { label: "ลำดับ", width: 80, field: "no" },
    {
      label: "เลข สรร.",
      width: 120,
      field: "receiptNumber",
      render: (item) => (
        <>
          {item.receiptNumber}
          <br />
        </>
      ),
    },
    { label: "เรื่อง", width: 300, field: "complaint" },
    { label: "วันที่รับงาน", width: 140, field: "receiveDate" },
    { label: "วันที่เสนอ ผอ.สรร.", width: 160, field: "proposeDate" },
    { label: "หน่วยงาน", width: 200, field: "agency" },
    { label: "เลขที่หนังสือจากส่วนราชการ", width: 160, field: "letterNumber" },
    { label: "สถานะเรื่อง", width: 140, field: "status" },
    { label: "ดำเนินการมาแล้ว (วัน)", width: 180, field: "elapsedDays" },
    { label: "ขั้นตอนปัจจุบัน", width: 160, field: "statusStep" },
    { label: "เสร็จสิ้น", width: 100, field: "completionStatus" },
    { label: "เสร็จแล้ว (วัน)", width: 120, field: "completedDays" },
  ];

  // เพิ่มคอลัมน์หมายเหตุให้ทุกแถว
  const columns = [...baseColumns, { label: "หมายเหตุ", width: 200, field: "remark" }];

  // Prepare export data: flat array with all fields for export
  const exportData = useMemo(() => {
    let no = 1;
    return Object.entries(groupedData).flatMap(([key, items]) =>
      items.map((item) => ({
        no: no++,
        ...item,
        responsibleOfficer: key,
        receiptDate: item.receiptDate || "",
        proposeDate: item.proposeDate || "",
      }))
    );
  }, [groupedData]);

  // ====== EXPORT EXCEL - แก้ไขตาม Template ======
  const getFlatExportData = (reportType) => {
  let dataRows = [];

  // กำหนดคอลัมน์ตามประเภทรายงาน - ตาม Template ที่ให้มา
  const getColumnHeaders = (type) => {
    // Helper: format date for Excel - convert Thai locale date string or raw date to abbreviated Thai format
    const fmtDate = (val) => {
      if (!val || val === "-") return "";
      // ถ้าเป็น Thai locale format เช่น "15/3/2569" ให้แปลงเป็น Date ก่อน
      if (typeof val === "string" && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) {
        const parts = val.split("/");
        const ceYear = Number(parts[2]) - 543;
        const d = new Date(ceYear, Number(parts[1]) - 1, Number(parts[0]));
        return formatThaiDateShort(d);
      }
      return formatThaiDateShort(val);
    };

    if (type === "new_complaint") {
      return {
        columns: ["ลำดับ", "เลขรับ สรร.", "ลงวันที่", "เรื่อง", "วันที่รับงาน", "วันที่เสนองาน ผอ.สรร.", "สถานะ", "จำนวน (วัน)"],
        dataMapping: (item, no) => ({
          "ลำดับ": no,
          "เลขรับ สรร.": item.letterNumber ?? "",
          "ลงวันที่": fmtDate(item.receiptDate),
          "เรื่อง": item.complaint ?? "",
          "วันที่รับงาน": fmtDate(item.receiveDate),
          "วันที่เสนองาน ผอ.สรร.": fmtDate(item.proposeDate),
          "สถานะ": translateStatusForExport(item.status),
          "จำนวน (วัน)": item.elapsedDays ?? "",
        })
      };
    } else if (type === "additional_complaint") {
      return {
        columns: ["ลำดับ", "เลขรับ สรร.", "เลขที่อ้างอิง", "ลงวันที่", "เรื่อง", "วันที่รับงาน", "วันที่เสนองาน ผอ.สรร.", "สถานะ", "จำนวน (วัน)"],
        dataMapping: (item, no) => ({
          "ลำดับ": no,
          "เลขรับ สรร.": item.letterNumber ?? "",
          "เลขที่อ้างอิง": item.referenceNumber ?? "",
          "ลงวันที่": fmtDate(item.receiptDate),
          "เรื่อง": item.complaint ?? "",
          "วันที่รับงาน": fmtDate(item.receiveDate),
          "วันที่เสนองาน ผอ.สรร.": fmtDate(item.proposeDate),
          "สถานะ": translateStatusForExport(item.status),
          "จำนวน (วัน)": item.elapsedDays ?? "",
        })
      };
    } else if (type === "department_decision") {
      return {
        columns: ["ลำดับ", "เลขรับ สรร.", "ลงวันที่", "เรื่อง", "วันที่รับงาน", "วันที่เสนองาน ผอ.สรร.", "หน่วยงานภายใน", "จำนวน (วัน)"],
        dataMapping: (item, no) => ({
          "ลำดับ": no,
          "เลขรับ สรร.": item.letterNumber ?? "",
          "ลงวันที่": fmtDate(item.receiptDate),
          "เรื่อง": item.complaint ?? "",
          "วันที่รับงาน": fmtDate(item.receiveDate),
          "วันที่เสนองาน ผอ.สรร.": fmtDate(item.proposeDate),
          "หน่วยงานภายใน": item.agency ?? "",
          "จำนวน (วัน)": item.elapsedDays ?? "",
        })
      };
    } else {
      return {
        columns: ["ลำดับ", "เลขรับ สรร.", "ลงวันที่", "เรื่อง", "วันที่รับงาน", "วันที่เสนองาน ผอ.สรร.", "สถานะ", "จำนวน (วัน)"],
        dataMapping: (item, no) => ({
          "ลำดับ": no,
          "เลขรับ สรร.": item.letterNumber ?? "",
          "ลงวันที่": fmtDate(item.receiptDate),
          "เรื่อง": item.complaint ?? "",
          "วันที่รับงาน": fmtDate(item.receiveDate),
          "วันที่เสนองาน ผอ.สรร.": fmtDate(item.proposeDate),
          "สถานะ": translateStatusForExport(item.status),
          "จำนวน (วัน)": item.elapsedDays ?? "",
        })
      };
    }
  };

  const config = getColumnHeaders(reportType);

  Object.entries(groupedData).forEach(([groupKey, items]) => {
    // เพิ่มข้อมูลเจ้าหน้าที่ (จะ merge ภายหลัง)
    dataRows.push({
      type: "officer",
      officerName: groupKey,
      data: {}
    });

    // ลำดับของใครของมัน
    let no = 1;
    // Export ทุกรายการโดยไม่ต้องเปิดดรอปดาวน์
    items.forEach((item) => {
      dataRows.push({
        type: "data",
        officerName: groupKey,
        data: config.dataMapping(item, no++)
      });
    });
  });

  return { rows: dataRows, columns: config.columns };
};

const handleExportExcel = () => {
  const today = new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  // หา dataType จาก filters - ค้นหาจาก filterFields
  const getFieldValue = (name) => {
    const field = filterFields.find(f => f.name.includes(name));
    return field ? filters[field.name] : filters[name];
  };

  const reportType = getFieldValue("dataType") || "";

  // กำหนดชื่อไฟล์และชื่อรายงานตามประเภท - ตาม Template
  let reportName = "ทั้งหมด";
  if (reportType === "new_complaint") {
    reportName = "เรื่องร้องเรียนใหม่";
  } else if (reportType === "additional_complaint") {
    reportName = "ร้องเรียนเพิ่มเติม";
  } else if (reportType === "department_decision") {
    reportName = "ผลการพิจารณาจากหน่วยงาน";
  }
  const reportTitle = "การติดตามงานค้าง";

  const filename = `${reportName}_${today}.xlsx`;
  const exportResult = getFlatExportData(reportType);

  if (exportResult.rows.filter(r => r.type === "data").length === 0) {
    alert("ไม่มีข้อมูลให้ Export กรุณากรองข้อมูลก่อน");
    return;
  }

  // สร้าง workbook
  const wb = XLSX.utils.book_new();

  // กำหนดข้อมูลวันที่
  const dateFromVal = getFieldValue("receiveDateFrom");
  const dateToVal = getFieldValue("receiveDateTo");
  const fromText = dateFromVal ? formatThaiDate(dateFromVal) : "-";
  const toText = dateToVal ? formatThaiDate(dateToVal) : "-";

  // จำนวนคอลัมน์
  const numCols = exportResult.columns.length;

  // สร้าง array สำหรับ worksheet
  const wsData = [];

  // แถวที่ 1: ชื่อรายงาน
  wsData.push([reportTitle]);

  // แถวที่ 2: วันที่
  wsData.push([`ตั้งแต่วันที่ ${fromText} ถึงวันที่ ${toText}`]);

  // แถวที่ 3: ประเภท
  wsData.push([`ประเภท ${reportName}`]);

  // แถวที่ 4: หัวคอลัมน์
  wsData.push(exportResult.columns);

  // เพิ่มข้อมูล
  exportResult.rows.forEach((row) => {
    if (row.type === "officer") {
      // แถวเจ้าหน้าที่ (จะ merge ภายหลัง)
      wsData.push([`เจ้าหน้าที่ผู้รับผิดชอบ : ${row.officerName}`]);
    } else {
      // แถวข้อมูล
      const dataRow = [];
      exportResult.columns.forEach(colName => {
        dataRow.push(row.data[colName] ?? "");
      });
      wsData.push(dataRow);
    }
  });

  // สร้าง worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Merge cells
  if (!ws['!merges']) ws['!merges'] = [];

  // Merge แถวที่ 1-3 (หัวข้อ)
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } });
  ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: numCols - 1 } });
  ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: numCols - 1 } });

  // Merge แถวเจ้าหน้าที่
  let currentRow = 4; // เริ่มจากแถวหลังหัวคอลัมน์
  exportResult.rows.forEach((row) => {
    if (row.type === "officer") {
      ws['!merges'].push({
        s: { r: currentRow, c: 0 },
        e: { r: currentRow, c: numCols - 1 }
      });
    }
    currentRow++;
  });

  // กำหนดความกว้างคอลัมน์ - ตาม Template
  const colWidths = [];
  if (reportType === "new_complaint") {
    colWidths.push(
      { wch: 8 },  // ลำดับ
      { wch: 12 }, // เลขรับ สรร.
      { wch: 15 }, // ลงวันที่
      { wch: 50 }, // เรื่อง
      { wch: 15 }, // วันที่รับงาน
      { wch: 18 }, // วันที่เสนองาน ผอ.สรร.
      { wch: 20 }, // สถานะ
      { wch: 12 }, // จำนวน (วัน)
    );
  } else if (reportType === "additional_complaint") {
    colWidths.push(
      { wch: 8 },  // ลำดับ
      { wch: 12 }, // เลขรับ สรร.
      { wch: 15 }, // เลขที่อ้างอิง
      { wch: 15 }, // ลงวันที่
      { wch: 50 }, // เรื่อง
      { wch: 15 }, // วันที่รับงาน
      { wch: 18 }, // วันที่เสนองาน ผอ.สรร.
      { wch: 20 }, // สถานะ
      { wch: 12 }, // จำนวน (วัน)
    );
  } else if (reportType === "department_decision") {
    colWidths.push(
      { wch: 8 },  // ลำดับ
      { wch: 12 }, // เลขรับ สรร.
      { wch: 15 }, // ลงวันที่
      { wch: 50 }, // เรื่อง
      { wch: 15 }, // วันที่รับงาน
      { wch: 18 }, // วันที่เสนองาน ผอ.สรร.
      { wch: 30 }, // หน่วยงานภายใน
      { wch: 12 }, // จำนวน (วัน)
    );
  } else {
    colWidths.push(
      { wch: 8 },  // ลำดับ
      { wch: 12 }, // เลขรับ สรร.
      { wch: 15 }, // ลงวันที่
      { wch: 50 }, // เรื่อง
      { wch: 15 }, // วันที่รับงาน
      { wch: 18 }, // วันที่เสนองาน ผอ.สรร.
      { wch: 20 }, // สถานะ
      { wch: 12 }, // จำนวน (วัน)
    );
  }
  ws['!cols'] = colWidths;

  // จัดรูปแบบเซลล์
  const borderStyle = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" }
  };

  const range = XLSX.utils.decode_range(ws['!ref']);

  // ติดตามว่าแถวไหนเป็นแถวเจ้าหน้าที่
  const officerRows = new Set();
  let trackRow = 4;
  exportResult.rows.forEach((row) => {
    if (row.type === "officer") {
      officerRows.add(trackRow);
    }
    trackRow++;
  });

  // วนลูปทุกเซลล์เพื่อจัดรูปแบบ
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellAddress]) {
        ws[cellAddress] = { t: 's', v: '' };
      }

      if (!ws[cellAddress].s) ws[cellAddress].s = {};

      // จัดรูปแบบแถวที่ 0-2 (หัวข้อรายงาน) - ไม่ใส่เส้นตาราง
      if (R >= 0 && R <= 2) {
        ws[cellAddress].s.alignment = {
          horizontal: "center",
          vertical: "center",
          wrapText: true
        };
        ws[cellAddress].s.font = {
          name: "TH Sarabun",
          bold: true,
          sz: 13
        };
      }
      // จัดรูปแบบแถวที่ 3 (หัวคอลัมน์) - ไม่ใส่เส้นตาราง
      else if (R === 3) {
        ws[cellAddress].s.alignment = {
          horizontal: "center",
          vertical: "center",
          wrapText: true
        };
        ws[cellAddress].s.font = {
          name: "TH Sarabun",
          bold: true,
          sz: 13
        };
      }
      // แถวข้อมูล - ใส่เส้นตาราง
      else {
        // ใส่เส้นตารางเฉพาะแถวข้อมูล
        ws[cellAddress].s.border = borderStyle;

        if (officerRows.has(R)) {
          // แถวเจ้าหน้าที่
          ws[cellAddress].s.font = {
            name: "TH Sarabun",
            bold: true,
            sz: 13
          };
          ws[cellAddress].s.alignment = {
            horizontal: "left",
            vertical: "center",
            wrapText: true
          };
        } else {
          // แถวข้อมูลปกติ
          if (C === 0) {
            // คอลัมน์ลำดับ จัดกลาง
            ws[cellAddress].s.alignment = {
              horizontal: "center",
              vertical: "center",
              wrapText: true
            };
          } else {
            ws[cellAddress].s.alignment = {
              horizontal: "left",
              vertical: "center",
              wrapText: true
            };
          }
          ws[cellAddress].s.font = {
            name: "TH Sarabun",
            sz: 13
          };
        }
      }
    }
  }

  // ตั้งค่า Page Setup เป็น A4
  ws['!pageSetup'] = {
    paperSize: 9, // A4 = 9
    orientation: "portrait",
    fitToPage: false,
    scale: 100,
  };

  // ตั้งค่า margins
  ws['!margins'] = {
    left: 0.5,
    right: 0.5,
    top: 0.5,
    bottom: 0.5,
    header: 0.3,
    footer: 0.3,
  };

  // เพิ่ม worksheet เข้า workbook
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  // บันทึกไฟล์
  XLSX.writeFile(wb, filename);
};

  const getDatePickerProps = () => {
    if (!isMounted || typeof window === "undefined") {
      return {
        sx: {
          width: "100%",
          position: "relative",
          zIndex: 1000,
        },
      };
    }
    return {
      componentsProps: {
        popper: {
          style: { zIndex: 99999 },
          placement: "bottom-start",
          container: document.body,
        },
      },
      PopperProps: {
        style: { zIndex: 99999 },
        disablePortal: false,
        container: document.body,
      },
      slotProps: {
        popper: {
          style: { zIndex: 99999 },
          container: document.body,
        },
      },
      sx: {
        width: "100%",
        position: "relative",
        zIndex: 1000,
        "& .MuiInputBase-root": { position: "relative", zIndex: 1000 },
        "& .MuiPopper-root": { zIndex: `${99999} !important` },
        "& .MuiDialog-root": { zIndex: `${99999} !important` },
        "& .MuiModal-root": { zIndex: `${99999} !important` },
        "& .MuiPaper-root": { zIndex: `${99999} !important` },
      },
    };
  };
  // ---- ดึงค่า filter มาแสดงในหัวตาราง ----
  const fieldKey = (name) => filterFields.find(f => f.name.includes(name))?.name || "";
  const receiveDateFromVal = filters[fieldKey("receiveDateFrom")];
  const receiveDateToVal = filters[fieldKey("receiveDateTo")];
  const dataTypeVal = filters[fieldKey("dataType")];

  // format
  const fromText = receiveDateFromVal
    ? formatThaiDate(receiveDateFromVal)
    : "-";
  const toText = receiveDateToVal
    ? formatThaiDate(receiveDateToVal)
    : "-";

  // แปลง dataType เป็นข้อความภาษาไทย
  let typeText = "ทั้งหมด";
  if (dataTypeVal === "new_complaint") {
    typeText = "เรื่องร้องเรียนใหม่";
  } else if (dataTypeVal === "additional_complaint") {
    typeText = "เรื่องร้องเรียนเพิ่มเติม";
  } else if (dataTypeVal === "department_decision") {
    typeText = "ผลการพิจารณาจากหน่วยงาน";
  }

  // เมื่อคลิกแถวเนื้อหาย่อย (collapse) ให้เปลี่ยนหน้า (push) ไป admin/box/list/{id}
  const handleSubRowClick = (id) => {
    // ตรวจสอบและเอา prefix ออก (เช่น new_) ก่อน push
    const cleanId = id.replace(/^new_/, '');
    router.push(`/admin/box/list/${cleanId}/`);
  };

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        backgroundColor: "#fff",
        borderRadius: 2,
        boxShadow: "0 6px 18px rgba(0,0,0,.06)",
        overflow: "hidden",
        position: "relative",
        zIndex: 1,
      }}
    >
      <Box className={styles.headerBar}></Box>

      {/* Filters Section */}
      <Box
        px={{ xs: 1.5, sm: 2 }}
        py={{ xs: 1.5, sm: 1 }}
        sx={{
          overflow: "visible",
          position: "relative",
          zIndex: 1000,
        }}
      >
        {isSm || isBelow1100 ? (
          <>
            {/* Filter Fields - Grid Layout */}
            <Box
              display="grid"
              gridTemplateColumns={{
                xs: "1fr",
                sm: "1fr 1fr",
                md: "repeat(3, 1fr)",
              }}
              gap={{ xs: 2, sm: 1.5 }}
              sx={{
                mb: 2,
                width: "100%",
                position: "relative",
                zIndex: 1000,
                "& > div": {
                  minWidth: 0,
                  position: "relative",
                  zIndex: 1000,
                },
              }}
            >
              {filterFields.map((f, index) => (
                <Box
                  key={f.name}
                  sx={{ position: "relative", zIndex: 1000 + index }}
                >
                  {f.type === "department" ? (
                    f.component
                  ) : f.type === "select" ? (
                    <SelectField
                      fullWidth
                      label={f.label}
                      options={f.options}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      size={isXs ? "small" : "medium"}
                      sx={{ position: "relative", zIndex: 1000 + index }}
                    />
                  ) : f.type === "date" ? (
                    <DateThaiPickerService
                      label={f.label}
                      value={filters[f.name]}
                      onChange={handleDateChange(f.name)}
                      placeholder={f.placeholder || `เลือก${f.label}`}
                      disabled={f.disabled || false}
                      required={f.required || false}
                      {...getDatePickerProps()}
                    />
                  ) : (
                    <InputText
                      fullWidth
                      label={f.label}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      size={isXs ? "small" : "medium"}
                      sx={{ position: "relative", zIndex: 1000 + index }}
                    />
                  )}
                </Box>
              ))}
            </Box>
            {/* Search Buttons */}
            <Box
              display="flex"
              gap={1.5}
              justifyContent="center"
              mb={2}
              sx={{ position: "relative", zIndex: 500 }}
            >
              <IconButton
                onClick={handleSearchClick}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  "&:hover": { bgcolor: "#0b1580" },
                  position: "relative",
                  zIndex: 500,
                }}
              >
                <SearchIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
              </IconButton>
              <IconButton
                onClick={handleClearSearch}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  "&:hover": { bgcolor: "#0b1580" },
                  position: "relative",
                  zIndex: 500,
                }}
              >
                <SearchOffIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
              </IconButton>
            </Box>
            {/* Export Buttons - Mobile/Tablet */}
            <Box
              display="flex"
              flexDirection="column"
              gap={1.5}
              alignItems="center"
              sx={{ position: "relative", zIndex: 500 }}
            >
              {isXs ? (
                <>
                  {actionButtonLabel && (
                    <ButtonService
                      label={actionButtonLabel}
                      onClick={onActionClick}
                      size="small"
                      sx={{ width: "100%", maxWidth: "300px", mb: 1 }}
                    />
                  )}
                  <ExportButton
                    label="Export PDF"
                    onClick={() =>
                      exportElementToPDF(pdfRef, "รายงานการติดตามงานค้าง.pdf")
                    }
                    size="small"
                    sx={{ width: "100%", maxWidth: "300px" }}
                  />
                  <ExportButton
                    label="Export Excel"
                    onClick={handleExportExcel}
                    size="small"
                    sx={{ width: "100%", maxWidth: "300px" }}
                  />
                </>
              ) : (
                <Box
                  display="flex"
                  gap={1}
                  width="100%"
                  justifyContent="center"
                >
                  {actionButtonLabel && (
                    <ButtonService
                      label={actionButtonLabel}
                      onClick={onActionClick}
                      size="medium"
                      sx={{ flex: 1, maxWidth: "150px", mr: 1 }}
                    />
                  )}
                  <ExportButton
                    label="Export PDF"
                    onClick={() =>
                      exportElementToPDF(pdfRef, "รายงานการติดตามงานค้าง.pdf")
                    }
                    size="medium"
                    sx={{ flex: 1, maxWidth: "150px" }}
                  />
                  <ExportButton
                    label="Export Excel"
                    onClick={handleExportExcel}
                    size="medium"
                    sx={{ flex: 1, maxWidth: "150px" }}
                  />
                </Box>
              )}
            </Box>
          </>
        ) : (
          // Large Desktop Layout (>= 1100px)
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{ position: "relative", zIndex: 1000 }}
          >
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              sx={{
                flexGrow: 1,
                overflowX: "visible",
                maxWidth: "60%",
                position: "relative",
                zIndex: 1000,
              }}
            >
              {filterFields.map((f, index) => (
                <Box
                  key={f.name}
                  sx={{
                    flex: "1 1 140px",
                    minWidth: "140px",
                    maxWidth: "300px",
                    position: "relative",
                    zIndex: 1000 + index,
                  }}
                >
                  {f.type === "department" ? (
                    f.component
                  ) : f.type === "select" ? (
                    <SelectField
                      fullWidth
                      label={f.label}
                      options={f.options}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      sx={{ position: "relative", zIndex: 1000 + index }}
                    />
                  ) : f.type === "date" ? (
                    <DateThaiPickerService
                      label={f.label}
                      value={filters[f.name]}
                      onChange={handleDateChange(f.name)}
                      placeholder={f.placeholder || `เลือก${f.label}`}
                      disabled={f.disabled || false}
                      required={f.required || false}
                      {...getDatePickerProps()}
                    />
                  ) : (
                    <InputText
                      fullWidth
                      label={f.label}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      sx={{ position: "relative", zIndex: 1000 + index }}
                    />
                  )}
                </Box>
              ))}
              <Box
                display="flex"
                gap={1}
                sx={{ flexShrink: 0, ml: 1, position: "relative", zIndex: 500 }}
              >
                <IconButton
                  onClick={handleSearchClick}
                  sx={{
                    bgcolor: "#1120A3",
                    color: "#fff",
                    width: 40,
                    height: 40,
                    "&:hover": { bgcolor: "#0b1580" },
                    position: "relative",
                    zIndex: 500,
                  }}
                >
                  <SearchIcon />
                </IconButton>
                <IconButton
                  onClick={handleClearSearch}
                  sx={{
                    bgcolor: "#1120A3",
                    color: "#fff",
                    width: 40,
                    height: 40,
                    "&:hover": { bgcolor: "#0b1580" },
                    position: "relative",
                    zIndex: 500,
                  }}
                >
                  <SearchOffIcon />
                </IconButton>
              </Box>
            </Box>
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              sx={{ flexShrink: 0, ml: 2, position: "relative", zIndex: 500 }}
            >
              {actionButtonLabel && (
                <ButtonService
                  label={actionButtonLabel}
                  onClick={onActionClick}
                  size="medium"
                  sx={{ mr: 1 }}
                />
              )}
              <ExportButton
                label="Export PDF"
                onClick={() =>
                  exportElementToPDF(pdfRef, "รายงานการติดตามงานค้าง.pdf")
                }
                size="medium"
              />
              <ExportButton
                label="Export Excel"
                onClick={handleExportExcel}
                size="medium"
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Report Title */}
      <Box
        sx={{
          backgroundColor: "#EAF5FF",
          p: 2,
          color: "#1120A3",
          textAlign: "center",
          fontSize: { xs: 16, sm: 18, md: 20 },
          fontWeight: "bold",
          position: "relative",
          zIndex: 1,
        }}
      >
        รายงานการติดตามงานค้าง
        <br />
        ตั้งแต่วันที่ {fromText} ถึงวันที่ {toText}
        <br />
        ประเภท {typeText}
      </Box>

      {/* Table with grouped collapsible rows */}
      <div ref={pdfRef}>
        <Box
          sx={{
            overflowX: "auto",
            px: { xs: 1, sm: 2 },
            pb: 1,
            position: "relative",
            zIndex: 1,
            "&::-webkit-scrollbar": { height: "8px" },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "#f1f1f1",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#888",
              borderRadius: "4px",
              "&:hover": { backgroundColor: "#555" },
            },
          }}
        >
          <Table
            sx={{
              minWidth: 2100,
              position: "relative",
              zIndex: 1,
            }}
          >
            <TableHead>
              <TableRow>
                {columns.map((col, i) => (
                  <TableCell
                    key={i}
                    align={i === 0 ? "center" : "left"}
                    sx={{
                      width: col.width,
                      fontSize: { xs: 12, sm: 14 },
                      fontWeight: 600,
                      color: "#1120a3",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedGroups.map((groupKey) => {
                const items = groupedData[groupKey];
                return (
                  <React.Fragment key={groupKey}>
                    <TableRow
                      sx={{
                        "&:hover": { backgroundColor: "#f5f7ff" },
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <TableCell
                        align="center"
                        sx={{
                          width: 60,
                          position: "relative",
                          zIndex: 1,
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => toggleGroup(groupKey)}
                        >
                          {expandedGroups[groupKey] ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )}
                        </IconButton>
                      </TableCell>
                      <TableCell
                        colSpan={columns.length + 1}
                        sx={{
                          width: 300,
                          fontSize: { xs: 12, sm: 14 },
                          fontWeight: "bold",
                          position: "relative",
                          zIndex: 1,
                        }}
                      >
                        {`เจ้าหน้าที่ผู้รับผิดชอบ : ${groupKey}`}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        style={{ padding: 0 }}
                        colSpan={columns.length + 2}
                        sx={{
                          position: "relative",
                          zIndex: 1,
                        }}
                      >
                        <Collapse
                          in={expandedGroups[groupKey]}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box>
                            <Table size="small">
                              <TableBody
                                sx={{
                                  backgroundColor: "#FEFAEF",
                                  position: "relative",
                                  zIndex: 1,
                                }}
                              >
                                {items.map((item, idx) => (
                                  <TableRow
                                    key={item.id}
                                    sx={{
                                      "&:hover": { backgroundColor: "#f5f7ff" },
                                      cursor: "pointer",
                                      position: "relative",
                                      zIndex: 1,
                                    }}
                                  >
                                    <TableCell
                                      align="center"
                                      sx={{
                                        width: columns[0].width,
                                        fontWeight: 600,
                                        color: "#1120A3",
                                        fontSize: { xs: 12, sm: 14 },
                                        position: "relative",
                                        zIndex: 1,
                                      }}
                                      onClick={() => handleSubRowClick(item.id)}
                                    >
                                      {page * rowsPerPage + idx + 1}
                                    </TableCell>
                                    {columns.slice(1).map((col, i) => {
                                      // ถ้าเป็นคอลัมน์หมายเหตุ (แก้ไขได้ทุกแถว)
                                      if (col.field === "remark") {
                                        return (
                                          <TableCell
                                            key={i}
                                            sx={{
                                              width: col.width,
                                              fontSize: { xs: 12, sm: 14 },
                                              position: "relative",
                                              zIndex: 1,
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <Box display="flex" alignItems="center" gap={1}>
                                              <Box flexGrow={1} sx={{ wordBreak: "break-word" }}>
                                                {item.remark || "-"}
                                              </Box>
                                              <Tooltip title="แก้ไขหมายเหตุ">
                                                <IconButton
                                                  size="small"
                                                  onClick={() => onEditNote(item.id, item.remark)}
                                                  sx={{ color: "#1120A3" }}
                                                >
                                                  <EditIcon fontSize="small" />
                                                </IconButton>
                                              </Tooltip>
                                            </Box>
                                          </TableCell>
                                        );
                                      }

                                      // คอลัมน์ปกติ
                                      return (
                                        <TableCell
                                          key={i}
                                          sx={{
                                            width: col.width,
                                            fontSize: { xs: 12, sm: 14 },
                                            position: "relative",
                                            zIndex: 1,
                                          }}
                                          onClick={() => handleSubRowClick(item.id)}
                                        >
                                          {col.field === "status"
                                            ? STATUS_TRANSLATION[(item.status || "").toLowerCase()] ||
                                              STATUS_TRANSLATION[item.status] ||
                                              item.status ||
                                              "-"
                                            : col.field === "statusStep"
                                              ? (item.statusStep || "-")
                                            : col.field === "completionStatus"
                                              ? (item.isCompleted ? "เสร็จสิ้น" : "อยู่ระหว่างดำเนินการ")
                                            : col.field === "completedDays"
                                              ? (item.completedDays !== null && item.completedDays !== undefined
                                                  ? item.completedDays
                                                  : "-")
                                            : col.render
                                              ? col.render(item)
                                              : item[col.field] || "-"}
                                        </TableCell>
                                      );
                                    })}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            rowsPerPageOptions={[5, 10, 25]}
            count={flatData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            sx={{
              borderTop: "1px solid #eee",
              position: "relative",
              zIndex: 1,
              "& .MuiTablePagination-toolbar": {
                fontSize: { xs: 12, sm: 14 },
                minHeight: { xs: 48, sm: 52 },
              },
            }}
          />
        </Box>
      </div>
    </Container>
  );
};

TableWorkFollow.propTypes = {
  data: PropTypes.array,
  filterFields: PropTypes.array,
  onSearch: PropTypes.func,
  navigateTo: PropTypes.string,
  // ฟีเจอร์แก้ไขหมายเหตุ
  onEditNote: PropTypes.func,
  onSaveNote: PropTypes.func,
  onCancelEdit: PropTypes.func,
  editingNote: PropTypes.string,
  noteValue: PropTypes.string,
  setNoteValue: PropTypes.func,
  // ปุ่มเพิ่มเติม
  actionButtonLabel: PropTypes.string,
  onActionClick: PropTypes.func,
  // ฟังก์ชันล้างการค้นหา
  onClearSearch: PropTypes.func,
};

export default TableWorkFollow;