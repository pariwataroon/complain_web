import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import {
  alertSuccess,
  alertError,
  showLoading,
  closeAlert,
} from "@utils/Alerts";
import {
  CreateOutgoingReport2,
  UploadOutgoingReportAttachments,
} from "@pages/api/outgoinreports/outgoinreports";
import axiosInstance from "@pages/api/axiosInstance";

const toYMD = (d) => {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt.toISOString().slice(0, 10);
};

// แปลงเลข สป.กค. (complaint_number) รูปแบบ MOF-YYYYMMDD(-suffix) => Thai date object
// รองรับปีพ.ศ. ( > 2400 ) จะลบ 543 ให้เป็น ค.ศ. ภายใน ก่อนสร้าง Date จริง
const parseComplaintNumberToThaiDate = (val) => {
  if (!val || typeof val !== 'string') return null;
  const cleaned = val.trim();
  const m = cleaned.match(/MOF-(\d{8})(?:-[A-Za-z0-9]+)?/i);
  if (!m) return null;
  const raw = m[1]; // YYYYMMDD
  if (raw.length !== 8) return null;
  let year = parseInt(raw.slice(0, 4), 10);
  const month = parseInt(raw.slice(4, 6), 10);
  const day = parseInt(raw.slice(6, 8), 10);
  if (!year || !month || !day) return null;
  if (year > 2400) year -= 543; // พ.ศ. -> ค.ศ.
  const d = new Date(year, month - 1, day);
  if (isNaN(d.getTime())) return null;
  return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear(), buddhistYear: d.getFullYear() + 543 };
};

