import React, { useState, useMemo } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs.jsx";
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
  // Add more mock data as needed
  {
    id: 4,
    claimantName: "นายสมชาย ใจดี",
    issue: "ปัญหาการอนุมัติเอกสาร",
    responsibleOfficer: "นายธารกร ภูมิรัตน์",
    receiptNumber: "842/68",
    officerReceiveDate: "22 พ.ย. 2567",
    issueType: "ระยะเวลาเรื่องร้องเรียนใหม่ / เรื่องร้องเรียนเพิ่มเติม",
    countTimes: 1,
  },
  {
    id: 5,
    claimantName: "นางสาวจิราพร สว่างใส",
    issue: "ค่าธรรมเนียมไม่ถูกต้อง",
    responsibleOfficer: "นางสาวนภัส มีความสุข",
    receiptNumber: "843/68",
    officerReceiveDate: "23 พ.ย. 2567",
    issueType: "ระยะเวลาส่งเอกสารเพิ่มเติมจากผู้ร้อง",
    countTimes: 2,
  },
  {
    id: 6,
    claimantName: "นายพิชัย รุ่งเรือง",
    issue: "ปัญหาการคำนวณภาษี",
    responsibleOfficer: "นางสาวปวิณา อมรชัยกุล",
    receiptNumber: "844/68",
    officerReceiveDate: "24 พ.ย. 2567",
    issueType: "ระยะเวลาการนำกลุ่มสำรวจตรวจสอบกลับจากหน่วยงาน",
    countTimes: 1,
  },
  {
    id: 7,
    claimantName: "บริษัท สมบูรณ์ การค้า จำกัด",
    issue: "ความล่าช้าในการดำเนินการ",
    responsibleOfficer: "นายธารกร ภูมิรัตน์",
    receiptNumber: "845/68",
    officerReceiveDate: "25 พ.ย. 2567",
    issueType: "ระยะเวลาเรื่องร้องเรียนใหม่ / เรื่องร้องเรียนเพิ่มเติม",
    countTimes: 3,
  },
  {
    id: 8,
    claimantName: "นางวิมล ขจรศิลป์",
    issue: "ปัญหาการติดต่อเจ้าหน้าที่",
    responsibleOfficer: "นางสาวนภัส มีความสุข",
    receiptNumber: "846/68",
    officerReceiveDate: "26 พ.ย. 2567",
    issueType: "ระยะเวลาส่งเอกสารเพิ่มเติมจากผู้ร้อง",
    countTimes: 2,
  },
  {
    id: 9,
    claimantName: "นายสุรชาติ เจริญสุข",
    issue: "ข้อมูลไม่ถูกต้องในระบบ",
    responsibleOfficer: "นางสาวปวิณา อมรชัยกุล",
    receiptNumber: "847/68",
    officerReceiveDate: "27 พ.ย. 2567",
    issueType: "ระยะเวลาการนำกลุ่มสำรวจตรวจสอบกลับจากหน่วยงาน",
    countTimes: 1,
  },
  {
    id: 10,
    claimantName: "นางสาวอัญชลี มั่นใจ",
    issue: "ปัญหาการออกใบรับรอง",
    responsibleOfficer: "นายธารกร ภูมิรัตน์",
    receiptNumber: "848/68",
    officerReceiveDate: "28 พ.ย. 2567",
    issueType: "ระยะเวลาเรื่องร้องเรียนใหม่ / เรื่องร้องเรียนเพิ่มเติม",
    countTimes: 2,
  },
];

const StaffNotificationComponents = () => {
  const [allComplaints] = useState(mockComplaints);
  const [filteredComplaints, setFilteredComplaints] = useState(mockComplaints);

  // สร้าง options ออกมาก่อน
  const responsibleOfficerOptions = useMemo(() => {
    const unique = [...new Set(allComplaints.map((c) => c.responsibleOfficer))];
    return [...unique.map((v) => ({ value: v, label: v }))];
  }, [allComplaints]);

  const issueTypeOptions = useMemo(() => {
    const unique = [...new Set(allComplaints.map((c) => c.issueType))];
    return [...unique.map((v) => ({ value: v, label: v }))];
  }, [allComplaints]);

  // คอนฟิกฟิลด์เดียว ใช้ทั้ง render และ search
  const filterFields = useMemo(
    () => [
      {
        name: "responsibleOfficer",
        label: "เจ้าหน้าที่ผู้รับผิดชอบ",
        type: "select",
        options: responsibleOfficerOptions,
      },
      { name: "claimantName", label: "ชื่อ - สกุล (ผู้ร้อง)", type: "text" },

      { name: "receiptNumber", label: "เลข สรร.", type: "text" },
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

export default StaffNotificationComponents;
