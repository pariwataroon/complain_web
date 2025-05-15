import React, { useState } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableAnnualCompSum from "@services/TableAnnualCompSum/TableAnnualCompSum";

const mockComplaints = [
  {
    id: 1,
    agency: "สำนักงานปลัดกระทรวงการคลัง / สำนักงานรัฐมนตรี",
    total: 22,
    closed: 20,
    ongoing: 2,
    children: [
      {
        id: 101,
        agency: "กลุ่มงานบริหารงานทั่วไป",
        total: 8,
        closed: 7,
        ongoing: 1,
      },
      {
        id: 102,
        agency: "กลุ่มงานนโยบายเศรษฐกิจมหภาค",
        total: 5,
        closed: 5,
        ongoing: 0,
      },
      {
        id: 103,
        agency: "กลุ่มงานตรวจสอบภายใน",
        total: 9,
        closed: 8,
        ongoing: 1,
      },
    ],
  },
  {
    id: 2,
    agency: "กรมธนารักษ์",
    total: 16,
    closed: 9,
    ongoing: 7,
    children: [
      {
        id: 201,
        agency: "สำนักบริหารทรัพย์สิน",
        total: 6,
        closed: 4,
        ongoing: 2,
      },
      {
        id: 202,
        agency: "สำนักปฏิบัติการธนารักษ์",
        total: 4,
        closed: 2,
        ongoing: 2,
      },
      { id: 203, agency: "สำนักพัฒนาระบบ", total: 6, closed: 3, ongoing: 3 },
    ],
  },
  {
    id: 3,
    agency: "กรมบัญชีกลาง",
    total: 4,
    closed: 2,
    ongoing: 2,
    children: [
      {
        id: 301,
        agency: "กลุ่มงานเบิกจ่ายเงินเดือน",
        total: 2,
        closed: 1,
        ongoing: 1,
      },
      {
        id: 302,
        agency: "กลุ่มงานบัญชีเงินทุน",
        total: 1,
        closed: 1,
        ongoing: 0,
      },
      {
        id: 303,
        agency: "กลุ่มงานพัสดุและทรัพย์สิน",
        total: 1,
        closed: 0,
        ongoing: 1,
      },
    ],
  },
  {
    id: 4,
    agency: "กรมศุลกากร",
    total: 2,
    closed: null,
    ongoing: 2,
    children: [
      {
        id: 401,
        agency: "ด่านศุลกากรกรุงเทพฯ",
        total: 1,
        closed: null,
        ongoing: 1,
      },
      {
        id: 402,
        agency: "ด่านศุลกากรท่าเรือ",
        total: 1,
        closed: null,
        ongoing: 1,
      },
    ],
  },
  {
    id: 5,
    agency: "กรมสรรพสามิต",
    total: 4,
    closed: 1,
    ongoing: 3,
    children: [
      {
        id: 501,
        agency: "กลุ่มตรวจสอบภาษีสรรพสามิต",
        total: 2,
        closed: 1,
        ongoing: 1,
      },
      {
        id: 502,
        agency: "กลุ่มบริหารภาษีสรรพสามิต",
        total: 1,
        closed: 0,
        ongoing: 1,
      },
      { id: 503, agency: "ศูนย์ข้อมูลกลาง", total: 1, closed: 0, ongoing: 1 },
    ],
  },
  {
    id: 6,
    agency: "กรมสรรพากร (เลี่ยงภาษี/คืนภาษีล่าช้า/ร้องเรียนเจ้าหน้าที่)",
    total: 2,
    closed: 1,
    ongoing: 1,
    children: [
      {
        id: 601,
        agency: "สำนักสนับสนุนจัดเก็บภาษี",
        total: 1,
        closed: 1,
        ongoing: 0,
      },
      {
        id: 602,
        agency: "กองคืนภาษีและปรับปรุงข้อมูล",
        total: 1,
        closed: 0,
        ongoing: 1,
      },
    ],
  },
  {
    id: 7,
    agency: "สำนักงานคณะกรรมการนโยบายรัฐวิสาหกิจ (สคร.)",
    total: null,
    closed: null,
    ongoing: null,
    children: [
      {
        id: 701,
        agency: "กลุ่มวิเคราะห์และติดตามผล",
        total: null,
        closed: null,
        ongoing: null,
      },
      {
        id: 702,
        agency: "กลุ่มกำกับกิจการรัฐวิสาหกิจ",
        total: null,
        closed: null,
        ongoing: null,
      },
    ],
  },
  {
    id: 8,
    agency: "สำนักงานบริหารหนี้สาธารณะ (สบน.)",
    total: 7,
    closed: 4,
    ongoing: 3,
    children: [
      {
        id: 801,
        agency: "กลุ่มบริหารหนี้สาธารณะ",
        total: 3,
        closed: 2,
        ongoing: 1,
      },
      {
        id: 802,
        agency: "กลุ่มติดตามและปรับโครงสร้างหนี้",
        total: 4,
        closed: 2,
        ongoing: 2,
      },
    ],
  },
  {
    id: 9,
    agency:
      "สำนักงานเศรษฐกิจการคลัง (สศค.) (โครงการเราชนะ/บัตรสวัสดิการฯ/หนี้สิน/เงินทุนฯ)",
    total: 4,
    closed: null,
    ongoing: 4,
    children: [
      {
        id: 901,
        agency: "กลุ่มโครงการการเงินภาคประชาชน",
        total: 2,
        closed: null,
        ongoing: 2,
      },
      {
        id: 902,
        agency: "กลุ่มวิเคราะห์นโยบายสวัสดิการ",
        total: 2,
        closed: null,
        ongoing: 2,
      },
    ],
  },
  {
    id: 10,
    agency: "อื่นๆ",
    total: 8,
    closed: 6,
    ongoing: 2,
    children: [
      {
        id: 1001,
        agency: "สำนักงานผู้ตรวจการแผ่นดิน",
        total: 2,
        closed: 1,
        ongoing: 1,
      },
      {
        id: 1002,
        agency: "คณะกรรมการการเลือกตั้ง",
        total: 2,
        closed: 2,
        ongoing: 0,
      },
      {
        id: 1003,
        agency: "สำนักงานตำรวจแห่งชาติ",
        total: 4,
        closed: 3,
        ongoing: 1,
      },
    ],
  },
];

