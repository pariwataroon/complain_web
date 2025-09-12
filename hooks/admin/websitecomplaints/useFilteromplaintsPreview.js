import { useState } from "react";
import { UpdateAssignmentCompleteByAdmin } from "@pages/api/complaint/complaint";
import { alertSuccess, alertError } from "@utils/Alerts";

const useFilteromplaintsPreview = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateAssignment = async (complaint_id, formData, userInfo) => {
    if (!complaint_id) {
      throw new Error("ไม่พบ ID เรื่องร้องทุกข์");
    }

    if (!formData) {
      throw new Error("ไม่พบข้อมูลที่จะส่ง");
    }

    setIsSubmitting(true);

    try {
      const currentDateTime = new Date().toISOString();
      const currentUser = userInfo
        ? `${userInfo.first_name || ""} ${userInfo.last_name || ""}`.trim() ||
        "ผู้ใช้ไม่ระบุชื่อ"
        : "ผู้ใช้ไม่ระบุชื่อ";

      // เตรียมข้อมูลตาม API Body format และ Database Schema
      const step3Data = formData.step3?.general || {};

      const additionalDetails = formData.step4?.general || {};
      // ดึง assigned_officer_id จาก responsibleOfficer object
      const assignedOfficerId =
        additionalDetails.responsibleOfficer?.id ||
        additionalDetails.responsibleOfficerId ||
        additionalDetails.responsibleOfficer ||
        "";

      const preparedData = {};

      // ข้อมูลเลขที่อ้างอิงจากระบบอื่น (ส่งเฉพาะที่มีค่า)
      if (step3Data.referenceNumber1) {
        preparedData.reference_number = step3Data.referenceNumber1;
      }
      if (step3Data.referenceDate1) {
        preparedData.reference_date = step3Data.referenceDate1;
      }
      if (step3Data.referenceNumber2) {
        preparedData.reference_number2 = step3Data.referenceNumber2;
      }
      if (step3Data.referenceDate2) {
        preparedData.reference_date2 = step3Data.referenceDate2;
      }
      if (step3Data.referenceNumber3) {
        preparedData.reference_number3 = step3Data.referenceNumber3;
      }
      if (step3Data.referenceDate3) {
        preparedData.reference_date3 = step3Data.referenceDate3;
      }
      // เลข สรร. (สารบัญ) ต้องส่งที่ reference_number4 (ไม่ใช่ complaint_number)
      if (step3Data.referenceNumber4) {
        preparedData.reference_number4 = step3Data.referenceNumber4;
      }
      if (step3Data.referenceDate4) {
        preparedData.reference_date4 = step3Data.referenceDate4;
      }

      // เลขที่หนังสือ
      if (step3Data.documentNumber) {
        preparedData.document_number = step3Data.documentNumber;
      }
      if (step3Data.documentDate) {
        preparedData.document_date = step3Data.documentDate;
      }

      // หน่วยงานที่ส่งเรื่องมาถึง กค. (กันค่าหาย: ใช้ค่าจากฟอร์มหรือ fallback จาก assignment_form)
      const senderAgencyId =
        step3Data.senderAgency ??
        formData?.assignment_form?.agency_sender ??
        formData?.step3?.general?.agency_sender ??
        null;
      if (senderAgencyId) {
        preparedData.agency_sender = senderAgencyId;
      }
      // console.debug("[prepared] agency_sender:", preparedData.agency_sender);

      // เรื่อง
      if (step3Data.subject) {
        preparedData.subject = step3Data.subject;
      }

      // ความลับและความเร่งด่วน (map ค่าให้ตรงกับ enum)
      if (step3Data.securityLevel) {
        // UI ควรส่งค่าที่ตรง enum แล้ว: normal, confidential, secret, top_secret
        // เผื่อค่าอื่น/พิมพ์ผิด → fallback เป็น normal
        const confidentialityMap = {
          normal: "normal",
          confidential: "confidential",
          secret: "secret",
          top_secret: "top_secret",
        };
        preparedData.confidentiality_level =
          confidentialityMap[step3Data.securityLevel] || "normal";
      }

      if (step3Data.urgencyLevel) {
        // UI ใช้ค่าเดียวกับ enum ฝั่ง API แล้ว: low, medium, high, urgent, critical
        // เผื่อกรณีเก่าที่ยังเป็น normal/very_urgent → map ให้ตรงด้วย
        const urgencyMap = {
          low: "low",
          medium: "medium",
          high: "high",
          urgent: "urgent",
          critical: "critical",
          normal: "low", // backward compat
          very_urgent: "high", // backward compat
        };
        preparedData.urgency_level = urgencyMap[step3Data.urgencyLevel] || "low";
      }

      // ประเภทการร้องเรียน - จาก complaintFilingType
      if (step3Data.complaintFilingType) {
        const complaintFilingMap = {
          new: "new",
          additional: "additional",
          committee: "anonymous",
        };
        preparedData.complaint_filing_type =
          complaintFilingMap[step3Data.complaintFilingType] || "new";
      } else {
        preparedData.complaint_filing_type = "new"; // default
      }

      // ข้อมูล checkbox สำหรับการร้องเรียน
      preparedData.new_complaint = step3Data.new_complaint || false;
      preparedData.add_more_complaint_to_ref =
        step3Data.add_more_complaint_to_ref || false;
      preparedData.group_work = step3Data.group_work || false;

      // เลขที่อ้างอิงเพิ่มเติม
      if (
        step3Data.additional_reference_number1 ||
        step3Data.additionalReference1
      ) {
        preparedData.additional_reference_number1 =
          step3Data.additional_reference_number1 ||
          step3Data.additionalReference1;
      }
      if (
        step3Data.additional_reference_date1 ||
        step3Data.additionalReferenceDate1
      ) {
        preparedData.additional_reference_date1 =
          step3Data.additional_reference_date1 ||
          step3Data.additionalReferenceDate1;
      }
      if (
        step3Data.additional_reference_number2 ||
        step3Data.additionalReference2
      ) {
        preparedData.additional_reference_number2 =
          step3Data.additional_reference_number2 ||
          step3Data.additionalReference2;
      }
      if (
        step3Data.additional_reference_date2 ||
        step3Data.additionalReferenceDate2
      ) {
        preparedData.additional_reference_date2 =
          step3Data.additional_reference_date2 ||
          step3Data.additionalReferenceDate2;
      }

      // ประเภทเรื่องร้องเรียน
      if (step3Data.complaintType) {
        preparedData.complaint_type_id = step3Data.complaintType;
      }

      // ประเภทเรื่องย่อย (แก้ mapping ให้ถูกต้อง: backend ต้องการ complaint_subtype_id)
      if (step3Data.complaintSubType) {
        preparedData.complaint_subtype_id = step3Data.complaintSubType;
      }

      // วันที่รับเรื่องและเสนองาน
      if (additionalDetails.officerReceivedDate) {
        preparedData.officer_received_date =
          additionalDetails.officerReceivedDate;
      }
      if (additionalDetails.directorSubmittedDate) {
        preparedData.director_submitted_date =
          additionalDetails.directorSubmittedDate;
      }
      if (additionalDetails.incidentDate) {
        preparedData.incident_date = additionalDetails.incidentDate;
      }

      // หมายเหตุการคัดกรอง
      if (additionalDetails.screeningRemarks) {
        preparedData.assigned_remark = additionalDetails.screeningRemarks;
      }

      // ข้อมูลการประมวลผล - ใช้ assigned_officer_id จาก responsibleOfficer
      preparedData.registration_date = currentDateTime || "";
      preparedData.assigned_officer_id = assignedOfficerId;
      preparedData.assigned_remark = additionalDetails.screeningRemarks || "";
      preparedData.assigned_date = currentDateTime;
      preparedData.assignment_reason = "";

      // Debug ช่วยตรวจสอบ payload ก่อนส่ง
      // console.log("Prepared assignment payload:", preparedData);

      // ตรวจสอบข้อมูลจำเป็น
      if (!preparedData.assigned_officer_id) {
        throw new Error("กรุณาเลือกเจ้าหน้าที่ผู้รับผิดชอบ");
      }



      // เรียก API
      const response = await UpdateAssignmentCompleteByAdmin(
        complaint_id,
        preparedData
      );

      // ตรวจสอบผลลัพธ์
      if (response?.success || response?.res_code === "0000" || (response?.httpStatus >= 200 && response?.httpStatus < 300)) {
        alertSuccess("บันทึกข้อมูลเรียบร้อยแล้ว");
        return response;
      } else if (response?.res_code === "4000") {
        alertError(
          `ข้อมูลไม่ถูกต้อง: ${response?.res_desc || "กรุณาตรวจสอบข้อมูล"}`
        );
        throw new Error(response?.res_desc || "ข้อมูลที่ส่งมาไม่ถูกต้อง");
      } else {
        alertError(
          `เกิดข้อผิดพลาด: ${response?.res_desc || "การส่งข้อมูลไม่สำเร็จ"}`
        );
        throw new Error(response?.res_desc || "การส่งข้อมูลไม่สำเร็จ");
      }
    } catch (error) {
      // แสดงรายละเอียดจาก server ถ้ามี
      const serverMsg = error?.response?.data?.res_desc || error?.message;

      // แสดง error message ที่เหมาะสม
      if (
        !error.message.includes("ข้อมูลไม่ถูกต้อง") &&
        !error.message.includes("การส่งข้อมูลไม่สำเร็จ") &&
        !error.message.includes("กรุณาเลือกเจ้าหน้าที่ผู้รับผิดชอบ")
      ) {
        alertError(serverMsg || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }

      throw error;
    } finally {
      // ใช้ setTimeout เพื่อให้ UI มีเวลาแสดงผล
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
    }
  };

  return {
    isSubmitting,
    handleUpdateAssignment,
  };
};

export default useFilteromplaintsPreview;
