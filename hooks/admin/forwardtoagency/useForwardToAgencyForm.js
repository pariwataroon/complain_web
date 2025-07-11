import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useCallback, useState } from "react";
import {
  alertSuccess,
  alertError,
  showLoading,
  closeAlert,
} from "@utils/Alerts";

// Extended validation schema with file validation
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
  // State to store the actual file object (not just the name)
  const [fileData, setFileData] = useState(null);
  // Add a key state to force file input to re-render
  const [fileInputKey, setFileInputKey] = useState(0);

  // Current time and user from the input
  const currentTime = "2025-07-08 18:24:03";
  const currentUser = "vampirebeam";

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
      confidentiality: "null",
      urgency: "null",
      attachment: "",
      note: "",
    },
  });

  // Function to reset the file input specifically
  const resetFileInput = useCallback(() => {
    setFileData(null);
    setValue("attachment", "", { shouldValidate: true });
    // Increment key to force the file input to re-render
    setFileInputKey((prevKey) => prevKey + 1);
  }, [setValue]);

  // ฟังก์ชันสำหรับจัดการไฟล์
  const handleFileChange = useCallback(
    (fileInput) => {
      // Reset file data if nothing was provided
      if (!fileInput) {
        resetFileInput();
        return;
      }

      // Handle different types of file inputs
      let file;

      // Case 1: fileInput is a File object directly
      if (fileInput instanceof File) {
        file = fileInput;
      }
      // Case 2: fileInput is an Event from input onChange
      else if (fileInput.target && fileInput.target.files) {
        file = fileInput.target.files[0];
      }
      // Case 3: fileInput is an array of files or FileList
      else if (fileInput.length && fileInput[0] instanceof File) {
        file = fileInput[0];
      }
      // Case 4: fileInput might be some custom object containing a file
      else if (fileInput.file && fileInput.file instanceof File) {
        file = fileInput.file;
      } else {
        console.error("Unsupported file input format:", fileInput);
        alertError(
          "รูปแบบไฟล์ไม่ถูกต้อง",
          "ไม่สามารถอ่านข้อมูลไฟล์ได้ กรุณาลองใหม่อีกครั้ง"
        );
        return;
      }

      // Validate the file
      if (!file) {
        alertError("ไม่พบไฟล์", "กรุณาเลือกไฟล์ที่ต้องการอัพโหลด");
        return;
      }

      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        alertError("ไฟล์ขนาดใหญ่เกินไป", "กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 10MB");
        return;
      }

      // Optional: Validate file type if needed
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
      ];

      if (!allowedTypes.includes(file.type)) {
        alertError(
          "ประเภทไฟล์ไม่ถูกต้อง",
          "กรุณาอัพโหลดไฟล์ในรูปแบบ PDF, Word, Excel หรือรูปภาพเท่านั้น"
        );
        return;
      }

      // Store file in state
      setFileData(file);

      // Set the file name in the form
      setValue("attachment", file.name, { shouldValidate: true });

      // Log the file information
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      console.log("📎 File attached:", {
        name: file.name,
        size: `${fileSizeMB} MB`,
        type: file.type,
        uploadedBy: currentUser,
        uploadedAt: currentTime,
        lastModified: new Date(file.lastModified).toISOString(),
      });
    },
    [setValue, resetFileInput, currentTime, currentUser]
  );

  // ฟังก์ชันสำหรับจัดการวันที่
  const handleDateChange = useCallback(
    (field) => (date) => {
      setValue(field, date, { shouldValidate: true });
      console.log(`📅 Date ${field} changed:`, {
        field,
        value: date,
        changedBy: currentUser,
        changedAt: currentTime,
      });
    },
    [setValue, currentTime, currentUser]
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

    // Reset file input completely
    resetFileInput();

    console.log(`🧹 Form cleared by ${currentUser} at ${currentTime}`);
  }, [reset, resetFileInput, currentTime, currentUser]);

  // ฟังก์ชันสำหรับบันทึกข้อมูล
  const handleSave = useCallback(
    async (data) => {
      try {
        showLoading("กำลังบันทึกข้อมูล...");

        // Check if file was attached
        if (!fileData) {
          closeAlert();
          alertError("ไม่พบไฟล์แนบ", "กรุณาอัพโหลดไฟล์ก่อนบันทึกข้อมูล");
          return { success: false };
        }

        // สร้างข้อมูลที่จะส่ง พร้อมข้อมูลผู้ใช้และเวลาปัจจุบัน
        const submitData = {
          ...data,
          fileInfo: {
            name: fileData.name,
            size: fileData.size,
            type: fileData.type,
            lastModified: fileData.lastModified,
          },
          submittedBy: currentUser,
          submittedAt: currentTime,
          submittedAtThai: new Date(currentTime).toLocaleString("th-TH", {
            timeZone: "Asia/Bangkok",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
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
        console.log("📄 File to Upload:", fileData);
        console.log("👤 Current User:", currentUser);
        console.log("🕐 Current Time (UTC):", currentTime);
        console.log("🕐 Current Time (Thai): ", submitData.submittedAtThai);
        console.log("🌏 Browser Info:", submitData.browserInfo);

        // จำลองการเรียก API
        await new Promise((resolve) => setTimeout(resolve, 2000));

        closeAlert();

        // สร้าง success message ที่มีข้อมูลรายละเอียด
        const successMessage = `
          <div style="text-align: center; line-height: 1.6;">
            <p style="margin-bottom: 15px; font-size: 16px;"> บันทึกแบบรายงานส่งหน่วยงานที่เกี่ยวข้องเรียบร้อยแล้ว</p>
          </div>
        `;

        await alertSuccess(
          "บันทึกสำเร็จ!",
          successMessage,
          true // ใช้ HTML
        );

        // Reset form after successful submission
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

        // Reset file input completely
        resetFileInput();

        console.log(
          `🔄 Form reset after successful submission by ${currentUser} at ${currentTime}`
        );

        // Return success status for component to handle
        return { success: true };
      } catch (error) {
        closeAlert();
        console.error("❌ Save error:", error);
        await alertError(
          "เกิดข้อผิดพลาด",
          `ไม่สามารถบันทึกข้อมูลได้: ${error.message || "กรุณาลองใหม่อีกครั้ง"}`
        );
        return { success: false, error };
      }
    },
    [fileData, reset, resetFileInput, currentTime, currentUser]
  );

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
      fileData: fileData
        ? {
            name: fileData.name,
            size: `${(fileData.size / 1024 / 1024).toFixed(2)} MB`,
            type: fileData.type,
          }
        : null,
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
        lastModified: currentTime,
        modifiedBy: currentUser,
        version: "1.0.0",
      },
    };
  }, [watch, isValid, isDirty, errors, fileData, currentTime, currentUser]);

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
    fileData,
    fileInputKey, // Export this key to use in component
    resetFileInput,
  };
};

export default useForwardToAgencyForm;
