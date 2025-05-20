import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import styles from "./ReportTable.module.scss";

const data = [
  {
    order: 1,
    date: "1422/67\n29 พ.ย. 2567",
    subject: "ขอให้แก้ไขปัญหาในโครงการก้านไม้เขียว (นายประยูรชา)",
    province: { BKK: "", PROV: "สค.", COORD: "1" },
    remark: "(PM) มีที่ประชุมเสนอขอให้สามารถเติมน้ำมันเขียวในถังได้...",
  },
  {
    order: 2,
    date: "1435/67\n2 ธ.ค. 2567",
    subject: "ขอให้พิจารณาซ่อมถนนในหมู่บ้านที่ประสบอุทกภัย ปี 67 (นายชัยพร)",
    province: { BKK: "", PROV: "", COORD: "1" },
    remark: "ตรวจสอบแล้ว GSB แจ้งว่าคุณสมบัติไม่ผ่านตามเกณฑ์...",
  },
  {
    order: 3,
    date: "1525/67\n20 ธ.ค. 2567",
    subject: "ขอความช่วยเหลือแก้ไขปัญหาหนี้สิน... (นายประหยัด ฯลฯ)",
    province: { BKK: "", PROV: "", COORD: "1" },
    remark: "(PM) GSB และผู้ร้องได้พบกันแล้ว GSB ให้ส่งรวบรวมเอกสาร...",
  },
];

