import React, { useState, useMemo } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs.jsx";
import TableListStaffNoti from "@services/TableListStaffNoti/TableListStaffNoti";
import dayjs from "dayjs";

// ─── mock data (20 รายการ) ─────────────────────────────────────────────────
const mockComplaints = [
  {
    id: 1,
    claimantName: "นายปริญญา ทรัพย์รุ่ง",
    issue: "พฤติกรรมเจ้าหน้าที่ไม่เหมาะสม",
    responsibleOfficer: "นางสาวนภัส มีความสุข",
    receiptNumber: "841/68",
    officerReceiveDate: "01 ต.ค. 2568",
    officerReceiveDateISO: "2025-10-01",
    issueType: "เรื่องร้องเรียนใหม่/ร้องเรียนเพิ่มเติม",
    countTimes: 3,
  },
  {
    id: 2,
    claimantName: "นางอารดา บุญเลิศ",
    issue: "ปัญหาค้างชำระหนี้ในระบบ",
    responsibleOfficer: "นายธารกร ภูมิรัตน์",
    receiptNumber: "841/68",
    officerReceiveDate: "05 ต.ค. 2568",
    officerReceiveDateISO: "2025-10-05",
    issueType: "ขอให้ผู้ร้องส่งเอกสารเพิ่มเติม",
    countTimes: 2,
  },
  {
    id: 3,
    claimantName: "บริษัท ไพรมีโชคอุตสาหกรรม จำกัด",
    issue: "ไม่สามารถเบิกค่าใช้จ่ายทางรถยนต์ได้",
    responsibleOfficer: "นางสาวปวิณา อมรชัยกุล",
    receiptNumber: "841/68",
    officerReceiveDate: "08 ต.ค. 2568",
    officerReceiveDateISO: "2025-10-08",
    issueType: "หน่วยงานรายงานผลการพิจารณา",
    countTimes: 1,
  },
  // Add more mock data as needed
  {
    id: 4,
    claimantName: "นายสมชาย ใจดี",
    issue: "ปัญหาการอนุมัติเอกสาร",
    responsibleOfficer: "นายธารกร ภูมิรัตน์",
    receiptNumber: "842/68",
    officerReceiveDate: "10 ต.ค. 2568",
    officerReceiveDateISO: "2025-10-10",
    issueType: "เรื่องร้องเรียนใหม่/ร้องเรียนเพิ่มเติม",
    countTimes: 1,
  },
  {
    id: 5,
    claimantName: "นางสาวจิราพร สว่างใส",
    issue: "ค่าธรรมเนียมไม่ถูกต้อง",
    responsibleOfficer: "นางสาวนภัส มีความสุข",
    receiptNumber: "843/68",
    officerReceiveDate: "12 ต.ค. 2568",
    officerReceiveDateISO: "2025-10-12",
    issueType: "ขอให้ผู้ร้องส่งเอกสารเพิ่มเติม",
    countTimes: 2,
  },
  {
    id: 6,
    claimantName: "นายพิชัย รุ่งเรือง",
    issue: "ปัญหาการคำนวณภาษี",
    responsibleOfficer: "นางสาวปวิณา อมรชัยกุล",
    receiptNumber: "844/68",
    officerReceiveDate: "15 ต.ค. 2568",
    officerReceiveDateISO: "2025-10-15",
    issueType: "หน่วยงานรายงานผลการพิจารณา",
    countTimes: 1,
  },
  {
    id: 7,
    claimantName: "บริษัท สมบูรณ์ การค้า จำกัด",
    issue: "ความล่าช้าในการดำเนินการ",
    responsibleOfficer: "นายธารกร ภูมิรัตน์",
    receiptNumber: "845/68",
    officerReceiveDate: "17 ต.ค. 2568",
    officerReceiveDateISO: "2025-10-17",
    issueType: "เรื่องร้องเรียนใหม่/ร้องเรียนเพิ่มเติม",
    countTimes: 3,
  },
  {
    id: 8,
    claimantName: "นางวิมล ขจรศิลป์",
    issue: "ปัญหาการติดต่อเจ้าหน้าที่",
    responsibleOfficer: "นางสาวนภัส มีความสุข",
    receiptNumber: "846/68",
    officerReceiveDate: "20 ต.ค. 2568",
    officerReceiveDateISO: "2025-10-20",
    issueType: "ขอให้ผู้ร้องส่งเอกสารเพิ่มเติม",
    countTimes: 2,
  },
  {
    id: 9,
    claimantName: "นายสุรชาติ เจริญสุข",
    issue: "ข้อมูลไม่ถูกต้องในระบบ",
    responsibleOfficer: "นางสาวปวิณา อมรชัยกุล",
    receiptNumber: "847/68",
    officerReceiveDate: "22 ต.ค. 2568",
    officerReceiveDateISO: "2025-10-22",
    issueType: "หน่วยงานรายงานผลการพิจารณา",
    countTimes: 1,
  },
  {
    id: 10,
    claimantName: "นางสาวอัญชลี มั่นใจ",
    issue: "ปัญหาการออกใบรับรอง",
    responsibleOfficer: "นายธารกร ภูมิรัตน์",
    receiptNumber: "848/68",
    officerReceiveDate: "25 ต.ค. 2568",
    officerReceiveDateISO: "2025-10-25",
    issueType: "เรื่องร้องเรียนใหม่/ร้องเรียนเพิ่มเติม",
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

  // กำหนดตัวเลือกหัวข้อตามลำดับที่ต้องการ
  const issueTypeOptions = useMemo(() => {
    return [
      { value: "เรื่องร้องเรียนใหม่/ร้องเรียนเพิ่มเติม", label: "เรื่องร้องเรียนใหม่/ร้องเรียนเพิ่มเติม" },
      { value: "หน่วยงานรายงานผลการพิจารณา", label: "หน่วยงานรายงานผลการพิจารณา" },
      { value: "ขอให้ผู้ร้องส่งเอกสารเพิ่มเติม", label: "ขอให้ผู้ร้องส่งเอกสารเพิ่มเติม" },
    ];
  }, []);

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
      { name: "startDate", label: "ตั้งแต่วันที่", type: "date" },
      { name: "endDate", label: "ถึงวันที่", type: "date" },
    ],
    [responsibleOfficerOptions, issueTypeOptions]
  );

  const handleSearch = (filters) => {
    console.log("🔍 handleSearch called with filters:", filters);

    const result = allComplaints.filter((item) => {
      // กรองตามฟิลด์ทั่วไป (text และ select)
      const matchesTextAndSelect = filterFields
        .filter(({ type }) => type !== "date")
        .every(({ name, type }) => {
          let value = filters[name];

          // ถ้าเป็น select แล้ว TableList คืนมาเป็น object {value,label}
          if (type === "select" && value && typeof value === "object") {
            value = value.value;
          }

          // ถ้าไม่มีค่ากรอง ก็ข้ามฟิลด์นี้
          if (!value && value !== 0) return true;

          if (type === "select") {
            // select: เช็คเท่ากันเป๊ะ
            const match = item[name] === value;
            if (name === "issueType") {
              console.log(`  issueType compare: "${item[name]}" === "${value}" = ${match}`);
            }
            return match;
          } else {
            // text: substring, case-insensitive
            return (
              item[name]
                ?.toString()
                .toLowerCase()
                .includes(value.trim().toLowerCase()) ?? false
            );
          }
        });

      // กรองตามช่วงวันที่
      let matchesDateRange = true;
      const startDate = filters.startDate;
      const endDate = filters.endDate;

      if (startDate || endDate) {
        if (!item.officerReceiveDateISO) {
          matchesDateRange = false;
        } else {
          const itemDate = dayjs(item.officerReceiveDateISO);
          if (!itemDate.isValid()) {
            matchesDateRange = false;
          } else {
            // ถ้ามี startDate ให้เช็คว่าวันที่ต้อง >= startDate
            if (startDate) {
              const start = dayjs(startDate).startOf("day");
              if (itemDate.isBefore(start)) {
                matchesDateRange = false;
              }
            }

            // ถ้ามี endDate ให้เช็คว่าวันที่ต้อง <= endDate
            if (endDate) {
              const end = dayjs(endDate).endOf("day");
              if (itemDate.isAfter(end)) {
                matchesDateRange = false;
              }
            }
          }
        }
      }

      return matchesTextAndSelect && matchesDateRange;
    });

    console.log(`✅ Found ${result.length} matching items out of ${allComplaints.length}`);
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
