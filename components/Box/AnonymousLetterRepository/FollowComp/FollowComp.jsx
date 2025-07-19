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
  Stack,
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

  const handleManage = (sectionKey, id, router) => {
  if (!id) {
    console.error("Error: complaintId is undefined or null");
    // แสดงข้อความหรือทำอะไรสักอย่างเมื่อไม่มี id
    return;  // หยุดการทำงานหาก id ไม่มีค่า
  }

  switch (sectionKey) {
    case "RECEIVED":
      router.push(`/admin/edit/website-complaints/${id}`);
      break;
    case "FORWARDED":
      router.push(`/admin/edit/forward-to-agency/${id}`);
      break;
    case "INITIAL_NOTIFY":
      router.push(`/admin/edit/initial-notification-to-complainant-or-agency/${id}`);
      break;
    case "REQUEST_UPDATE":
      router.push(`/admin/edit/request-result-or-progress/${id}`);
      break;
    case "AGENCY_REPORT":
      router.push(`/admin/edit/report/${id}`);
      break;
    case "FINAL_NOTIFY":
      router.push(`/admin/edit/inform-related-parties/${id}`);
      break;
    default:
      break;
  }
};

// Breadcrumb items
const breadcrumbItems = [
  {
    label: "เมนูคลังเอกสาร",
    icon: <Inventory2Icon sx={{ width: 24, height: 24, mb: -1 }} />,
  },
  { label: "คลังบัตรสนเท่ห์" },
];

// Mock header info
const mockHeader = {
  responsibleOfficer: "นายเป็นสุข เป็นสุขเถิด",
  complainantName: "กิติศักดิ์ รัตนเกษม",
};

// แก้ไข: ใช้ PDF จาก W3Schools
const handleOpenDocument = (documentName) => {
  // ใช้ PDF sample จาก W3Schools
  const w3schoolsPDF =
    "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

  // เปิด PDF ในแท็บใหม่
  window.open(w3schoolsPDF, "_blank");
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
      "การจัดการ",
    ],
    rows: [
      {
        id: "6a5f18be-017f-4c10-9b2b-20d05c00d33e",
        ลำดับ: 1,
        หน่วยงาน: "กรมการกำกับ",
        "เลข สรร.": "97/68",
        "เลขที่อ้างอิง(เลขสรร.สารบัญ)": "02/68",
        เรื่อง: "พฤติกรรมเจ้าหน้าที่ไม่เหมาะสม",
        ประเภทเรื่อง: "พฤติกรรมเจ้าหน้าที่",
        เอกสารแนบ: "หนังสือรับเรื่อง",
      },
      {
        id: "6a5f18be-017f-4c10-9b2b-20d05c00d33e",
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
      "การจัดการ",
    ],
    rows: [
      {
        id: "6a5f18be-017f-4c10-9b2b-20d05c00d33e",
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
      "การจัดการ",
    ],
    rows: [
      {
        id: "1",
        ลำดับ: 1,
        "หน่วยงานหรือผู้ร้อง(ครั้งที่ส่ง)": "สำนักงานปลัดสำนักนายกรัฐมนตรี(1)",
        เลขที่หนังสือ: "กค.0203/416202",
        ลงวันที่: "10 มี.ค. 2568",
        เรื่อง: "เสนอผลการดำเนินการ",
        ผู้ลงนาม: "ผอ.สป.",
        เอกสารแนบ: "หนังสือแจ้งผล",
      },
      {
        id: "2",
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
      "การจัดการ",
    ],
    rows: [
      {
        id: "1",
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
      "การจัดการ",
    ],
    rows: [
      {
        id: "1",
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
      "การจัดการ",
    ],
    rows: [
      {
        id: "1",
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

  const { id } = useRouter().query;

  const handleImageClick = () => {
    router.push("/complaint/");
  };

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
      {/* แก้ไข: เพิ่มไอคอนโฟลเดอร์ข้างเจ้าหน้าที่ */}
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
          <FolderIcon />
        </IconButton>
      </Box>

      <Box sx={{ background: "#FBEAE9", py: 2, px: 3 }}>
        ชื่อผู้ร้อง: {mockHeader.complainantName}
      </Box>
      <Box sx={{ background: "#91CBFF", py: 2, px: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h6" sx={{ color: "#000" }}>
            ขั้นตอนดำเนินการครั้งแรก
          </Typography>
          <img
            src="/icons/Add.png"
            alt="Add"
            style={{
              width: "24px",
              height: "24px",
              cursor: "pointer",
              marginLeft: "auto",
            }}
            onClick={handleImageClick} 
          />
        </Stack>
      </Box>

       {/* First 5 dynamic sections */}
      {sections
        .filter((section) => section.status !== "FINAL_NOTIFY")
        .map((section) => (
          <Box
            key={section.status}
            sx={{ border: "1px solid #E0E0E0", borderRadius: 1, mb: 2 }}>
            <Box
              sx={{
                px: 3,
                background: "#EAF5FF",
                py: 1,
              }}>
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
                    {section.headers.map((h) => {
                      if (h === "เอกสารแนบ") {
                        return (
                          <TableCell key={h} align="center">
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleOpenDocument(row["เอกสารแนบ"])
                              }
                              sx={{
                                color: "#1976d2",
                                "&:hover": {
                                  backgroundColor: "rgba(25, 118, 210, 0.04)",
                                },
                              }}
                            >
                              <FolderIcon
                                sx={{ color: "#1223A5", fontSize: 24 }}
                              />
                            </IconButton>
                          </TableCell>
                        );
                      } else if (h === "การจัดการ") {
                        return (
                          <TableCell key={h} align="center">
                            <IconButton
                              size="small"
                              onClick={() => {
                                
                                if (row.id) {
                                  console.log("Going to edit with id:", row.id);
                                  handleManage(section.key, row.id, router); // ใช้ handleManage สำหรับกรณีนี้
                                  } else {
                                  console.error("Error: ID is missing for this row.");
                                  // แสดงข้อความแจ้งเตือนหรือทำอะไรที่ต้องการ
                                }
                              }}
                              sx={{
                                color: "#1976d2",
                                "&:hover": {
                                  backgroundColor: "rgba(25, 118, 210, 0.04)",
                                },
                              }}
                            >
                              <img
                                src="/icons/Edit.png"
                                alt="Edit"
                                style={{
                                  width: 35,
                                  height: 35,
                                  filter:
                                    "brightness(0) saturate(100%) invert(9%) sepia(89%) saturate(7495%) hue-rotate(230deg) brightness(94%) contrast(106%)",
                                }}
                              />
                            </IconButton>
                          </TableCell>
                        );
                      } else {
                        return <TableCell key={h}>{row[h] ?? "-"}</TableCell>;
                      }
                    })}
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
                          <FolderIcon />
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
