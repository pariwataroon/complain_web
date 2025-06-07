import React, { useState, useMemo, useCallback } from "react";
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

// สร้าง Options แยกออกมาแบบ Static
const ISSUE_TYPE_OPTIONS = [
  { value: "", label: "เลือกประเภทเรื่อง" },
  { value: "การค้า", label: "การค้า" },
  { value: "ภาครัฐ", label: "ภาครัฐ" },
  { value: "ร้องเรียน", label: "ร้องเรียน" },
  { value: "ร้องทุกข์", label: "ร้องทุกข์" },
  { value: "การเงิน", label: "การเงิน" },
  { value: "การศึกษา", label: "การศึกษา" },
  { value: "สาธารณสุข", label: "สาธารณสุข" },
  { value: "การขนส่ง", label: "การขนส่ง" },
  { value: "สิ่งแวดล้อม", label: "สิ่งแวดล้อม" },
  { value: "สวัสดิการสังคม", label: "สวัสดิการสังคม" },
  { value: "อื่นๆ", label: "อื่นๆ" },
];

const RESPONDENT_OPTIONS = [
  { value: "", label: "เลือกผู้ถูกร้อง" },
  { value: "กรมพาณิชย์", label: "กรมพาณิชย์" },
  { value: "กรมบัญชีกลาง", label: "กรมบัญชีกลาง" },
  { value: "กรมจัดซื้อ", label: "กรมจัดซื้อ" },
  { value: "กรมการเงิน", label: "กรมการเงิน" },
  { value: "กรมสารสนเทศ", label: "กรมสารสนเทศ" },
  { value: "กระทรวงการคลัง", label: "กระทรวงการคลัง" },
  { value: "กระทรวงมหาดไทย", label: "กระทรวงมหาดไทย" },
  { value: "กระทรวงศึกษาธิการ", label: "กระทรวงศึกษาธิการ" },
  { value: "กระทรวงสาธารณสุข", label: "กระทรวงสาธารณสุข" },
  { value: "กระทรวงแรงงาน", label: "กระทรวงแรงงาน" },
  { value: "กระทรวงพาณิชย์", label: "กระทรวงพาณิชย์" },
  { value: "จังหวัด", label: "จังหวัด" },
  { value: "อำเภอ", label: "อำเภอ" },
  { value: "เทศบาล", label: "เทศบาล" },
  { value: "องค์การบริหารส่วนตำบล", label: "องค์การบริหารส่วนตำบล" },
  { value: "องค์การบริหารส่วนจังหวัด", label: "องค์การบริหารส่วนจังหวัด" },
];

const Filteromplaints = () => {
  const [allGroups] = useState([
    { title: "ช่องทางการรับเรื่อง : เว็บไซต์", data: group1 },
    { title: "ช่องทางการรับเรื่อง : ผู้ดูแลระบบ(แอดมิน)", data: group2 },
    { title: "ช่องทางการรับเรื่อง : เว็บไซต์ OPM1111", data: group3 },
  ]);

  const [filteredGroups, setFilteredGroups] = useState(allGroups);

  // Helper function สำหรับการค้นหาแบบ safe
  const safeIncludes = (text, query) => {
    if (!query || query === "") return true;
    if (!text) return false;

    const textStr = String(text).toLowerCase().trim();
    const queryStr = String(query).toLowerCase().trim();

    return textStr.includes(queryStr);
  };

  // Helper function สำหรับการตรวจสอบค่าว่าง
  const isEmpty = (value) => {
    return value === "" || value === null || value === undefined;
  };

  // Helper function สำหรับการเปรียบเทียบ exact match
  const exactMatch = (text, query) => {
    if (isEmpty(query)) return true;
    if (!text) return false;

    const textStr = String(text).trim();
    const queryStr = String(query).trim();

    console.log(
      `🎯 Exact match: "${textStr}" === "${queryStr}" = ${textStr === queryStr}`
    );
    return textStr === queryStr;
  };

  const handleSearch = useCallback(
    (filters) => {
      console.log("🔍 Search started with filters:", filters);

      const { claimantName, subject, issueType, respondentName } = filters;

      // ตรวจสอบว่ามีการกรองหรือไม่
      const hasFilters =
        !isEmpty(claimantName) ||
        !isEmpty(subject) ||
        !isEmpty(issueType) ||
        !isEmpty(respondentName);

      if (!hasFilters) {
        console.log("✅ No filters, showing all data");
        setFilteredGroups(allGroups);
        return;
      }

      console.log("🔍 Applying filters:");
      console.log("- claimantName:", claimantName);
      console.log("- subject:", subject);
      console.log("- issueType:", issueType);
      console.log("- respondentName:", respondentName);

      const filteredData = allGroups
        .map((group) => ({
          ...group,
          data: group.data.filter((item) => {
            console.log(
              "🔍 Testing item:",
              item.name,
              "- issueType:",
              item.issueType
            );

            // ชื่อผู้ร้อง - partial match
            if (
              !isEmpty(claimantName) &&
              !safeIncludes(item.name, claimantName)
            ) {
              console.log("❌ Name filter failed");
              return false;
            }

            // ชื่อเรื่อง - partial match
            if (!isEmpty(subject) && !safeIncludes(item.subject, subject)) {
              console.log("❌ Subject filter failed");
              return false;
            }

            // ประเภทเรื่อง - exact match
            if (!isEmpty(issueType) && !exactMatch(item.issueType, issueType)) {
              console.log("❌ IssueType filter failed");
              return false;
            }

            // ชื่อผู้ถูกร้อง - partial match
            if (
              !isEmpty(respondentName) &&
              !safeIncludes(item.respondentName, respondentName)
            ) {
              console.log("❌ Respondent filter failed");
              return false;
            }

            console.log("✅ Item passed all filters");
            return true;
          }),
        }))
        .filter((group) => group.data.length > 0);

      console.log("📋 Filtered result:", filteredData);
      console.log(
        `🎯 Found ${filteredData.reduce(
          (total, group) => total + group.data.length,
          0
        )} items`
      );

      setFilteredGroups(filteredData);
    },
    [allGroups]
  );

  return (
    <>
      <BreadcrumbsService items={breadcrumbItems} />
      <TableFilterList
        title="คัดกรองเรื่องร้องเรียน"
        navigateTo="/admin/edit/search/Filteromplaints/edit"
        groups={filteredGroups}
        issueTypeOptions={ISSUE_TYPE_OPTIONS}
        respondentOptions={RESPONDENT_OPTIONS}
        onSearch={handleSearch}
      />
    </>
  );
};

export default Filteromplaints;