const AnnualComplaintSummaryComponents = () => {
  const [allComplaints] = useState(mockComplaints);
  const [filteredComplaints, setFilteredComplaints] = useState(mockComplaints);
  const router = useRouter();

  // เปลี่ยนหน้า summary
  const handleSummaryByIssueType = () => {
    router.push(
      "/admin/document/new-additional-complaints-summary/summaryresults"
    );
  };

  // กรองข้อมูลตามวันที่และประเภทเรื่อง
  const handleSearch = ({ receiveDateFrom, receiveDateTo, issueType }) => {
    let result = allComplaints;

    if (receiveDateFrom) {
      result = result.filter((item) =>
        item.receiveDate.includes(receiveDateFrom)
      );
    }
    if (receiveDateTo) {
      result = result.filter((item) =>
        item.receiveDate.includes(receiveDateTo)
      );
    }
    if (issueType) {
      result = result.filter((item) => item.issueType === issueType);
    }

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
          { label: "รายงานสรุปเรื่องร้องเรียนประจำปีงบประมาณ" },
        ]}
      />

      <TableAnnualCompSum
        data={filteredComplaints}
        onSearch={handleSearch}
        actionButtonLabel="สรุปผลตามประเภทเรื่อง"
        onActionClick={handleSummaryByIssueType}
        navigateTo="/admin/document/annual-complaint-summary/reportresults"
        filterFields={[
          {
            name: "receiveDateFrom",
            label: "ตั้งแต่วันที่",
            type: "date",
          },
          {
            name: "receiveDateTo",
            label: "ถึงวันที่",
            type: "date",
          },
        ]}
      />
    </>
  );
};

export default AnnualComplaintSummaryComponents;
