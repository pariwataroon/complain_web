import React from "react";
import ComplaintSummaryService from "@services/ComplaintSummaryService/ComplaintSummaryService";
import { useRouter } from "next/router";

const ComplaintDetail = () => {
  const { id } = useRouter().query;

  const dataFromAPI = {
    general: {
      general: {
        idCard: "1234567890123",
        name: "นายสมชาย ใจดี",
        address: "123/4 ถ.สุขุมวิท",
        label: "คลองเตย",
        zipcode: "10110",
        email: "somchai@example.com",
        phone: "0812345678",
      },
      delegate: {
        idCard: "3210987654321",
        name: "นางสมหญิง ใจงาม",
        address: "88/1 ถ.เพลินจิต",
        label: "ปทุมวัน",
        zipcode: "10330",
        email: "somying@example.com",
        phone: "0898765432",
      },
      corporate: {},
      signer: {},
    },
    respondent: {
      individual: {
        idCard: "0000000000000",
        name: "นายผู้ถูกร้อง",
        address: "99/1 ถ.ราชดำริ",
        label: "บางรัก",
        zipcode: "10500",
        email: "accused@example.com",
        phone: "0812340000",
      },
      corporate: {},
      government: {},
    },
    complaint: {
      complaintType: "ร้องเรียน",
      subject: "พฤติกรรมไม่เหมาะสม",
      channel: "เว็บไซต์",
      incidentDate: "2025-05-10T14:30:00Z",
      description: "มีการปฏิบัติหน้าที่โดยมิชอบในที่ทำงาน",
      attachment: [
        { name: "evidence.pdf" },
        { name: "photo.jpg" },
      ],
    },
  };

  return <ComplaintSummaryService data={dataFromAPI} />;
};

export default ComplaintDetail;
