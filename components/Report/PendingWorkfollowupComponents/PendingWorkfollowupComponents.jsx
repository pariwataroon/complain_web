import React, { useState, useMemo } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableWorkFollow from "@services/TableWorkFollow/TableWorkFollow";

// mock data (แก้ไขให้สามารถค้นหาได้)
const mockComplaints = [
  {
    id: 1,
    responsibleOfficer: "นางสาวพัชรินทร์ จันทร์โพธิ์",
    receiptNumber: "98/68",
    receiptDate: "20 ม.ค. 2568",
    referenceNumber: "747/67",
    proposeDate: "6 พ.ย. 2567",
    complaint: "เร่งรัดผลการพิจารณา ราษฎรศุภชัย อเจริญ",
    receiveDate: "22 พ.ย. 2567",
    receiveDateObj: new Date(2024, 10, 22), // 22 พ.ย. 2567
    agency: "กรมธนารักษ์",
    letterNumber: "000/000",
    status: "รอแจ้งผลจากหน่วยงาน",
    elapsedDays: 2,
    issueType: "พฤติกรรมเจ้าหน้าที่",
  },
  {
    id: 2,
    responsibleOfficer: "นางสาวสุวิชา ลีละเศรษฐกุล",
    receiptNumber: "98/68",
    receiptDate: "20 ม.ค. 2568",
    referenceNumber: "747/67",
    proposeDate: "6 พ.ย. 2567",
    complaint:
      "แจ้งผลการพิจารณารายผู้ประกอบการก่อสร้าง (บ. ราษฎร์วิศ ดีเวลลอปเมนท์ จำกัด)",
    receiveDate: "11 พ.ย. 2567",
    receiveDateObj: new Date(2024, 10, 11), // 11 พ.ย. 2567
    agency: "กรมบัญชีกลาง",
    letterNumber: "000/000",
    status: "อยู่ระหว่างดำเนินการ",
    elapsedDays: 30,
    issueType: "การเบิกจ่ายงบประมาณ",
  },
  {
    id: 3,
    responsibleOfficer: "นางสาวสุปราณี อาทร",
    receiptNumber: "98/68",
    receiptDate: "20 ม.ค. 2568",
    referenceNumber: "747/67",
    proposeDate: "6 พ.ย. 2567",
    complaint: "แจ้งผลการพิจารณารายนายอุกฤษชัย พจมานต",
    receiveDate: "25 พ.ย. 2567",
    receiveDateObj: new Date(2024, 10, 25), // 25 พ.ย. 2567
    agency: "กรมศุลกากร",
    letterNumber: "000/000",
    status: "รอแจ้งผลจากหน่วยงาน",
    elapsedDays: 1,
    issueType: "ภาษีอากร",
  },
  {
    id: 4,
    responsibleOfficer: "นางสาวสุปราณี อาทร",
    receiptNumber: "98/68",
    receiptDate: "20 ม.ค. 2568",
    referenceNumber: "747/67",
    proposeDate: "6 พ.ย. 2567",
    complaint: "แจ้งผลการพิจารณารายนายดินผล ทิพย์สุทธิ์",
    receiveDate: "21 พ.ย. 2567",
    receiveDateObj: new Date(2024, 10, 21), // 21 พ.ย. 2567
    agency: "กรมสรรพสามิต",
    letterNumber: "000/000",
    status: "รอแจ้งผลจากหน่วยงาน",
    elapsedDays: 3,
    issueType: "ภาษีอากร",
  },
  {
    id: 5,
    responsibleOfficer: "นางสาวพัชรินทร์ จันทร์โพธิ์",
    receiptNumber: "99/68",
    receiptDate: "22 ม.ค. 2568",
    referenceNumber: "748/67",
    proposeDate: "8 พ.ย. 2567",
    complaint: "เรื่องร้องเรียนการให้บริการ",
    receiveDate: "15 พ.ย. 2567",
    receiveDateObj: new Date(2024, 10, 15), // 15 พ.ย. 2567
    agency: "กรมการขนส่งทางบก",
    letterNumber: "001/001",
    status: "อยู่ระหว่างดำเนินการ",
    elapsedDays: 10,
    issueType: "การขนส่งสาธารณะ",
  },
  {
    id: 6,
    responsibleOfficer: "นางสาวสุวิชา ลีละเศรษฐกุล",
    receiptNumber: "100/68",
    receiptDate: "25 ม.ค. 2568",
    referenceNumber: "749/67",
    proposeDate: "10 พ.ย. 2567",
    complaint: "เรื่องการจัดสวัสดิการข้าราชการ",
    receiveDate: "5 พ.ย. 2567",
    receiveDateObj: new Date(2024, 10, 5), // 5 พ.ย. 2567
    agency: "กรมบัญชีกลาง",
    letterNumber: "002/002",
    status: "รอแจ้งผลจากหน่วยงาน",
    elapsedDays: 20,
    issueType: "การจัดสวัสดิการ",
  },
  // เพิ่มข้อมูลเพิ่มเติมเพื่อทดสอบ
  {
    id: 7,
    responsibleOfficer: "นายวิชัย สมบูรณ์",
    receiptNumber: "101/68",
    receiptDate: "26 ม.ค. 2568",
    referenceNumber: "750/67",
    proposeDate: "12 พ.ย. 2567",
    complaint: "เรื่องการจัดทำรายงานประจำปี",
    receiveDate: "1 พ.ย. 2567",
    receiveDateObj: new Date(2024, 10, 1), // 1 พ.ย. 2567
    agency: "กรมส่งเสริมการปกครองท้องถิ่น",
    letterNumber: "003/003",
    status: "อยู่ระหว่างดำเนินการ",
    elapsedDays: 25,
    issueType: "การจัดทำรายงาน",
  },
  {
    id: 8,
    responsibleOfficer: "นางสาวจันทร์ ใจดี",
    receiptNumber: "102/68",
    receiptDate: "27 ม.ค. 2568",
    referenceNumber: "751/67",
    proposeDate: "14 พ.ย. 2567",
    complaint: "เรื่องการให้คำปรึกษาด้านการเงิน",
    receiveDate: "30 ต.ค. 2567",
    receiveDateObj: new Date(2024, 9, 30), // 30 ต.ค. 2567
    agency: "กรมตรวจบัญชีสหกรณ์",
    letterNumber: "004/004",
    status: "รอแจ้งผลจากหน่วยงาน",
    elapsedDays: 28,
    issueType: "การให้คำปรึกษา",
  },
  {
    id: 9,
    responsibleOfficer: "นายสมชาย เก่งมาก",
    receiptNumber: "103/68",
    receiptDate: "28 ม.ค. 2568",
    referenceNumber: "752/67",
    proposeDate: "16 พ.ย. 2567",
    complaint: "เรื่องการพัฒนาบุคลากร",
    receiveDate: "28 พ.ย. 2567",
    receiveDateObj: new Date(2024, 10, 28), // 28 พ.ย. 2567
    agency: "สำนักงาน ก.พ.",
    letterNumber: "005/005",
    status: "อยู่ระหว่างดำเนินการ",
    elapsedDays: 5,
    issueType: "การพัฒนาบุคลากร",
  },
  {
    id: 10,
    responsibleOfficer: "นางประดิษฐ์ รุ่งเรือง",
    receiptNumber: "104/68",
    receiptDate: "29 ม.ค. 2568",
    referenceNumber: "753/67",
    proposeDate: "18 พ.ย. 2567",
    complaint: "เรื่องการส่งเสริมสุขภาพชุมชน",
    receiveDate: "10 ธ.ค. 2567",
    receiveDateObj: new Date(2024, 11, 10), // 10 ธ.ค. 2567
    agency: "กรมอนามัย",
    letterNumber: "006/006",
    status: "รอแจ้งผลจากหน่วยงาน",
    elapsedDays: 15,
    issueType: "การส่งเสริมสุขภาพ",
  },
];

