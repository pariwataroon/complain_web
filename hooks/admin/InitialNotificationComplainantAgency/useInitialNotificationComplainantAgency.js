import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import {
  alertSuccess,
  alertError,
  showLoading,
  closeAlert,
} from "@utils/Alerts";
import axiosInstance from "@pages/api/axiosInstance";
import {
  CreateOutgoingReport2,
  UploadOutgoingReportAttachments,
  GetOutgoingReport2ById,
} from "@pages/api/outgoinreports/outgoinreports";
import { GetAllOutsideDepartments } from "@pages/api/outsideDepartments/outsideDepartments";

export const UpdateOutgoingReport2 = async (id, data) => {
  if (!id) throw new Error("Missing id for UpdateOutgoingReport2");
  try {
    const response = await axiosInstance.put(`/outgoing-reports2/${id}`, data);
    return response.data;
  } catch (errorPut) {
    const statusPut = errorPut?.response?.status;
    try {
      const responsePatch = await axiosInstance.patch(`/outgoing-reports2/${id}`, data);
      return responsePatch.data;
    } catch (errorPatch) {
      console.error("Error updating outgoing report2:", {
        putStatus: statusPut,
        putData: errorPut?.response?.data,
        patchStatus: errorPatch?.response?.status,
        patchData: errorPatch?.response?.data,
        message: errorPatch?.message,
      });
      throw errorPatch;
    }
  }
};

export const DeleteOutgoingReport2Attachment = async ({ outgoing_report_id, attachment_id }) => {
  if (!outgoing_report_id || !attachment_id) {
    return { success: false, res_message: "missing outgoing_report_id or attachment_id" };
  }
  try {
    const endpoint = `/outgoing-reports2/${outgoing_report_id}/attachments/${attachment_id}`;
    const response = await axiosInstance.delete(endpoint);
    return response.data || { success: true };
  } catch (error) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.error("Error deleting attachment (type2):", { status, data });
    return { success: false, res_message: data?.res_message || error?.message || "DELETE_FAILED", res_code: String(status || "500") };
  }
};

function parseIsoToThaiDate(isoString) {
  const m = typeof isoString === "string" && isoString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);
  return {
    day,
    month,
    year,
    buddhistYear: year + 543,
  };
}

const toYMD = (d) => {
  if (!d) return null;
  if (typeof d === "object" && d.year && d.month && d.day) {
    const yyyy = d.year;
    const mm = String(d.month).padStart(2, "0");
    const dd = String(d.day).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  if (d instanceof Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate());
    return `${yyyy}-${mm}-${dd}`;
  }
  if (typeof d === "string") {
    const isoParsed = parseIsoToThaiDate(d);
    if (isoParsed) return `${isoParsed.year}-${String(isoParsed.month).padStart(2, "0")}-${String(isoParsed.day).padStart(2, "0")}`;
    return null;
  }
  return null;
};

const parseComplaintNumberToThaiDate = (val) => {
  if (!val || typeof val !== 'string') return null;
  const cleaned = val.trim();
  const m = cleaned.match(/(?:MOF-)?(\d{8})/i);
  if (!m) return null;
  const raw = m[1];
  let year = parseInt(raw.slice(0,4),10);
  const month = parseInt(raw.slice(4,6),10);
  const day = parseInt(raw.slice(6,8),10);
  if (!year || !month || !day) return null;
  if (year > 2400) year -= 543;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { day, month, year, buddhistYear: year + 543 };
};

