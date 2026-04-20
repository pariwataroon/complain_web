import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import {
  alertSuccess,
  alertError,
  showLoading,
  closeAlert,
} from "@utils/Alerts";
import {
  CreateOutgoingReport3,
  UploadOutgoingReportAttachments,
  UploadOutgoingReport3Attachments,
  UpdateOutgoingReport3,
  GetOutgoingReport3ById,
} from "@pages/api/outgoinreports/outgoinreports";
import axiosInstance from "@pages/api/axiosInstance";
import { getDepartments } from "@pages/api/department/department";
const levelLabelMap = {
  1: "ปกติ",
  2: "ลับ",
  3: "ลับมาก",
  4: "ลับที่สุด",
};
const levelUrgencyMap = {
  1: "ปกติ",
  2: "เร่งด่วน",
  3: "เร่งด่วนมาก",
  4: "เร่งด่วนที่สุด",
};

// หมายเหตุ: ยกเลิกการบังคับให้เลือกหน่วยงาน (department) ตามคำขอผู้ใช้
// ถ้าผู้ใช้ไม่ได้เลือก จะไม่บล็อคการบันทึกอีกต่อไป
const requiredFields = [
  "salutation",
  "refNo",
  "docNo",
  "docDate",
  "refDate",
  "subject",
  // "department",  // removed from required list
  "signer",
  "confidentiality",
  "urgency",
  "attachment",
];

// Helper: UUID format checker (fallback kept only as last resort so backend always gets UUID)
const POSITION_FALLBACK = "7e18e4fe-d416-4580-b4d4-2a4032f67770";
const DEPARTMENT_FALLBACK = process.env.NEXT_PUBLIC_DEFAULT_DEPARTMENT_ID || "11111111-1111-1111-1111-111111111111";
const isUUID = (s) =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

const parseRefNoToThaiDate = (val) => {
  if (!val || typeof val !== "string") return null;
  const cleaned = val.trim();
  const m = cleaned.match(/MOF-(\d{8})(?:-\w+)?/i);
  if (!m) return null;
  const raw = m[1];
  let year = parseInt(raw.slice(0, 4), 10);
  const month = parseInt(raw.slice(4, 6), 10);
  const day = parseInt(raw.slice(6, 8), 10);
  if (!year || !month || !day) return null;
  if (year > 2400) year -= 543; // BE -> CE
  const d = new Date(year, month - 1, day);
  return isNaN(d.getTime()) ? null : d;
};

// Date helpers: keep plain date (YYYY-MM-DD) to avoid timezone -1 day issues
const pad = (n) => String(n).padStart(2, '0');
const parseApiDateToStruct = (str) => {
  if (!str) return null;
  const m = String(str).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const year = parseInt(m[1],10), month = parseInt(m[2],10), day = parseInt(m[3],10);
  if (!year || !month || !day) return null;
  return { day, month, year, buddhistYear: year + 543 };
};
const toAPIDateString = (v) => {
  if (!v) return null;
  try {
    if (typeof v === 'object' && v.day && v.month && v.year) {
      return `${v.year}-${pad(v.month)}-${pad(v.day)}`;
    }
    if (v instanceof Date) {
      return `${v.getFullYear()}-${pad(v.getMonth()+1)}-${pad(v.getDate())}`;
    }
    return String(v);
  } catch { return null; }
};
const nullIfEmpty = (v) =>
  v === undefined || v === null || v === "" ? null : v;

