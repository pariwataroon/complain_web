import { useState, useCallback, useEffect } from "react";
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
  const m = cleaned.match(/MOF-(\d{8})(?:-[A-Za-z0-9]+)?/i);
  if (!m) return null;
  const raw = m[1];
  if (raw.length !== 8) return null;
  let year = parseInt(raw.slice(0, 4), 10);
  const month = parseInt(raw.slice(4, 6), 10);
  const day = parseInt(raw.slice(6, 8), 10);
  if (!year || !month || !day) return null;
  if (year > 2400) year -= 543;
  return { day, month, year, buddhistYear: year + 543 };
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
    document_date: null,
    complaint_number: "",
    complaint_number_date: null,
    subject: "",
    department: "",
    signer: "",
    confidentiality: "",
    urgency: "",
    attachment: "",
    note: "",
    position_id: "",
    complaint_id: "",
    selected_complaint_number: "",
  });

  // เก็บไฟล์จริง (รองรับหลายไฟล์)
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(0);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // ไฟล์แนบที่มีอยู่ในเซิร์ฟเวอร์ (สำหรับ mode edit)
  const [existingAttachments, setExistingAttachments] = useState([]);

  // -------- EDIT mode: โหลดข้อมูลจาก API และ sync attachments --------
  useEffect(() => {
    if (!router?.isReady || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await GetOutgoingReport2ById(id);
        const d = res?.res_data || res?.data || res;
        if (cancelled || !d) return;

        setForm((prev) => ({
          ...prev,
          complaint_number: d.complaint_number || d.reference_number || "",
          complaint_id: d.complaint_id || "",
          refNo: d.document_number || "",
          subject: d.subject || "",
          salutation: d.position?.id || "",
          salutation_is_other: (d.position?.name || "") === "อื่นๆ",
          position_other_text: d.position_other_text || "",
          signer: d.signature_authority_user?.id || d.signature_authority_user_id || "",
          position_id: d.signature_authority_user?.position_id ||
                        d.signature_authority_user?.position?.id ||
                        d.signature_authority_user?.positionId || "",
          department: d.department?.id || "",
          document_date: d.document_date ? parseIsoToThaiDate(d.document_date) : null,
          complaint_number_date: d.complaint_number_date ? parseIsoToThaiDate(d.complaint_number_date) : null,
          confidentiality: d.confidentiality_level !== undefined && d.confidentiality_level !== null ? String(d.confidentiality_level) : "",
          urgency: d.urgency_level !== undefined && d.urgency_level !== null ? String(d.urgency_level) : "",
          note: d.remarks || "",
          selected_complaint_number: "",
        }));

        // ใช้เฉพาะ attachments ที่ได้จาก API เท่านั้น
        setExistingAttachments(Array.isArray(d.attachments) ? d.attachments : []);
        // อัพเดทชื่อไฟล์แนบในฟอร์ม (แสดงไฟล์ปัจจุบันจาก API)
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

  // -------- CREATE mode: Prefill จาก query --------
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

  // -------- Required fields --------
  const requiredFields = [
    "salutation",
    "refNo",
    "document_date",
    "complaint_number",
    "complaint_number_date",
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

  // การเปลี่ยนค่าฟิลด์ในฟอร์ม
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    const finalValue = typeof value === 'object' && value !== null ? value.value || '' : value;
    setForm(prev => ({ ...prev, [name]: finalValue }));

    if (name === 'salutation_is_other' && !finalValue) {
      setForm(prev => ({ ...prev, position_other_text: "" }));
      if (errors.position_other_text) setErrors(prev => ({ ...prev, position_other_text: null }));
    }
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
      { field: "salutation", label: "เรียน" },
      ...(form.salutation_is_other ? [{ field: "position_other_text", label: "ตำแหน่ง (อื่นๆ)" }] : []),
      { field: "refNo", label: "เลขที่หนังสือ" },
      { field: "document_date", label: "วันที่หนังสือ" },
      { field: "complaint_number", label: "เลข สป.กค." },
      { field: "complaint_number_date", label: "วันที่ สป.กค." },
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
      department: "",
      signer: "",
      confidentiality: "",
      urgency: "",
      attachment: "",
      note: "",
      position_id: "",
      complaint_id: "",
      selected_complaint_number: "",
    });
    setAttachmentFiles([]);
    setErrors({});
    setExistingAttachments([]);
  }, []);

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

  // DELETE ATTACHMENT: No alert; refetch attachments after delete from API
  const handleDeleteExistingAttachment = useCallback(
    async (att) => {
      const reportId = router?.query?.id || id || null;
      // if (!reportId || !att?.id) return false;
      // await DeleteOutgoingReport2Attachment({
      //   outgoing_report_id: reportId,
      //   attachment_id: att.id,
      // });

      // Refetch data after delete (sync UI with API)
      try {
        const res = await GetOutgoingReport2ById(reportId);
        const d = res?.res_data || res?.data || res;
        setExistingAttachments(Array.isArray(d.attachments) ? d.attachments : []);
        const names = Array.isArray(d.attachments) && d.attachments.length
          ? d.attachments.map(a => a.file_name || a.original_name || a.name || '').filter(Boolean).join(', ')
          : "";
        setForm((prev) => ({ ...prev, attachment: names }));
      } catch (err) {}
      return true;
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

    // ตรวจไฟล์ก่อนอัปโหลด
    if (attachmentFiles.length) {
      const maxSize = 10 * 1024 * 1024;
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
      complaint_number_date: toYMD(form.complaint_number_date),
      document_number: form.refNo || "",
      document_date: toYMD(form.document_date),
      subject: form.subject || "",
      signature_authority_user_id: nullIfEmpty(form.signer),
      department_id: nullIfEmpty(form.department),
      user_id: null,
      confidentiality_level: nullIfEmpty(form.confidentiality),
      urgency_level: nullIfEmpty(form.urgency),
      complaint_id: nullIfEmpty(form.complaint_id),
      remarks: form.note || "",
    };
    console.log("OutgoingReport2 payload", payload);

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

  const isFormValid = useCallback(
    () =>
      requiredFields.every((f) => {
        const v = form[f];
        return v !== undefined && v !== null && v !== "";
      }) && (!form.salutation_is_other || !!form.position_other_text),
    [form, requiredFields]
  );

  const canSave = useCallback(() => {
    const baseOk = requiredFields.every((f) => {
      const v = form[f];
      return v !== undefined && v !== null && v !== "";
    });
    const otherOk = !form.salutation_is_other || !!form.position_other_text;
    return baseOk && otherOk;
  }, [form, requiredFields]);

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
      department: "",
      signer: "",
      confidentiality: "",
      urgency: "",
      attachment: "",
      note: "",
      position_id: "",
      complaint_id: "",
      selected_complaint_number: "",
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
  };
};

export default useInitialNotificationComplainantAgency;