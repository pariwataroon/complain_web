import React, { useState } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableAssignedComp from "@services/TableAssignedComp/TableAssignedComp";
import { useRouter } from "next/router";

const breadcrumbItems = [
  {
    label: "บัตรสนเท่ห์ที่ได้รับมอบหมาย",
    icon: (
      <img
        src="/icons/Pencil.png"
        alt="pencil"
        style={{ width: 24, height: 24, marginBottom: -8 }}
      />
    ),
  },
];

// Mock data matching the table columns in the design
const mockData = [
  {
    id: 1,
    name: "นางสาวณภัทร มีความสุข",
    subject: "พฤติกรรมเจ้าหน้าที่กกต.ไม่เหมาะสม",
    docNo4: "125/26",
    docNo: "สป-กค-1234-5-678-9",
    docNo2: "สป-สร-1234-5-678-9",
    docNo3: "สตป-1234-5-678-9",
    receiveDate: "2025-01-17T00:00:00.000Z",
  },
  {
    id: 2,
    name: "นางสาวจารุณี สิขังสมาธิมี",
    subject: "พฤติกรรมเจ้าหน้าที่กกต.ไม่เหมาะสม",
    docNo4: "124/26",
    docNo: "สป-กค-1234-5-678-9",
    docNo2: "สป-สร-1234-5-678-9",
    docNo3: "สตป-1234-5-678-9",
    receiveDate: "2025-01-18T00:00:00.000Z",
  },
  {
    id: 3,
    name: "บริษัท สกายเทค อินโนเวชั่น จำกัด",
    subject: "ไม่สามารถเบิกค่ารักษาพยาบาลได้",
    docNo4: "123/26",
    docNo: "สป-กค-1234-5-678-9",
    docNo2: "สป-สร-1234-5-678-9",
    docNo3: "สตป-1234-5-678-9",
    receiveDate: "2025-01-18T00:00:00.000Z",
  },
  {
    id: 4,
    name: "นายปาเจรา จาริยา",
    subject: "โดนทวงหนี้นอกระบบ",
    docNo4: "142/26",
    docNo: "สป-กค-1234-5-678-9",
    docNo2: "สป-สร-1234-5-678-9",
    docNo3: "สตป-1234-5-678-9",
    receiveDate: "2025-01-20T00:00:00.000Z",
  },
  {
    id: 5,
    name: "บริษัท เอ็กซ์เซลเลนท์ ซัพพลาย จำกัด",
    subject: "การกู้ยืมโดยไม่มีสัญญา",
    docNo4: "422/26",
    docNo: "สป-กค-1234-5-678-9",
    docNo2: "สป-สร-1234-5-678-9",
    docNo3: "สตป-1234-5-678-9",
    receiveDate: "2025-01-20T00:00:00.000Z",
  },
  {
    id: 6,
    name: "นางสาวอภิญญา แสนสุข",
    subject: "การเรียกร้องค่าชดเชยไม่เป็นธรรม",
    docNo4: "423/26",
    docNo: "สป-กค-1111-1-222-3",
    docNo2: "สป-สร-1111-1-222-3",
    docNo3: "สตป-1111-1-222-3",
    receiveDate: "2025-01-21T00:00:00.000Z",
  },
  {
    id: 7,
    name: "นายสมชาย ใจดี",
    subject: "การจัดเก็บภาษีเกินจริง",
    docNo4: "524/26",
    docNo: "สป-กค-2222-2-333-4",
    docNo2: "สป-สร-2222-2-333-4",
    docNo3: "สตป-2222-2-333-4",
    receiveDate: "2025-01-22T00:00:00.000Z",
  },
  {
    id: 8,
    name: "บริษัท ไทยรุ่งเรือง จำกัด",
    subject: "สินค้าไม่ตรงตามสเปค",
    docNo4: "325/26",
    docNo: "สป-กค-3333-3-444-5",
    docNo2: "สป-สร-3333-3-444-5",
    docNo3: "สตป-3333-3-444-5",
    receiveDate: "2025-01-23T00:00:00.000Z",
  },
  {
    id: 9,
    name: "นางสาวมณีรัตน์ สุขใจ",
    subject: "บริการหลังการขายไม่ดี",
    docNo4: "226/26",
    docNo: "สป-กค-4444-4-555-6",
    docNo2: "สป-สร-4444-4-555-6",
    docNo3: "สตป-4444-4-555-6",
    receiveDate: "2025-01-24T00:00:00.000Z",
  },
  {
    id: 10,
    name: "บริษัท รุ่งอรุณ จำกัด",
    subject: "การส่งมอบงานล่าช้า",
    docNo4: "627/26",
    docNo: "สป-กค-5555-5-666-7",
    docNo2: "สป-สร-5555-5-666-7",
    docNo3: "สตป-5555-5-666-7",
    receiveDate: "2025-01-25T00:00:00.000Z",
  },
  {
    id: 11,
    name: "นายอำนาจ กล้าหาญ",
    subject: "การเรียกเก็บค่าปรับผิดกฎหมาย",
    docNo4: "728/26",
    docNo: "สป-กค-6666-6-777-8",
    docNo2: "สป-สร-6666-6-777-8",
    docNo3: "สตป-6666-6-777-8",
    receiveDate: "2025-01-26T00:00:00.000Z",
  },
  {
    id: 12,
    name: "นางสาวจันทร์เจ้า เทพรักษ์",
    subject: "การส่งภาษีล่าช้า",
    docNo4: "829/26",
    docNo: "สป-กค-7777-7-888-9",
    docNo2: "สป-สร-7777-7-888-9",
    docNo3: "สตป-7777-7-888-9",
    receiveDate: "2025-01-27T00:00:00.000Z",
  },
  {
    id: 13,
    name: "บริษัท กรีนฟิลด์ จำกัด",
    subject: "การประเมินความเสี่ยงไม่ชัดเจน",
    docNo4: "930/26",
    docNo: "สป-กค-8888-8-999-0",
    docNo2: "สป-สร-8888-8-999-0",
    docNo3: "สตป-8888-8-999-0",
    receiveDate: "2025-01-28T00:00:00.000Z",
  },
  {
    id: 14,
    name: "นายปรเมศวร์ วัฒนกิจ",
    subject: "บริการลูกค้าไม่เป็นมิตร",
    docNo4: "1031/26",
    docNo: "สป-กค-9999-9-000-1",
    docNo2: "สป-สร-9999-9-000-1",
    docNo3: "สตป-9999-9-000-1",
    receiveDate: "2025-01-29T00:00:00.000Z",
  },
  {
    id: 15,
    name: "นางสาวพัชรินทร์ นิ่มนวล",
    subject: "เอกสารสัญญาขาดหาย",
    docNo4: "1132/26",
    docNo: "สป-กค-1010-1-010-1",
    docNo2: "สป-สร-1010-1-010-1",
    docNo3: "สตป-1010-1-010-1",
    receiveDate: "2025-01-30T00:00:00.000Z",
  },
  {
    id: 16,
    name: "บริษัท ไทยซอฟต์ จำกัด",
    subject: "ซอฟต์แวร์บั๊กเยอะ",
    docNo4: "1233/26",
    docNo: "สป-กค-2020-2-020-2",
    docNo2: "สป-สร-2020-2-020-2",
    docNo3: "สตป-2020-2-020-2",
    receiveDate: "2025-01-31T00:00:00.000Z",
  },
  {
    id: 17,
    name: "นายจักรพงษ์ แข็งแรง",
    subject: "สินค้าชำรุดก่อนเวลา",
    docNo4: "1334/26",
    docNo: "สป-กค-3030-3-030-3",
    docNo2: "สป-สร-3030-3-030-3",
    docNo3: "สตป-3030-3-030-3",
    receiveDate: "2025-02-01T00:00:00.000Z",
  },
  {
    id: 18,
    name: "นางสาวมาลี มั่งคั่ง",
    subject: "การรับประกันไม่ครอบคลุม",
    docNo4: "1435/26",
    docNo: "สป-กค-4040-4-040-4",
    docNo2: "สป-สร-4040-4-040-4",
    docNo3: "สตป-4040-4-040-4",
    receiveDate: "2025-02-02T00:00:00.000Z",
  },
  {
    id: 19,
    name: "บริษัท แกรนด์เทค จำกัด",
    subject: "การติดตั้งล่าช้า",
    docNo4: "1536/26",
    docNo: "สป-กค-5050-5-050-5",
    docNo2: "สป-สร-5050-5-050-5",
    docNo3: "สตป-5050-5-050-5",
    receiveDate: "2025-02-03T00:00:00.000Z",
  },
  {
    id: 20,
    name: "นางสาวสุนิสา ใจบุญ",
    subject: "บริการหลังการขายไม่มีคุณภาพ",
    docNo4: "1637/26",
    docNo: "สป-กค-6060-6-060-6",
    docNo2: "สป-สร-6060-6-060-6",
    docNo3: "สตป-6060-6-060-6",
    receiveDate: "2025-02-04T00:00:00.000Z",
  },
];

