import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import {
  alertSuccess,
  alertError,
  showLoading,
  closeAlert,
} from "@utils/Alerts";
import {
  CreateOutgoingReport,
  UploadOutgoingReportAttachments,
} from "@pages/api/outgoinreports/outgoinreports";
import axiosInstance from "@pages/api/axiosInstance";

// Extended validation schema with file validation
const validationSchema = yup.object().shape({
  salutation: yup
    .string()
    .required("กรุณาเลือกคำขึ้นต้น")
    .notOneOf([""], "กรุณาเลือกคำขึ้นต้น"),
  // เมื่อเลือก 'อื่นๆ' ให้ต้องระบุข้อความเพิ่มเติม (ใช้ flag salutation_is_other)
  position_other_text: yup.string().when("salutation_is_other", (isOther, schema) => {
    return isOther
      ? schema
        .required("กรุณาระบุตำแหน่ง (อื่นๆ)")
        .min(2, "กรุณาระบุอย่างน้อย 2 ตัวอักษร")
      : schema.optional().nullable();
  }),

  complaint_number: yup
    .string()
    .required("กรุณากรอกเลข สป.กค.")
    .min(1, "กรุณากรอกเลข สป.กค."),

  complaint_number_date: yup
    .string()
    .nullable()
    .required("กรุณาเลือกวันที่ของเลข สป.กค."),

  subject: yup
    .string()
    .required("กรุณากรอกเรื่อง")
    .min(5, "เรื่องต้องมีอย่างน้อย 5 ตัวอักษร"),

  document_number: yup
    .string()
    .required("กรุณากรอกเลขที่หนังสือ")
    .min(1, "กรุณากรอกเลขที่หนังสือ"),

  document_date: yup
    .string()
    .nullable()
    .required("กรุณาเลือกวันที่หนังสือ"),

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

  attachment: yup
    .string()
    .required("กรุณาแนบเอกสาร")
    .min(1, "กรุณาแนบเอกสาร"),

  note: yup.string().optional(),
});


const toYMD = (d) => {
  if (!d) return null;
  const dt = new Date(d);

  // ใช้ค่า Local แทน UTC
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
};

// Fallback mapping from numeric value to API label (in case caller passes numbers)
const levelLabelMap = {
  confidentiality: {
    1: "ปกติ",
    2: "ลับ",
    3: "ลับมาก",
    4: "ลับที่สุด",
  },
  urgency: {
    1: "ปกติ",
    2: "เร่งด่วน",
    3: "เร่งด่วนมาก",
    4: "เร่งด่วนที่สุด",
  },
};

const mapLevel = (val, type) => {
  if (val == null) return "";
  // If already a non-numeric string, return as is
  if (typeof val === "string" && isNaN(Number(val))) return val;
  const n = Number(val);
  return levelLabelMap[type]?.[n] || String(val);
};


