import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useCallback } from "react";
import {
  alertSuccess,
  alertError,
  showLoading,
  closeAlert,
} from "@utils/Alerts";

// Validation Schema
const validationSchema = yup.object().shape({
  salutation: yup
    .string()
    .required("กรุณาเลือกคำขึ้นต้น")
    .notOneOf([""], "กรุณาเลือกคำขึ้นต้น"),
  refNo: yup
    .string()
    .required("กรุณากรอกเลข สป.กค.")
    .min(1, "กรุณากรอกเลข สป.กค."),
  date1: yup.string().nullable().required("กรุณาเลือกวันที่"),
  subject: yup
    .string()
    .required("กรุณากรอกเรื่อง")
    .min(5, "เรื่องต้องมีอย่างน้อย 5 ตัวอักษร"),
  bookNo: yup
    .string()
    .required("กรุณากรอกเลขที่หนังสือ")
    .min(1, "กรุณากรอกเลขที่หนังสือ"),
  date2: yup.string().nullable().required("กรุณาเลือกวันที่"),
  signer: yup
    .string()
    .required("กรุณาเลือกผู้ลงนาม")
    .notOneOf([""], "กรุณาเลือกผู้ลงนาม"),
  department: yup
    .string()
    .required("กรุณาเลือกหน่วยงาน")
    .notOneOf([""], "กรุณาเลือกหน่วยงาน"),
  confidentiality: yup
    .string()
    .required("กรุณาเลือกชั้นความลับ")
    .notOneOf([""], "กรุณาเลือกชั้นความลับ"),
  urgency: yup
    .string()
    .required("กรุณาเลือกชั้นความเร่งด่วน")
    .notOneOf([""], "กรุณาเลือกชั้นความเร่งด่วน"),
  attachment: yup.string().required("กรุณาแนบเอกสาร").min(1, "กรุณาแนบเอกสาร"),
  note: yup.string().optional(),
});