const POSITION_FALLBACK = "7e18e4fe-d416-4580-b4d4-2a4032f67770";
const isUUID = (s) => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export const useInitialNotificationComplainantAgency = () => {
  const router = useRouter();
  const { id } = router.query;

  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const [form, setForm] = useState({
    salutation: "",
    salutation_is_other: false,
    position_other_text: "",
    refNo: "",
    document_date: null,
    complaint_number: "",
    complaint_number_date: null,
    subject: "",
    // department: "",
    signer: "",
    confidentiality: "",
    urgency: "",
    attachment: "",
    note: "",
    position_id: "",
    complaint_id: "",
    selected_complaint_number: "",
    outside_department_id: "",
  });

  const prevComplaintNumberRef = useRef(null);
  const originalDepartmentIdRef = useRef(null);
  const lastDepartmentIdRef = useRef(null);

  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [externalDepartments, setExternalDepartments] = useState([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);

  // Restore external department
  useEffect(() => {
    if (form.outside_department_id) return;
    try {
      const storeKey = `outgoing_report2_outside_dept_${id || 'new'}`;
      const raw = localStorage.getItem(storeKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const savedId = parsed?.outsideDepartmentId || null;
      const savedName = parsed?.outsideDepartmentName || null;

      if (savedId && isUUID(savedId)) {
        const exists = externalDepartments.some(d => String(d.id) === String(savedId));
        if (exists) {
          setForm(prev => ({ ...prev, outside_department_id: savedId }));
          return;
        }
      }

      if (savedName) {
        setForm(prev => ({ ...prev, outside_department_id: savedName }));
      }
    } catch (_) {}
  }, [externalDepartments, form.outside_department_id, id]);

  // EDIT mode: Load data from API
  useEffect(() => {
    if (!router?.isReady || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await GetOutgoingReport2ById(id);
        const d = res?.res_data || res?.data || res;
        if (cancelled || !d) return;

        const posNameLoaded = (d.position?.name || "").trim();
        const isCustomLoaded = ["อื่นๆ", "ผู้ร้อง", "ผู้ร้องเรียน"].includes(posNameLoaded);
        
        setForm((prev) => ({
          ...prev,
          complaint_number: d.complaint_number || d.reference_number || "",
          complaint_id: d.complaint_id || "",
          refNo: d.document_number || "",
          subject: d.subject || "",
          salutation: d.position?.id || "",
          salutation_is_other: isCustomLoaded,
          position_other_text: d.position_other_text || "",
          signer: d.signature_authority_user?.id || d.signature_authority_user_id || "",
          position_id: d.signature_authority_user?.position_id ||
                        d.signature_authority_user?.position?.id ||
                        d.signature_authority_user?.positionId || "",
          outside_department_id: d.outside_department?.id || "",
          document_date: d.document_date ? parseIsoToThaiDate(d.document_date) : null,
          complaint_number_date: d.complaint_number_date ? parseIsoToThaiDate(d.complaint_number_date) : null,
          confidentiality: d.confidentiality_level !== undefined && d.confidentiality_level !== null ? String(d.confidentiality_level) : "",
          urgency: d.urgency_level !== undefined && d.urgency_level !== null ? String(d.urgency_level) : "",
          note: d.remarks || "",
          selected_complaint_number: "",
        }));

        const prefillDeptObj = d.outside_department
          ? {
              id: d.outside_department.id,
              value: d.outside_department.id,
              label: d.outside_department.name,
              name: d.outside_department.name,
              code: d.outside_department.code || "",
              shortName: d.outside_department.short_name || d.outside_department.shortName || "",
            }
          : null;
          setSelectedDepartment(prefillDeptObj ? {
            id: prefillDeptObj.id,
            value: prefillDeptObj.id,
            label: prefillDeptObj.name,
            name: prefillDeptObj.name,
            code: prefillDeptObj.code || "",
            shortName: prefillDeptObj.short_name || prefillDeptObj.shortName || "",
          } : null);
        
        const deptLoaded = d.department?.id || d.outside_department?.id || "";
        originalDepartmentIdRef.current = deptLoaded || null;
        lastDepartmentIdRef.current = deptLoaded || null;

        setExistingAttachments(Array.isArray(d.attachments) ? d.attachments : []);
        if (Array.isArray(d.attachments) && d.attachments.length) {
          const names = d.attachments.map(a => a.file_name || a.original_name || a.name || '').filter(Boolean).join(', ');
          setForm((prev) => ({ ...prev, attachment: names }));
        } else {
          setForm((prev) => ({ ...prev, attachment: "" }));
        }
      } catch (err) {}
    })();
    return () => { cancelled = true; };
  }, [router?.isReady, id]);

  // CREATE mode: Prefill from query
  useEffect(() => {
    if (!router?.isReady || id) return;
    const { complaint_id: qId, complaint_number: qNum } = router.query || {};
    setForm((prev) => {
      let next = { ...prev };
      if (qId && !next.complaint_id) next.complaint_id = String(qId);
      if (qNum && !next.complaint_number) next.complaint_number = String(qNum);
      return next;
    });
  }, [router?.isReady, router?.query, id]);

  // AUTO PARSE on initial load
  useEffect(() => {
    if (!id && form.complaint_number && !form.complaint_number_date) {
      const parsed = parseComplaintNumberToThaiDate(form.complaint_number);
      if (parsed) {
        setForm(prev => ({ ...prev, complaint_number_date: parsed }));
        prevComplaintNumberRef.current = form.complaint_number;
      }
    }
  }, [id, form.complaint_number, form.complaint_number_date]);

  // Load external departments
  useEffect(() => {
    let cancelled = false;
    const loadExternalDepartments = async () => {
      try {
        setIsLoadingDepartments(true);
        const response = await GetAllOutsideDepartments({
          skip: 0,
          limit: 100000,
          search: "",
        });
        
        if (cancelled) return;
        
        let items = [];
        if (response?.res_data) {
          if (Array.isArray(response.res_data)) {
            items = response.res_data;
          } else if (response.res_data.data && Array.isArray(response.res_data.data)) {
            items = response.res_data.data;
          } else if (response.res_data.items && Array.isArray(response.res_data.items)) {
            items = response.res_data.items;
          }
        } else if (Array.isArray(response?.data)) {
          items = response.data;
        } else if (Array.isArray(response)) {
          items = response;
        }
        
        const formattedDepartments = items.map(dept => ({
          id: dept.id,
          value: dept.id,
          label: dept.name || dept.department_name || dept.title || "",
          code: dept.code || dept.department_code || "",
          shortName: dept.short_name || dept.shortName || "",
          name: dept.name || dept.department_name || dept.title || "",
          ...dept
        }));
        
        console.log('Loaded external departments:', formattedDepartments);
        setExternalDepartments(formattedDepartments);
      } catch (error) {
        if (!cancelled) {
          console.error("Error loading external departments:", error);
          setExternalDepartments([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDepartments(false);
        }
      }
    };

    loadExternalDepartments();
    return () => { cancelled = true; };
  }, []);

  // Required fields
  const baseRequiredFields = [
    "salutation",
    "refNo",
    "document_date",
    "complaint_number",
    "complaint_number_date",
    "subject",
    "signer",
    "confidentiality",
    "urgency",
    // "attachment",
  ];

  const isRequired = useCallback(
    (fieldName) => {
     if (fieldName === 'outside_department_id') return !form.salutation_is_other;
      if (fieldName === 'position_other_text') return false;
      return baseRequiredFields.includes(fieldName);
    },
    [form.salutation_is_other, id]
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

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    const finalValue = typeof value === 'object' && value !== null ? value.value || '' : value;

    if (name === 'complaint_number') {
      if (finalValue !== prevComplaintNumberRef.current) {
        const parsed = parseComplaintNumberToThaiDate(finalValue);
        setForm(prev => ({
          ...prev,
          complaint_number: finalValue,
          complaint_number_date: parsed || null,
        }));
        prevComplaintNumberRef.current = finalValue;
        if (errors.complaint_number) setErrors(prev => ({ ...prev, complaint_number: null }));
        if (errors.complaint_number_date) setErrors(prev => ({ ...prev, complaint_number_date: null }));
        return;
      }
    }

    if (name === 'salutation_is_other') {
      if (!finalValue) {
        setForm(prev => ({ ...prev, position_other_text: "", salutation_is_other: false }));
        if (errors.position_other_text) setErrors(prev => ({ ...prev, position_other_text: null }));
      } else {
        setForm(prev => ({ ...prev, salutation_is_other: true }));
      }
      return;
    }

    if (name === 'salutation') {
      const lowered = String(finalValue || '').trim();
      if (["อื่นๆ", "ผู้ร้อง", "ผู้ร้องเรียน"].includes(lowered)) {
        setForm(prev => ({ ...prev, salutation: finalValue, salutation_is_other: true }));
        return;
      }
    }

    setForm(prev => ({ ...prev, [name]: finalValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  }, [errors]);

  const handleDocumentDateChange = useCallback(
    (value) => {
      let dateObj;
      if (typeof value === "string") {
        dateObj = parseIsoToThaiDate(value);
      } else if (value && value.day && value.month && value.year) {
        dateObj = value;
      } else if (value instanceof Date) {
        dateObj = {
          day: value.getDate(),
          month: value.getMonth() + 1,
          year: value.getFullYear(),
          buddhistYear: value.getFullYear() + 543,
        };
      } else {
        dateObj = null;
      }
      setForm(prev => ({ ...prev, document_date: dateObj }));
      if (errors.document_date) setErrors(prev => ({ ...prev, document_date: null }));
    },
    [errors.document_date]
  );

  const handleComplaintNumberDateChange = useCallback(
    (value) => {
      let dateObj;
      if (typeof value === "string") {
        dateObj = parseIsoToThaiDate(value);
      } else if (value && value.day && value.month && value.year) {
        dateObj = value;
      } else if (value instanceof Date) {
        dateObj = {
          day: value.getDate(),
          month: value.getMonth() + 1,
          year: value.getFullYear(),
          buddhistYear: value.getFullYear() + 543,
        };
      } else {
        dateObj = null;
      }
      setForm(prev => ({ ...prev, complaint_number_date: dateObj }));
      if (errors.complaint_number_date) setErrors(prev => ({ ...prev, complaint_number_date: null }));
    },
    [errors.complaint_number_date]
  );

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

  const validateRequiredFields = useCallback(() => {
    const fieldsConfig = [
      { field: 'salutation', label: 'เรียน' },
      // ...(form.salutation_is_other ? [{ field: 'position_other_text', label: 'ตำแหน่ง (อื่นๆ)' }] : []),
      // ...(!form.salutation_is_other ? [{ field: 'outside_department_id', label: 'หน่วยงาน / ผู้ร้อง' }] : []),
      { field: 'refNo', label: 'เลขที่หนังสือ' },
      { field: 'document_date', label: 'วันที่หนังสือ' },
      { field: 'complaint_number', label: 'เลข สป.กค.' },
      { field: 'complaint_number_date', label: 'วันที่ สป.กค.' },
      { field: 'subject', label: 'เรื่อง' },
      { field: 'signer', label: 'ผู้ลงนาม' }, 
      { field: 'confidentiality', label: 'ชั้นความลับ' },
      { field: 'urgency', label: 'ชั้นความเร่งด่วน' },
      // { field: 'attachment', label: 'เอกสารแนบ' },
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

  const nullIfEmpty = (v) => (v === undefined || v === null || v === "" ? null : v);

  const handleClear = useCallback(() => {
    setForm({
      salutation: "",
      salutation_is_other: false,
      position_other_text: "",
      refNo: "",
      document_date: null,
      complaint_number: "",
      complaint_number_date: null,
      subject: "",
      // department: "",
      signer: "",
      confidentiality: "",
      urgency: "",
      attachment: "",
      note: "",
      position_id: "",
      complaint_id: "",
      selected_complaint_number: "",
      outside_department_id: "",
    });
    setAttachmentFiles([]);
    setErrors({});
    setExistingAttachments([]);
    setSelectedDepartment(null);
  }, []);

  const resetField = useCallback((fieldName) => {
    setForm((prev) => ({ ...prev, [fieldName]: "" }));
    setErrors((prev) => ({ ...prev, [fieldName]: null }));
    if (fieldName === "attachment") setAttachmentFiles([]);
  }, []);

  const updateField = useCallback(
    (fieldName, value) => {
      // if (fieldName === 'department' && value && isUUID(value)) {
      //   lastDepartmentIdRef.current = value;
      //   if (!originalDepartmentIdRef.current) originalDepartmentIdRef.current = value;
      // }
      setForm(prev => ({ ...prev, [fieldName]: value }));
      if (errors[fieldName]) setErrors((prev) => ({ ...prev, [fieldName]: null }));
    },
    [errors]
  );

  const handleDeleteExistingAttachment = useCallback(
    async (att) => {
      const reportId = router?.query?.id || id || null;
      if (!reportId || !att?.id) return false;

      setExistingAttachments(prev => prev.filter(a => a.id !== att.id));
      setForm(prev => {
        const remaining = existingAttachments.filter(a => a.id !== att.id);
        const names = remaining.length
          ? remaining.map(a => a.file_name || a.original_name || a.name || '').filter(Boolean).join(', ')
          : "";
        return { ...prev, attachment: names };
      });

      try {
        const delRes = await DeleteOutgoingReport2Attachment({
          outgoing_report_id: reportId,
          attachment_id: att.id,
        });
        if (!delRes || delRes.success === false) {
          const res = await GetOutgoingReport2ById(reportId);
          const d = res?.res_data || res?.data || res;
          setExistingAttachments(Array.isArray(d.attachments) ? d.attachments : []);
          const names = Array.isArray(d.attachments) && d.attachments.length
            ? d.attachments.map(a => a.file_name || a.original_name || a.name || '').filter(Boolean).join(', ')
            : "";
          setForm((prev) => ({ ...prev, attachment: names }));
          await alertError?.("ลบไฟล์ไม่สำเร็จ", delRes?.res_message || "ไม่สามารถลบไฟล์ได้");
          return false;
        }
        try {
          const res = await GetOutgoingReport2ById(reportId);
          const d = res?.res_data || res?.data || res;
          setExistingAttachments(Array.isArray(d.attachments) ? d.attachments : []);
          const names = Array.isArray(d.attachments) && d.attachments.length
            ? d.attachments.map(a => a.file_name || a.original_name || a.name || '').filter(Boolean).join(', ')
            : "";
          setForm((prev) => ({ ...prev, attachment: names }));
        } catch (_) { }
        return true;
      } catch (error) {
        try {
          const res = await GetOutgoingReport2ById(reportId);
          const d = res?.res_data || res?.data || res;
          setExistingAttachments(Array.isArray(d.attachments) ? d.attachments : []);
          const names = Array.isArray(d.attachments) && d.attachments.length
            ? d.attachments.map(a => a.file_name || a.original_name || a.name || '').filter(Boolean).join(', ')
            : "";
          setForm((prev) => ({ ...prev, attachment: names }));
        } catch (_) { }
        await alertError?.("ลบไฟล์ไม่สำเร็จ", "เกิดข้อผิดพลาดในการลบไฟล์");
        return false;
      }
    },
    [router?.query?.id, id]
  );

const handleSave = useCallback(async () => {
  const missing = validateRequiredFields();
  if (missing.length > 0) {
    const names = missing.map((m) => m.label).join(", ");
    alertError("ข้อมูลไม่ครบถ้วน", `กรุณากรอกข้อมูลในฟิลด์: ${names}`);
    return;
  }

  const resolvedOutsideId = (() => {
    if (form.salutation_is_other) return null; 
    const raw = form.outside_department_id;
    if (!raw) return null;
    const id = typeof raw === 'object' ? (raw.id || raw.value) : raw;
    const found = externalDepartments.find(d => String(d.id) === String(id));
    return found ? found.id : null; 
  })();

   if (!form.salutation_is_other && !resolvedOutsideId) {
    await alertError('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือก "หน่วยงาน / ผู้ร้อง" จากรายการ');
    return;
  }

  const resolvedPositionId = (() => {
    if (isUUID(form.position_id)) return form.position_id;
    if (isUUID(form.salutation)) return form.salutation;
    return POSITION_FALLBACK; // ตัวเดิมที่ประกาศไว้ข้างบน
  })();

  // // ✅ แก้ logic การ resolve outside_department_id
  // const finalOutsideDepartmentId = (() => {
  //   console.log('[DeptDebug] Processing department:', {
  //     department: form.department,
  //     departmentType: typeof form.department,
  //     externalDepartments_count: externalDepartments.length,
  //   });

  //   if (!form.department) {
  //     console.log('[DeptDebug] No department selected -> null');
  //     return null;
  //   }

  //   // ถ้าเป็น UUID อยู่แล้ว
  //   if (isUUID(form.department)) {
  //     console.log('[DeptDebug] department is UUID:', form.department);
  //     return form.department;
  //   }

  //   // หา match ใน externalDepartments
  //   const match = externalDepartments.find(
  //     (dept) =>
  //       String(dept.id) === String(form.department) ||
  //       dept.name === form.department ||
  //       dept.label === form.department
  //   );

  //   if (match && isUUID(match.id)) {
  //     console.log('[DeptDebug] matched externalDepartments:', match.id);
  //     return match.id;
  //   }

  //   // ถ้าไม่ match อะไรเลย → return null (กัน error FK)
  //   console.warn('[DeptDebug] department not found in externalDepartments, forcing null:', form.department);
  //   return null;
  // })();

  // console.log("[DeptDebug] Final outside_department_id =", finalOutsideDepartmentId);

  const payload = {
    position_id: resolvedPositionId,
    // ถ้าเป็นกรณีพิเศษถึงจะส่งข้อความตำแหน่งอื่นๆ ไม่งั้นไม่ต้องใส่คีย์
    ...(form.salutation_is_other
      ? { position_other_text: (form.position_other_text || '').trim() }
      : {}),
    complaint_number: form.complaint_number || '',
    complaint_number_date: toYMD(form.complaint_number_date),
    document_number: form.refNo || '',
    document_date: toYMD(form.document_date),
    subject: form.subject || '',
    signature_authority_user_id: nullIfEmpty(form.signer),
    confidentiality_level: nullIfEmpty(form.confidentiality),
    urgency_level: nullIfEmpty(form.urgency),
    complaint_id: nullIfEmpty(form.complaint_id),
    remarks: form.note || '',
  };

  // แนบ “เฉพาะ”ฟิลด์ department ที่ควรใช้
  if (!form.salutation_is_other) {
    // เคสปกติ ใช้หน่วยงานภายนอกเท่านั้น
    if (resolvedOutsideId) {
      payload.outside_department_id = resolvedOutsideId;
    }
    // อย่าแนบ department_id เลย
  } else {
    // เคสพิเศษ: ไม่ต้องส่งทั้งคู่
  }

  // เคลียร์คีย์ที่เป็น undefined ออก เพื่อไม่ให้ axios ส่งขึ้นไป
  Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

  console.log('OutgoingReport2 payload', payload);

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

    try {
      const r1 = await axiosInstance.post(`/outgoing-reports2/${reportId}/attachments`, buildFormData(false));
      ok = !!r1?.data;
    } catch (e1) {
      const data = e1?.response?.data;
      lastErr = data?.res_data?.error || data?.res_message || e1.message || '';
      console.error('Upload type2 attempt #1 failed', data || e1);
    }

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

    let reportId = id || null;
    let createOrUpdateRes = null; 
    let mode = 'create';
    
    if (id) {
      mode = 'update';
      showLoading('กำลังอัพเดตรายงาน...');
      try {
        createOrUpdateRes = await UpdateOutgoingReport2(id, payload);
      } catch (eUpd) {
        closeAlert();
        setIsLoading(false);
        const msg = eUpd?.response?.data?.res_message || eUpd?.message || 'อัพเดตไม่สำเร็จ';
        await alertError('เกิดข้อผิดพลาด', msg);
        return;
      }
      reportId = id;
    } else {
      showLoading('กำลังสร้างรายงาน...');
      createOrUpdateRes = await CreateOutgoingReport2(payload);
    }

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
    
    const createdId = reportId || extractReportId(createOrUpdateRes);

    if (!createdId) {
      closeAlert();
      setIsLoading(false);
      await alertError("ไม่พบรหัสรายงาน", "ระบบไม่สามารถดึงรหัสรายงานที่สร้างได้ กรุณาลองใหม่อีกครั้ง");
      return;
    }

    try {
      if (!id && createdId) {
        const newKey = 'outgoing_report2_outside_dept_new';
        const finalKey = `outgoing_report2_outside_dept_${createdId}`;
        const rawOutside = localStorage.getItem(newKey);
        if (rawOutside && !localStorage.getItem(finalKey)) {
          try {
            localStorage.setItem(finalKey, rawOutside);
            localStorage.removeItem(newKey);
            console.debug('[DeptDebug] migrated outside dept key:', newKey, '->', finalKey, rawOutside);
          } catch(_){}
        }
      }
    } catch (_) { console.log('[DeptDebug] migrate outside dept key failed'); }

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
      <p style="margin:6px 0 14px 0;">${id ? 'อัพเดตรายงานสำเร็จ' : 'บันทึกแบบรายงานส่งหน่วยงานที่เกี่ยวข้องเรียบร้อยแล้ว'}</p>
      <p style="margin:4px 0;color:#666">รหัสรายงาน: <strong>${createdId}</strong></p>
      <p style="margin:4px 0;color:#666">เรื่อง: <strong>${form.subject || "-"}</strong></p>
      ${fileNames ? `<p style="margin:4px 0;color:#666">ไฟล์แนบ: <strong>${fileNames}</strong></p>` : ""}
    </div>
  `;
    await alertSuccess(id ? 'อัพเดตสำเร็จ!' : 'บันทึกสำเร็จ!', successHtml, true);

    // Smart navigation
    const returnUrl = router?.query?.returnUrl || router?.query?.from;
    const cid = router?.query?.complaint_id || router?.query?.id || form.complaint_id;

    if (cid) {
      router.push(`/admin/box/list/${cid}`);
    } else if (returnUrl && typeof returnUrl === 'string') {
      router.push(returnUrl);
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/admin/box/list');
    }
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
    
    if (data?.res_code === '4040' && /FOREIGN KEY constraint/i.test(backendMsg)) {
      await alertError('หน่วยงานไม่ถูกต้อง', 'ไม่พบหน่วยงานที่เลือก หรือถูกลบออกจากระบบ กรุณาเลือกหน่วยงานใหม่');
      return;
    }
    
    alertError("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
  }
}, [form, attachmentFiles, validateRequiredFields, externalDepartments, router, id, selectedDepartment]);

  const handleDepartmentSelect = (arg1, arg2) => {
    // รองรับทั้ง (event, newValue) และ (option)
    let option = (arg2 !== undefined) ? arg2 : arg1;
    // ถ้ามาเป็น event ให้ลอง map จาก value กลับเป็น option
    if (option && option.target) {
      const raw = option.target.value ?? "";
      option =
        externalDepartments.find(
          d => String(d.id) === String(raw) ||
                String(d.value) === String(raw) ||
                d.label === raw || d.name === raw
        ) || (raw ? { id: raw, value: raw, label: raw } : null);
    }
    const deptId = option?.id || option?.value || "";
    setSelectedDepartment(option || null);
    handleChange({ target: { name: "outside_department_id", value: deptId } });
    if (deptId) {
      // ล้างข้อความ error ทันที
      setErrors(prev => ({ ...prev, outside_department_id: null }));
    }
  };

  const isFormValid = useCallback(() => {
    const requiredFields = [
      'salutation', 'refNo', 'document_date', 'complaint_number', 
      'complaint_number_date', 'subject', 'signer', 'confidentiality', 
      'urgency', 
      // 'attachment'
    ];
    
    const baseOk = requiredFields.every(f => {
      const v = form[f];
      return v !== undefined && v !== null && v !== '';
    });
    
    // const otherOk = !form.salutation_is_other || !!form.position_other_text;
    const deptOk = form.salutation_is_other ? true : !!form.outside_department_id;
    
     return baseOk && deptOk;
  }, [form]);

  const canSave = useCallback(() => isFormValid(), [isFormValid]);

  const hasFormChanges = useCallback(() => {
    const initial = {
      salutation: "",
      salutation_is_other: false,
      position_other_text: "",
      refNo: "",
      document_date: null,
      complaint_number: "",
      complaint_number_date: null,
      subject: "",
      // department: "",
      signer: "",
      confidentiality: "",
      urgency: "",
      attachment: "",
      note: "",
      position_id: "",
      complaint_id: "",
      selected_complaint_number: "",
      outside_department_id: "",
    };
    return Object.keys(initial).some((k) => form[k] !== initial[k]);
  }, [form]);

  return {
    form,
    errors,
    isLoading,
    id,
    isRequired,
    createLabel,
    getFieldError,
    isFormValid,
    fileInputKey,
    canSave,
    hasFormChanges,
    handleChange,
    handleDocumentDateChange,
    handleComplaintNumberDateChange,
    handleFileUpload,
    handleFileChange,
    handleClear,
    handleSave,
    validateRequiredFields,
    resetField,
    updateField,
    UpdateOutgoingReport2,
    DeleteOutgoingReport2Attachment,
    existingAttachments,
    setExistingAttachments,
    handleDeleteExistingAttachment,
    externalDepartments,
    isLoadingDepartments,
    selectedDepartment,       
    setSelectedDepartment,   
    handleDepartmentSelect,  
  };
};

export default useInitialNotificationComplainantAgency;