import React from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
} from "@mui/material";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import FolderIcon from "@mui/icons-material/Folder";

// 1. Define English-status constants
const STATUS = {
  RECEIVED: 1, // รับเรื่องราวร้องทุกข์
  FORWARDED: 2, // ส่งหน่วยงานที่เกี่ยวข้อง
  INITIAL_NOTIFY: 3, // แจ้งผู้ร้องเรียน / ส่วนราชการที่ส่งเรื่องมากระทรวงทราบเบื้องต้น
  REQUEST_UPDATE: 4, // ขอทราบผลการพิจารณา / ผลความคืบหน้า
  AGENCY_REPORT: 5, // หนังสือแจ้งผลการพิจารณาหน่วยงาน
  FINAL_NOTIFY: 6, // แจ้งผลการให้ผู้เกี่ยวข้องทราบ
};

// Breadcrumb items
const breadcrumbItems = [
  {
    label: "เมนูคลังเอกสาร",
    icon: <Inventory2Icon sx={{ width: 24, height: 24, mb: -1 }} />,
    url: "/admin/box/list",
  },
  { label: "คลังเรื่องราวร้องทุกข์" },
];

// ฟังก์ชันแปลงสถานะอังกฤษเป็นไทย
const getThaiStatus = (englishStatus) => {
  const statusMap = {
    pending: "อยู่ระหว่างการแจ้งผล",
    waiting: "รอหน่วยงานตอบกลับ",
    stop: "ยุติ",
    received: "รับเรื่องแล้ว",
    investigating: "กำลังตรวจสอบ",
    processing: "กำลังดำเนินการ",
    awaiting_info: "รอข้อมูลเพิ่มเติม",
    forwarded: "ส่งต่อหน่วยงาน",
    completed: "ดำเนินการเสร็จสิ้น",
  };
  return statusMap[englishStatus] || englishStatus;
};

// แก้ไข: ใช้ PDF จาก W3Schools
const handleOpenDocument = (documentName) => {
  // ใช้ PDF sample จาก W3Schools
  const w3schoolsPDF =
    "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

  // เปิด PDF ในแท็บใหม่
  window.open(w3schoolsPDF, "_blank");
};

// ฟังก์ชันดักสถานะจาก query parameters
const getStatusFromQuery = (query) => {
  // console.log("🔍 Full query object:", query); // Debug log

  // ตรวจสอบ query parameters ทั้งหมดเพื่อหาสถานะ
  const statusKeys = [
    "waiting",
    "pending",
    "stop",
    "received",
    "investigating",
    "processing",
    "awaiting_info",
    "forwarded",
    "completed",
  ];

  for (const status of statusKeys) {
    if (query.hasOwnProperty(status)) {
      // console.log(`✅ Found status in query: ${status}`); // Debug log
      return status;
    }
  }

  // ถ้าไม่เจอสถานะใน query parameters ให้ใช้ค่าเริ่มต้น
  // console.log("❌ No status found in query, using default: received"); // Debug log
  return "received";
};

const getIconForStatus = (englishStatus) => {
  // console.log("🎯 Getting icon for status:", englishStatus); // Debug log

  // เฉพาะสถานะที่ยังรอการดำเนินการเท่านั้นที่ใช้ folder icon
  const pendingStatuses = ["pending", "waiting"];

  if (pendingStatuses.includes(englishStatus)) {
    // console.log("📁 Using Folder icon for:", englishStatus); // Debug log
    return <FolderIcon sx={{ color: "#1223A5", fontSize: 24 }} />; // ✅ pending, waiting ใช้ Folder icon สี #1223A5
  } else {
    // console.log("✏️ Using Edit icon for:", englishStatus); // Debug log
    // สถานะอื่น ๆ รวมทั้ง "stop" ใช้ Edit icon สี #1223A5
    return (
      <img
        src="/icons/Edit.png"
        alt="Edit"
        style={{
          width: 35,
          height: 35,
          // CSS filter ที่แปลงสีรูปภาพเป็น #1223A5 (สีน้ำเงินเข้ม)
          filter:
            "brightness(0) saturate(100%) invert(9%) sepia(89%) saturate(7495%) hue-rotate(230deg) brightness(94%) contrast(106%)",
        }}
      />
    );
  }
};

