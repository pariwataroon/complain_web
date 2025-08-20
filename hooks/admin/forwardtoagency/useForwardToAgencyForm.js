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
import {
  CreateOutgoingReport,
  UploadOutgoingReportAttachments,
} from "@pages/api/outgoinreports/outgoinreports";

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
  const [fileData, setFileData] = useState(null);
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
      position_id: "",
      reference_number: "",
      reference_date: null,
      subject: "",
      complaint_number: "",
      complaint_number_date: null,
      signature_authority_user_id: "",
      department_id: "",
      confidentiality_level: "null",
      urgency_level: "null",
      attachment: "",
      remarks: "",
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

    },
    [setValue, resetFileInput, currentTime, currentUser]
  );

  // ฟังก์ชันสำหรับจัดการวันที่
  const handleDateChange = useCallback(
    (field) => (date) => {
      setValue(field, date, { shouldValidate: true });
      
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

  }, [reset, resetFileInput, currentTime, currentUser]);

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
          reference_number: data.refNo,
          reference_date: data.date1,
          subject: data.subject,
          complaint_number: data.bookNo,
          complaint_number_date: data.date2,
          signature_authority_user_id: data.signer,
          department_id: data.department,
          confidentiality_level: data.confidentiality,
          urgency_level: data.urgency,
          remarks: data.note || "",
        };


        showLoading("กำลังสร้างรายงาน...");

        // 🔍 Add try-catch specifically for API call
        let createResponse;
        try {
          createResponse = await CreateOutgoingReport(outgoingReportData);
        } catch (apiError) {
          console.error("🚨 API Call Error:", apiError);
          console.error("🚨 API Error Details:", {
            message: apiError.message,
            response: apiError.response,
            status: apiError.response?.status,
            statusText: apiError.response?.statusText,
            data: apiError.response?.data,
          });

        }


        if (createResponse === null || createResponse === undefined) {
          console.error("❌ createResponse is null or undefined");
        }
        if (createResponse === null || createResponse === undefined) {
          console.error("❌ No response received from CreateOutgoingReport");
        }

        if (typeof createResponse !== "object") {
          console.error("❌ Invalid response type:", typeof createResponse);
          console.error("❌ Response value:", createResponse);
        }


        // 🔍 แก้ไขการตรวจสอบ success ตาม API response จริง
        const isSuccess =
          createResponse.success === true ||
          createResponse.success === "true" ||
          createResponse.res_code === "0001" ||
          createResponse.res_message === "CREATE_DATA_SUCCESSFULLY" ||
          (createResponse.res_code &&
            createResponse.res_code.toString().startsWith("2")) ||
          createResponse.status === "success";

        if (!isSuccess) {
          console.error("❌ API indicated failure:", createResponse);

          const errorSources = [
            createResponse?.res_data?.error,
            createResponse?.res_data?.message,
            createResponse?.res_message,
            createResponse?.message,
            createResponse?.error,
            createResponse?.data?.error,
            createResponse?.data?.message,
          ].filter(Boolean);

          const errorMessage =
            errorSources[0] || "ไม่สามารถสร้างรายงานได้ (ไม่ทราบสาเหตุ)";

          console.error("❌ Final error message:", errorMessage);

          closeAlert();
          await alertError("เกิดข้อผิดพลาด", errorMessage);
          return { success: false };
        }

        const reportId = createResponse.res_data?.id;
        console.log({ reportId });
        
        if (!reportId) {
          console.error("❌ No report ID found in response:", createResponse);
        }


        // Step 2: อัพโหลดไฟล์แนบ (ถ้ามีไฟล์)
        if (reportId) {
          showLoading("กำลังอัพโหลดไฟล์แนบ...");

          const fileForUpload = prepareFileAsFormData(fileData);

          try {
            const uploadResponse = await UploadOutgoingReportAttachments(
              fileForUpload,
              reportId
            );

            if (!uploadResponse || !uploadResponse.success) {
              console.warn("⚠️ File upload failed:", uploadResponse?.message);
              await alertError(
                "คำเตือน",
                "สร้างรายงานสำเร็จแล้ว แต่ไม่สามารถอัพโหลดไฟล์แนบได้: " +
                  (uploadResponse?.message ||
                    uploadResponse?.res_message ||
                    "ไม่ทราบสาเหตุ")
              );
            }
          } catch (uploadError) {
            console.error("❌ File upload error:", uploadError);
            await alertError(
              "คำเตือน",
              "สร้างรายงานสำเร็จแล้ว แต่ไม่สามารถอัพโหลดไฟล์แนบได้: " +
                (uploadError.message || "ไม่ทราบสาเหตุ")
            );
          }
        }

        closeAlert();

        const successMessage = `
        <div style="text-align: center; line-height: 1.6;">
          <p style="margin-bottom: 15px; font-size: 16px;">บันทึกแบบรายงานส่งหน่วยงานที่เกี่ยวข้องเรียบร้อยแล้ว</p>
          <p style="margin-bottom: 10px; color: #666;">รหัสรายงาน: <strong>${reportId}</strong></p>
          <p style="margin-bottom: 10px; color: #666;">เรื่อง: <strong>${
            data.subject
          }</strong></p>
          ${
            fileData
              ? `<p style="color: #666;">ไฟล์แนบ: <strong>${fileData.name}</strong></p>`
              : ""
          }
        </div>
      `;

        await alertSuccess("บันทึกสำเร็จ!", successMessage, true);

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

        resetFileInput();

        return {
          success: true,
          reportId: reportId,
          data: createResponse.res_data || createResponse.data,
        };
      } catch (error) {
        closeAlert();
        console.error("❌ Save error:", error);
        console.error("❌ Error stack:", error.stack);

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

        console.error("❌ Final error message:", errorMessage);
        await alertError("เกิดข้อผิดพลาด", errorMessage);
        return { success: false, error };
      }
    },
    [fileData, reset, resetFileInput, currentTime, currentUser]
  );

  const prepareFileAsFormData = (file, reportId) => {
    const formData = new FormData();
    formData.append("file", file);
    return formData;
  };

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
