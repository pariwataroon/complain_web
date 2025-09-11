import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useCallback, useState, useRef } from "react";
import { useRouter } from "next/router";
import {
  alertSuccess,
  alertError,
  showLoading,
  closeAlert,
} from "@utils/Alerts";
import { CreateOutgoingReport, UploadOutgoingReportAttachments } from "@pages/api/outgoinreports/outgoinreports";
import { getDepartments } from "@pages/api/department/department";
import axiosInstance from "@pages/api/axiosInstance";

// Extended validation schema with file validation
const validationSchema = yup.object().shape({
  salutation_is_other: yup.boolean().default(false),
  salutation: yup
    .string()
    .required("กรุณาเลือกคำขึ้นต้น")
    .notOneOf([""], "กรุณาเลือกคำขึ้นต้น"),
  // เมื่อเลือก 'อื่นๆ' ให้ต้องระบุข้อความเพิ่มเติม (ใช้ flag salutation_is_other)
  position_other_text: yup
    .string()
    .when("salutation_is_other", {
      is: true,
      then: (schema) => schema
        .required("กรุณาระบุตำแหน่ง (อื่นๆ)")
        .min(2, "กรุณาระบุอย่างน้อย 2 ตัวอักษร"),
      otherwise: (schema) => schema.optional().nullable(),
    }),

  complaint_number: yup
    .string()
    .required("กรุณากรอกเลข สป.กค.")
    .min(1, "กรุณากรอกเลข สป.กค."),

  complaint_number_date: yup
    .date()
    .typeError("กรุณาเลือกวันที่ของเลข สป.กค.")
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
    .date()
    .typeError("กรุณาเลือกวันที่หนังสือ")
    .nullable()
    .required("กรุณาเลือกวันที่หนังสือ"),

  signer: yup
    .string()
    .required("กรุณาเลือกผู้ลงนาม")
    .notOneOf([""], "กรุณาเลือกผู้ลงนาม"),

  department: yup
    .string()
    .when('salutation_is_other', {
      is: true,
      then: (schema) => schema.optional().nullable(),
      otherwise: (schema) => schema.required("กรุณาเลือกหน่วยงาน").notOneOf([""], "กรุณาเลือกหน่วยงาน"),
    }),

  confidentiality: yup
    .mixed()
    .test(
      "confidentiality-required",
      "กรุณาเลือกชั้นความลับ",
      (val) => val !== undefined && val !== null && val !== ""
    ),

  urgency: yup
    .mixed()
    .test(
      "urgency-required",
      "กรุณาเลือกชั้นความเร่งด่วน",
      (val) => val !== undefined && val !== null && val !== ""
    ),

  // หมายเหตุ: ในหน้าแก้ไข ไม่จำเป็นต้องแนบไฟล์ใหม่ หากมีไฟล์เดิมอยู่แล้ว
  attachment: yup
    .string()
    .nullable()
    .optional(),

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

const uuidv4 = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const isUUID = (s) => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
// Position fallback (match other reports)
const POSITION_FALLBACK = "7e18e4fe-d416-4580-b4d4-2a4032f67770";


// Hook หลัก
export const useForwardToAgencyForm = () => {
  const [fileData, setFileData] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const originalDepartmentIdRef = useRef(null);
  const lastDepartmentIdRef = useRef(null);

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
    trigger,
    formState: { errors, isValid, isDirty },
  } = useForm({
    resolver: yupResolver(validationSchema),
    mode: "onChange",
    shouldUnregister: true,
    defaultValues: {
      salutation: "",
      salutation_is_other: false,
      position_other_text: "",
      complaint_number: "",
  original_department_id: "",
      complaint_id: "",
      complaint_number_date: null,
      subject: "",
      document_number: "",
      document_date: null,
      signer: "",
  position_id: "",
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
  position_id: "",
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

        // หมายเหตุ: ไม่บังคับอัพโหลดไฟล์ใหม่ หากไฟล์เดิมครบหรือผู้ใช้ไม่ต้องการแนบเพิ่ม

        // Department fallback parity with report2
        const specialSalutation = data.salutation_is_other === true || ["อื่นๆ","ผู้ร้อง","ผู้ร้องเรียน"].includes(String(data.position_other_text || '').trim()) || ["อื่นๆ","ผู้ร้อง","ผู้ร้องเรียน"].includes(String(data.salutation_label||'').trim());
        // Track explicit selection
        if (data.department && isUUID(data.department)) {
          lastDepartmentIdRef.current = data.department;
          if (!originalDepartmentIdRef.current) originalDepartmentIdRef.current = data.department;
        }
        let deptToSend = data.department && isUUID(data.department) ? data.department : null;
        if (!deptToSend) {
          if (specialSalutation) {
            if (lastDepartmentIdRef.current && isUUID(lastDepartmentIdRef.current)) {
              deptToSend = lastDepartmentIdRef.current;
            } else if (originalDepartmentIdRef.current && isUUID(originalDepartmentIdRef.current)) {
              deptToSend = originalDepartmentIdRef.current;
            }
          } else if (originalDepartmentIdRef.current && isUUID(originalDepartmentIdRef.current)) {
            deptToSend = originalDepartmentIdRef.current;
          }
        }
        const ensureRealDepartmentId = async (current) => {
          if (current) return current;
            try {
              const resp = await getDepartments();
              const raw = resp?.res_data || resp?.data || resp;
              let list = [];
              if (Array.isArray(raw)) list = raw; else if (Array.isArray(raw?.items)) list = raw.items;
              const first = list.find(d => d && isUUID(d.id));
              if (first) {
                if (!originalDepartmentIdRef.current) originalDepartmentIdRef.current = first.id;
                if (!lastDepartmentIdRef.current) lastDepartmentIdRef.current = first.id;
                return first.id;
              }
            } catch (e) {
              console.warn('fetch departments (forward) failed', e);
            }
            return current || process.env.NEXT_PUBLIC_DEFAULT_DEPARTMENT_ID || '11111111-1111-1111-1111-111111111111';
        };
        deptToSend = await ensureRealDepartmentId(deptToSend);
        if (!data.original_department_id && deptToSend) {
          setValue('original_department_id', deptToSend, { shouldDirty: false, shouldValidate: false });
        }

        // Resolve position id (prefer explicit position_id then salutation if UUID)
        const resolvedPositionId = (() => {
          if (isUUID(data.position_id)) return data.position_id;
          if (isUUID(data.salutation)) return data.salutation;
          return POSITION_FALLBACK;
        })();

        const outgoingReportData = {
          position_id: resolvedPositionId,
          position_other_text: data.salutation_is_other ? (data.position_other_text || '').trim() : '',
          salutation: data.salutation_is_other ? (data.salutation || '') : resolvedPositionId,
          reference_number: (data.complaint_number || "").trim(),  
          reference_date: toYMD(data.complaint_number_date),       
          subject: (data.subject || "").trim(),
          complaint_number: (data.complaint_number || "").trim(),   // เลข สป.กค.
          complaint_id: data.complaint_id || null,
          complaint_number_date: toYMD(data.complaint_number_date),
          document_number: (data.document_number || "").trim(),
          document_date: toYMD(data.document_date),
          signature_authority_user_id: data.signer,
          department_id: deptToSend,
          confidentiality_level: mapLevel(data.confidentiality, "confidentiality"),
          urgency_level: mapLevel(data.urgency, "urgency"),
          remarks: data.note || "",
        };

        // Debug payload for 422 troubleshooting (visible in dev console)
        try { console.debug("OutgoingReport payload", outgoingReportData); } catch { }

        // Decide create or update by presence of route id
        const routeId = router?.query?.id;
        let reportId = routeId || null;

        if (routeId) {
          showLoading("กำลังอัพเดตรายงาน...");
          try {
            // Try PUT then PATCH fallback
            let updateResp;
            try {
              updateResp = await axiosInstance.put(`/outgoing-reports/${routeId}`, outgoingReportData);
            } catch (putErr) {
              updateResp = await axiosInstance.patch(`/outgoing-reports/${routeId}`, outgoingReportData);
            }
            // Basic success check
            const ok = updateResp?.data && (updateResp.data.success === true || !updateResp.data.res_code || !String(updateResp.data.res_code).startsWith('4'));
            if (!ok) {
              const msg = updateResp?.data?.res_message || updateResp?.data?.message || 'ไม่สามารถอัพเดตรายงานได้';
              closeAlert();
              await alertError('เกิดข้อผิดพลาด', msg);
              return { success: false, error: msg };
            }
          } catch (updErr) {
            closeAlert();
            const msg = updErr?.response?.data?.res_message || updErr?.message || 'อัพเดตไม่สำเร็จ';
            await alertError('เกิดข้อผิดพลาด', msg);
            return { success: false, error: msg };
          }
        } else {
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

            const isSuccess =
              createResponse.success === true ||
              createResponse.success === 'true' ||
              createResponse.res_code === '0001' ||
              createResponse.res_message === 'CREATE_DATA_SUCCESSFULLY' ||
              (createResponse.res_code && String(createResponse.res_code).startsWith('2')) ||
              createResponse.status === 'success';

          if (!isSuccess) {
            const errorSources = [
              createResponse?.res_data?.error,
              createResponse?.res_data?.message,
              createResponse?.res_message,
              createResponse?.message,
              createResponse?.error,
            ].filter(Boolean);
            const errorMessage = errorSources[0] || 'ไม่สามารถสร้างรายงานได้';
            closeAlert();
            await alertError('เกิดข้อผิดพลาด', errorMessage);
            return { success: false, error: errorMessage };
          }
          reportId = createResponse.res_data?.id || createResponse?.id;
          if (!reportId) {
            throw new Error('ไม่พบ ID ของรายงานที่สร้างขึ้น');
          }
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
          <p style="margin-bottom: 15px; font-size: 16px;">${routeId ? 'อัพเดตรายงานสำเร็จ' : 'บันทึกแบบรายงานส่งหน่วยงานที่เกี่ยวข้องเรียบร้อยแล้ว'}</p>
          <p style="margin-bottom: 10px; color: #666;">รหัสรายงาน: <strong>${reportId}</strong></p>
          <p style="margin-bottom: 10px; color: #666;">เรื่อง: <strong>${data.subject || '-'}</strong></p>
          ${fileData
            ? `<p style=\"color: #666;\">ไฟล์แนบ: <strong>${Array.isArray(fileData)
              ? fileData.map((f) => f.name).join(', ')
              : fileData.name
            }</strong></p>`
            : ''
          }
        </div>
        `;

        await alertSuccess(routeId ? 'อัพเดตสำเร็จ!' : 'บันทึกสำเร็จ!', successMessage, true);

        // Determine desired return URL (query ?returnUrl=/path or ?from=/path)
        const returnUrl = router?.query?.returnUrl || router?.query?.from;

        if (routeId) {
          // After update: go to explicit returnUrl/from if provided; else navigate back; fallback to list
            if (returnUrl && typeof returnUrl === 'string') {
              router.push(returnUrl);
            } else if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
              router.back();
            } else {
              router.push('/admin/box/list');
            }
        } else {
          // After create: reset, then go to returnUrl if given else list
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
          if (returnUrl && typeof returnUrl === 'string') {
            router.push(returnUrl);
          } else {
            router.push('/admin/box/list');
          }
        }

        return { success: true, reportId };
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
  [fileData, reset, resetFileInput, router, prepareFileAsFormData, setValue]
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
  ];

  return {
    control,
    handleSubmit,
    trigger,
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
