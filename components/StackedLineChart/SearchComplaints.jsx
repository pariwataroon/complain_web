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
    label: "ติดตามผลการดำเนินการ",
    icon: (
      <img
        src="/icons/Cube.png"
        alt="cube"
        style={{ width: 24, height: 24, marginBottom: -8 }}
      />
    ),
  },
];

// Mock header info
const mockHeader = {
  responsibleOfficer: "นายเป็นสุข เป็นสุขเถิด",
  complainantName: "กิติศักดิ์ รัตนเกษม",
};

// 2. Sections array with status + matching header/row keys
const sections = [
  {
    status: STATUS.RECEIVED,
    title: "รับเรื่องราวร้องทุกข์",
    headers: [
      "ลำดับ",
      "เลข สรร.",
      "เลขที่อ้างอิง(เลขสรร.สารบัญ)",
      "หน่วยงาน",
      "เรื่อง",
      "ประเภทเรื่อง",
      "การจัดการ",
    ],
    rows: [
      {
        ลำดับ: 1,
        หน่วยงาน: "กรมการกำกับ",
        "เลข สรร.": "97/68",
        "เลขที่อ้างอิง(เลขสรร.สารบัญ)": "02/68",
        เรื่อง: "พฤติกรรมเจ้าหน้าที่ไม่เหมาะสม",
        ประเภทเรื่อง: "พฤติกรรมเจ้าหน้าที่",
      },
      {
        ลำดับ: 2,
        หน่วยงาน: "กรมการกำกับ",
        "เลข สรร.": "02/68",
        "เลขที่อ้างอิง(เลขสรร.สารบัญ)": "-",
        เรื่อง: "พฤติกรรมเจ้าหน้าที่ไม่เหมาะสม",
        ประเภทเรื่อง: "พฤติกรรมเจ้าหน้าที่",
      },
    ],
  },
  {
    status: STATUS.FORWARDED,
    title: "ส่งหน่วยงานที่เกี่ยวข้อง",
    headers: [
      "ลำดับ",
      "เลขที่หนังสือ",
      "หน่วยงาน(ครั้งที่ส่ง)",
      "เรื่อง",
      "ลงวันที่",
      "ผู้ลงนาม",
      "การจัดการ",
    ],
    rows: [
      {
        ลำดับ: 1,
        "หน่วยงาน(ครั้งที่ส่ง)": "กรมสรรพากร(1)",
        เรื่อง: "พฤติกรรมเจ้าหน้าที่ไม่เหมาะสม",
        เลขที่หนังสือ: "กค.0203/16200",
        ลงวันที่: "10 ก.พ. 2568",
        ผู้ลงนาม: "นางปวีณา ใจทรงธรรม",
      },
    ],
  },
  {
    status: STATUS.INITIAL_NOTIFY,
    title: "แจ้งผู้ร้องเรียนส่วนราชการที่ส่งเรื่องมากระทรวงทราบเบื้องต้น",
    headers: [
      "ลำดับ",
      "เลขที่หนังสือ",
      "หน่วยงานหรือผู้ร้อง(ครั้งที่ส่ง)",
      "ลงวันที่",
      "เรื่อง",
      "ผู้ลงนาม",
      "การจัดการ",
    ],
    rows: [
      {
        ลำดับ: 1,
        "หน่วยงานหรือผู้ร้อง(ครั้งที่ส่ง)": "สำนักงานปลัดสำนักนายกรัฐมนตรี(1)",
        เลขที่หนังสือ: "กค.0203/416202",
        ลงวันที่: "10 มี.ค. 2568",
        เรื่อง: "เสนอผลการดำเนินการ",
        ผู้ลงนาม: "ผอ.สป.",
      },
      {
        ลำดับ: 2,
        "หน่วยงานหรือผู้ร้อง(ครั้งที่ส่ง)": "นางสนิท หวันหาญ(1)",
        เลขที่หนังสือ: "กค.0203/416202",
        ลงวันที่: "10 มี.ค. 2568",
        เรื่อง: "เสนอผลการดำเนินการ",
        ผู้ลงนาม: "ผอ.สป.",
      },
    ],
  },
  {
    status: STATUS.REQUEST_UPDATE,
    title: "ขอทราบผลการพิจารณา / ผลความคืบหน้า",
    headers: [
      "ลำดับ",
      "เลขที่หนังสือ",
      "ส่งหน่วยงาน(ครั้งที่ส่ง)",
      "เรื่อง",
      "ลงวันที่",
      "ผู้ลงนาม",
      "การจัดการ",
    ],
    rows: [
      {
        ลำดับ: 1,
        "ส่งหน่วยงาน(ครั้งที่ส่ง)": "กรมสรรพากร(1)",
        เรื่อง: "ขอความเห็นการพิจารณา",
        เลขที่หนังสือ: "กค.1059/2104",
        ลงวันที่: "13 มี.ค. 2568",
        ผู้ลงนาม: "ผอ.สป.",
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
      "การจัดการ",
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
      },
    ],
  },
  {
    status: STATUS.FINAL_NOTIFY,
    title: "แจ้งผลการให้ผู้เกี่ยวข้องทราบ",
    headers: [
      "ลำดับ",
      "เลขที่หนังสือ",
      "ถึงหน่วยงาน / ผู้ร้อง / อื่นๆ (ครั้งที่แจ้งผล)",
      "เรื่อง",
      "ลงวันที่",
      "การจัดการ",
    ],
    rows: [
      {
        ลำดับ: 1,
        "ถึงหน่วยงาน / ผู้ร้อง / อื่นๆ (ครั้งที่แจ้งผล)": "กรมสรรพากร(1)",
        เลขที่หนังสือ: "กค.1302/3513",
        เรื่อง: "รายงานผลการพิจารณา",
        ลงวันที่: "18 มี.ค. 2568",
      },
    ],
  },
];