const InspectorComplaintManagementComponents = () => {
  const [selectedInspector, setSelectedInspector] = useState("");

  // สเตตเก็บตัวเลือกผู้ตรวจ (อาจจะดึงจาก API ก็ได้)
  const [inspectorOptions, setInspectorOptions] = useState([
    { value: "", label: "กรุณาเลือกผู้ตรวจ", disabled: true },
    { value: "inspector1", label: "นายสมชาย ใจดี" },
    { value: "inspector2", label: "นางสาวอรทัย แซ่ลิ้ม" },
    { value: "inspector3", label: "นายวิทยา ศรีสุข" },
    // ... เพิ่มตามจริง
  ]);

  // handler จะได้รับ object { target: { name, value } }
  const handleInspectorChange = ({ target: { name, value } }) => {
    setSelectedInspector(value);
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
            { label: "รายงานผลการจัดการเรื่องร้องเรียนของผู้ตรวจ" },
          ]}
        />
      </Box>
      <Box
        sx={{
          background: "linear-gradient(to right, #1223a5, #2499ff)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          height: "50px",
          borderTopRightRadius: "12px",
          padding: "0 24px",
        }}
      />
      <Box
        sx={{
          background: "#fff", // หรือกำหนดพื้นหลังตามต้องการ
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",

          p: 2, // padding 16px
        }}
      >
        <Box p={5}>
          <Typography
            sx={{
              color: "#1120A3",
              fontSize: "20px",
              fontWeight: "bold",
              lineHeight: 1.2, // ปรับระยะบรรทัดถ้าจำเป็น
            }}
          >
            รายงานผลการจัดการเรื่องร้องเรียนของผู้ตรวจ
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            mb: 2, // หรือปรับ margin-bottom ตามต้องการ
          }}
        >
          {/* ซ้าย: ช่องเลือกผู้ตรวจ */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              minWidth: "300px",
              maxWidth: "500px",
            }}
          >
            <SelectField
              label="รายชื่อผู้ตรวจ"
              name="inspector"
              value={selectedInspector}
              onChange={handleInspectorChange}
              externalOptions={inspectorOptions}
              optionMapper={(opt) => opt}
            />
          </Box>

          {/* ขวา: ปุ่ม Export */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <ExportButton label="Export PDF" />
            <ExportButton label="Export Excel" />
          </Box>
        </Box>

        <Box className={styles.container}>
          <table className={styles.table}>
            {/* กำหนดความกว้างคอลัมน์ด้วย colgroup: 18 คอลัมน์แรก ปกติ / คอลัมน์หมายเหตุ 400px */}
            <colgroup>
              {/* 1: ลำดับ, 2: วันที่, 3: เรื่อง */}
              <col style={{ width: "15px" }} />
              <col style={{ width: "40px" }} />
              <col style={{ width: "150px" }} />

              {/* 4–9: หน่วยงาน (6 คอลัมน์ @60px) */}
              <col span="6" style={{ width: "16px" }} />

              {/* 10–13: ประเภทเรื่อง (4 คอลัมน์ @60px) */}
              <col span="4" style={{ width: "16px" }} />

              {/* 14–15: จังหวัด (2 คอลัมน์ @30px เล็กลง) */}
              <col span="2" style={{ width: "15px" }} />

              {/* 16–18: สถานะ (3 คอลัมน์ @50px) */}
              <col span="3" style={{ width: "20px" }} />

              {/* 19: หมายเหตุ */}
              <col style={{ width: "150px" }} />
            </colgroup>

            <thead>
              {/* Row 1: กลุ่มหลัก */}
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

                {/* หน่วยงาน */}
                <th colSpan={6} className={styles.unitHeader}>
                  หน่วยงาน
                </th>
                {/* ประเภทเรื่อง */}
                <th colSpan={4} className={styles.typeHeader}>
                  ประเภทเรื่อง
                </th>
                {/* จังหวัด */}
                <th colSpan={2} className={styles.provinceHeader}>
                  จังหวัด
                </th>
                {/* สถานะ */}
                <th colSpan={3} className={styles.statusHeader}>
                  สถานะ
                </th>

                <th rowSpan={3} className={styles.remarkCol}>
                  หมายเหตุ
                </th>
              </tr>

              {/* Row 2: Leaf ของหน่วยงาน + subgroup ของ ประเภทเรื่อง + province leaves + กลางของสถานะ */}
              <tr>
                {/* หน่วยงาน (rowSpan=2) */}
                <th rowSpan={2} style={{ backgroundColor: "#ffc0cb" }}>
                  GSB
                </th>
                <th rowSpan={2} style={{ backgroundColor: "#ffe4b5" }}>
                  PD
                  <br />
                  MO
                </th>
                <th rowSpan={2} style={{ backgroundColor: "#d6d6ff" }}>
                  บสส
                </th>
                <th rowSpan={2} style={{ backgroundColor: "#a8e1ff" }}>
                  ยสท
                </th>
                <th rowSpan={2} style={{ backgroundColor: "#c2ffff" }}>
                  สุรา
                </th>
                <th rowSpan={2} style={{ backgroundColor: "#b5ffb5" }}>
                  ไผ่
                </th>

                {/* ประเภทเรื่อง: subgroup headers */}
                <th colSpan={2}>หน่วยงาน</th>
                <th colSpan={2}>ส่วนบุคคล</th>

                {/* จังหวัด (rowSpan=2) */}
                <th rowSpan={2} style={{ backgroundColor: "#843DFF" }}>
                  กทม.
                </th>
                <th rowSpan={2} style={{ backgroundColor: "#BEA6FF" }}>
                  ตวจ.
                </th>

                {/* สถานะ: ประสาน (rowSpan=2) + สถานะเรื่อง (colSpan=2) */}
                <th rowSpan={2}>
                  ประสาน
                  <br />
                  (ครั้ง)
                </th>
                <th colSpan={2}>สถานะเรื่อง</th>
              </tr>

              {/* Row 3: Leaf ของ ประเภทเรื่อง + leaf ของ สถานะเรื่อง */}
              <tr>
                {/* ประเภทเรื่อง leaf */}
                <th style={{ backgroundColor: "#A5A5A5" }}>$</th>
                <th style={{ backgroundColor: "#D9D9D9" }}>No$</th>
                <th style={{ backgroundColor: "#A5A5A5" }}>$</th>
                <th style={{ backgroundColor: "#D9D9D9" }}>No$</th>

                {/* สถานะเรื่อง leaf */}
                <th style={{ backgroundColor: "#FFD86C" }}>ดำเนินการ</th>
                <th style={{ backgroundColor: "#89DB5D" }}>ยุติ</th>
              </tr>
            </thead>

            <tbody>
              {data.map((row) => (
                <tr key={row.order}>
                  <td>{row.order}</td>
                  <td style={{ whiteSpace: "pre-line", textAlign: "center" }}>
                    {row.date}
                  </td>
                  <td style={{ textAlign: "left" }}>{row.subject}</td>

                  {/* หน่วยงาน */}
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>

                  {/* ประเภทเรื่อง: หน่วยงาน */}
                  <td></td>
                  <td></td>
                  {/* ประเภทเรื่อง: ส่วนบุคคล */}
                  <td></td>
                  <td></td>

                  {/* จังหวัด */}
                  <td>{row.province.BKK}</td>
                  <td>{row.province.PROV}</td>
                  <td>{row.province.COORD}</td>

                  {/* สถานะ */}
                  <td></td>
                  <td></td>

                  {/* หมายเหตุ */}
                  <td
                    className={styles.remarkCol}
                    style={{ textAlign: "left" }}
                  >
                    {row.remark}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </Box>
    </Box>
  );
};

export default InspectorComplaintManagementComponents;
