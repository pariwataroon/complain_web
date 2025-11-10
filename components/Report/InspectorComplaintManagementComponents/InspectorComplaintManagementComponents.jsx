import React, { useState, useRef, useEffect } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import styles from "./ReportTable.module.scss";
import { exportElementToPDF } from "@utils/exportPDF";
import { exportExcel } from "@utils/exportExcel";
import { GetInspectorComplaintManagement } from "@pages/api/report/report";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/th";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("th");
dayjs.tz.setDefault("Asia/Bangkok");

// ข้อมูลแยกตามผู้ตรวจ
const dataByInspector = {
  inspector1: [
    {
      order: 1,
      date: "1422/67\n29 พ.ย. 67",
      subject: "ขอให้แก้ไขปัญหาในโครงการก้านไม้เขียว (นายประยูรชา)",
      agencies: {
        gsb: "1",
        pdmo: "",
        bss: "",
        yst: "1",
        sura: "",
        phai: "",
      },
      issueTypes: {
        agencyMoney: "1",
        agencyNoMoney: "",
        personalMoney: "",
        personalNoMoney: "1",
      },
      provinces: {
        bkk: "1",
        regional: "ชบ.",
      },
      status: {
        coordination: "2",
        ongoing: "",
        terminated: "2ด1ว",
      },
      remark:
        "(PM) มีที่ประชุมเสนอขอให้สามารถเติมน้ำมันเขียวในถังได้ในโครงการก้านไม้เขียว (ฯ) ส่งคำถามการสอบถามรายละเอียดโครงการก้านไม้เขียวของส่วน",
    },
    {
      order: 2,
      date: "1435/67\n2 ธ.ค. 67",
      subject: "ขอให้พิจารณาซ่อมถนนในหมู่บ้านที่ประสบอุทกภัย ปี 67 (นายชัยพร)",
      agencies: {
        gsb: "",
        pdmo: "1",
        bss: "1",
        yst: "",
        sura: "1",
        phai: "",
      },
      issueTypes: {
        agencyMoney: "",
        agencyNoMoney: "1",
        personalMoney: "1",
        personalNoMoney: "",
      },
      provinces: {
        bkk: "",
        regional: "ภก.",
      },
      status: {
        coordination: "3",
        ongoing: "1",
        terminated: "1ด15ว",
      },
      remark:
        "ตรวจสอบแล้วรับทราบแล้วสำคัญอาคารที่ให้บริการนายยกกรรมที่ปรากฏ (สำคัญในท้ายที่ประสบภัย) ตามประกาศที่ 33/30 ก.ค.67",
    },
    {
      order: 3,
      date: "1525/67\n20 ธ.ค. 67",
      subject:
        "ขอความช่วยเหลือแก้ไขปัญหาหนี้สิน... (นายประหยัด ฯลฯ) และนางเจ็บรา)",
      agencies: {
        gsb: "",
        pdmo: "",
        bss: "",
        yst: "",
        sura: "",
        phai: "1",
      },
      issueTypes: {
        agencyMoney: "",
        agencyNoMoney: "",
        personalMoney: "",
        personalNoMoney: "1",
      },
      provinces: {
        bkk: "1",
        regional: "นม.",
      },
      status: {
        coordination: "1",
        ongoing: "",
        terminated: "3ด10ว",
      },
      remark:
        "(PM) GSBและนางเจ็บราได้พบกันแล้ว GSBให้ส่งรวบรวมเอกสารใส่ครบถ้วนและชัดเจนเพื่อพิจารณาดำเนินต่อไป",
    },
  ],
  inspector2: [
    {
      order: 1,
      date: "1440/67\n5 ธ.ค. 67",
      subject: "ร้องเรียนเรื่องการจัดซื้อวัสดุอุปกรณ์ไม่โปร่งใส (นางสาวสุนิสา)",
      agencies: {
        gsb: "",
        pdmo: "",
        bss: "1",
        yst: "",
        sura: "1",
        phai: "",
      },
      issueTypes: {
        agencyMoney: "1",
        agencyNoMoney: "",
        personalMoney: "",
        personalNoMoney: "",
      },
      provinces: {
        bkk: "",
        regional: "สก.",
      },
      status: {
        coordination: "5",
        ongoing: "1",
        terminated: "",
      },
      remark:
        "อยู่ระหว่างการตรวจสอบข้อเท็จจริงและประสานงานกับหน่วยงานที่เกี่ยวข้อง รอการชี้แจงเพิ่มเติม",
    },
    {
      order: 2,
      date: "1455/67\n8 ธ.ค. 67",
      subject: "ขอความช่วยเหลือเรื่องการออกแบบแปลงที่ดิน (นายวีระ)",
      agencies: {
        gsb: "1",
        pdmo: "",
        bss: "",
        yst: "1",
        sura: "",
        phai: "1",
      },
      issueTypes: {
        agencyMoney: "",
        agencyNoMoney: "1",
        personalMoney: "1",
        personalNoMoney: "",
      },
      provinces: {
        bkk: "1",
        regional: "",
      },
      status: {
        coordination: "2",
        ongoing: "",
        terminated: "5ด3ว",
      },
      remark:
        "ดำเนินการประสานหน่วยงานที่เกี่ยวข้องและแจ้งผลการพิจารณาแล้ว สามารถติดตามได้ที่สาขา",
    },
    {
      order: 3,
      date: "1470/67\n12 ธ.ค. 67",
      subject: "แจ้งปัญหาการบริการของเจ้าหน้าที่สาขา (นายอดิศักดิ์)",
      agencies: {
        gsb: "1",
        pdmo: "1",
        bss: "",
        yst: "",
        sura: "",
        phai: "",
      },
      issueTypes: {
        agencyMoney: "",
        agencyNoMoney: "",
        personalMoney: "",
        personalNoMoney: "1",
      },
      provinces: {
        bkk: "",
        regional: "ขก.",
      },
      status: {
        coordination: "4",
        ongoing: "",
        terminated: "1ด25ว",
      },
      remark: "ตรวจสอบข้อเท็จจริงเสร็จสิ้นแล้ว ได้ชี้แจงและแก้ไขปัญหาเรียบร้อย",
    },
    {
      order: 4,
      date: "1485/67\n15 ธ.ค. 67",
      subject: "ขอรับการสนับสนุนโครงการพัฒนาชุมชน (นางประนอม)",
      agencies: {
        gsb: "",
        pdmo: "",
        bss: "",
        yst: "",
        sura: "",
        phai: "1",
      },
      issueTypes: {
        agencyMoney: "1",
        agencyNoMoney: "",
        personalMoney: "",
        personalNoMoney: "",
      },
      provinces: {
        bkk: "",
        regional: "ลพ.",
      },
      status: {
        coordination: "3",
        ongoing: "1",
        terminated: "",
      },
      remark:
        "ส่งเรื่องไปยังหน่วยงานที่เกี่ยวข้องแล้ว รอการพิจารณาอนุมัติงบประมาณ",
    },
  ],
  inspector3: [
    {
      order: 1,
      date: "1500/67\n18 ธ.ค. 67",
      subject: "ร้องเรียนเรื่องระบบสารสนเทศไม่เสถียร (นายกิตติ)",
      agencies: {
        gsb: "",
        pdmo: "1",
        bss: "1",
        yst: "",
        sura: "",
        phai: "",
      },
      issueTypes: {
        agencyMoney: "1",
        agencyNoMoney: "",
        personalMoney: "",
        personalNoMoney: "",
      },
      provinces: {
        bkk: "1",
        regional: "",
      },
      status: {
        coordination: "6",
        ongoing: "",
        terminated: "10ด5ว",
      },
      remark:
        "ปัญหาระบบได้รับการแก้ไขแล้ว มีการติดตามผลและปรับปรุงระบบเพิ่มเติม",
    },
    {
      order: 2,
      date: "1515/67\n22 ธ.ค. 67",
      subject: "ขอความช่วยเหลือด้านการเงินสำหรับผู้สูงอายุ (นางวรรณา)",
      agencies: {
        gsb: "1",
        pdmo: "",
        bss: "",
        yst: "",
        sura: "1",
        phai: "",
      },
      issueTypes: {
        agencyMoney: "",
        agencyNoMoney: "",
        personalMoney: "1",
        personalNoMoney: "",
      },
      provinces: {
        bkk: "",
        regional: "นว.",
      },
      status: {
        coordination: "2",
        ongoing: "1",
        terminated: "",
      },
      remark:
        "ประสานงานกับสำนักงานประกันสังคมและกรมพัฒนาสังคมและสวัสดิการ รอการดำเนินการ",
    },
    {
      order: 3,
      date: "1530/67\n25 ธ.ค. 67",
      subject: "แจ้งปัญหาการส่งมอบสินค้าล่าช้า (บริษัท ดีดีเทค)",
      agencies: {
        gsb: "",
        pdmo: "",
        bss: "",
        yst: "1",
        sura: "",
        phai: "1",
      },
      issueTypes: {
        agencyMoney: "1",
        agencyNoMoney: "",
        personalMoney: "",
        personalNoMoney: "",
      },
      provinces: {
        bkk: "",
        regional: "รย.",
      },
      status: {
        coordination: "4",
        ongoing: "",
        terminated: "7ด12ว",
      },
      remark: "ประสานงานกับผู้ขายและผู้ซื้อแล้ว ได้ข้อยุติที่ทุกฝ่ายยอมรับ",
    },
    {
      order: 4,
      date: "1545/67\n28 ธ.ค. 67",
      subject: "ขอรับคำปรึกษาด้านกฎหมายที่ดิน (นายสมบูรณ์)",
      agencies: {
        gsb: "",
        pdmo: "1",
        bss: "",
        yst: "",
        sura: "",
        phai: "",
      },
      issueTypes: {
        agencyMoney: "",
        agencyNoMoney: "1",
        personalMoney: "",
        personalNoMoney: "",
      },
      provinces: {
        bkk: "1",
        regional: "",
      },
      status: {
        coordination: "1",
        ongoing: "",
        terminated: "2ด8ว",
      },
      remark: "ให้คำปรึกษาและแนะนำช่องทางการดำเนินการที่ถูกต้องแล้ว",
    },
    {
      order: 5,
      date: "1560/67\n30 ธ.ค. 67",
      subject: "ร้องเรียนเรื่องมลพิษเสียงจากโรงงาน (ชุมชนบ้านสวน)",
      agencies: {
        gsb: "",
        pdmo: "",
        bss: "1",
        yst: "",
        sura: "1",
        phai: "",
      },
      issueTypes: {
        agencyMoney: "",
        agencyNoMoney: "",
        personalMoney: "",
        personalNoMoney: "1",
      },
      provinces: {
        bkk: "",
        regional: "สมุ.",
      },
      status: {
        coordination: "8",
        ongoing: "1",
        terminated: "",
      },
      remark:
        "ประสานงานกับกรมควบคุมมลพิษและโรงงาน กำลังดำเนินการตรวจสอบและแก้ไข",
    },
  ],
};

