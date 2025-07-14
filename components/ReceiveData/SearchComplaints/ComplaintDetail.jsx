import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ComplaintSummaryService from "@services/ComplaintSummaryService/ComplaintSummaryService";
import { GetComplaintByID } from "@pages/api/complaint/complaint";

// mockupData ตามโครงสร้างที่ให้มา
export const mockupData = {
  complainant: {
    idCard: "",
    name: "",
    address: "",
    label: "", // ตำบล/แขวง
    district: "", // อำเภอ/เขต
    province: "", // จังหวัด
    zipcode: "",
    email: "",
    phone: "",
  },
  delegate: {
    idCard: "",
    name: "",
    address: "",
    label: "", // ตำบล/แขวง
    district: "", // อำเภอ/เขต
    province: "", // จังหวัด
    zipcode: "",
    email: "",
    phone: "",
  },
  corporate: {
    idCard: "",
    name: "",
    address: "",
    label: "",
    district: "",
    province: "",
    zipcode: "",
    email: "",
    phone: "",
  },
  signer: {
    idCard: "",
    name: "",
    address: "",
    label: "",
    district: "",
    province: "",
    zipcode: "",
    email: "",
    phone: "",
  },
  respondent: {
    idCard: "",
    name: "",
    address: "",
    label: "", // ตำบล/แขวง
    district: "", // อำเภอ/เขต
    province: "", // จังหวัด
    zipcode: "",
    email: "",
    phone: "",
  },
  corporateS2: {
    idCard: "",
    name: "",
    address: "",
    label: "",
    district: "",
    province: "",
    zipcode: "",
    email: "",
    phone: "",
  },
  government: {
    idCard: "",
    name: "",
    address: "",
    label: "",
    district: "",
    province: "",
    zipcode: "",
    email: "",
    phone: "",
  },
  complaint: {
    complaintType: "",
    subject: "",
    channel: "",
    incidentDate: "",
    description: "",
  },
  files: [{ name: "" }, { name: "" }, { name: "" }],
};

// ฟังก์ชัน mapping ที่ควรใช้ค่าจาก API มาฝังใส่ mockupData (ถ้าต้องการ map จริง ให้ใช้โครงนี้)
function mapComplaintData(raw) {
  if (!raw) return { ...mockupData };

  // ตัวอย่าง mapping: ให้ copy โครง mockupData มา แล้วฝังค่าจาก raw ลงในแต่ละ field
  return {
    complainant: {
      idCard: raw.step1?.general?.idCard || "",
      name: raw.step1?.general?.name || "",
      address: raw.step1?.general?.address || "",
      subdistricts: raw.step1?.general?.subdistricts?.label || "",
      district: raw.step1?.general?.districts?.label || "",
      province: raw.step1?.general?.province?.label || "",
      zipcode: raw.step1?.general?.zipcode?.label || "",
      email: raw.step1?.general?.email || "",
      phone: raw.step1?.general?.phone || "",
    },
    delegate: {
      idCard: raw.step1?.general?.delegate?.idCard || "",
      name: raw.step1?.general?.delegate?.name || "",
      address: raw.step1?.general?.delegate?.address || "",
      subdistricts: raw.step1?.general?.delegate?.subdistricts?.label || "",
      district: raw.step1?.general?.delegate?.districts?.label || "",
      province: raw.step1?.general?.delegate?.province?.label || "",
      zipcode: raw.step1?.general?.delegate?.zipcode?.label || "",
      email: raw.step1?.general?.delegate?.email || "",
      phone: raw.step1?.general?.delegate?.phone || "",
    },
    corporate: {
      idCard: raw.step1?.general?.general?.idCard || "",
      name: raw.step1?.general?.general?.name || "",
      address: raw.step1?.general?.general?.address || "",
      subdistricts: raw.step1?.general?.general?.subdistricts?.label || "",
      district: raw.step1?.general?.general?.districts?.label || "",
      province: raw.step1?.general?.general?.province?.label || "",
      zipcode: raw.step1?.general?.general?.zipcode?.label || "",
      email: raw.step1?.general?.general?.email || "",
      phone: raw.step1?.general?.general?.phone || "",
    },
    signer: {
      idCard: raw.step1?.general?.signer?.idCard || "",
      name: raw.step1?.general?.signer?.name || "",
      address: raw.step1?.general?.signer?.address || "",
      subdistricts: raw.step1?.general?.signer?.subdistricts?.label || "",
      district: raw.step1?.general?.signer?.districts?.label || "",
      province: raw.step1?.general?.signer?.province?.label || "",
      zipcode: raw.step1?.general?.signer?.zipcode?.label || "",
      email: raw.step1?.general?.signer?.email || "",
      phone: raw.step1?.general?.signer?.phone || "",
    },
    respondent: {
      idCard: raw.step2?.general?.individual?.idCard || "",
      name: raw.step2?.general?.individual?.name || "",
      address: raw.step2?.general?.individual?.address || "",
      subdistricts: raw.step2?.general?.individual?.subdistricts?.label || "",
      district: raw.step2?.general?.individual?.districts?.label || "",
      province: raw.step2?.general?.individual?.province?.label || "",
      zipcode: raw.step2?.general?.individual?.zipcode?.label || "",
      email: raw.step2?.general?.individual?.email || "",
      phone: raw.step2?.general?.individual?.phone || "",
    },
    corporateS2: {
      idCard: raw.step2?.general?.corporate?.idCard || "",
      name: raw.step2?.general?.corporate?.name || "",
      address: raw.step2?.general?.corporate?.address || "",
      subdistricts: raw.step2?.general?.corporate?.subdistricts?.label || "",
      district: raw.step2?.general?.corporate?.districts?.label || "",
      province: raw.step2?.general?.corporate?.province?.label || "",
      zipcode: raw.step2?.general?.corporate?.zipcode?.label || "",
      email: raw.step2?.general?.corporate?.email || "",
      phone: raw.step2?.general?.corporate?.phone || "",
    },
    government: {
      idCard: raw.step2?.general?.government?.idCard || "",
      name: raw.step2?.general?.government?.name || "",
      address: raw.step2?.general?.government?.address || "",
      subdistricts: raw.step2?.general?.government?.subdistricts?.label || "",
      district: raw.step2?.general?.government?.districts?.label || "",
      province: raw.step2?.general?.government?.province?.label || "",
      zipcode: raw.step2?.general?.government?.zipcode?.label || "",
      email: raw.step2?.general?.government?.email || "",
      phone: raw.step2?.general?.government?.phone || "",
    },
    complaint: {
      complaintType: raw.step3?.general?.complaintType || "",
      subject: raw.step3?.general?.subject || raw.subject || "",
      channel: raw.assignment_form?.complaint_channel_name || "",
      incidentDate: raw.step3?.general?.incidentDate || "",
      description: raw.step3?.general?.description || "",
    },
    files: Array.isArray(raw.step3?.general?.attachment)
      ? raw.step3.general.attachment.map((f) => ({
          name: f.name || f.filename || "",
          url: f.url || "",
        }))
      : [],
  };
}

const ComplaintDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState(mockupData);

  const handleSubmit = () => {
    router.push("/admin/edit/search/");
  };
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const res = await GetComplaintByID(id);
      console.log("res?.res_data", res?.res_data);
      setData(mapComplaintData(res?.res_data));
    };
    fetchData();
  }, [id]);

  // ใช้ mockupData เสมอ (สำหรับ dev/mock)
  return <ComplaintSummaryService data={data} handleSubmit={handleSubmit} />;
};

export default ComplaintDetail;