export const useRequestResultProgress = () => {
  const router = useRouter();
  const { id, complaint_id, complaint_number, outgoing_report3_id, report3_id } = router.query;
  const complaintId =
    (Array.isArray(id) ? id[0] : id) ||
    (Array.isArray(complaint_id) ? complaint_id[0] : complaint_id) ||
    null;

  const editReportId = (Array.isArray(outgoing_report3_id) ? outgoing_report3_id[0] : outgoing_report3_id) || (Array.isArray(report3_id) ? report3_id[0] : report3_id) || null;
  const complaintNumberFromQuery = Array.isArray(complaint_number)
    ? complaint_number[0]
    : complaint_number || "";

  // -------- Form state --------
  const [form, setForm] = useState({
    salutation: "",
    salutation_is_other: false,
    position_other_text: "",
    refNo: complaintNumberFromQuery || "",
    docNo: "",
    docDate: null,
    refDate: null,
    subject: "",
    department: "",
    signer: "",
    confidentiality: "ปกติ",
    urgency: "ปกติ",
    attachment: "",
    note: "",
    position_id: "",
    complaint_id: "",
    department_meta: null,
    signer_meta: null,
  });

  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0); // For file input reset
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Lightweight deep-ish equality to prevent redundant state updates
  const isEqual = (a, b) => {
    if (a === b) return true;
    try {
      // Handles simple objects/arrays/dates (date objects stringify to ISO)
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  };

  const initialRefNoRef = useRef(null);
  const prevRefNoRef = useRef(null);
  const originalDepartmentIdRef = useRef(null);
  const lastDepartmentIdRef = useRef(null);

  useEffect(() => {
    if (!complaintNumberFromQuery) return;
    const parsed = parseRefNoToThaiDate(complaintNumberFromQuery);
    setForm(prev => {
      const next = { ...prev };
      if (!prev.refNo) next.refNo = complaintNumberFromQuery;
      if (parsed && !prev.refDate) next.refDate = parsed;
      return next;
    });
    if (!initialRefNoRef.current) initialRefNoRef.current = complaintNumberFromQuery;
    prevRefNoRef.current = complaintNumberFromQuery;
  }, [complaintNumberFromQuery]);

  useEffect(() => {
    if (!editReportId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await GetOutgoingReport3ById(editReportId);
        const d = res?.res_data || res?.data || res;
        if (!d || cancelled) return;
        setIsEditing(true);
        setForm(prev => ({
          ...prev,
          salutation: d.position?.id || d.salutation || prev.salutation,
          salutation_is_other: !!d.position_other_text,
          position_other_text: d.position_other_text || "",
          // Sync position_id with position.id to avoid fallback override
          position_id: d.position?.id || d.position_id || prev.position_id,
          // refNo should reflect complaint_number (เลข สป.กค.)
          refNo: d.complaint_number || d.reference_number || prev.refNo,
          docNo: d.document_number || prev.docNo,
          docDate: parseApiDateToStruct(d.document_date) || parseApiDateToStruct(d.complaint_number_date) || prev.docDate,
          refDate: parseApiDateToStruct(d.complaint_number_date) || parseApiDateToStruct(d.document_date) || prev.refDate,
          subject: d.subject || prev.subject,
          department: d.department?.id || d.department_id || prev.department,
          signer: d.signature_authority_user?.id || d.signature_authority_user_id || prev.signer,
          confidentiality: levelLabelMap[d.confidentiality_level] ?? d.confidentiality_level ?? prev.confidentiality,
          urgency: levelUrgencyMap[d.urgency_level] ?? d.urgency_level ?? prev.urgency,
          attachment: Array.isArray(d.attachments) && d.attachments.length ? d.attachments.map(a => a.original_name || a.file_name || a.name).filter(Boolean).join(', ') : prev.attachment,
          note: d.remarks || prev.note,
          complaint_id: d.complaint_id || prev.complaint_id,
        }));

        const deptLoaded = d.department?.id || d.department_id || null;
        originalDepartmentIdRef.current = deptLoaded;
        lastDepartmentIdRef.current = deptLoaded;
        const currentRef = d.complaint_number || d.document_number || form.refNo;
        initialRefNoRef.current = currentRef;
        prevRefNoRef.current = currentRef;
      } catch (e) {
        console.error('Load report3 (edit) failed', e);
      }
    })();
    return () => { cancelled = true; };
  }, [editReportId]);

  useEffect(() => {
    if (complaintId && !form.complaint_id) {
      setForm((prev) => ({ ...prev, complaint_id: complaintId }));
    }
  }, [complaintId]);

  // ---- File Input ----
  const resetFileInput = useCallback(() => {
    setAttachmentFiles([]);
    setForm((prev) => ({ ...prev, attachment: "" }));
    setFileInputKey((prevKey) => prevKey + 1);
  }, []);

  // ---- File Change ----
  const handleFileChange = useCallback(
    (fileInput) => {
      if (!fileInput) {
        resetFileInput();
        return;
      }
      let files = [];
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
      const maxSize = 10 * 1024 * 1024;
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
          alertError("ประเภทไฟล์ไม่ถูกต้อง", `ไฟล์ ${file.name} ไม่ใช่ประเภทที่รองรับ`);
          return;
        }
      }
      setAttachmentFiles(files);
      const fileNames = files.map((f) => f.name).join(", ");
      setForm((prev) => ({ ...prev, attachment: fileNames }));
    },
    [resetFileInput]
  );

  // ---- Clear Form ----
  const handleClear = useCallback(() => {
    setForm({
      salutation: "",
      salutation_is_other: false,
      position_other_text: "",
      refNo: "",
      docNo: "",
      docDate: null,
      refDate: null,
      subject: "",
      department: "",
      signer: "",
      confidentiality: "ปกติ",
      urgency: "ปกติ",
      attachment: "",
      note: "",
      position_id: "",
      complaint_id: "",
      department_meta: null,
      signer_meta: null,
    });
    resetFileInput();
    setErrors({});
  }, [resetFileInput]);

  // ---- Manual Field Error ----
  const getFieldError = useCallback(
    (fieldName) => errors[fieldName] || null,
    [errors]
  );

  // ---- Required ----
  const isRequired = useCallback(
    (fieldName) => requiredFields.includes(fieldName),
    []
  );

  // ---- Label ----
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

  // ---- Change Handler ----
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target ?? {};
      const v = value ?? e?.value ?? e;
      // Special case for refNo
      if (name === "refNo") {
        const incoming = v || "";
        const changed = incoming !== prevRefNoRef.current;
        if (changed) {
          const parsedDate = parseRefNoToThaiDate(incoming);
          const parsed = parsedDate
            ? { day: parsedDate.getDate(), month: parsedDate.getMonth() + 1, year: parsedDate.getFullYear(), buddhistYear: parsedDate.getFullYear() + 543 }
            : null;
          setForm((prev) => {
            const next = { ...prev, refNo: incoming, ...(parsed ? { refDate: parsed } : {}) };
            return next;
          });
          prevRefNoRef.current = incoming;
          if (!initialRefNoRef.current) initialRefNoRef.current = incoming;
          if (errors.refNo) setErrors((prev) => ({ ...prev, refNo: null }));
          if (parsed && errors.refDate) setErrors((prev) => ({ ...prev, refDate: null }));
        }
        return;
      }
      // Toggle off 'other' clears text
      if (name === 'salutation_is_other' && !v) {
        setForm((prev) => ({ ...prev, position_other_text: "", salutation_is_other: false }));
        if (errors.position_other_text) setErrors((prev) => ({ ...prev, position_other_text: null }));
        return;
      }
      setForm((prev) => {
        if (isEqual(prev[name], v)) return prev;
        return { ...prev, [name]: v };
      });
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    },
    [errors]
  );

  // ---- Update Field ----
  const updateField = useCallback(
    (fieldName, value) => {
      if (fieldName === "refNo") {
        const incoming = value || "";
        if (incoming !== prevRefNoRef.current) {
          const parsedDate = parseRefNoToThaiDate(incoming);
          const parsed = parsedDate
            ? { day: parsedDate.getDate(), month: parsedDate.getMonth() + 1, year: parsedDate.getFullYear(), buddhistYear: parsedDate.getFullYear() + 543 }
            : null;
          setForm((prev) => ({ ...prev, refNo: incoming, ...(parsed ? { refDate: parsed } : {}) }));
          prevRefNoRef.current = incoming;
          if (!initialRefNoRef.current) initialRefNoRef.current = incoming;
          if (errors.refNo) setErrors((prev) => ({ ...prev, refNo: null }));
          if (parsed && errors.refDate) setErrors((prev) => ({ ...prev, refDate: null }));
        }
        return;
      }
      if (fieldName === 'department') {
        if (value && isUUID(value)) {
          lastDepartmentIdRef.current = value;
          if (!originalDepartmentIdRef.current && isEditing) {
            originalDepartmentIdRef.current = value;
          }
        }
      }
      setForm((prev) => {
        if (isEqual(prev[fieldName], value)) return prev;
        return { ...prev, [fieldName]: value };
      });
      if (errors[fieldName]) setErrors((prev) => ({ ...prev, [fieldName]: null }));
    },
    [errors, isEditing]
  );

  // ---- Validate ----
  const validateRequiredFields = useCallback((state = form) => {
    const fieldsConfig = [
      { field: "salutation", label: "เรียน" },
      ...(state.salutation_is_other ? [{ field: 'position_other_text', label: 'ตำแหน่ง (อื่นๆ/ผู้ร้อง)' }] : []),
      { field: "refNo", label: "เลข สป.กค." },
      { field: "docNo", label: "เลขที่หนังสือ" },
      { field: "docDate", label: "วันที่หนังสือ" },
      { field: "refDate", label: "วันที่ สป.กค." },
      { field: "subject", label: "เรื่อง" },
      // department no longer required regardless of salutation_is_other
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

  // ---- Form Valid ----
  const isFormValid = useCallback(() => {
    const baseOk = requiredFields.every(f => {
      if (f === 'department' && form.salutation_is_other) return true; // skip department
      const v = form[f];
      return v !== undefined && v !== null && v !== '';
    });
    const otherOk = !form.salutation_is_other || !!form.position_other_text;
    return baseOk && otherOk;
  }, [form]);

  // canSave similar to Forward page: focus only on required fields and 'อื่นๆ' rule
  const canSave = useCallback(() => {
    const baseOk = requiredFields.every(f => {
      if (f === 'department' && form.salutation_is_other) return true;
      const v = form[f];
      return v !== undefined && v !== null && v !== '';
    });
    const otherOk = !form.salutation_is_other || !!form.position_other_text;
    return baseOk && otherOk;
  }, [form]);

  // ---- SAVE ----
    // ---- SAVE ----
  const handleSave = useCallback(
    async (overrides = {}) => {
      if (isLoading) return;
      const state = { ...form, ...overrides };

      // Validate required fields
      const candidatePid = state.position_id;
      if (candidatePid && !isUUID(candidatePid)) state.position_id = null;
      const missing = validateRequiredFields(state);
      if (missing.length > 0) {
        const names = missing.map((m) => m.label).join(", ");
        alertError("ข้อมูลไม่ครบถ้วน", `กรุณากรอกข้อมูลในฟิลด์: ${names}`);
        return;
      }

      // Department fallback logic
      let deptId = state.department && isUUID(state.department) ? state.department : null;
      if (!deptId) {
        if (state.salutation_is_other) {
          if (lastDepartmentIdRef.current && isUUID(lastDepartmentIdRef.current)) {
            deptId = lastDepartmentIdRef.current;
          } else if (originalDepartmentIdRef.current && isUUID(originalDepartmentIdRef.current)) {
            deptId = originalDepartmentIdRef.current;
          } else {
            deptId = DEPARTMENT_FALLBACK;
          }
        } else {
          if (originalDepartmentIdRef.current && isUUID(originalDepartmentIdRef.current)) {
            deptId = originalDepartmentIdRef.current;
          } else {
            deptId = DEPARTMENT_FALLBACK;
          }
        }
      }
      const ensureRealDepartmentId = async (current) => {
        if (current && current !== DEPARTMENT_FALLBACK) return current;
        try {
          const resp = await getDepartments();
          const raw = resp?.res_data || resp?.data || resp;
          let list = [];
          if (Array.isArray(raw)) list = raw;
          else if (Array.isArray(raw?.items)) list = raw.items;
          else if (Array.isArray(raw?.departments)) list = raw.departments;
          else if (raw?.results && Array.isArray(raw.results)) list = raw.results;
          const first = list.find(d => d && (isUUID(d.id) || isUUID(d.value)));
          if (first) {
            const realId = first.id || first.value;
            if (isUUID(realId)) {
              originalDepartmentIdRef.current = originalDepartmentIdRef.current || realId;
              lastDepartmentIdRef.current = lastDepartmentIdRef.current || realId;
              return realId;
            }
          }
        } catch (e) {
          console.warn('ไม่สามารถดึง departments เพื่อหา id จริง ใช้ fallback ต่อไป', e);
        }
        return current;
      };
      deptId = await ensureRealDepartmentId(deptId);

      // Resolve position_id
      const resolvedPositionId = (() => {
        if (isUUID(state.position_id)) return state.position_id;
        if (isUUID(state.salutation)) return state.salutation;
        return POSITION_FALLBACK;
      })();

      // Build payload
      const payload = {
        position_id: resolvedPositionId,
        position_other_text: (state.salutation_is_other || state.position_other_text) ? (state.position_other_text || "").trim() : "",
        salutation: state.salutation_is_other ? (state.salutation || '') : (resolvedPositionId || state.salutation || ''),
        complaint_number: state.refNo || "",
        complaint_number_date: toAPIDateString(state.refDate),
        document_number: state.docNo || "",
        document_date: toAPIDateString(state.docDate),
        subject: state.subject || "เรื่อง ขอทราบผลการพิจารณาเรื่องร้องเรียน",
        signature_authority_user_id: nullIfEmpty(state.signer),
        user_id: null,
        confidentiality_level: nullIfEmpty(state.confidentiality),
        urgency_level: nullIfEmpty(state.urgency),
        complaint_id: nullIfEmpty(state.complaint_id),
        remarks: state.note || "",
      };
      if (deptId) payload.department_id = deptId;

      try {
        setIsLoading(true);
        showLoading("กำลังบันทึกข้อมูล...");

        let createRes = null;
        if (editReportId) {
          try {
            createRes = await UpdateOutgoingReport3(editReportId, payload);
          } catch (e) {
            console.error('Update report3 failed', e);
            throw e;
          }
        } else {
          createRes = await CreateOutgoingReport3(payload);
        }

        // Error: duplicate
        if (createRes?.res_code === "4090") {
          closeAlert();
          setIsLoading(false);
          return alertError("เลขหนังสือซ้ำ", createRes?.res_data?.error || "เลขหนังสือซ้ำ");
        }

        const createdId = editReportId || createRes?.res_data?.id || createRes?.data?.id || createRes?.id || null;

        // Upload attachments
        if (createdId && attachmentFiles.length > 0) {
          let uploadOk = false;
          let lastErrorMsg = "";
          const buildFormData = (useSingleKey = false) => {
            const formData = new FormData();
            if (attachmentFiles.length > 1) {
              attachmentFiles.forEach((f) =>
                formData.append(useSingleKey ? "file" : "files", f, f.name)
              );
            } else if (attachmentFiles.length === 1) {
              formData.append(useSingleKey ? "file" : "files", attachmentFiles[0], attachmentFiles[0].name);
            }
            return formData;
          };
          try {
            const up1 = await UploadOutgoingReport3Attachments(buildFormData(false), createdId);
            uploadOk = !!(up1 && (up1.success === true || up1.res_code === "0001" || (up1.res_code && String(up1.res_code).startsWith('2')) || up1.status === 'success'));
            if (!uploadOk) {
              lastErrorMsg = up1?.res_data?.error || up1?.res_message || up1?.message || "";
            }
          } catch (err1) {
            const data = err1?.response?.data;
            lastErrorMsg = data?.res_data?.error || data?.res_message || err1.message || "";
            console.error("Upload attempt #1 (multi-files) failed", data || err1);
          }
          if (!uploadOk && attachmentFiles.length === 1) {
            try {
              const up2 = await UploadOutgoingReport3Attachments(buildFormData(true), createdId);
              uploadOk = !!(up2 && (up2.success === true || up2.res_code === "0001" || (up2.res_code && String(up2.res_code).startsWith('2')) || up2.status === 'success'));
              if (!uploadOk) {
                lastErrorMsg = up2?.res_data?.error || up2?.res_message || up2?.message || lastErrorMsg;
              }
            } catch (err2) {
              const data = err2?.response?.data;
              lastErrorMsg = data?.res_data?.error || data?.res_message || err2.message || lastErrorMsg;
              console.error("Upload attempt #2 (single key) failed", data || err2);
            }
          }
          if (!uploadOk) {
            try {
              const up3 = await axiosInstance.post(
                `/outgoing-reports3/${createdId}/attachments`,
                buildFormData(false)
              );
              uploadOk = !!up3?.data;
            } catch (err3) {
              const data = err3?.response?.data;
              lastErrorMsg = data?.res_data?.error || data?.res_message || err3.message || lastErrorMsg;
              console.error("Upload attempt #3 (direct API) failed", data || err3);
            }
          }
          if (!uploadOk) {
            console.warn("⚠️ บันทึกรายงานสำเร็จแต่แนบไฟล์ไม่สำเร็จ", lastErrorMsg);
            await alertError("แนบไฟล์ไม่สำเร็จ", lastErrorMsg || "ระบบไม่สามารถแนบไฟล์ได้ กรุณาลองใหม่");
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
            <p style="margin:6px 0 14px 0;">${editReportId ? 'อัพเดตแบบรายงานเรียบร้อยแล้ว' : 'บันทึกแบบรายงานส่งหน่วยงานที่เกี่ยวข้องเรียบร้อยแล้ว'}</p>
            <p style="margin:4px 0;color:#666">รหัสรายงาน: <strong>${createdId}</strong></p>
            <p style="margin:4px 0;color:#666">เรื่อง: <strong>${form.subject || "-"}</strong></p>
            ${fileNames ? `<p style=\"margin:4px 0;color:#666\">ไฟล์แนบ: <strong>${fileNames}</strong></p>` : ''}
          </div>`;
        await alertSuccess(editReportId ? "อัพเดตสำเร็จ!" : "บันทึกสำเร็จ!", successHtml, true);

        // --------- REDIRECT LOGIC AFTER SUBMIT ----------
        const returnUrl = router?.query?.returnUrl || router?.query?.from;
        const cid = router?.query?.complaint_id || router?.query?.id || state.complaint_id || form.complaint_id;

        if (cid) {
          router.push(`/admin/box/list/${cid}`);
        } else if (returnUrl && typeof returnUrl === 'string') {
          router.push(returnUrl);
        } else if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
          router.back();
        } else {
          router.push('/admin/box/list');
        }
// --------- END REDIRECT LOGIC ----------
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
          const serverMsg =
            data?.res_data?.error ||
            data?.res_message ||
            data?.message ||
            "Validation error (422)";
          const detail =
            typeof data === "object"
              ? JSON.stringify(data, null, 2)
              : String(data);
          await alertError("ข้อมูลไม่ถูกต้อง (422)", serverMsg + "\n" + detail);
          return;
        }
        const backendMsg =
          data?.res_data?.error ||
          data?.res_message ||
          data?.message ||
          "";
        if (
          httpStatus === 409 ||
          data?.res_code === "4090" ||
          String(backendMsg).includes("มีอยู่แล้ว")
        ) {
          await alertError(
            "เลขที่หนังสือซ้ำ",
            backendMsg || `เลขที่หนังสือ ${form.refNo || "-"} มีอยู่แล้ว`
          );
          return;
        }
        alertError(
          "เกิดข้อผิดพลาด",
          "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง"
        );
      }
    },
    [form, attachmentFiles, validateRequiredFields, handleClear, router, editReportId, complaintId]
  );

  // ---- Form Change ----
  const hasFormChanges = useCallback(() => {
    const initial = {
      salutation: "",
      refNo: "",
      docNo: "",
      docDate: null,
      refDate: null,
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
    };
    return Object.keys(initial).some((k) => form[k] !== initial[k]);
  }, [form]);

  return {
    form,
    errors,
    isLoading,
    fileInputKey,
    attachmentFiles,

    isRequired,
    createLabel,
    getFieldError,
    isFormValid,
    canSave,
    hasFormChanges,

    handleChange,
    // handleDateChange removed
    handleFileChange,
    handleClear,
    handleSave,
    updateField,
    validateRequiredFields,
    resetFileInput,
    isEditing: !!editReportId,
    editReportId,
  };
};

export default useRequestResultProgress;