// ฟังก์ชันสำหรับกำหนดสีพื้นหลัง - แสดงแค่สี ไม่แสดงตัวเลข
const getCellStyle = (value, color) => {
  return {
    backgroundColor: value ? color : "#ffffff",
    color: "transparent",
  };
};

// ฟังก์ชันสำหรับช่องที่ต้องแสดงตัวเลข (เช่น ประสาน)
const getTextCellStyle = (value, color = "#ffffff") => {
  return {
    backgroundColor: color,
    color: "#000",
    textAlign: "center",
  };
};

// ฟังก์ชันสำหรับช่อง "ยุติ" ที่จะแสดงข้อความบนพื้นหลังสี
const getTerminatedCellStyle = (value) => {
  return {
    backgroundColor: value ? "#89DB5D" : "#ffffff",
    color: value ? "#000" : "transparent",
    fontSize: "11px",
    fontWeight: "bold",
    textAlign: "center",
  };
};

// ฟังก์ชันสำหรับช่อง "ตจว." ที่จะแสดงชื่อย่อจังหวัด
const getProvinceCellStyle = (value) => {
  return {
    backgroundColor: value ? "#BEA6FF" : "#ffffff",
    color: value ? "#000" : "transparent",
    fontSize: "10px",
    fontWeight: "bold",
    textAlign: "center",
  };
};

