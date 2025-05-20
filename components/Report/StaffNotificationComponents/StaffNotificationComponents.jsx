// pages/admin/ComplaintArchives.jsx
import React, { useState, useMemo } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListStaffNoti from "@services/TableListStaffNoti/TableListStaffNoti";

// ─── mock data (20 รายการ) ─────────────────────────────────────────────────
const mockComplaints = [
  {
    id: 1,
    claimantName: "นายปริญญา ทรัพย์รุ่ง",
    issue: "พฤติกรรมเจ้าหน้าที่ไม่เหมาะสม",
    responsibleOfficer: "นางสาวนภัส มีความสุข",
    receiptNumber: "841/68",
    officerReceiveDate: "21 พ.ย. 2567",
    issueType: "ระยะเวลาเรื่องร้องเรียนใหม่ / เรื่องร้องเรียนเพิ่มเติม",
    countTimes: 3,
  },
  {
    id: 2,
    claimantName: "นางอารดา บุญเลิศ",
    issue: "ปัญหาค้างชำระหนี้ในระบบ",
    responsibleOfficer: "นายธารกร ภูมิรัตน์",
    receiptNumber: "841/68",
    officerReceiveDate: "21 พ.ย. 2567",
    issueType: "ระยะเวลาส่งเอกสารเพิ่มเติมจากผู้ร้อง",
    countTimes: 2,
  },
  {
    id: 3,
    claimantName: "บริษัท ไพรมีโชคอุตสาหกรรม จำกัด",
    issue: "ไม่สามารถเบิกค่าใช้จ่ายทางรถยนต์ได้",
    responsibleOfficer: "นางสาวปวิณา อมรชัยกุล",
    receiptNumber: "841/68",
    officerReceiveDate: "21 พ.ย. 2567",
    issueType: "ระยะเวลาการนำกลุ่มสำรวจตรวจสอบกลับจากหน่วยงาน",
    countTimes: 1,
  },
  // ... เพิ่ม rows ตามต้องการ ...
];

const ComplaintArchives = () => {
  const [allComplaints] = useState(mockComplaints);
  const [filteredComplaints, setFilteredComplaints] = useState(mockComplaints);
  const router = useRouter();

  // สร้าง options ออกมาก่อน
  const responsibleOfficerOptions = useMemo(() => {
    const unique = [...new Set(allComplaints.map((c) => c.responsibleOfficer))];
    return [
      { value: "", label: "ทั้งหมด" },
      ...unique.map((v) => ({ value: v, label: v })),
    ];
  }, [allComplaints]);

  const issueTypeOptions = useMemo(() => {
    const unique = [...new Set(allComplaints.map((c) => c.issueType))];
    return [
      { value: "", label: "ทั้งหมด" },
      ...unique.map((v) => ({ value: v, label: v })),
    ];
  }, [allComplaints]);

  // คอนฟิกฟิลด์เดียว ใช้ทั้ง render และ search
  const filterFields = useMemo(
    () => [
      { name: "claimantName", label: "ชื่อ - สกุล (ผู้ร้อง)", type: "text" },
      {
        name: "responsibleOfficer",
        label: "เจ้าหน้าที่ผู้รับผิดชอบ",
        type: "select",
        options: responsibleOfficerOptions,
      },
      { name: "receiptNumber", label: "เลขรับ สรร.", type: "text" },
      { name: "issue", label: "ชื่อเรื่อง", type: "text" },
      {
        name: "issueType",
        label: "หัวข้อ",
        type: "select",
        options: issueTypeOptions,
      },
    ],
    [responsibleOfficerOptions, issueTypeOptions]
  );

  const handleSearch = (filters) => {
    const result = allComplaints.filter((item) =>
      filterFields.every(({ name, type }) => {
        let value = filters[name];

        // ถ้าเป็น select แล้ว TableList คืนมาเป็น object {value,label}
        if (type === "select" && value && typeof value === "object") {
          value = value.value;
        }

        // ถ้าไม่มีค่ากรอง ก็ข้ามฟิลด์นี้
        if (!value && value !== 0) return true;

        if (type === "select") {
          // select: เช็คเท่ากันเป๊ะ
          return item[name] === value;
        } else {
          // text: substring, case-insensitive
          return (
            item[name]
              ?.toString()
              .toLowerCase()
              .includes(value.trim().toLowerCase()) ?? false
          );
        }
      })
    );

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
          },
          { label: "รายงานการแจ้งเตือนเจ้าหน้าที่" },
        ]}
      />

      <TableListStaffNoti
        data={filteredComplaints}
        title="รายงานการแจ้งเตือนเจ้าหน้าที่"
        // navigateTo="/admin/edit/website-complaints"
        onSearch={handleSearch}
        filterFields={filterFields}
      />
    </>
  );
};

export default ComplaintArchives;
