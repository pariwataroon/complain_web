import React, { useState, useRef } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListCollaps from "@services/TableListCollaps/TableListCollaps";

const mockComplaints = [
  {
    id: 1,
    claimantName: "เรียกเก็บ VAT ซ้ำซ้อน",
    department: "ภาษีอากร",
    responsibleOfficer: "กรมสรรพากร",
    receiptNumber: "REC-0001",
    referenceNumber: "1234-5-678-9",
    workingDays: 3,
    status: "รอดำเนินการ",
    departmentsData: [
      {
        department: "ภาษีอากร",
        receiptNumber: "REC-0001-1",
        referenceNumber: "0000000001",
        workingDays: 8,
        status: "ยุติ",
      },
      {
        department: "สำนักงานสรรพากรภาค 1",
        receiptNumber: "REC-0001-2",
        referenceNumber: "0000000002",
        workingDays: 7,
        status: "ไม่ยุติ",
      },
    ],
  },
  {
    id: 2,
    claimantName: "ขอคืนภาษีซื้อเกิน",
    department: "ภาษีอากร",
    responsibleOfficer: "กรมสรรพากร",
    receiptNumber: "REC-0002",
    referenceNumber: "2345-6-789-0",
    workingDays: 5,
    status: "กำลังดำเนินการ",
    departmentsData: [
      {
        department: "ภาษีอากร",
        receiptNumber: "REC-0002-1",
        referenceNumber: "0000000100",
        workingDays: 6,
        status: "รอตรวจสอบ",
      },
    ],
  },
  {
    id: 3,
    claimantName: "ขอเบิกค่ารักษาพยาบาล",
    department: "ค่ารักษาพยาบาล",
    responsibleOfficer: "สำนักงานเศรษฐกิจการคลัง",
    receiptNumber: "REC-0003",
    referenceNumber: "3456-7-890-1",
    workingDays: 2,
    status: "เสร็จสิ้น",
    departmentsData: [
      {
        department: "ค่ารักษาพยาบาล",
        receiptNumber: "REC-0003-1",
        referenceNumber: "0000001000",
        workingDays: 2,
        status: "อนุมัติ",
      },
    ],
  },
  {
    id: 4,
    claimantName: "ครุภัณฑ์ไม่ตรงสเปค",
    department: "การจัดซื้อจัดจ้าง",
    responsibleOfficer: "กรมบัญชีกลาง",
    receiptNumber: "REC-0004",
    referenceNumber: "4567-8-901-2",
    workingDays: 7,
    status: "รอดำเนินการ",
    departmentsData: [
      {
        department: "การจัดซื้อจัดจ้าง",
        receiptNumber: "REC-0004-1",
        referenceNumber: "0000010000",
        workingDays: 7,
        status: "อยู่ระหว่างพิจารณา",
      },
    ],
  },
  {
    id: 5,
    claimantName: "ปรับโครงสร้างหนี้",
    department: "หนี้ในระบบ",
    responsibleOfficer: "สำนักงานบริหารหนี้สาธารณะ",
    receiptNumber: "REC-0005",
    referenceNumber: "5678-9-012-3",
    workingDays: 4,
    status: "กำลังดำเนินการ",
    departmentsData: [
      {
        department: "หนี้ในระบบ",
        receiptNumber: "REC-0005-1",
        referenceNumber: "0000100000",
        workingDays: 4,
        status: "ดำเนินการอยู่",
      },
    ],
  },
];

const departmentOptions = [
  { value: "", label: "ทั้งหมด" },
  { value: "ภาษีอากร", label: "ภาษีอากร" },
  { value: "ค่ารักษาพยาบาล", label: "ค่ารักษาพยาบาล" },
  { value: "การจัดซื้อจัดจ้าง", label: "การจัดซื้อจัดจ้าง" },
  { value: "หนี้ในระบบ", label: "หนี้ในระบบ" },
  { value: "หนี้นอกระบบ", label: "หนี้นอกระบบ" },
  { value: "พฤติกรรมเจ้าหน้าที่", label: "พฤติกรรมเจ้าหน้าที่" },
  { value: "อื่นๆ", label: "อื่นๆ" },
  { value: "โครงการสาธารณูปโภคพื้นฐาน", label: "โครงการสาธารณูปโภคพื้นฐาน" },
  { value: "โครงการลงทะเบียนสวัสดิการ", label: "โครงการลงทะเบียนสวัสดิการ" },
];