const SearchComplaints = () => {
  const { id } = useRouter().query;

  const firstPhases = sections.filter((s) => s.status < STATUS.FINAL_NOTIFY);
  const finalPhase = sections.find((s) => s.status === STATUS.FINAL_NOTIFY);

  const router = useRouter();

  // map each status to its target path
  const sectionPaths = {
    [STATUS.FORWARDED]: "/admin/edit/forward-to-agency",
    [STATUS.INITIAL_NOTIFY]:
      "/admin/edit/initial-notification-to-complainant-or-agency",
    [STATUS.REQUEST_UPDATE]: "/admin/edit/request-result-or-progress",
    [STATUS.AGENCY_REPORT]: "/admin/edit/inform-related-parties",
    [STATUS.FINAL_NOTIFY]: "/admin/edit/inform-related-parties",
  };

  return (
    <Box sx={{ overflowX: "auto", p: 2 }}>
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
        {" "}
        <Typography variant="h5" fontWeight="bold" color="#1120A3">
          ติดตามผลการดำเนินการ
        </Typography>{" "}
      </Box>
      {/* Info rows */}
      <Box sx={{ background: "#EDF7EA", py: 2, px: 3 }}>
        เจ้าหน้าที่ผู้รับผิดชอบ: {mockHeader.responsibleOfficer}
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
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: 3,
              background: "#EAF5FF",
              py: 1,
            }}
          >
            <Typography sx={{ fontWeight: "bold", color: "#1120A3" }}>
              {section.title}
            </Typography>
            {section.status !== STATUS.AGENCY_REPORT &&
              section.status !== STATUS.RECEIVED && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    mt: 1,
                    mr: { xs: 2, sm: 3, md: 5 },
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() =>
                      router.push(sectionPaths[section.status] || "/")
                    }
                  >
                    <img
                      src="/icons/Add.png"
                      alt="add"
                      style={{ width: 24, height: 24, cursor: "pointer" }}
                    />
                  </IconButton>
                </Box>
              )}
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
                      {h === "การจัดการ" ? (
                        <img
                          src="/icons/writeblue.png"
                          alt="edit"
                          style={{ width: 24, height: 24, cursor: "pointer" }}
                        />
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
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: 3,
              background: "#FEFAEF",
              py: 1,
            }}
          >
            <Typography sx={{ fontWeight: "bold", color: "#1120A3" }}>
              {finalPhase.title}
            </Typography>
            <IconButton
              size="small"
              onClick={() =>
                router.push(sectionPaths[finalPhase.status] || "/")
              }
            >
              <img
                src="/icons/Add.png"
                alt="add"
                style={{ width: 24, height: 24, cursor: "pointer" }}
              />
            </IconButton>
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
                      {h === "การจัดการ" ? (
                        <img
                          src="/icons/writeblue.png"
                          alt="edit"
                          style={{ width: 24, height: 24, cursor: "pointer" }}
                        />
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

export default SearchComplaints;
