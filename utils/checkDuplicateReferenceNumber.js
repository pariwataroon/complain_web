import { GetComplaintByReferenceNumber1 } from "@pages/api/complaint/complaint";

/**
 * ตรวจสอบว่าเลข สป.กค. (reference_number1) ซ้ำกับเรื่องอื่นในระบบหรือไม่
 *
 * @param {string} referenceNumber1 - เลข สป.กค. ที่ต้องการตรวจสอบ
 * @param {string|null} currentComplaintId - ID ของเรื่องปัจจุบัน (สำหรับกรณี update — ไม่นับตัวเอง)
 * @returns {{ isDuplicate: boolean, existingComplaint: object|null, errorMessage: string|null }}
 */
const checkDuplicateReferenceNumber = async (referenceNumber1, currentComplaintId = null) => {
  // ถ้าไม่มีเลข ไม่ต้องตรวจ
  if (!referenceNumber1 || (typeof referenceNumber1 === "string" && referenceNumber1.trim() === "")) {
    return { isDuplicate: false, existingComplaint: null, errorMessage: null };
  }

  const trimmed = referenceNumber1.trim();

  try {
    const res = await GetComplaintByReferenceNumber1({
      reference_number1: trimmed,
      limit: 10,
    });

    // ดึง list จาก response (รองรับหลาย format ของ backend)
    const complaints = res?.res_data || res?.data || [];

    if (!Array.isArray(complaints) || complaints.length === 0) {
      return { isDuplicate: false, existingComplaint: null, errorMessage: null };
    }

    // กรณี update: กรองเอาเรื่องปัจจุบันออก (ถ้ามี ID ส่งมา)
    const existing = complaints.find(
      (c) => String(c.id) !== String(currentComplaintId)
    );

    if (existing) {
      const subject = existing.subject || existing.step3?.general?.subject || "(ไม่มีหัวเรื่อง)";
      const complaintNumber =
        existing.complaint_number ||
        existing.assignment_form?.complaint_number ||
        "-";
      return {
        isDuplicate: true,
        existingComplaint: existing,
        errorMessage: `เลข สป.กค. <strong>${trimmed}</strong> มีอยู่ในระบบแล้ว<br/><br/>เรื่อง: ${subject}<br/>เลขที่รับ: ${complaintNumber}`,
      };
    }

    return { isDuplicate: false, existingComplaint: null, errorMessage: null };
  } catch (error) {
    // ถ้า API ล้ม ให้ log แต่ไม่ block — ปล่อยให้บันทึกต่อ (เหมือน EOffice checkDuplicate pattern)
    console.warn("⚠️ ไม่สามารถตรวจสอบเลข สป.กค. ซ้ำได้:", error);
    return { isDuplicate: false, existingComplaint: null, errorMessage: null };
  }
};

export default checkDuplicateReferenceNumber;