export const useInitialNotificationComplainantAgency = () => {
  const router = useRouter();
  const { id } = router.query;

  // -------- Form state --------
  const [form, setForm] = useState({
    salutation: "",
    salutation_is_other: false,
    position_other_text: "",
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
    complaint_number: "",
    selected_complaint_number: "", // เพิ่มฟิลด์นี้เพื่อเก็บ complaint_number ที่เลือก
  });

  // เก็บไฟล์จริง (รองรับหลายไฟล์)
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(0);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // -------- Prefill from query (complaint_id, complaint_number, created_at) --------
  useEffect(() => {
    if (!router?.isReady) return;
    const { complaint_id: qId, complaint_number: qNum, created_at } = router.query || {};
    if (!qId && !qNum && !created_at) return;

    setForm((prev) => {
      let next = { ...prev };
      if (qId && !next.complaint_id) next.complaint_id = String(qId);
      if (qNum && !next.complaint_number) next.complaint_number = String(qNum);
      if (created_at && !next.date) {
        const d = new Date(created_at);
        if (!isNaN(d.getTime())) next.date = d;
      }
      return next;
    });
  }, [router?.isReady, router?.query]);

  // -------- Required fields (ตามที่ให้ไว้) --------
  const requiredFields = [
    "salutation",
    // position_other_text will be required only when salutation_is_other is true
    "refNo",
    "date",
    "subject",
    "department",
    "signer",
    "confidentiality",
    "urgency",
    "attachment",
  ];

  // -------- helpers --------
  const isRequired = useCallback(
    (fieldName) => requiredFields.includes(fieldName),
    [requiredFields]
  );

  const createLabel = useCallback(
    (text, fieldName) => (
      <span>
        {text}
        {isRequired(fieldName) && (
          <span style={{ color: "red", marginLeft: 4 }}>*</span>
        )}
      </span>
    ),
    [isRequired]
  );

  const getFieldError = useCallback(
    (fieldName) => errors[fieldName] || null,
    [errors]
  );

  // -------- change handlers --------
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    const finalValue = typeof value === 'object' && value !== null ? value.value || '' : value;

    if (name === 'complaint_number') {
      const parsed = parseComplaintNumberToThaiDate(finalValue);
      setForm(prev => ({ ...prev, complaint_number: finalValue, ...(parsed ? { date: parsed } : {}) }));
      if (errors.complaint_number) setErrors(prev => ({ ...prev, complaint_number: null }));
      if (parsed && errors.date) setErrors(prev => ({ ...prev, date: null }));
      return;
    }

    setForm(prev => ({ ...prev, [name]: finalValue }));
    // dynamic validation for Other position
    if (name === 'salutation_is_other' && !finalValue) {
      // clear other text if toggled off
      setForm(prev => ({ ...prev, position_other_text: "" }));
      if (errors.position_other_text) setErrors(prev => ({ ...prev, position_other_text: null }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  }, [errors]);

  // เฝ้า complaint_number เผื่อพิมพ์ครบทีหลังโดยไม่มี onChange (edge / paste แบบช้า)
  useEffect(() => {
    const val = form.complaint_number;
    const parsed = parseComplaintNumberToThaiDate(val);
    const cur = form.date;
    const isSame = cur && parsed && cur.day === parsed.day && cur.month === parsed.month && cur.year === parsed.year;
    if (parsed && !isSame) {
      setForm(prev => ({ ...prev, date: parsed }));
      if (errors.date) setErrors(prev => ({ ...prev, date: null }));
    }
  }, [form.complaint_number]); // eslint-disable-line react-hooks/exhaustive-deps

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
        setFileInputKey(k => k + 1);
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

  // legacy: input[type=file]
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
  const validateRequiredFields = useCallback(() => {
    const fieldsConfig = [
      { field: "salutation", label: "เรียน" },
      // add conditional required rule for other text
      ...(form.salutation_is_other ? [{ field: "position_other_text", label: "ตำแหน่ง (อื่นๆ)" }] : []),
      { field: "refNo", label: "เลขที่หนังสือ" },
      { field: "date", label: "วันที่" },
      { field: "subject", label: "เรื่อง" },
      { field: "department", label: "หน่วยงาน / ผู้ร้อง" },
      { field: "signer", label: "ผู้ลงนาม" },
      { field: "confidentiality", label: "ชั้นความลับ" },
      { field: "urgency", label: "ชั้นความเร่งด่วน" },
      { field: "attachment", label: "เอกสารแนบ" },
    ];

    const newErrors = {};
    const missing = [];

    fieldsConfig.forEach(({ field, label }) => {
      const value = form[field];
      if (!value && value !== 0) {
        newErrors[field] = `กรุณากรอก${label}`;
        missing.push({ field, label });
      }
    });

    setErrors(newErrors);
    return missing;
  }, [form]);

  // ---------- helpers ----------
  const toNullString = (v) =>
    v === undefined || v === null || v === "" ? "null" : String(v);

  const toDateISOOrNullString = (value) => {
    if (!value) return "null";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "null" : d.toISOString();
  };

  // แปลง UUID ให้เป็น simple (ตัดขีด) กันเหนียวตาม error ของ API
  // ป้องกัน RangeError: Invalid time value รองรับรูปแบบ {day,month,year} หรือ Date/string
  const toISOorNull = (v) => {
    if (!v) return null;
    try {
      // Thai date object from picker
      if (typeof v === 'object' && v.day && v.month && v.year) {
        const d = new Date(v.year, v.month - 1, v.day);
        return isNaN(d.getTime()) ? null : d.toISOString();
      }
      // Already a Date
      if (v instanceof Date) {
        return isNaN(v.getTime()) ? null : v.toISOString();
      }
      // String or number
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d.toISOString();
    } catch (e) {
      console.warn('toISOorNull parse failed', v, e);
      return null;
    }
  };
  const nullIfEmpty = (v) => (v === undefined || v === null || v === "" ? null : v);

  const handleClear = useCallback(() => {
    setForm({
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
      complaint_number: "",
      selected_complaint_number: "", // เพิ่มฟิลด์นี้
    });
    setAttachmentFiles([]);
    setErrors({});
  }, []);

  // ---------- SAVE ----------
  const handleSave = useCallback(async () => {
    const missing = validateRequiredFields();
    if (missing.length > 0) {
      const names = missing.map((m) => m.label).join(", ");
      alertError("ข้อมูลไม่ครบถ้วน", `กรุณากรอกข้อมูลในฟิลด์: ${names}`);
      return;
    }

    // ตรวจไฟล์ก่อนอัปโหลด
    if (attachmentFiles.length) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowed = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
      ];
      const oversize = attachmentFiles.find(f => f.size > maxSize);
      if (oversize) {
        alertError("ไฟล์ใหญ่เกินไป", `ไฟล์ ${oversize.name} เกิน 10MB`);
        return;
      }
      const badType = attachmentFiles.find(f => !allowed.includes(f.type));
      if (badType) {
        alertError("ประเภทไฟล์ไม่รองรับ", `ไฟล์ ${badType.name} ไม่ใช่ประเภทที่รองรับ`);
        return;
      }
    }

    const payload = {
      position_id: form.position_id || "7e18e4fe-d416-4580-b4d4-2a4032f67770",
      complaint_number: form.complaint_number || "",
      complaint_number_date: toISOorNull(form.date),
      document_number: form.refNo || "",
      document_date: toISOorNull(form.date),
      subject: form.subject || "",
      signature_authority_user_id: nullIfEmpty(form.signer),
      department_id: nullIfEmpty(form.department),
      user_id: null,
      confidentiality_level: nullIfEmpty(form.confidentiality),
      urgency_level: nullIfEmpty(form.urgency),
      complaint_id: nullIfEmpty(form.complaint_id),
      remarks: form.note || "",
    };

    // Helper: upload attachments for type2 endpoint with fallbacks
    const uploadType2Attachments = async (reportId) => {
      if (!reportId || attachmentFiles.length === 0) return true;

      const buildFormData = (useSingleKey = false) => {
        const fd = new FormData();
        if (useSingleKey && attachmentFiles.length === 1) {
          fd.append('file', attachmentFiles[0], attachmentFiles[0].name);
        } else {
          attachmentFiles.forEach((f) => fd.append('files', f, f.name));
        }
        return fd;
      };

      let ok = false;
      let lastErr = '';

      // Attempt #1: correct type2 endpoint with 'files'
      try {
        const r1 = await axiosInstance.post(`/outgoing-reports2/${reportId}/attachments`, buildFormData(false));
        ok = !!r1?.data;
      } catch (e1) {
        const data = e1?.response?.data;
        lastErr = data?.res_data?.error || data?.res_message || e1.message || '';
        console.error('Upload type2 attempt #1 failed', data || e1);
      }

      // Attempt #2: generic endpoint (some backends accept this) with 'files'
      if (!ok) {
        try {
          const r2 = await UploadOutgoingReportAttachments(buildFormData(false), reportId);
          ok = !!(r2 && (r2.success === true || r2.res_code === '0001' || r2.data));
          if (!ok) {
            lastErr = r2?.res_data?.error || r2?.res_message || r2?.message || lastErr;
          }
        } catch (e2) {
          const data = e2?.response?.data;
          lastErr = data?.res_data?.error || data?.res_message || e2.message || lastErr;
          console.error('Upload generic attempt failed', data || e2);
        }
      }

      // Attempt #3: type2 endpoint with single key 'file' (if one file)
      if (!ok && attachmentFiles.length === 1) {
        try {
          const r3 = await axiosInstance.post(`/outgoing-reports2/${reportId}/attachments`, buildFormData(true));
          ok = !!r3?.data;
        } catch (e3) {
          const data = e3?.response?.data;
          lastErr = data?.res_data?.error || data?.res_message || e3.message || lastErr;
          console.error('Upload type2 attempt #3 (single) failed', data || e3);
        }
      }

      if (!ok) {
        await alertError('แนบไฟล์ไม่สำเร็จ', lastErr || 'ระบบไม่สามารถแนบไฟล์ได้ กรุณาลองใหม่');
      }
      return ok;
    };

    try {
      setIsLoading(true);
      showLoading("กำลังบันทึกข้อมูล...");

      // 1) สร้างรายการออกหนังสือ
      const createRes = await CreateOutgoingReport2(payload);

      const extractReportId = (resp) => {
        if (!resp) return null;
        const candidates = [
          resp?.res_data?.id,
          resp?.res_data?.report_id,
          resp?.res_data?.outgoing_report_id,
          resp?.data?.id,
          resp?.id,
        ].filter(Boolean);
        if (candidates.length) return candidates[0];
        try {
          const stack = [resp];
          while (stack.length) {
            const cur = stack.pop();
            if (cur && typeof cur === 'object') {
              if (Object.prototype.hasOwnProperty.call(cur, 'id') && cur.id) return cur.id;
              Object.values(cur).forEach(v => { if (v && typeof v === 'object') stack.push(v); });
            }
          }
        } catch (_) { }
        return null;
      };
      const createdId = extractReportId(createRes);

      if (!createdId) {
        closeAlert();
        setIsLoading(false);
        await alertError("ไม่พบรหัสรายงาน", "ระบบไม่สามารถดึงรหัสรายงานที่สร้างได้ กรุณาลองใหม่อีกครั้ง");
        return;
      }

      // 2) อัปโหลดไฟล์แนบ (ถ้ามีไฟล์และสร้างสำเร็จ)
      if (attachmentFiles.length > 0) {
        showLoading("กำลังอัพโหลดไฟล์แนบ...");
        await uploadType2Attachments(createdId);
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
      closeAlert();
      setIsLoading(false);

      const httpStatus = err?.response?.status;
      const data = err?.response?.data;
      const backendMsg = data?.res_data?.error || data?.res_message || data?.message || "";
      if (httpStatus === 409 || data?.res_code === "4090" || String(backendMsg).includes("มีอยู่แล้ว")) {
        await alertError("เลขที่หนังสือซ้ำ", backendMsg || `เลขที่หนังสือ ${form.refNo || "-"} มีอยู่แล้ว`);
        return;
      }
      alertError("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    }
  }, [form, attachmentFiles, validateRequiredFields]);

  // ... ส่วนอื่น ๆ ของ hook และ export เหมือนเดิม ...

  // ---------- utilities ----------
  const resetField = useCallback((fieldName) => {
    setForm((prev) => ({ ...prev, [fieldName]: "" }));
    setErrors((prev) => ({ ...prev, [fieldName]: null }));
    if (fieldName === "attachment") setAttachmentFiles([]);
  }, []);

  const updateField = useCallback(
    (fieldName, value) => {
      setForm((prev) => ({ ...prev, [fieldName]: value }));
      if (errors[fieldName]) setErrors((prev) => ({ ...prev, [fieldName]: null }));
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
      complaint_number: "",
      selected_complaint_number: "",
    };
    return Object.keys(initial).some((k) => form[k] !== initial[k]);
  }, [form]);

  const isFormValid = useCallback(
    () =>
      requiredFields.every((f) => {
        const v = form[f];
        return v !== undefined && v !== null && v !== "";
      }) && (!form.salutation_is_other || !!form.position_other_text),
    [form, requiredFields]
  );

  // canSave focuses on required-only validation like Forward component
  const canSave = useCallback(() => {
    const baseOk = requiredFields.every((f) => {
      const v = form[f];
      return v !== undefined && v !== null && v !== "";
    });
    const otherOk = !form.salutation_is_other || !!form.position_other_text;
    return baseOk && otherOk;
  }, [form, requiredFields]);

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
    isRequired,
    fileInputKey,
    canSave,
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

export default useInitialNotificationComplainantAgency;