// Hook หลัก
export const useForwardToAgencyForm = () => {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid, isDirty },
  } = useForm({
    resolver: yupResolver(validationSchema),
    mode: "onChange",
    defaultValues: {
      salutation: "",
      refNo: "",
      date1: null,
      subject: "",
      bookNo: "",
      date2: null,
      signer: "",
      department: "",
      confidentiality: "",
      urgency: "",
      attachment: "",
      note: "",
    },
  });

  // ฟังก์ชันสำหรับจัดการไฟล์
  const handleFileChange = useCallback(
    (file) => {
      if (file) {
        // ตรวจสอบขนาดไฟล์ (10MB = 10 * 1024 * 1024 bytes)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          alertError(
            "ไฟล์ขนาดใหญ่เกินไป",
            "กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 10MB"
          );
          return;
        }

        setValue("attachment", file.name, { shouldValidate: true });
        console.log("📎 File attached:", {
          name: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          type: file.type,
          uploadedBy: "vampirebeam",
          uploadedAt: "2025-06-16 12:41:38",
        });
      } else {
        setValue("attachment", "", { shouldValidate: true });
      }
    },
    [setValue]
  );

  // ฟังก์ชันสำหรับจัดการวันที่
  const handleDateChange = useCallback(
    (field) => (date) => {
      setValue(field, date, { shouldValidate: true });
      console.log(`📅 Date ${field} changed:`, {
        field,
        value: date,
        changedBy: "vampirebeam",
        changedAt: "2025-06-16 12:41:38",
      });
    },
    [setValue]
  );

  // ฟังก์ชันสำหรับรีเซ็ตฟอร์ม
  const handleClear = useCallback(() => {
    reset({
      salutation: "",
      refNo: "",
      date1: null,
      subject: "",
      bookNo: "",
      date2: null,
      signer: "",
      department: "",
      confidentiality: "",
      urgency: "",
      attachment: "",
      note: "",
    });

    console.log("🧹 Form cleared by vampirebeam at 2025-06-16 12:41:38");
  }, [reset]);

  // ฟังก์ชันสำหรับบันทึกข้อมูล
  const handleSave = useCallback(async (data) => {
    try {
      showLoading("กำลังบันทึกข้อมูล...");

      // สร้างข้อมูลที่จะส่ง พร้อมข้อมูลผู้ใช้และเวลาปัจจุบัน
      const submitData = {
        ...data,
        submittedBy: "vampirebeam",
        submittedAt: "2025-06-16 12:41:38",
        submittedAtThai: new Date("2025-06-16T12:41:38Z").toLocaleString(
          "th-TH",
          {
            timeZone: "Asia/Bangkok",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }
        ),
        formId: `FORM_${Date.now()}`,
        version: "1.0.0",
        sessionId: `SESSION_${Math.random().toString(36).substr(2, 9)}`,
        browserInfo: {
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : "N/A",
          language:
            typeof navigator !== "undefined" ? navigator.language : "th-TH",
          platform:
            typeof navigator !== "undefined" ? navigator.platform : "N/A",
        },
      };

      // Log ข้อมูลที่จะส่ง (สำหรับ development)
      console.log("📋 Form Data to Submit:", submitData);
      console.log("👤 Current User: vampirebeam");
      console.log("🕐 Current Time (UTC): 2025-06-16 12:41:38");
      console.log("🕐 Current Time (Thai): ", submitData.submittedAtThai);
      console.log("🌏 Browser Info:", submitData.browserInfo);

      // จำลองการเรียก API
      await new Promise((resolve) => setTimeout(resolve, 2000));

      closeAlert();

      // สร้าง success message ที่มีข้อมูลรายละเอียด
      const successMessage = `
          <div style="text-align: left; line-height: 1.6;">
            <p style="margin-bottom: 15px; font-size: 16px;">✅ บันทึกแบบรายงานส่งหน่วยงานที่เกี่ยวข้องเรียบร้อยแล้ว</p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
              <p style="margin: 0 0 10px 0; font-weight: 600; color: #495057;">
                📄 <strong>รหัสฟอร์ม:</strong>
              </p>
              <p style="margin: 0 0 15px 20px; font-family: monospace; font-size: 14px; color: #007bff; background: white; padding: 8px; border-radius: 4px; border: 1px solid #dee2e6;">
                ${submitData.formId}
              </p>
              
              <p style="margin: 0 0 10px 0; font-weight: 600; color: #495057;">
                🔢 <strong>รหัสเซสชัน:</strong>
              </p>
              <p style="margin: 0 0 15px 20px; font-family: monospace; font-size: 12px; color: #6c757d; background: white; padding: 6px; border-radius: 4px; border: 1px solid #dee2e6;">
                ${submitData.sessionId}
              </p>
              
              <p style="margin: 0 0 10px 0; font-weight: 600; color: #495057;">
                📋 <strong>สรุปข้อมูล:</strong>
              </p>
              <ul style="margin: 0 0 0 20px; padding: 0; color: #6c757d; font-size: 14px;">
                <li>เรียน: ${data.salutation}</li>
                <li>เลข สป.กค.: ${data.refNo}</li>
                <li>เรื่อง: ${data.subject}</li>
                <li>หน่วยงาน: ${data.department}</li>
                <li>เอกสารแนบ: ${data.attachment}</li>
                <li>ชั้นความลับ: ${data.confidentiality}</li>
                <li>ชั้นความเร่งด่วน: ${data.urgency}</li>
              </ul>
            </div>
            
            <div style="margin-top: 15px; padding: 10px; background: #e3f2fd; border-radius: 4px; border-left: 4px solid #2196f3;">
              <p style="margin: 0; font-size: 12px; color: #1565c0;">
                ⏰ บันทึกเมื่อ: ${submitData.submittedAtThai} | 👤 ผู้บันทึก: ${submitData.submittedBy} | 🌐 เวอร์ชัน: ${submitData.version}
              </p>
            </div>
          </div>
        `;

      await alertSuccess(
        "บันทึกสำเร็จ!",
        successMessage,
        true // ใช้ HTML
      );

      // อาจจะ redirect หรือทำอะไรต่อหลังจากสำเร็จ
      // router.push("/some-success-page");
    } catch (error) {
      closeAlert();
      console.error("❌ Save error:", error);
      await alertError(
        "เกิดข้อผิดพลาด",
        `ไม่สามารถบันทึกข้อมูลได้: ${error.message || "กรุณาลองใหม่อีกครั้ง"}`
      );
    }
  }, []);

  // ฟังก์ชันตรวจสอบว่า field ไหนที่มี error
  const getFieldError = useCallback(
    (fieldName) => {
      return errors[fieldName]?.message;
    },
    [errors]
  );

  // ฟังก์ชันตรวจสอบว่า field ไหนที่ required
  const isRequired = useCallback((fieldName) => {
    const requiredFields = [
      "salutation",
      "refNo",
      "date1",
      "subject",
      "bookNo",
      "date2",
      "signer",
      "department",
      "confidentiality",
      "urgency",
      "attachment",
    ];
    return requiredFields.includes(fieldName);
  }, []);

  // ฟังก์ชันสำหรับดึงข้อมูลปัจจุบันของฟอร์ม
  const getCurrentFormData = useCallback(() => {
    const currentData = watch();
    const requiredFields = [
      "salutation",
      "refNo",
      "date1",
      "subject",
      "bookNo",
      "date2",
      "signer",
      "department",
      "confidentiality",
      "urgency",
      "attachment",
    ];

    return {
      ...currentData,
      formStatus: {
        isValid,
        isDirty,
        errorCount: Object.keys(errors).length,
        completedFields: Object.values(currentData).filter(
          (value) => value !== "" && value !== null && value !== undefined
        ).length,
        totalRequiredFields: requiredFields.length,
        completionPercentage: Math.round(
          (Object.values(currentData).filter(
            (value) => value !== "" && value !== null && value !== undefined
          ).length /
            requiredFields.length) *
            100
        ),
      },
      metadata: {
        lastModified: "2025-06-16 12:41:38",
        modifiedBy: "vampirebeam",
        version: "1.0.0",
      },
    };
  }, [watch, isValid, isDirty, errors]);

  // ฟังก์ชันสำหรับ validation แบบ manual
  const validateField = useCallback((fieldName, value) => {
    try {
      const fieldSchema = validationSchema.fields[fieldName];
      if (fieldSchema) {
        fieldSchema.validateSync(value);
        return null; // ไม่มี error
      }
    } catch (error) {
      return error.message;
    }
    return null;
  }, []);

  const requiredFields = [
    "salutation",
    "refNo",
    "date1",
    "subject",
    "bookNo",
    "date2",
    "signer",
    "department",
    "confidentiality",
    "urgency",
    "attachment",
  ];

  return {
    control,
    handleSubmit,
    errors,
    isValid,
    isDirty,
    watch,
    setValue,
    handleFileChange,
    handleDateChange,
    handleClear,
    handleSave,
    getFieldError,
    isRequired,
    getCurrentFormData,
    validateField,
    requiredFields,
  };
};

export default useForwardToAgencyForm;