const AssignedAnonymousComponents = () => {
  // state เก็บผลลัพธ์ที่กรองแล้ว
  const [rows, setRows] = useState(mockData);
  const router = useRouter();
  // ฟังก์ชันกรองข้อมูล
  const handleSearch = (filters) => {
    const filtered = mockData.filter((item) => {
      const matchName = filters.claimantName
        ? item.name.toLowerCase().includes(filters.claimantName.toLowerCase())
        : true;
      const matchSubject = filters.subject
        ? item.subject.toLowerCase().includes(filters.subject.toLowerCase())
        : true;
      const matchDocNo4 = filters.docNo4
        ? item.docNo4.includes(filters.docNo4)
        : true;
      const matchDate = filters.receiveDate
        ? item.receiveDate.startsWith(filters.receiveDate.split("T")[0])
        : true;
      return matchName && matchSubject && matchDocNo4 && matchDate;
    });
    setRows(filtered);
  };
  const handleRowClick = (item) => {
    if (item.id) router.push(`/admin/edit/assigned-anonymous/${item.id}`);
  };

  return (
    <>
      <BreadcrumbsService items={breadcrumbItems} />
      <TableAssignedComp
        title="บัตรสนเท่ห์ที่ได้รับมอบหมาย"
        rows={rows}
        onSearch={handleSearch} // ส่ง handleSearch ลงไปให้ Table
        handleRowClick={handleRowClick}
      />
    </>
  );
};

export default AssignedAnonymousComponents;