const PendingWorkfollowupComponents = () => {
  const [allComplaints] = useState(mockComplaints);
  const [filteredComplaints, setFilteredComplaints] = useState(mockComplaints);
  const router = useRouter();

  // สร้าง ISSUE_TYPE_OPTIONS จาก mockComplaints โดยใช้ useMemo
  const ISSUE_TYPE_OPTIONS = useMemo(() => {
    console.log("🏗️ Building issue type options from mock data...");

    // ดึงประเภทเรื่องที่ไม่ซ้ำจาก mockComplaints
    const uniqueIssueTypes = [
      ...new Set(mockComplaints.map((item) => item.issueType)),
    ];

    console.log("📝 Unique issue types found:", uniqueIssueTypes);

    // สร้าง options โดยเริ่มจาก "ทั้งหมด" แล้วตามด้วยประเภทที่พบ
    const options = [
      ...uniqueIssueTypes
        .filter((type) => type && type.trim() !== "") // กรองค่าว่าง
        .sort() // เรียงตามลำดับ A-Z
        .map((type) => ({
          value: type,
          label: type,
        })),
    ];

    console.log("✅ Final issue type options:", options);
    return options;
  }, [mockComplaints]); // Dependency on mockComplaints

  // เปลี่ยนหน้า summary
  const handleSummaryByIssueType = () => {
    router.push(
      "/admin/document/new-additional-complaints-summary/summaryresults"
    );
  };

  // ฟังก์ชันแปลง DateThaiPickerService object เป็น Date object
  const convertThaiDateToJs = (thaiDateObj) => {
    console.log("🔄 Converting Thai date:", thaiDateObj);

    if (!thaiDateObj || typeof thaiDateObj !== "object") {
      console.log("❌ Invalid date object");
      return null;
    }

    if (!thaiDateObj.year || !thaiDateObj.month || !thaiDateObj.day) {
      console.log("❌ Missing date components");
      return null;
    }

    // แปลง พ.ศ. เป็น ค.ศ. ถ้าจำเป็น
    let gregorianYear = thaiDateObj.year;
    if (gregorianYear > 2500) {
      gregorianYear = gregorianYear - 543; // แปลง พ.ศ. เป็น ค.ศ.
    }

    const jsDate = new Date(
      gregorianYear,
      thaiDateObj.month - 1,
      thaiDateObj.day
    );
    console.log("✅ Converted to:", jsDate);
    return jsDate;
  };

  // กรองข้อมูลตามวันที่และประเภทเรื่อง
  const handleSearch = (filterData) => {
    console.log("🔍 ==================== SEARCH START ====================");
    console.log("🔍 Received filter data:", filterData);
    console.log("📊 Total items before filter:", allComplaints.length);

    let result = [...allComplaints]; // Copy array เพื่อไม่ให้มีผลกับ original

    // กรองตามวันที่เริ่มต้น
    if (filterData.receiveDateFrom) {
      console.log("📅 Filtering by FROM date...");
      const fromDate = convertThaiDateToJs(filterData.receiveDateFrom);

      if (fromDate) {
        console.log("📅 FROM Date (JS):", fromDate.toLocaleDateString("th-TH"));
        const beforeFilter = result.length;

        result = result.filter((item) => {
          const itemDate = item.receiveDateObj;
          const isMatch = itemDate >= fromDate;
          console.log(
            `🗓️ ${item.complaint} | Item: ${itemDate.toLocaleDateString(
              "th-TH"
            )} | From: ${fromDate.toLocaleDateString("th-TH")} | Match: ${
              isMatch ? "✅" : "❌"
            }`
          );
          return isMatch;
        });

        console.log(
          `📊 After FROM filter: ${result.length} / ${beforeFilter} items`
        );
      }
    }

    // กรองตามวันที่สิ้นสุด
    if (filterData.receiveDateTo) {
      console.log("📅 Filtering by TO date...");
      const toDate = convertThaiDateToJs(filterData.receiveDateTo);

      if (toDate) {
        // ตั้งเวลาเป็น 23:59:59 เพื่อให้รวมวันที่สิ้นสุดด้วย
        toDate.setHours(23, 59, 59, 999);
        console.log("📅 TO Date (JS):", toDate.toLocaleDateString("th-TH"));
        const beforeFilter = result.length;

        result = result.filter((item) => {
          const itemDate = item.receiveDateObj;
          const isMatch = itemDate <= toDate;
          console.log(
            `🗓️ ${item.complaint} | Item: ${itemDate.toLocaleDateString(
              "th-TH"
            )} | To: ${toDate.toLocaleDateString("th-TH")} | Match: ${
              isMatch ? "✅" : "❌"
            }`
          );
          return isMatch;
        });

        console.log(
          `📊 After TO filter: ${result.length} / ${beforeFilter} items`
        );
      }
    }

    // กรองตามประเภทเรื่อง
    if (filterData.issueType && filterData.issueType !== "") {
      console.log("🏷️ Filtering by issue type:", filterData.issueType);
      const beforeFilter = result.length;

      result = result.filter((item) => {
        const isMatch = item.issueType === filterData.issueType;
        console.log(
          `🏷️ ${item.complaint} | Type: ${item.issueType} | Filter: ${
            filterData.issueType
          } | Match: ${isMatch ? "✅" : "❌"}`
        );
        return isMatch;
      });

      console.log(
        `📊 After TYPE filter: ${result.length} / ${beforeFilter} items`
      );
    }

    console.log("✨ ==================== SEARCH RESULT ====================");
    console.log(
      "✨ Final filtered results:",
      result.map((item) => ({
        id: item.id,
        complaint: item.complaint,
        receiveDate: item.receiveDate,
        issueType: item.issueType,
        responsibleOfficer: item.responsibleOfficer,
      }))
    );
    console.log(
      `📊 FINAL Results: ${result.length} / ${allComplaints.length} items`
    );
    console.log("🔍 ==================== SEARCH END ====================");

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
          { label: "รายงานการติดตามงานค้าง" },
        ]}
      />

      <TableWorkFollow
        data={filteredComplaints}
        onSearch={handleSearch}
        actionButtonLabel="สรุปผลตามประเภทเรื่อง"
        onActionClick={handleSummaryByIssueType}
        filterFields={[
          {
            name: "receiveDateFrom",
            label: "ตั้งแต่วันที่",
            type: "date",
            placeholder: "เลือกวันที่เริ่มต้น",
          },
          {
            name: "receiveDateTo",
            label: "ถึงวันที่",
            type: "date",
            placeholder: "เลือกวันที่สิ้นสุด",
          },
          {
            name: "issueType",
            label: "ประเภทเรื่อง",
            type: "select",
            options: ISSUE_TYPE_OPTIONS, // ← ใช้ options ที่สร้างจาก mock data
          },
        ]}
      />
    </>
  );
};

export default PendingWorkfollowupComponents;
