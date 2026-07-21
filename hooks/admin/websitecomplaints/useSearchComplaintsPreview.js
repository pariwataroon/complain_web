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

      // เตรียมข้อมูลตาม API Body format
      const step3Data = formData.step3?.general || {};
      const additionalDetails = formData.step4?.general || {};

      // สร้างข้อมูลตาม API schema ที่ต้องการ
      const preparedData = {
        // ข้อมูลผู้รับผิดชอบ
        assigned_officer_id: assignedOfficerId || "",
        assigned_remark: "",
        assigned_date: formData?.assignment_form?.assigned_date || formData?.assigned_date || currentDateTime,
        assignment_reason: "",

        // ข้อมูลประเภทเรื่องร้องเรียน
        complaint_type_id:
          step3Data.complaintTypeID || step3Data.complaintType || "",
        complaint_subtype_id: step3Data.complaintSubType || "",
        complaint_channel_id: step3Data.complaintChannel || "",

        // วันที่ลงทะเบียน - ใช้ค่าเดิมถ้ามี ไม่ทับด้วยวันปัจจุบัน
        registration_date: additionalDetails.officerReceivedDate || formData?.assignment_form?.registration_date || currentDateTime,

        // ระดับความลับและความเร่งด่วน
        confidentiality_level: (() => {
          const confidentialityMap = {
            normal: "normal",
            confidential: "confidential",
            secret: "secret",
            top_secret: "top_secret",
          };
          return confidentialityMap[step3Data.securityLevel] || "normal";
        })(),

        // urgency_level: Use value from form directly (low|medium|high|urgent|critical)
        // Previous mapping caused all non-mapped values to fall back to 'low'
        urgency_level: (() => {
          const allowed = ["low", "medium", "high", "urgent", "critical"]; // backend accepted values
          if (allowed.includes(step3Data.urgencyLevel)) return step3Data.urgencyLevel;
          // handle legacy values accidentally stored
          const legacyMap = {
            normal: "low",
            very_urgent: "urgent",
            emergency: "critical",
          };
          if (legacyMap[step3Data.urgencyLevel]) return legacyMap[step3Data.urgencyLevel];
          // fallback to existing assignment_form urgency_level if present
          return formData?.assignment_form?.urgency_level || "low";
        })(),

        // เลขที่อ้างอิงจากระบบต่างๆ
        reference_number1: step3Data.referenceNumber1 || "",
        reference_date1: step3Data.referenceDate1 || "",
        reference_number2: step3Data.referenceNumber2 || "",
        reference_date2: step3Data.referenceDate2 || "",
        reference_number3: step3Data.referenceNumber3 || "",
        reference_date3: step3Data.referenceDate3 || "",
        reference_number4: step3Data.referenceNumber4 || "",
        reference_date4: step3Data.referenceDate4 || "",

        // ประเภทการยื่นเรื่อง
        complaint_filing_type: (() => {
          const currentType = step3Data.complaint_filing_type || "new";
          const complaintFilingMap = {
            new: "new",
            additional: "additional",
            committee: "anonymous",
          };
          return complaintFilingMap[currentType] || "new";
        })(),

        // เลขที่หนังสือและวันที่
        document_number: step3Data.documentNumber || "",
        document_date: step3Data.documentDate || "",

        // หน่วยงานที่ได้รับมอบหมาย
        assigned_agency: step3Data.senderAgency || "",

        // ประเภทเรื่องร้องเรียน (boolean)
        new_complaint:
          step3Data.complaint_filing_type === "new" ||
          step3Data.isNewComplaint === true ||
          !step3Data.complaint_filing_type, // default เป็น new

        add_more_complaint_to_ref:
          step3Data.complaint_filing_type === "additional" ||
          step3Data.isAdditionalComplaint === true,

        group_work:
          step3Data.complaint_filing_type === "committee" ||
          step3Data.isCommitteeComplaint === true,

        // เลขที่กฎระเบียบอ้างอิง
        regulation_reference: step3Data.regulationReference || "",
      };

      // เพิ่มข้อมูลเลขที่อ้างอิงเพิ่มเติมถ้ามี (บัตรสนเทศไม่ส่ง ref1 เพื่อหลีกเลี่ยง self-reference error)
      if (step3Data.additionalReference1 && step3Data.complaint_filing_type !== "committee" && step3Data.isCommitteeComplaint !== true) {
        preparedData.additional_reference_number1 =
          step3Data.additionalReference1;
      }
      if (step3Data.additionalReferenceDate1 && step3Data.complaint_filing_type !== "committee" && step3Data.isCommitteeComplaint !== true) {
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

      // เพิ่มข้อมูลจาก step4 ถ้ามี
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

      console.log(
        "Prepared Data for API (Complete):",
        JSON.stringify(preparedData, null, 2)
      );

      console.log("[DEBUG] Selected form urgencyLevel:", step3Data.urgencyLevel);
      console.log("[DEBUG] Payload urgency_level:", preparedData.urgency_level);

      // เรียก API
      const response = await UpdateAssignmentCompleteByAdmin(
        complaint_id,
        preparedData
      );

      console.log("✅ API call completed");
      console.log("=== API Response ===", response);

      // ตรวจสอบผลลัพธ์
      if (response?.success || response?.res_code === "0000" || (response?.httpStatus >= 200 && response?.httpStatus < 300)) {
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