const responsibleOfficerOptions = [
  { value: "", label: "ทั้งหมด" },
  { value: "กรมสรรพากร", label: "กรมสรรพากร" },
  { value: "สำนักงานเศรษฐกิจการคลัง", label: "สำนักงานเศรษฐกิจการคลัง" },
  { value: "กรมบัญชีกลาง", label: "กรมบัญชีกลาง" },
  { value: "สำนักงานบริหารหนี้สาธารณะ", label: "สำนักงานบริหารหนี้สาธารณะ" },
  { value: "ธนาคารแห่งประเทศไทย", label: "ธนาคารแห่งประเทศไทย" },
  { value: "กรมศุลกากร", label: "กรมศุลกากร" },
  { value: "สำนักงานเลขาธิการนายกรัฐมนตรี", label: "สลน.นายกฯ" },
  { value: "กรมโยธาธิการและผังเมือง", label: "กรมโยธาฯ" },
  { value: "สำนักงานหลักประกันสุขภาพแห่งชาติ", label: "สปสช." },
];

const statusOptions = [
  { value: "", label: "ทั้งหมด" },
  { value: "รอดำเนินการ", label: "รอดำเนินการ" },
  { value: "กำลังดำเนินการ", label: "กำลังดำเนินการ" },
  { value: "เสร็จสิ้น", label: "เสร็จสิ้น" },
];

const StatusTrackingReport = () => {
  const [allComplaints] = useState(mockComplaints);
  const [filteredComplaints, setFilteredComplaints] = useState(mockComplaints);
  const router = useRouter();

  const handleSearch = (filters) => {
    const {
      claimantName: fName,
      department: fDept,
      responsibleOfficer: fOfficer,
      receiptNumber: fReceipt,
      referenceNumber: fReference,
      status: fStatus,
    } = filters;

    // ถ้าไม่มี filter ใดเลย ให้แสดงทั้งหมด
    if (!fName && !fDept && !fOfficer && !fReceipt && !fReference && !fStatus) {
      setFilteredComplaints(allComplaints);
      return;
    }

    const result = allComplaints.filter((item) => {
      // ชื่อเรื่อง
      if (
        fName &&
        item.claimantName.toLowerCase().includes(fName.toLowerCase())
      ) {
        return true;
      }
      // หน่วยงาน: เช็คทั้งหลักและใน departmentsData
      if (
        fDept &&
        (item.department === fDept ||
          item.departmentsData.some((d) => d.department === fDept))
      ) {
        return true;
      }
      // เจ้าหน้าที่ผู้รับผิดชอบ
      if (fOfficer && item.responsibleOfficer === fOfficer) {
        return true;
      }
      // เลขรับ สรร.
      if (
        fReceipt &&
        item.receiptNumber.toLowerCase().includes(fReceipt.toLowerCase())
      ) {
        return true;
      }
      // เลขที่อ้างอิง
      if (
        fReference &&
        item.referenceNumber.toLowerCase().includes(fReference.toLowerCase())
      ) {
        return true;
      }
      // สถานะเรื่อง
      if (fStatus && item.status === fStatus) {
        return true;
      }
      // ถ้าไม่ match เลย ให้กรองออก
      return false;
    });

    setFilteredComplaints(result);
  };

  const handleNavigateTo = (item) =>
    router.push(`/admin/edit/opm1111/${item.id}`);

  return (
    <>
      <BreadcrumbsService
        items={[
          {
            label: "เมนูรายงาน",
            icon: (
              <img
                src="/icons/note.png"
                alt="pencil"
                style={{ width: 24, height: 24, marginBottom: -8 }}
              />
            ),
          },
          { label: "รายงานติดตามสถานะ" },
        ]}
      />

      <TableListCollaps
        data={filteredComplaints}
        title="รายงานติดตามสถานะ"
        navigateTo="/admin/document/status-tracking-report"
        handleNavigateTo={handleNavigateTo}
        onSearch={handleSearch}
        filterFields={[
          { name: "claimantName", label: "ชื่อเรื่อง", type: "text" },
          {
            name: "department",
            label: "หน่วยงาน",
            type: "select",
            options: departmentOptions,
          },
          {
            name: "responsibleOfficer",
            label: "เจ้าหน้าที่ผู้รับผิดชอบ",
            type: "select",
            options: responsibleOfficerOptions,
          },
          { name: "receiptNumber", label: "เลขรับ สรร.", type: "text" },
          { name: "referenceNumber", label: "เลขที่อ้างอิง", type: "text" },
          {
            name: "status",
            label: "สถานะเรื่อง",
            type: "select",
            options: statusOptions,
          },
        ]}
      />
    </>
  );
};

export default StatusTrackingReport;
