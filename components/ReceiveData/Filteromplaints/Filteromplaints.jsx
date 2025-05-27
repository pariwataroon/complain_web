import React, { useState } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableFilterList from "@services/TableFilterList/TableFilterList";

const breadcrumbItems = [
  {
    label: "รับเข้าข้อมูล",
    icon: (
      <img
        src="/icons/Pencil.png"
        alt="pencil"
        style={{ width: 24, height: 24, marginBottom: -8 }}
      />
    ),
  },
  {
    label: "สืบค้นเรื่องร้องเรียน",
    url: "/admin/edit/search",
  },
  { label: "คัดกรองเรื่องร้องเรียน" },
];

const group1 = [
  {
    id: 1,
    name: "บริษัท ดีพี เทคโนโลยี จำกัด",
    issueType: "การค้า",
    subject: "การดำเนินการล่าช้า",
    respondentName: "กรมพาณิชย์",
    docNo: "12.3457.56 (14 ก.พ. 2568)",
    docNo2: "16.4825.56 (14 ก.พ. 2568)",
    docNo3: "15.5992.45 (14 ก.พ. 2568)",
    docNo4: "24/68",
  },
  {
    id: 2,
    name: "บริษัท เอ็ม เทรดดิ้ง อินเตอร์เนชั่นแนล จำกัด",
    issueType: "การค้า",
    subject: "การประสานงานกับหน่วยงานล่าช้า",
    respondentName: "กรมบัญชีกลาง",
    docNo: "13.4678.88 (13 ก.พ. 2568)",
    docNo2: "14.6543.21 (13 ก.พ. 2568)",
    docNo3: "15.9213.88 (13 ก.พ. 2568)",
    docNo4: "29/68",
  },
];

const group2 = [
  {
    id: 1,
    name: "บริษัท เทค ซัพพลาย จำกัด",
    issueType: "ภาครัฐ",
    subject: "ปัญหาในการยื่นเอกสารประกวดราคา",
    respondentName: "กรมจัดซื้อ",
    docNo: "11.1234.22 (12 ก.พ. 2568)",
    docNo2: "12.5678.33 (12 ก.พ. 2568)",
    docNo3: "13.7890.44 (12 ก.พ. 2568)",
    docNo4: "31/68",
  },
  {
    id: 2,
    name: "หจก. ซัพพลายพลัส",
    issueType: "ภาครัฐ",
    subject: "เจ้าหน้าที่แสดงกิริยาไม่เหมาะสม",
    respondentName: "กรมการเงิน",
    docNo: "12.2222.55 (11 ก.พ. 2568)",
    docNo2: "13.3333.66 (11 ก.พ. 2568)",
    docNo3: "14.4444.77 (11 ก.พ. 2568)",
    docNo4: "33/68",
  },
];

const group3 = [
  {
    id: 1,
    name: "บริษัท โอพีเอ็ม คอร์ปอเรชั่น",
    issueType: "ร้องเรียน",
    subject: "ความล่าช้าในการดำเนินงาน",
    respondentName: "กระทรวงการคลัง",
    docNo: "10.1111.22 (10 ก.พ. 2568)",
    docNo2: "11.2222.33 (10 ก.พ. 2568)",
    docNo3: "12.3333.44 (10 ก.พ. 2568)",
    docNo4: "44/68",
  },
  {
    id: 2,
    name: "บริษัท ระบบราชการดีเยี่ยม จำกัด",
    issueType: "ร้องเรียน",
    subject: "ขอข้อมูลเพิ่มเติมจากเจ้าหน้าที่",
    respondentName: "กรมสารสนเทศ",
    docNo: "09.9999.88 (9 ก.พ. 2568)",
    docNo2: "08.8888.77 (9 ก.พ. 2568)",
    docNo3: "07.7777.66 (9 ก.พ. 2568)",
    docNo4: "45/68",
  },
];


const Filteromplaints = () => {

  return (
    <>
      <BreadcrumbsService items={breadcrumbItems} />
      <TableFilterList
        title="คัดกรองเรื่องร้องเรียน"
        navigateTo="/admin/edit/search/Filteromplaints/edit"
        groups={[
          { title: "ช่องทางการรับเรื่อง : เว็บไซต์", data: group1 },
          { title: "ช่องทางการรับเรื่อง : ผู้ดูแลระบบ(แอดมิน)", data: group2 },
          { title: "ช่องทางการรับเรื่อง : เว็บไซต์ OPM1111", data: group3 },
        ]}
      />
    </>
  );
};

export default Filteromplaints;