// 2. Sections array with status + matching header/row keys
const sections = [
  {
    status: STATUS.RECEIVED,
    title: "รับเรื่องราวร้องทุกข์",
    headers: [
      "ลำดับ",
      "หน่วยงาน",
      "เลข สรร.",
      "เลขที่อ้างอิง(เลขสรร.สารบัญ)",
      "เรื่อง",
      "ประเภทเรื่อง",
      "เอกสารแนบ",
    ],
    rows: [
      {
        ลำดับ: 1,
        หน่วยงาน: "กรมการกำกับ",
        "เลข สรร.": "97/68",
        "เลขที่อ้างอิง(เลขสรร.สารบัญ)": "02/68",
        เรื่อง: "พฤติกรรมเจ้าหน้าที่ไม่เหมาะสม",
        ประเภทเรื่อง: "พฤติกรรมเจ้าหน้าที่",
        เอกสารแนบ: "หนังสือรับเรื่อง",
      },
      {
        ลำดับ: 2,
        หน่วยงาน: "กรมการกำกับ",
        "เลข สรร.": "02/68",
        "เลขที่อ้างอิง(เลขสรร.สารบัญ)": "-",
        เรื่อง: "พฤติกรรมเจ้าหน้าที่ไม่เหมาะสม",
        ประเภทเรื่อง: "พฤติกรรมเจ้าหน้าที่",
        เอกสารแนบ: "หนังสือรับเรื่อง",
      },
    ],
  },
  {
    status: STATUS.FORWARDED,
    title: "ส่งหน่วยงานที่เกี่ยวข้อง",
    headers: [
      "ลำดับ",
      "หน่วยงาน(ครั้งที่ส่ง)",
      "เรื่อง",
      "เลขที่หนังสือ",
      "ลงวันที่",
      "ผู้ลงนาม",
      "เอกสารแนบ",
    ],
    rows: [
      {
        ลำดับ: 1,
        "หน่วยงาน(ครั้งที่ส่ง)": "กรมสรรพากร(1)",
        เรื่อง: "พฤติกรรมเจ้าหน้าที่ไม่เหมาะสม",
        เลขที่หนังสือ: "กค.0203/16200",
        ลงวันที่: "10 ก.พ. 2568",
        ผู้ลงนาม: "นางปวีณา ใจทรงธรรม",
        เอกสารแนบ: "หนังสือส่งต่อ",
      },
    ],
  },
  {
    status: STATUS.INITIAL_NOTIFY,
    title: "แจ้งผู้ร้องเรียนส่วนราชการที่ส่งเรื่องมากระทรวงทราบเบื้องต้น",
    headers: [
      "ลำดับ",
      "หน่วยงานหรือผู้ร้อง(ครั้งที่ส่ง)",
      "เลขที่หนังสือ",
      "ลงวันที่",
      "เรื่อง",
      "ผู้ลงนาม",
      "เอกสารแนบ",
    ],
    rows: [
      {
        ลำดับ: 1,
        "หน่วยงานหรือผู้ร้อง(ครั้งที่ส่ง)": "สำนักงานปลัดสำนักนายกรัฐมนตรี(1)",
        เลขที่หนังสือ: "กค.0203/416202",
        ลงวันที่: "10 มี.ค. 2568",
        เรื่อง: "เสนอผลการดำเนินการ",
        ผู้ลงนาม: "ผอ.สป.",
        เอกสารแนบ: "หนังสือแจ้งผล",
      },
      {
        ลำดับ: 2,
        "หน่วยงานหรือผู้ร้อง(ครั้งที่ส่ง)": "นางสนิท หวันหาญ(1)",
        เลขที่หนังสือ: "กค.0203/416202",
        ลงวันที่: "10 มี.ค. 2568",
        เรื่อง: "เสนอผลการดำเนินการ",
        ผู้ลงนาม: "ผอ.สป.",
        เอกสารแนบ: "หนังสือแจ้งผล",
      },
    ],
  },
  {
    status: STATUS.REQUEST_UPDATE,
    title: "ขอทราบผลการพิจารณา / ผลความคืบหน้า",
    headers: [
      "ลำดับ",
      "ส่งหน่วยงาน(ครั้งที่ส่ง)",
      "เรื่อง",
      "เลขที่หนังสือ",
      "ลงวันที่",
      "ผู้ลงนาม",
      "เอกสารแนบ",
    ],
    rows: [
      {
        ลำดับ: 1,
        "ส่งหน่วยงาน(ครั้งที่ส่ง)": "กรมสรรพากร(1)",
        เรื่อง: "ขอความเห็นการพิจารณา",
        เลขที่หนังสือ: "กค.1059/2104",
        ลงวันที่: "13 มี.ค. 2568",
        ผู้ลงนาม: "ผอ.สป.",
        เอกสารแนบ: "หนังสือส่งต่อ",
      },
    ],
  },
  {
    status: STATUS.AGENCY_REPORT,
    title: "หนังสือแจ้งผลพิจารณาหน่วยงาน",
    headers: [
      "ลำดับ",
      "เลขที่หนังสือ",
      "ลงวันที่",
      "เรื่อง",
      "วันรับงาน",
      "วันที่เสนองาน",
      "หน่วยงาน",
      "เอกสารแนบ",
    ],
    rows: [
      {
        ลำดับ: 1,
        เลขที่หนังสือ: "กค.1006/3574",
        ลงวันที่: "15 มี.ค. 2568",
        เรื่อง: "เสนอผลการตรวจสอบและรายงานผล",
        วันรับงาน: "31 ม.ค. 2568",
        วันที่เสนองาน: "18 มี.ค. 2568",
        หน่วยงาน: "กรมการกำกับ",
        เอกสารแนบ: "รายงานการตรวจสอบ",
      },
    ],
  },
  {
    status: STATUS.FINAL_NOTIFY,
    title: "แจ้งผลการให้ผู้เกี่ยวข้องทราบ",
    headers: [
      "ลำดับ",
      "ถึงหน่วยงาน / ผู้ร้อง / อื่นๆ (ครั้งที่แจ้งผล)",
      "เลขที่หนังสือ",
      "เรื่อง",
      "ลงวันที่",
      "เอกสารแนบ",
    ],
    rows: [
      {
        ลำดับ: 1,
        "ถึงหน่วยงาน / ผู้ร้อง / อื่นๆ (ครั้งที่แจ้งผล)": "กรมสรรพากร(1)",
        เลขที่หนังสือ: "กค.1302/3513",
        เรื่อง: "รายงานผลการพิจารณา",
        ลงวันที่: "18 มี.ค. 2568",
        เอกสารแนบ: "หนังสือตอบกลับ",
      },
    ],
  },
];

