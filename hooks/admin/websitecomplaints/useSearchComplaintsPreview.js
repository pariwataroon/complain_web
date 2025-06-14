import { useState } from "react";
import { UpdateAssignmentCompleteByAdmin } from "@pages/api/complaint/complaint";
import { alertSuccess, alertError } from "@utils/Alerts";

const useSearchComplaintsPreview = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateAssignment = async (complaint_id, formData, userInfo) => {
    console.log("=== Hook: handleUpdateAssignment called ===");
    console.log("Complaint ID:", complaint_id);
    console.log(
      "Raw Form Data from SearchComplaints:",
      JSON.stringify(formData, null, 2)
    );
    console.log("User Info:", userInfo);

    // Validation
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

      // Get user ID for assigned_officer_id
      const assignedOfficerId = userInfo?.user_id || userInfo?.id || "";

      console.log("Current User:", currentUser);
      console.log("Current DateTime:", currentDateTime);
      console.log("Assigned Officer ID:", assignedOfficerId);

      // เตรียมข้อมูลตาม API Body format และ Database Schema
      const step3Data = formData.step3?.general || {};
      const additionalDetails = formData.step4?.general || {};

      const preparedData = {};

      // ข้อมูลเลขที่อ้างอิงจากระบบอื่น (ส่งเฉพาะที่มีค่า)
      if (step3Data.referenceNumber1) {
        preparedData.reference_number1 = step3Data.referenceNumber1;
      }
      if (step3Data.referenceDate1) {
        preparedData.reference_date1 = step3Data.referenceDate1;
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

      // หน่วยงานที่ส่งเรื่องมาถึง กค.
      if (step3Data.senderAgency) {
        preparedData.agency_sender = step3Data.senderAgency;
      }

      // ความลับและความเร่งด่วน (map ค่าให้ตรงกับ enum)
      if (step3Data.securityLevel) {
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
        const urgencyMap = {
          normal: "low",
          urgent: "medium",
          very_urgent: "high",
        };
        preparedData.urgency_level =
          urgencyMap[step3Data.urgencyLevel] || "low";
      }

      // ประเภทการร้องเรียน
      if (step3Data.complaintType) {
        const complaintFilingMap = {
          new: "new",
          additional: "additional",
          committee: "anonymous",
        };
        preparedData.complaint_filing_type =
          complaintFilingMap[step3Data.complaintType] || "new";
      }

      // เลขที่อ้างอิงเพิ่มเติม
      if (step3Data.additionalReference1) {
        preparedData.additional_reference_number1 =
          step3Data.additionalReference1;
      }
      if (step3Data.additionalReferenceDate1) {
        preparedData.additional_reference_date1 =
          step3Data.additionalReferenceDate1;
      }
      if (step3Data.additionalReference2) {
        preparedData.additional_reference_number2 =
          step3Data.additionalReference2;
      }
      if (step3Data.additionalReferenceDate2) {
        preparedData.additional_reference_date2 =
          step3Data.additionalReferenceDate2;
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
      if (additionalDetails.additionalDescription) {
        preparedData.additional_description =
          additionalDetails.additionalDescription;
      }

      // ข้อมูลการประมวลผล
      preparedData.registration_date = currentDateTime || "";
      preparedData.assigned_officer_id = assignedOfficerId || "";
      preparedData.assigned_remark = "";
      preparedData.assigned_date = currentDateTime;
      preparedData.assignment_reason = "";

      console.log(
        "Prepared Data for API:",
        JSON.stringify(preparedData, null, 2)
      );

      // เรียก API
      const response = await UpdateAssignmentCompleteByAdmin(
        complaint_id,
        preparedData
      );

      console.log("✅ API call completed");
      console.log("=== API Response ===", response);

      // ตรวจสอบผลลัพธ์
      if (response?.res_code === "0000") {
        console.log("✅ API Success - res_code: 0000");
        alertSuccess("บันทึกข้อมูลเรียบร้อยแล้ว");
        return response;
      } else if (response?.res_code === "4000") {
        console.log("⚠️ API Error - res_code: 4000");
        console.log("ข้อมูลที่ส่งมาไม่ถูกต้อง:", response?.res_desc);
        alertError(
          `ข้อมูลไม่ถูกต้อง: ${response?.res_desc || "กรุณาตรวจสอบข้อมูล"}`
        );
        throw new Error(response?.res_desc || "ข้อมูลที่ส่งมาไม่ถูกต้อง");
      } else {
        console.log("❌ API Error - Unexpected response:", response);
        alertError(
          `เกิดข้อผิดพลาด: ${response?.res_desc || "การส่งข้อมูลไม่สำเร็จ"}`
        );
        throw new Error(response?.res_desc || "การส่งข้อมูลไม่สำเร็จ");
      }
    } catch (error) {
      console.error("❌ Error in handleUpdateAssignment:", error);

      // แสดง error message ที่เหมาะสม
      if (
        !error.message.includes("ข้อมูลไม่ถูกต้อง") &&
        !error.message.includes("การส่งข้อมูลไม่สำเร็จ")
      ) {
        alertError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
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

export default useSearchComplaintsPreview;
