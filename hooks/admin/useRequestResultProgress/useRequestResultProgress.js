import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { alertSuccess, alertError, showLoading, closeAlert } from "@utils/Alerts";
import { CreateOutgoingReport3, UploadOutgoingReportAttachments } from "@pages/api/outgoinreports/outgoinreports";
import axiosInstance from "@pages/api/axiosInstance";

  const POSITION_FALLBACK = "7e18e4fe-d416-4580-b4d4-2a4032f67770";
  const isUUID = (s) =>
    typeof s === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

  // แปลงเลข สป.กค. => Thai date object {day,month,year,buddhistYear}
  // รองรับรูปแบบ:
  //   MOF-YYYYMMDD
  //   MOF-YYYYMMDD-00001 (optional suffix)
  //   เคสพิมพ์ยังไม่ครบ -> จะยังไม่ตั้งค่า
  const parseRefNoToThaiDate = (val) => {
    if (!val || typeof val !== 'string') return null;
    const cleaned = val.trim();
    // จับ YYYYMMDD โดย suffix หลังวันที่เป็นทางเลือก
    const m = cleaned.match(/MOF-(\d{8})(?:-\w+)?/i);
    if (!m) return null;
    const raw = m[1]; // YYYYMMDD (อาจเป็น พ.ศ. หรือ ค.ศ.)
    if (raw.length !== 8) return null;
    let year = parseInt(raw.slice(0,4),10);
    const month = parseInt(raw.slice(4,6),10);
    const day = parseInt(raw.slice(6,8),10);
    if (!year || !month || !day) return null;
    if (year > 2400) year -= 543; // แปลง พ.ศ. -> ค.ศ.
    const d = new Date(year, month-1, day);
    if (isNaN(d.getTime())) return null;
    return { day: d.getDate(), month: d.getMonth()+1, year: d.getFullYear(), buddhistYear: d.getFullYear()+543 };
  };

  export const useRequestResultProgress = () => {
    const router = useRouter();
    const { id, complaint_id, complaint_number } = router.query;
    const complaintId =
      (Array.isArray(id) ? id[0] : id) ||
      (Array.isArray(complaint_id) ? complaint_id[0] : complaint_id) ||
      null;
    const complaintNumberFromQuery = Array.isArray(complaint_number)
      ? complaint_number[0]
      : complaint_number || "";

  // -------- Form state --------
  const [form, setForm] = useState({
    salutation: "",
    refNo: complaintNumberFromQuery || "",
    docNo: "",
    date: null,
    subject: "",
    department: "",
    signer: "",
    confidentiality: "",
    urgency: "",
    attachment: "",
    note: "",
    position_id: "",
    complaint_id: "",
    department_meta: null,  
    signer_meta: null,       
    // refNoDisplay: "",
  });

  useEffect(() => {
    if (complaintNumberFromQuery && !form.refNo) {
      const parsed = parseRefNoToThaiDate(complaintNumberFromQuery);
      setForm(prev => ({ ...prev, refNo: complaintNumberFromQuery, ...(parsed ? { date: parsed } : {}) }));
    }
  }, [complaintNumberFromQuery]); // eslint-disable-line

   useEffect(() => {
    if (complaintId && !form.complaint_id) {
     setForm((prev) => ({ ...prev, complaint_id: complaintId }));
    }
   }, [complaintId]);

  // เก็บไฟล์จริง (รองรับหลายไฟล์)
  const [attachmentFiles, setAttachmentFiles] = useState([]);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // -------- Required fields --------
  const requiredFields = [
    "salutation",
    "refNo",
    "docNo", 
    "date",
    "subject",
    // "department",  // ทำให้ไม่บังคับกรอกหน่วยงาน
    "signer",
    "confidentiality",
    "urgency",
    "attachment",
  ];

  // -------- helpers --------
  const isRequired = useCallback((fieldName) => requiredFields.includes(fieldName), [requiredFields]);

  const createLabel = useCallback(
    (text, fieldName) => (
      <span>
        {text}
        {isRequired(fieldName) && <span style={{ color: "red", marginLeft: 4 }}>*</span>}
      </span>
    ),
    [isRequired]
  );

  const getFieldError = useCallback((fieldName) => errors[fieldName] || null, [errors]);

  // -------- change handlers --------
  const handleChange = useCallback((e) => {
    const { name, value } = e.target ?? {};
    const v = value ?? e?.value ?? e;
    const finalValue = (typeof v === 'object' && v !== null) ? (v.id ?? v.value ?? '') : v;

    if (name === 'refNo') {
      const parsed = parseRefNoToThaiDate(finalValue);
      setForm(prev => ({ ...prev, refNo: finalValue, ...(parsed ? { date: parsed } : {}) }));
      if (errors.refNo) setErrors(prev => ({ ...prev, refNo: null }));
      if (parsed && errors.date) setErrors(prev => ({ ...prev, date: null }));
      return;
    }

    setForm(prev => ({ ...prev, [name]: finalValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  }, [errors]);

  // เฝ้าการเปลี่ยน refNo เพื่อ auto-parse แม้ผู้ใช้พิมพ์ครบทีหลัง (ไม่มี blur)
  useEffect(() => {
    if (!form) return;
    const refVal = form.refNo || "";
    const parsed = parseRefNoToThaiDate(refVal);
    // เปรียบเทียบ date ปัจจุบันกับ parsed
    const current = form.date;
    const isSame = current && parsed && current.day === parsed.day && current.month === parsed.month && current.year === parsed.year;
    if (parsed && !isSame) {
      setForm(prev => ({ ...prev, date: parsed }));
      if (errors.date) setErrors(prev => ({ ...prev, date: null }));
    } else if (!parsed && current) {
      // ถ้าลบรูปแบบออกให้ล้างวันที่ (ต้องการคงไว้ก็ลบบรรทัดนี้ได้)
      setForm(prev => ({ ...prev, date: null }));
    }
  }, [form.refNo]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDateChange = useCallback(
    (thaiDate) => {
      setForm((prev) => ({ ...prev, date: thaiDate }));
      if (errors.date) setErrors((prev) => ({ ...prev, date: null }));
    },
    [errors.date]
  );

  // ---------- รูป: รองรับหลายไฟล์ ----------
  const handleFileUpload = useCallback(
    (input) => {
      let files = [];

      if (!input) {
        setAttachmentFiles([]);
        setForm((prev) => ({ ...prev, attachment: "" }));
        return;
      }

      if (input instanceof File) {
        files = [input];
      } else if (Array.isArray(input) && input[0] instanceof File) {
        files = input;
      } else if (input?.target?.files) {
        files = Array.from(input.target.files);
      } else if (input?.length && input[0] instanceof File) {
        files = Array.from(input);
      } else if (input?.file && input.file instanceof File) {
        files = [input.file];
      } else {
        console.warn("Unsupported file input:", input);
        return;
      }

      setAttachmentFiles(files);
      const names = files.map((f) => f.name).join(", ");
      setForm((prev) => ({ ...prev, attachment: names }));
      if (errors.attachment) setErrors((prev) => ({ ...prev, attachment: null }));
    },
    [errors.attachment]
  );

  const handleFileChange = useCallback(
    (e) => {
      const files = e?.target?.files ? Array.from(e.target.files) : [];
      setAttachmentFiles(files);
      const names = files.map((f) => f.name).join(", ");
      setForm((prev) => ({ ...prev, attachment: names }));
      if (errors.attachment) setErrors((prev) => ({ ...prev, attachment: null }));
    },
    [errors.attachment]
  );

  // ---------- validate ----------
  const validateRequiredFields = useCallback((state = form) => {
    const fieldsConfig = [
      { field: "salutation", label: "เรียน" },
      { field: "refNo", label: "เลข สป.กค." },
      { field: "docNo", label: "เลขที่หนังสือ" },
      { field: "date", label: "วันที่" },
      { field: "subject", label: "เรื่อง" },
      // { field: "department", label: "หน่วยงาน / ผู้ร้อง" }, // ยกเลิกการบังคับ
      { field: "signer", label: "ผู้ลงนาม" },
      { field: "confidentiality", label: "ชั้นความลับ" },
      { field: "urgency", label: "ชั้นความเร่งด่วน" },
      { field: "attachment", label: "เอกสารแนบ" },
    ];

    const newErrors = {};
    const missing = [];

    fieldsConfig.forEach(({ field, label }) => {
      const value = state[field];
      if (!value && value !== 0) {
        newErrors[field] = `กรุณากรอก${label}`;
        missing.push({ field, label });
      }
    });

    setErrors(newErrors);
    return missing;
  }, [form]);

  // ---------- helpers ----------
  const toISOorNull = (v) => {
    if (!v) return null;
    try {
      if (typeof v === 'object' && v.day && v.month && v.year) {
        return new Date(v.year, v.month - 1, v.day).toISOString();
      }
      return new Date(v).toISOString();
    } catch {
      return null;
    }
  };
  const nullIfEmpty = (v) => (v === undefined || v === null || v === "" ? null : v);

  const handleClear = useCallback(() => {
    setForm({
      salutation: "",
      refNo: "",
      docNo: "",
      date: null,
      subject: "",
      department: "",
      signer: "",
      confidentiality: "",
      urgency: "",
      attachment: "",
      note: "",
      position_id: "",
      complaint_id: "",
      department_meta: null,
      signer_meta: null,
      // refNoDisplay: "",
    });
    setAttachmentFiles([]);
    setErrors({});
  }, []);

  const tryResolvePid = (state) => state.position_id || null;

  // ---------- SAVE ----------
  const handleSave = useCallback(async (overrides = {}) => {
    const state = { ...form, ...overrides };  
    const candidatePid = tryResolvePid(state);
    const finalPid = isUUID(candidatePid) ? candidatePid : POSITION_FALLBACK;
    state.position_id = finalPid;
    const missing = validateRequiredFields(state);
    if (missing.length > 0) {
      const names = missing.map((m) => m.label).join(", ");
      alertError("ข้อมูลไม่ครบถ้วน", `กรุณากรอกข้อมูลในฟิลด์: ${names}`);
      return;
    }

    if (!state.position_id) {
     state.position_id = POSITION_FALLBACK;
    }

    // Build payload; department_id optional (omit if empty/invalid to avoid UUID validation error)
    const deptId = state.department && isUUID(state.department) ? state.department : null;
    const payload = {
      position_id: state.position_id || POSITION_FALLBACK,
      salutation: state.salutation || "",
      complaint_number: state.refNo || "",
      complaint_number_date: toISOorNull(state.date),
      document_number: state.docNo || "",
      document_date: toISOorNull(state.date),
      subject: state.subject || "เรื่อง ขอทราบผลการพิจารณาเรื่องร้องเรียน",
      signature_authority_user_id: nullIfEmpty(state.signer),
      user_id: null,
      confidentiality_level: nullIfEmpty(state.confidentiality),
      urgency_level: nullIfEmpty(state.urgency),
      complaint_id: nullIfEmpty(state.complaint_id),
      remarks: state.note || "",
    };
    if (deptId) payload.department_id = deptId;
    console.log("DEBUG payload", payload);
    
    try {
      setIsLoading(true);
      showLoading("กำลังบันทึกข้อมูล...");

      // 1) สร้างรายการ (หน้า 3)
      const createRes = await CreateOutgoingReport3(payload);

      // กันเลขซ้ำ (backend ส่ง 4090)
      if (createRes?.res_code === "4090") {
        closeAlert();
        setIsLoading(false);
        return alertError("เลขหนังสือซ้ำ", createRes?.res_data?.error || "เลขหนังสือซ้ำ");
      }

      const createdId =
        createRes?.res_data?.id ??
        createRes?.data?.id ??
        createRes?.id ??
        null;

      // 2) อัปโหลดไฟล์แนบ (ถ้ามีไฟล์และสร้างสำเร็จ) - Multi-strategy fallback
      if (createdId && attachmentFiles.length > 0) {
        const buildFormData = (useSingleKey = false) => {
          const formData = new FormData();
          attachmentFiles.forEach((f) => formData.append(useSingleKey ? 'file' : 'files', f, f.name));
          return formData;
        };

        let uploadOk = false;
        let lastErrorMsg = '';

        // Attempt 1: /outgoing-reports3/{id}/attachments (specific for CreateOutgoingReport3)
        try {
          const up1 = await axiosInstance.post(`/outgoing-reports3/${createdId}/attachments`, buildFormData(false));
          uploadOk = !!up1?.data;
        } catch (err1) {
          const data = err1?.response?.data;
          lastErrorMsg = data?.res_data?.error || data?.res_message || err1.message || '';
          console.error('Upload attempt #1 (type3) failed', data || err1);
        }

        // Attempt 2: generic endpoint /outgoing-reports/{id}/attachments
        if (!uploadOk) {
          try {
            const up2 = await UploadOutgoingReportAttachments(buildFormData(false), createdId);
            uploadOk = !!(up2 && (up2.success === true || up2.res_code === '0001'));
            if (!uploadOk) {
              lastErrorMsg = up2?.res_data?.error || up2?.res_message || up2?.message || lastErrorMsg;
            }
          } catch (err2) {
            const data = err2?.response?.data;
            lastErrorMsg = data?.res_data?.error || data?.res_message || err2.message || lastErrorMsg;
            console.error('Upload attempt #2 (generic) failed', data || err2);
          }
        }

        // Attempt 3: single file key (if only one file)
        if (!uploadOk && attachmentFiles.length === 1) {
          try {
            const up3 = await axiosInstance.post(`/outgoing-reports3/${createdId}/attachments`, buildFormData(true));
            uploadOk = !!up3?.data;
          } catch (err3) {
            const data = err3?.response?.data;
            lastErrorMsg = data?.res_data?.error || data?.res_message || err3.message || lastErrorMsg;
            console.error('Upload attempt #3 (single file key) failed', data || err3);
          }
        }

        if (!uploadOk) {
          console.warn('⚠️ บันทึกรายงานสำเร็จแต่แนบไฟล์ไม่สำเร็จ', lastErrorMsg);
          await alertError('แนบไฟล์ไม่สำเร็จ', lastErrorMsg || 'ระบบไม่สามารถแนบไฟล์ได้ กรุณาลองใหม่');
        }
      }

      closeAlert();
      setIsLoading(false);

          const fileNames =
          attachmentFiles.length > 0
          ? attachmentFiles.map((f) => f.name).join(", ")
            : null;
          const successHtml = `
            <div style="text-align:center;line-height:1.7">
              <p style="margin:6px 0 14px 0;">บันทึกแบบรายงานส่งหน่วยงานที่เกี่ยวข้องเรียบร้อยแล้ว</p>
              <p style="margin:4px 0;color:#666">รหัสรายงาน: <strong>${createdId}</strong></p>
              <p style="margin:4px 0;color:#666">เรื่อง: <strong>${form.subject || "-"}</strong></p>
              ${fileNames ? `<p style="margin:4px 0;color:#666">ไฟล์แนบ: <strong>${fileNames}</strong></p>` : ""}
                    </div>
          `;
          await alertSuccess("บันทึกสำเร็จ!", successHtml, true);
          router.push(`/admin/box/list`);
        } catch (err) {
          console.error("Save error:", err);
          if (err?.response) {
            console.error("Response status:", err.response.status);
            console.error("Response data:", err.response.data);
          }
          closeAlert();
          setIsLoading(false);

          const httpStatus = err?.response?.status;
          const data = err?.response?.data;
          if (httpStatus === 422) {
            const serverMsg = data?.res_data?.error || data?.res_message || data?.message || "Validation error (422)";
            // Show which fields are missing if backend returns them
            const detail = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
            await alertError("ข้อมูลไม่ถูกต้อง (422)", serverMsg + "\n" + detail);
            return;
          }
          const backendMsg = data?.res_data?.error || data?.res_message || data?.message || "";
          if (httpStatus === 409 || data?.res_code === "4090" || String(backendMsg).includes("มีอยู่แล้ว")) {
              await alertError("เลขที่หนังสือซ้ำ", backendMsg || `เลขที่หนังสือ ${form.refNo || "-"} มีอยู่แล้ว`);
            return;
          }
          alertError("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
        }
      }, [form, attachmentFiles, validateRequiredFields]);

  // ---------- utilities ----------
  const resetField = useCallback((fieldName) => {
    setForm((prev) => ({ ...prev, [fieldName]: "" }));
    setErrors((prev) => ({ ...prev, [fieldName]: null }));
    if (fieldName === "attachment") setAttachmentFiles([]);
  }, []);

  const updateField = useCallback(
    (fieldName, value) => {
      if (fieldName === 'refNo') {
        const parsed = parseRefNoToThaiDate(value);
        setForm(prev => ({ ...prev, refNo: value, ...(parsed ? { date: parsed } : {}) }));
        if (errors.refNo) setErrors(prev => ({ ...prev, refNo: null }));
        if (parsed && errors.date) setErrors(prev => ({ ...prev, date: null }));
        return;
      }
      setForm(prev => ({ ...prev, [fieldName]: value }));
      if (errors[fieldName]) setErrors(prev => ({ ...prev, [fieldName]: null }));
    },
    [errors]
  );

  const hasFormChanges = useCallback(() => {
    const initial = {
      salutation: "",
      refNo: "",
      date: null,
      subject: "",
      department: "",
      signer: "",
      confidentiality: "",
      urgency: "",
      attachment: "",
      note: "",
      position_id: "",
      complaint_id: "",
    };
    return Object.keys(initial).some((k) => form[k] !== initial[k]);
  }, [form]);

  const isFormValid = useCallback(
    () =>
      requiredFields.every((f) => {
        const v = form[f];
        return v !== undefined && v !== null && v !== "";
      }),
    [form, requiredFields]
  );

  return {
    // State
    form,
    errors,
    isLoading,
    id,

    // Validation helpers
    isRequired,
    createLabel,
    getFieldError,
    isFormValid,
    hasFormChanges,

    // Form handlers
    handleChange,
    handleDateChange,
    handleFileUpload,
    handleFileChange,
    handleClear,
    handleSave,

    // Utility
    validateRequiredFields,
    resetField,
    updateField,
  };
};

export default useRequestResultProgress;