const FollowComp = () => {
  const router = useRouter();
  // console.log("🌐 Router query:", router.query); // Debug log

  // ดักสถานะจาก query parameters
  const englishStatus = getStatusFromQuery(router.query);
  const id = router.query.id || "unknown";

  // console.log("🆔 ID:", id);
  // console.log("📊 Detected Status:", englishStatus);

  // Mock header info - ใช้สถานะที่ดักได้จาก query และแปลงเป็นไทย
  const mockHeader = {
    responsibleOfficer: "นายเป็นสุข เป็นสุขเถิด",
    complainantName: "กิติศักดิ์ รัตนเกษม",
    status: getThaiStatus(englishStatus), // แปลงเป็นไทยเพื่อแสดงผล
    englishStatus: englishStatus, // เก็บสถานะอังกฤษไว้ใช้กับ icon
  };

  // console.log("📋 Mock Header:", mockHeader); // Debug log

  const firstPhases = sections.filter((s) => s.status < STATUS.FINAL_NOTIFY);
  const finalPhase = sections.find((s) => s.status === STATUS.FINAL_NOTIFY);

  return (
    <Box>
      <BreadcrumbsService items={breadcrumbItems} />

      {/* Top gradient bar */}
      <Box
        sx={{
          background: "linear-gradient(to right, #1223a5, #2499ff)",
          height: 50,
          borderTopRightRadius: "12px",
          px: 3,
          display: "flex",
          alignItems: "center",
        }}
      ></Box>
      <Box sx={{ background: "#fff", py: 2, px: 3 }}>
        <Typography variant="h5" fontWeight="bold" color="#1120A3">
          ติดตามผลการดำเนินการ
        </Typography>
      </Box>

      {/* Info rows */}
      {/* แก้ไข: ใช้ icon ตามสถานะภาษาอังกฤษ */}
      <Box
        sx={{
          background: "#EDF7EA",
          py: 2,
          px: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>เจ้าหน้าที่ผู้รับผิดชอบ: {mockHeader.responsibleOfficer}</span>
        <IconButton
          size="small"
          onClick={() => handleOpenDocument("เอกสารเจ้าหน้าที่")}
          sx={{
            color: "#1976d2",
            "&:hover": {
              backgroundColor: "rgba(25, 118, 210, 0.04)",
            },
          }}
        >
          {getIconForStatus(mockHeader.englishStatus)}
        </IconButton>
      </Box>

      <Box sx={{ background: "#FBEAE9", py: 2, px: 3 }}>
        ชื่อผู้ร้อง: {mockHeader.complainantName}
      </Box>
      <Box sx={{ background: "#91CBFF", py: 2, px: 3 }}>
        ขั้นตอนดำเนินการครั้งแรก
      </Box>

      {/* First 5 dynamic sections */}
      {firstPhases.map((section) => (
        <Box
          key={section.status}
          sx={{ border: "1px solid #E0E0E0", borderRadius: 1 }}
        >
          <Box
            sx={{
              px: 3,
              background: "#EAF5FF",
              py: 1,
            }}
          >
            <Typography sx={{ fontWeight: "bold", color: "#1120A3" }}>
              {section.title}
            </Typography>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                {section.headers.map((h) => (
                  <TableCell
                    key={h}
                    sx={{ background: "#fff", fontWeight: "bold" }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {section.rows.map((row, idx) => (
                <TableRow key={idx}>
                  {section.headers.map((h) => (
                    <TableCell key={h}>
                      {h === "เอกสารแนบ" ? (
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDocument(row[h])}
                          sx={{
                            color: "#1976d2",
                            "&:hover": {
                              backgroundColor: "rgba(25, 118, 210, 0.04)",
                            },
                          }}
                        >
                          {getIconForStatus(mockHeader.englishStatus)}
                        </IconButton>
                      ) : (
                        row[h] ?? "-"
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      ))}

      {/* Yellow in-progress bar */}
      <Box sx={{ background: "#FFF9C4", py: 2, px: 3, borderRadius: 1 }}>
        ขั้นตอนอยู่ระหว่างดำเนินการ
      </Box>

      {/* Final (status 6) section */}
      {finalPhase && (
        <Box sx={{ border: "1px solid #E0E0E0", borderRadius: 1 }}>
          <Box
            sx={{
              px: 3,
              background: "#FEFAEF",
              py: 1,
            }}
          >
            <Typography sx={{ fontWeight: "bold", color: "#1120A3" }}>
              {finalPhase.title}
            </Typography>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                {finalPhase.headers.map((h) => (
                  <TableCell
                    key={h}
                    sx={{ background: "#E3F2FD", fontWeight: "bold" }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {finalPhase.rows.map((row, idx) => (
                <TableRow key={idx}>
                  {finalPhase.headers.map((h) => (
                    <TableCell key={h}>
                      {h === "เอกสารแนบ" ? (
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDocument(row[h])}
                          sx={{
                            color: "#1976d2",
                            "&:hover": {
                              backgroundColor: "rgba(25, 118, 210, 0.04)",
                            },
                          }}
                        >
                          {getIconForStatus(mockHeader.englishStatus)}
                        </IconButton>
                      ) : (
                        row[h] ?? "-"
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default FollowComp;