// Hook หลัก
export const useForwardToAgencyForm = () => {
  const [fileData, setFileData] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  // Current time and user from the input
  const currentTime = "2025-09-03 07:30:42";
  const currentUser = "vampirebeam";
  const router = useRouter();

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
      salutation_is_other: false,
      position_other_text: "",
      complaint_number: "",
      complaint_id: "",
      complaint_number_date: null,
      subject: "",
      document_number: "",
      document_date: null,
      signer: "",
      department: "",
      confidentiality: "",
      urgency: "",
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

      let files = [];

      // Handle different types of file inputs
      if (fileInput instanceof File) {
        files = [fileInput];
      } else if (fileInput.target && fileInput.target.files) {
        files = Array.from(fileInput.target.files);
      } else if (Array.isArray(fileInput)) {
        files = fileInput.filter((f) => f instanceof File);
      } else if (fileInput.length && fileInput[0] instanceof File) {
        files = Array.from(fileInput);
      } else if (fileInput.file && fileInput.file instanceof File) {
        files = [fileInput.file];
      } else {
        console.error("Unsupported file input format:", fileInput);
        alertError(
          "รูปแบบไฟล์ไม่ถูกต้อง",
          "ไม่สามารถอ่านข้อมูลไฟล์ได้ กรุณาลองใหม่อีกครั้ง"
        );
        return;
      }

      // Validate files
      if (!files.length) {
        alertError("ไม่พบไฟล์", "กรุณาเลือกไฟล์ที่ต้องการอัพโหลด");
        return;
      }

      // Check each file
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
      ];

      for (const file of files) {
        if (file.size > maxSize) {
          alertError("ไฟล์ขนาดใหญ่เกินไป", `ไฟล์ ${file.name} มีขนาดเกิน 10MB`);
          return;
        }

        if (!allowedTypes.includes(file.type)) {
          alertError(
            "ประเภทไฟล์ไม่ถูกต้อง",
            `ไฟล์ ${file.name} ไม่ใช่ประเภทที่รองรับ`
          );
          return;
        }
      }

      // Store files in state (single file or array)
      setFileData(files.length === 1 ? files[0] : files);

      // Set file names in the form
      const fileNames = files.map((f) => f.name).join(", ");
      setValue("attachment", fileNames, { shouldValidate: true });
    },
    [setValue, resetFileInput]
  );

  // ฟังก์ชันสำหรับจัดการวันที่
  const handleDateChange = useCallback(
    (field) => (date) => {
      setValue(field, date, { shouldValidate: true });
    },
    [setValue]
  );

  // ฟังก์ชันสำหรับรีเซ็ตฟอร์ม
  const handleClear = useCallback(() => {
    reset({
      salutation: "",
      salutation_is_other: false,
      position_other_text: "",
      complaint_number: "",
      complaint_number_date: null,
      subject: "",
      document_number: "",
      document_date: null,
      signer: "",
      department: "",
      confidentiality: "",
      urgency: "",
      attachment: "",
      note: "",
    });

    // Reset file input completely
    resetFileInput();
  }, [reset, resetFileInput]);

  // ✅ แก้ไข prepareFileAsFormData function
  const prepareFileAsFormData = useCallback((file) => {
    const formData = new FormData();

    // ✅ เปลี่ยนจาก "file" เป็น "files"
    if (Array.isArray(file)) {
      // ถ้าเป็น array ของไฟล์
      file.forEach((f) => {
        formData.append("files", f);
      });
    } else {
      // ถ้าเป็นไฟล์เดียว
      formData.append("files", file);
    }

    return formData;
  }, []);

  const handleSave = useCallback(
    async (data) => {
      try {
        showLoading("กำลังบันทึกข้อมูล...");

        if (!fileData) {
          closeAlert();
          alertError("ไม่พบไฟล์แนบ", "กรุณาอัพโหลดไฟล์ก่อนบันทึกข้อมูล");
          return { success: false };
        }

        const outgoingReportData = {
          position_id: data.salutation,
          // ส่งข้อความกรณีเลือก "อื่นๆ" (ใช้ flag หรือมีค่าจริง)
          position_other_text: (data.salutation_is_other || data.position_other_text)
            ? (data.position_other_text || "").trim()
            : "",
          reference_number: (data.complaint_number || "").trim(),   // ใช้ complaint_number เป็น reference
          reference_date: toYMD(data.complaint_number_date),        // ใช้ complaint_number_date เป็น reference_date
          subject: (data.subject || "").trim(),
          complaint_number: (data.complaint_number || "").trim(),   // เลข สป.กค.
          complaint_id: data.complaint_id || null,
          complaint_number_date: toYMD(data.complaint_number_date),
          document_number: (data.document_number || "").trim(),
          document_date: toYMD(data.document_date),
          signature_authority_user_id: data.signer,
          department_id: data.department,
          confidentiality_level: mapLevel(data.confidentiality, "confidentiality"),
          urgency_level: mapLevel(data.urgency, "urgency"),
          remarks: data.note || "",
        };

        // Debug payload for 422 troubleshooting (visible in dev console)
        try { console.debug("OutgoingReport payload", outgoingReportData); } catch { }

        showLoading("กำลังสร้างรายงาน...");

        // Create report first
        let createResponse;
        try {
          createResponse = await CreateOutgoingReport(outgoingReportData);
        } catch (apiError) {
          console.error("🚨 API Call Error:", apiError);
          throw apiError;
        }

        if (!createResponse) {
          throw new Error("ไม่ได้รับ response จาก API");
        }

        // Check if creation was successful
        const isSuccess =
          createResponse.success === true ||
          createResponse.success === "true" ||
          createResponse.res_code === "0001" ||
          createResponse.res_message === "CREATE_DATA_SUCCESSFULLY" ||
          (createResponse.res_code &&
            createResponse.res_code.toString().startsWith("2")) ||
          createResponse.status === "success";

        if (!isSuccess) {
          const errorSources = [
            createResponse?.res_data?.error,
            createResponse?.res_data?.message,
            createResponse?.res_message,
            createResponse?.message,
            createResponse?.error,
          ].filter(Boolean);

          const errorMessage = errorSources[0] || "ไม่สามารถสร้างรายงานได้";

          // throw new Error(errorMessage);
          closeAlert();
          await alertError("เกิดข้อผิดพลาด", errorMessage);
          return { success: false, error: errorMessage };
        }

        const reportId = createResponse.res_data?.id;

        if (!reportId) {
          throw new Error("ไม่พบ ID ของรายงานที่สร้างขึ้น");
        }

        // Upload files with multi-strategy fallback
        if (fileData) {
          showLoading("กำลังอัพโหลดไฟล์แนบ...");

          const buildFormData = (useSingleKey = false) => {
            const formData = new FormData();
            if (Array.isArray(fileData)) {
              fileData.forEach((f) => formData.append(useSingleKey ? 'file' : 'files', f, f.name));
            } else {
              formData.append(useSingleKey ? 'file' : 'files', fileData, fileData.name);
            }
            return formData;
          };

          let uploadOk = false;
          let lastErrorMsg = '';

          // Attempt 1: /outgoing-reports/{id}/attachments (generic endpoint)
          try {
            const up1 = await UploadOutgoingReportAttachments(buildFormData(false), reportId);
            uploadOk = !!(up1 && (up1.success === true || up1.res_code === '0001'));
            if (!uploadOk) {
              lastErrorMsg = up1?.res_data?.error || up1?.res_message || up1?.message || '';
            }
          } catch (err1) {
            const data = err1?.response?.data;
            lastErrorMsg = data?.res_data?.error || data?.res_message || err1.message || '';
            console.error('Upload attempt #1 (generic) failed', data || err1);
          }

          // Attempt 2: /outgoing-reports/{id}/attachments with single file key
          if (!uploadOk && Array.isArray(fileData) && fileData.length === 1) {
            try {
              const up2 = await UploadOutgoingReportAttachments(buildFormData(true), reportId);
              uploadOk = !!(up2 && (up2.success === true || up2.res_code === '0001'));
              if (!uploadOk) {
                lastErrorMsg = up2?.res_data?.error || up2?.res_message || up2?.message || lastErrorMsg;
              }
            } catch (err2) {
              const data = err2?.response?.data;
              lastErrorMsg = data?.res_data?.error || data?.res_message || err2.message || lastErrorMsg;
              console.error('Upload attempt #2 (single key) failed', data || err2);
            }
          }

          // Attempt 3: direct API call to /outgoing-reports/{id}/attachments
          if (!uploadOk) {
            try {
              const up3 = await axiosInstance.post(`/outgoing-reports/${reportId}/attachments`, buildFormData(false));
              uploadOk = !!up3?.data;
            } catch (err3) {
              const data = err3?.response?.data;
              lastErrorMsg = data?.res_data?.error || data?.res_message || err3.message || lastErrorMsg;
              console.error('Upload attempt #3 (direct API) failed', data || err3);
            }
          }

          if (!uploadOk) {
            console.warn('⚠️ บันทึกรายงานสำเร็จแต่แนบไฟล์ไม่สำเร็จ', lastErrorMsg);
            // Don't throw error, just warn user
          }
        }

        closeAlert();

        const successMessage = `
        <div style="text-align: center; line-height: 1.6;">
          <p style="margin-bottom: 15px; font-size: 16px;">บันทึกแบบรายงานส่งหน่วยงานที่เกี่ยวข้องเรียบร้อยแล้ว</p>
          <p style="margin-bottom: 10px; color: #666;">รหัสรายงาน: <strong>${reportId}</strong></p>
          <p style="margin-bottom: 10px; color: #666;">เรื่อง: <strong>${data.subject
          }</strong></p>
          ${fileData
            ? `<p style="color: #666;">ไฟล์แนบ: <strong>${Array.isArray(fileData)
              ? fileData.map((f) => f.name).join(", ")
              : fileData.name
            }</strong></p>`
            : ""
          }
        </div>
        `;

        await alertSuccess("บันทึกสำเร็จ!", successMessage, true);
        router.push(`/admin/box/list`);

        reset({
          salutation: "",
          salutation_is_other: false,
          position_other_text: "",
          complaint_number: "",
          complaint_id: "",
          complaint_number_date: null,
          subject: "",
          document_number: "",
          document_date: null,
          signer: "",
          department: "",
          confidentiality: "",
          urgency: "",
          attachment: "",
          note: "",
        });

        resetFileInput();

        return {
          success: true,
          reportId: reportId,
          data: createResponse.res_data || createResponse.data,
        };
      } catch (error) {
        closeAlert();
        console.error("❌ Save error:", error);

        let errorMessage = "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง";

        if (error.response?.data) {
          const responseData = error.response.data;

          if (responseData.res_code === "4090") {
            errorMessage =
              responseData.res_data?.error || "เลข สป.กค. มีอยู่แล้ว";
          } else {
            errorMessage =
              responseData.res_data?.error ||
              responseData.res_message ||
              responseData.message ||
              errorMessage;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        await alertError("เกิดข้อผิดพลาด", errorMessage);
        return { success: false, error };
      }
    },
    [fileData, reset, resetFileInput, router, prepareFileAsFormData]
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
      "complaint_number",
      "complaint_number_date",
      "subject",
      "document_number",
      "document_date",
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
      "complaint_number",
      "complaint_number_date",
      "subject",
      "document_number",
      "document_date",
      "signer",
      "department",
      "confidentiality",
      "urgency",
      "attachment",
    ];

    return {
      ...currentData,
      fileData: fileData
        ? Array.isArray(fileData)
          ? fileData.map((f) => ({
            name: f.name,
            size: `${(f.size / 1024 / 1024).toFixed(2)} MB`,
            type: f.type,
          }))
          : {
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
    // position_other_text: required เฉพาะเมื่อเลือก 'อื่นๆ' จึงไม่ใส่ในชุดบังคับหลัก
    "complaint_number",
    "complaint_number_date",
    "subject",
    "document_number",
    "document_date",
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
    fileInputKey,
    resetFileInput,
  };
};

export default useForwardToAgencyForm;