// ย้าย inspectorOptions ออกมาเป็น constant เพื่อไม่ให้เกิด re-render
const INSPECTOR_OPTIONS = [
  { value: "inspector1", label: "นายสมชาย ใจดี" },
  { value: "inspector2", label: "นางสาวอรทัย แซ่ลิ้ม" },
  { value: "inspector3", label: "นายวิทยา ศรีสุข" },
];

// Mapping agency names to agency keys
const AGENCY_MAPPING = {
  "ธนาคารออมสิน": "gsb",
  "สำนักงานการพัฒนาเขตพิเศษภาคตะวันออก": "pdmo",
  "บริษัท บริการรื่นรมย์สงวนป่า จำกัด": "bss",
  "การยางแห่งประเทศไทย": "yst",
  "สรรพสุรา": "sura",
  "โรงงานไผ่": "phai",
};

const InspectorComplaintManagementComponents = () => {
  const pdfRef = useRef();
  const [selectedInspector, setSelectedInspector] = useState("");
  const [apiData, setApiData] = useState({});
  const [inspectorOptions, setInspectorOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // แปลงชื่อจังหวัดเป็นชื่อย่อ
  const getProvinceAbbr = (provinceName) => {
    if (!provinceName) return "";
    // ถ้ามีจุดอยู่แล้ว แสดงว่าเป็นชื่อย่อแล้ว
    if (provinceName.includes(".")) return provinceName;
    // ถ้าเป็นชื่อเต็ม ให้ตัดเอา 2-3 ตัวแรกแล้วใส่จุด
    if (provinceName.length > 4) {
      return provinceName.substring(0, Math.min(3, provinceName.length)) + ".";
    }
    return provinceName;
  };

  // แปลงข้อมูลจาก API format เป็น UI format
  const transformApiData = (apiItems) => {
    if (!apiItems || apiItems.length === 0) return [];

    return apiItems.map((item, index) => {
      // Map agency name to agency object
      const agencies = {
        gsb: "",
        pdmo: "",
        bss: "",
        yst: "",
        sura: "",
        phai: "",
      };

      // Check if agency_name matches any of our known agencies
      if (item.agency_name) {
        for (const [fullName, key] of Object.entries(AGENCY_MAPPING)) {
          if (item.agency_name.includes(fullName) || fullName.includes(item.agency_name)) {
            agencies[key] = "1";
            break;
          }
        }
      }

      // Map issue_type to issueTypes object
      const issueTypes = {
        agencyMoney: item.issue_type === "agencyMoney" ? "1" : "",
        agencyNoMoney: item.issue_type === "agencyNoMoney" ? "1" : "",
        personalMoney: item.issue_type === "personalMoney" ? "1" : "",
        personalNoMoney: item.issue_type === "personalNoMoney" ? "1" : "",
      };

      // Map province to provinces object
      const provinces = {
        bkk: item.is_bangkok ? "1" : "",
        regional: !item.is_bangkok && item.province_name ? getProvinceAbbr(item.province_name) : "",
      };

      // Map status
      const status = {
        coordination: item.coordination_count || "",
        ongoing: item.is_ongoing ? "1" : "",
        terminated: item.is_terminated ? item.elapsed_text : "",
      };

      return {
        order: item.order || index + 1,
        date: item.date || "",
        subject: item.subject || "",
        agencies,
        issueTypes,
        provinces,
        status,
        remark: item.remark || "",
      };
    });
  };

  // Fetch data from API
  const fetchData = async (inspectorId = "") => {
    setLoading(true);
    try {
      const response = await GetInspectorComplaintManagement(
        0,
        1000,
        null,  // year - ส่ง null แทน "" เพื่อให้ FastAPI รับเป็น Optional[int]
        "",
        "",
        inspectorId
      );

      if (response?.res_code === "0000" && response?.res_data?.items) {
        const inspectors = response.res_data.items;

        // Build apiData object
        const newApiData = {};
        const newOptions = [];

        inspectors.forEach((inspector) => {
          const inspectorKey = inspector.inspector_id;
          newApiData[inspectorKey] = transformApiData(inspector.items);
          newOptions.push({
            value: inspectorKey,
            label: inspector.inspector_name,
          });
        });

        setApiData(newApiData);
        setInspectorOptions(newOptions);
      }
    } catch (error) {
      console.error("Error fetching inspector complaint management data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const handleInspectorChange = (event) => {
    const value = event?.target ? event.target.value : event;
    setSelectedInspector(value);
  };

  // เลือกข้อมูลตามผู้ตรวจที่เลือก - ใช้ apiData แทน mock data
  const currentData = selectedInspector
    ? apiData[selectedInspector] || []
    : [];

  // หาชื่อผู้ตรวจที่เลือก - ใช้ inspectorOptions จาก API
  const selectedInspectorName =
    inspectorOptions.find((option) => option.value === selectedInspector)
      ?.label || "";

      // ฟังก์ชันสำหรับ Export Excel
  const handleExportExcel = () => {
  if (!selectedInspector || currentData.length === 0) return;

  // Header Row 1
  const header1 = [
    "ลำดับ", "วันที่ สคบ.\nรับเรื่อง", "เรื่อง",
    "หน่วยงาน", "", "", "", "", "",
    "ประเภทเรื่อง", "", "", "",
    "จังหวัด", "",
    "สถานะ", "", "",
    "หมายเหตุ"
  ];
  // Header Row 2
  const header2 = [
    "", "", "",
    "GSB", "PD_MO", "บสส", "ยสท", "สุรา", "ไผ่",
    "หน่วยงาน $", "หน่วยงาน No$", "ส่วนบุคคล $", "ส่วนบุคคล No$",
    "กทม.", "ตจว.",
    "ประสาน (ครั้ง)", "ดำเนินการ", "ยุติ",
    ""
  ];

  // Data Rows (ตามลำดับ column)
  const dataRows = currentData.map(row => [
    row.order,
    row.date,
    row.subject,
    row.agencies.gsb ? "✔" : "",
    row.agencies.pdmo ? "✔" : "",
    row.agencies.bss ? "✔" : "",
    row.agencies.yst ? "✔" : "",
    row.agencies.sura ? "✔" : "",
    row.agencies.phai ? "✔" : "",
    row.issueTypes.agencyMoney ? "✔" : "",
    row.issueTypes.agencyNoMoney ? "✔" : "",
    row.issueTypes.personalMoney ? "✔" : "",
    row.issueTypes.personalNoMoney ? "✔" : "",
    row.provinces.bkk ? "✔" : "",
    row.provinces.regional || "",
    row.status.coordination || "",
    row.status.ongoing ? "✔" : "",
    row.status.terminated || "",
    row.remark
  ]);

  // Title and Date
  const exportData = [];
  exportData.push([
    `รายงานผลการจัดการเรื่องร้องเรียนของผู้ตรวจราชการกระทรวงการคลัง${selectedInspectorName ? " - " + selectedInspectorName : ""}`
  ]);
  exportData.push([
    `วันที่ ${new Date().toLocaleDateString("th-TH", { year: 'numeric', month: 'long', day: 'numeric' })}`
  ]);
  exportData.push(header1);
  exportData.push(header2);
  exportData.push(...dataRows);

  // Merge cell เหมือนหน้าเว็บ
  const merges = [
    // Title
    { s: { r: 0, c: 0 }, e: { r: 0, c: 18 } },
    // Export Date
    { s: { r: 1, c: 0 }, e: { r: 1, c: 18 } },
    // "หน่วยงาน"
    { s: { r: 2, c: 3 }, e: { r: 2, c: 8 } },
    // "ประเภทเรื่อง"
    { s: { r: 2, c: 9 }, e: { r: 2, c: 12 } },
    // "จังหวัด"
    { s: { r: 2, c: 13 }, e: { r: 2, c: 14 } },
    // "สถานะ"
    { s: { r: 2, c: 15 }, e: { r: 2, c: 17 } },
    // "หมายเหตุ"
    { s: { r: 2, c: 18 }, e: { r: 3, c: 18 } },
  ];

  // เรียก util (ต้องรองรับ options.merges)
  exportExcel(exportData, {
    filename: `รายงานผลการจัดการเรื่องร้องเรียนของผู้ตรวจราชการกระทรวงการคลัง_${selectedInspectorName}.xlsx`,
    sheetName: "Report",
    merges
  });
};
  return (
    <Box>
      <Box>
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
            { label: "รายงานผลการจัดการเรื่องร้องเรียนของผู้ตรวจราชการกระทรวงการคลัง" },
          ]}
        />
      </Box>

      <Box
        sx={{
          backgroundColor: "#fff",
          borderRadius: 2,
          boxShadow: "0 6px 18px rgba(0,0,0,.06)",
          overflow: "hidden",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header Bar */}
        <Box
          sx={{
            background: "linear-gradient(to right, #1223a5, #2499ff)",
            height: "50px",
            borderTopRightRadius: "12px",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            color: "white",
            fontWeight: "bold",
            fontSize: "18px",
            position: "relative",
            zIndex: 1,
          }}
        />

        {/* Content */}
        <Box sx={{ p: 3 }}>
          {/* Title */}
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                color: "#1120A3",
                fontSize: "20px",
                fontWeight: "bold",
                lineHeight: 1.2,
              }}
            >
              รายงานผลการจัดการเรื่องร้องเรียนของผู้ตรวจราชการกระทรวงการคลัง
              {selectedInspectorName && (
                <span style={{ fontSize: "16px", fontWeight: "normal" }}>
                  {" - "}ของ {selectedInspectorName}
                </span>
              )}
            </Typography>
          </Box>

          {/* Responsive Controls */}
          <Box
            sx={{
              display: "flex",
              alignItems: { xs: "stretch", sm: "center" },
              justifyContent: { xs: "center", sm: "space-between" },
              flexDirection: { xs: "column", sm: "row" },
              gap: { xs: 2, sm: 0 },
              width: "100%",
              mb: 3,
            }}
          >
            {/* Select Field Container */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: { xs: "center", sm: "flex-start" },
                gap: 2,
                width: { xs: "100%", sm: "auto" },
                minWidth: { sm: "300px" },
                maxWidth: { xs: "100%", sm: "500px" },
              }}
            >
              <SelectField
                label="รายชื่อผู้ตรวจ"
                value={selectedInspector}
                onChange={handleInspectorChange}
                options={inspectorOptions}
                sx={{
                  width: { xs: "100%", sm: "250px" },
                  minWidth: { sm: "250px" },
                }}
              />
            </Box>

            {/* Export Buttons Container */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: { xs: "center", sm: "flex-end" },
                gap: 1,
                width: { xs: "100%", sm: "auto" },
                flexWrap: { xs: "wrap", sm: "nowrap" },
              }}
            >
              <ExportButton
                label="Export PDF"
                onClick={() =>
                  exportElementToPDF(
                    pdfRef,
                    `รายงานผลการจัดการเรื่องร้องเรียนของผู้ตรวจราชการกระทรวงการคลัง_${selectedInspectorName}.pdf`
                  )
                }
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  minWidth: { xs: "120px", sm: "auto" },
                }}
              />
              <ExportButton
                label="Export Excel"
                onClick={handleExportExcel}
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  minWidth: { xs: "120px", sm: "auto" },
                }}
              />
            </Box>
          </Box>

          {/* Table Container with Single Scrollbar */}
          <Box
            sx={{
              width: "100%",
              // แสดง scrollbar เฉพาะเมื่อหน้าจอต่ำกว่า 1200px
              "@media (max-width: 1200px)": {
                overflowX: "auto",
                overflowY: "hidden", // ป้องกัน vertical scrollbar
              },
              // สำหรับหน้าจอขนาด 1200px ขึ้นไป ไม่แสดง scrollbar
              "@media (min-width: 1201px)": {
                overflow: "visible",
              },
              "&::-webkit-scrollbar": {
                height: "8px",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#f1f1f1",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#c1c1c1",
                borderRadius: "4px",
                "&:hover": {
                  backgroundColor: "#a8a8a8",
                },
              },
            }}
          >
            <div ref={pdfRef}>
              {/* แสดง loading indicator */}
              {loading ? (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 8,
                    minWidth: "1200px",
                  }}
                >
                  <CircularProgress />
                  <Typography sx={{ mt: 2, color: "#666" }}>กำลังโหลดข้อมูล...</Typography>
                </Box>
              ) : !selectedInspector ? (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 8,
                    color: "#666",
                    fontSize: "18px",
                    minWidth: "1200px", // ใช้ minWidth แทน width
                  }}
                >
                  <Typography>กรุณาเลือกผู้ตรวจเพื่อแสดงข้อมูล</Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    minWidth: "1200px", // ใช้ minWidth แทน width เพื่อไม่ให้เกิด overflow ซ้อน
                  }}
                >
                  <table
                    className={styles.table}
                    style={{
                      width: "100%", // ใช้ 100% แทน px คงที่
                      tableLayout: "fixed",
                      borderCollapse: "collapse",
                      fontSize: "14px",
                    }}
                  >
                    <colgroup>
                      <col style={{ width: "5%" }} /> {/* ลำดับ */}
                      <col style={{ width: "8.33%" }} /> {/* วันที่ */}
                      <col style={{ width: "29.17%" }} /> {/* เรื่อง */}
                      <col span="6" style={{ width: "2.08%" }} />{" "}
                      {/* หน่วยงาน 6 คอลัมน์ */}
                      <col span="4" style={{ width: "2.08%" }} />{" "}
                      {/* ประเภทเรื่อง 4 คอลัมน์ */}
                      <col span="2" style={{ width: "2.5%" }} />{" "}
                      {/* จังหวัด 2 คอลัมน์ */}
                      <col span="3" style={{ width: "3.33%" }} />{" "}
                      {/* สถานะ 3 คอลัมน์ */}
                      <col style={{ width: "26.67%" }} /> {/* หมายเหตุ */}
                    </colgroup>

                    <thead>
                      <tr>
                        <th rowSpan={3}>ลำดับ</th>
                        <th rowSpan={3}>
                          วันที่ สคบ.
                          <br />
                          รับเรื่อง
                        </th>
                        <th rowSpan={3} style={{ textAlign: "left" }}>
                          เรื่อง
                        </th>

                        <th colSpan={6} className={styles.unitHeader}>
                          หน่วยงาน
                        </th>
                        <th colSpan={4} className={styles.typeHeader}>
                          ประเภทเรื่อง
                        </th>
                        <th colSpan={2} className={styles.provinceHeader}>
                          จังหวัด
                        </th>
                        <th colSpan={3} className={styles.statusHeader}>
                          สถานะ
                        </th>

                        <th rowSpan={3} className={styles.remarkCol}>
                          หมายเหตุ
                        </th>
                      </tr>

                      <tr>
                        <th
                          rowSpan={2}
                          style={{
                            backgroundColor: "#ffc0cb",
                            fontSize: "8px",
                            padding: "2px",
                          }}
                        >
                          G<br />S<br />B
                        </th>
                        <th
                          rowSpan={2}
                          style={{
                            backgroundColor: "#ffe4b5",
                            fontSize: "8px",
                            padding: "2px",
                          }}
                        >
                          PD
                          <br />
                          MO
                        </th>
                        <th
                          rowSpan={2}
                          style={{
                            backgroundColor: "#d6d6ff",
                            fontSize: "8px",
                            padding: "2px",
                          }}
                        >
                          บสส
                        </th>
                        <th
                          rowSpan={2}
                          style={{
                            backgroundColor: "#a8e1ff",
                            fontSize: "8px",
                            padding: "2px",
                          }}
                        >
                          ยสท
                        </th>
                        <th
                          rowSpan={2}
                          style={{
                            backgroundColor: "#c2ffff",
                            fontSize: "8px",
                            padding: "2px",
                          }}
                        >
                          สุรา
                        </th>
                        <th
                          rowSpan={2}
                          style={{
                            backgroundColor: "#b5ffb5",
                            fontSize: "8px",
                            padding: "2px",
                          }}
                        >
                          ไผ่
                        </th>

                        <th
                          colSpan={2}
                          style={{ fontSize: "10px", padding: "2px" }}
                        >
                          หน่วยงาน
                        </th>
                        <th
                          colSpan={2}
                          style={{ fontSize: "10px", padding: "2px" }}
                        >
                          ส่วนบุคคล
                        </th>

                        <th
                          rowSpan={2}
                          style={{
                            backgroundColor: "#843DFF",
                            fontSize: "8px",
                            padding: "2px",
                          }}
                        >
                          กทม.
                        </th>
                        <th
                          rowSpan={2}
                          style={{
                            backgroundColor: "#BEA6FF",
                            fontSize: "8px",
                            padding: "2px",
                          }}
                        >
                          ตจว.
                        </th>

                        <th
                          rowSpan={2}
                          style={{ fontSize: "9px", padding: "2px" }}
                        >
                          ประสาน
                          <br />
                          (ครั้ง)
                        </th>
                        <th
                          colSpan={2}
                          style={{ fontSize: "10px", padding: "2px" }}
                        >
                          สถานะเรื่อง
                        </th>
                      </tr>

                      <tr>
                        <th
                          style={{
                            backgroundColor: "#A5A5A5",
                            fontSize: "8px",
                            padding: "2px",
                          }}
                        >
                          $
                        </th>
                        <th
                          style={{
                            backgroundColor: "#D9D9D9",
                            fontSize: "8px",
                            padding: "2px",
                          }}
                        >
                          No$
                        </th>
                        <th
                          style={{
                            backgroundColor: "#A5A5A5",
                            fontSize: "8px",
                            padding: "2px",
                          }}
                        >
                          $
                        </th>
                        <th
                          style={{
                            backgroundColor: "#D9D9D9",
                            fontSize: "8px",
                            padding: "2px",
                          }}
                        >
                          No$
                        </th>

                        <th
                          style={{
                            backgroundColor: "#FFD86C",
                            fontSize: "9px",
                            padding: "2px",
                          }}
                        >
                          ดำเนินการ
                        </th>
                        <th
                          style={{
                            backgroundColor: "#89DB5D",
                            fontSize: "9px",
                            padding: "2px",
                          }}
                        >
                          ยุติ
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {currentData.length === 0 ? (
                        <tr>
                          <td
                            colSpan="17"
                            style={{ textAlign: "center", py: 4 }}
                          >
                            ไม่มีข้อมูลสำหรับผู้ตรวจที่เลือก
                          </td>
                        </tr>
                      ) : (
                        currentData.map((row) => (
                          <tr key={row.order}>
                            <td style={{ textAlign: "center" }}>{row.order}</td>
                            <td
                              style={{
                                whiteSpace: "pre-line",
                                textAlign: "center",
                              }}
                            >
                              {row.date}
                            </td>
                            <td
                              style={{
                                textAlign: "left",
                                wordWrap: "break-word",
                                overflow: "hidden",
                              }}
                            >
                              {row.subject}
                            </td>

                            {/* หน่วยงาน - แสดงแค่สี ไม่แสดงตัวเลข */}
                            <td
                              style={getCellStyle(row.agencies.gsb, "#ffc0cb")}
                            ></td>
                            <td
                              style={getCellStyle(row.agencies.pdmo, "#ffe4b5")}
                            ></td>
                            <td
                              style={getCellStyle(row.agencies.bss, "#d6d6ff")}
                            ></td>
                            <td
                              style={getCellStyle(row.agencies.yst, "#a8e1ff")}
                            ></td>
                            <td
                              style={getCellStyle(row.agencies.sura, "#c2ffff")}
                            ></td>
                            <td
                              style={getCellStyle(row.agencies.phai, "#b5ffb5")}
                            ></td>

                            {/* ประเภทเรื่อง - แสดงแค่สี ไม่แสดงตัวเลข */}
                            <td
                              style={getCellStyle(
                                row.issueTypes.agencyMoney,
                                "#A5A5A5"
                              )}
                            ></td>
                            <td
                              style={getCellStyle(
                                row.issueTypes.agencyNoMoney,
                                "#D9D9D9"
                              )}
                            ></td>
                            <td
                              style={getCellStyle(
                                row.issueTypes.personalMoney,
                                "#A5A5A5"
                              )}
                            ></td>
                            <td
                              style={getCellStyle(
                                row.issueTypes.personalNoMoney,
                                "#D9D9D9"
                              )}
                            ></td>

                            {/* จังหวัด - กทม. แสดงแค่สี, ตจว. แสดงชื่อย่อจังหวัด */}
                            <td
                              style={getCellStyle(row.provinces.bkk, "#843DFF")}
                            ></td>
                            <td
                              style={getProvinceCellStyle(
                                row.provinces.regional
                              )}
                            >
                              {row.provinces.regional}
                            </td>

                            {/* สถานะ - ประสานแสดงตัวเลข, ดำเนินการแสดงแค่สี, ยุติแสดงข้อความ */}
                            <td
                              style={getTextCellStyle(row.status.coordination)}
                            >
                              {row.status.coordination}
                            </td>
                            <td
                              style={getCellStyle(
                                row.status.ongoing,
                                "#FFD86C"
                              )}
                            ></td>
                            <td
                              style={getTerminatedCellStyle(
                                row.status.terminated
                              )}
                            >
                              {row.status.terminated}
                            </td>

                            <td
                              className={styles.remarkCol}
                              style={{
                                textAlign: "left",
                                wordWrap: "break-word",
                                overflow: "hidden",
                              }}
                            >
                              {row.remark}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* หมายเหตุ Legend */}
                  <Box sx={{ mt: 2, fontSize: "12px" }}>
                    <Box
                      sx={{ display: "flex", gap: 8, alignItems: "flex-start" }}
                    >
                      {/* คอลัมน์ซ้าย */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 1,
                        }}
                      >
                        <Typography
                          sx={{ fontWeight: "bold", color: "#1120A3", mr: 2 }}
                        >
                          หมายเหตุ :
                        </Typography>

                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                width: 15,
                                height: 12,
                                backgroundColor: "#ffc0cb",
                                border: "1px solid #000",
                              }}
                            />
                            <Typography sx={{ fontSize: "11px" }}>
                              ธนาคารออมสิน
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                width: 15,
                                height: 12,
                                backgroundColor: "#ffe4b5",
                                border: "1px solid #000",
                              }}
                            />
                            <Typography sx={{ fontSize: "11px" }}>
                              สำนักงานการพัฒนาเขตพิเศษภาคตะวันออก
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                width: 15,
                                height: 12,
                                backgroundColor: "#d6d6ff",
                                border: "1px solid #000",
                              }}
                            />
                            <Typography sx={{ fontSize: "11px" }}>
                              บริษัท บริการรื่นรมย์สงวนป่า จำกัด
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* คอลัมน์ขวา */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              width: 15,
                              height: 12,
                              backgroundColor: "#a8e1ff",
                              border: "1px solid #000",
                            }}
                          />
                          <Typography sx={{ fontSize: "11px" }}>
                            การยางแห่งประเทศไทย
                          </Typography>
                        </Box>

                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              width: 15,
                              height: 12,
                              backgroundColor: "#c2ffff",
                              border: "1px solid #000",
                            }}
                          />
                          <Typography sx={{ fontSize: "11px" }}>
                            สรรพสุรา
                          </Typography>
                        </Box>

                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              width: 15,
                              height: 12,
                              backgroundColor: "#b5ffb5",
                              border: "1px solid #000",
                            }}
                          />
                          <Typography sx={{ fontSize: "11px" }}>
                            โรงงานไผ่
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}
            </div>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default InspectorComplaintManagementComponents;
