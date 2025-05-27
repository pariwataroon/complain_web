// pages/admin/ComplaintArchives.jsx
import React, { useState } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListFollowing from "@services/TableListFollowing/TableListFollowing";

/* -------------------------------------------------------------------------- */
/*  breadcrumbs                                                               */
/* -------------------------------------------------------------------------- */
const breadcrumbItems = [
  {
    label: "ติดตามผลการดำเนินการ",
    icon: (
      <img
        src="/icons/Cube.png"
        alt="cube"
        style={{ width: 24, height: 24, marginBottom: -8 }}
      />
    ),
  },
];

/* -------------------------------------------------------------------------- */
/*  mock data                                                                 */
/* -------------------------------------------------------------------------- */
const mockComplaints = [
  {
    id: 1,
    claimantName: "นางสาวอนิภัทร มีความสุข",
    agency: "กรมสรรพากร",
    ssoNo: "97/68",
    issue: "พฤติกรรมเจ้าหน้าที่ที่กระทำรุนแรงต่อประชาชน",
    issueType: "พฤติกรรมเจ้าหน้าที่",
    receiveDate: "30 ม.ค. 2568",
    status: "อยู่ระหว่างการดำเนินการ",
  },
  {
    id: 2,
    claimantName: "นายคำบัว วงการ",
    agency: "โรงพยาบาลไท่",
    ssoNo: "97/69",
    issue: "ไม่สามารถขออนุญาตทำการพยาบาลได้",
    issueType: "บริการสาธารณสุข",
    receiveDate: "29 ม.ค. 2568",
    status: "อยู่ระหว่างการดำเนินการ",
  },
  {
    id: 3,
    claimantName: "นางสาวกมลวรรณ ณเณ่",
    agency: "กรมสรรพสามิต",
    ssoNo: "97/70",
    issue: "การขับขี่โดยไม่มีใบอนุญาต",
    issueType: "การแก้ไขปัญหาหนี้สิน",
    receiveDate: "28 ม.ค. 2568",
    status: "ยุติ",
  },
  // … เพิ่ม mock ให้ครอบคลุมตามต้องการ …
];

/* -------------------------------------------------------------------------- */
/*  สร้าง statusOptions จาก mockComplaints                                   */
/* -------------------------------------------------------------------------- */
const statusOptions = [
  { value: "", label: "ทั้งหมด" },
  // กรอง unique status จาก mockComplaints:
  ...Array.from(new Set(mockComplaints.map((c) => c.status))).map((s) => ({
    value: s,
    label: s,
  })),
];

const ComplaintArchives = () => {
  const [allComplaints] = useState(mockComplaints);
  const [filteredComplaints, setFilteredComplaints] = useState(mockComplaints);
  const router = useRouter();

  const handleSearch = ({ claimantName, agency, ssoNo, status }) => {
    const result = allComplaints.filter((item) => {
      if (claimantName && !item.claimantName.includes(claimantName))
        return false;
      if (agency && !item.agency.includes(agency)) return false;
      if (ssoNo && !item.ssoNo.includes(ssoNo)) return false;
      if (status && item.status !== status) return false;
      return true;
    });
    setFilteredComplaints(result);
  };

  return (
    <>
      <BreadcrumbsService items={breadcrumbItems} />

      <TableListFollowing
        data={filteredComplaints}
        title="ติดตามผลการดำเนินการ"
        navigateTo="/admin/StackedLineChart"
        statusOptions={statusOptions}
        onSearch={handleSearch}
      />
    </>
  );
};

export default ComplaintArchives;
