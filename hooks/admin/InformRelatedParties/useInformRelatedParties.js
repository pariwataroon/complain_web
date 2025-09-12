import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import {
  alertSuccess,
  alertError,
  showLoading,
  closeAlert,
} from "@utils/Alerts";
import {
  CreateOutgoingReport4,
  UploadOutgoingReportAttachments,
  GetOutgoingReport4ById,
  UpdateOutgoingReport4,
} from "@pages/api/outgoinreports/outgoinreports";
import axiosInstance from "@pages/api/axiosInstance";

// NOTE: Removed POSITION_FALLBACK mock. We now always attempt to send the actual
// selected position (salutation) id. If none is selected validation will block save.

const isUUID = (s) =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

// Helper function to convert Thai date to YMD format
const toYMD = (thaiDate) => {
  if (!thaiDate) return null;

  // If it's already in YYYY-MM-DD format, return as is
  if (typeof thaiDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(thaiDate)) {
    return thaiDate;
  }

  // If it's a Date object, convert to YYYY-MM-DD
  if (thaiDate instanceof Date) {
    return thaiDate.toISOString().split('T')[0];
  }

  // Handle Thai date format conversion logic here
  // This is a placeholder - implement based on your DateThaiPickerService format
  return thaiDate;
};

export const useInformRelatedParties = () => {
  const router = useRouter();
  const { id, complaint_id, complaint_number, report4_id } = router.query;
  // complaint id separate from report4 editing id
  const complaintId =
    (Array.isArray(complaint_id) ? complaint_id[0] : complaint_id) ||
    (Array.isArray(id) ? id[0] : id) ||
    null;
  // editing target (report4 primary id)
  const report4Id = Array.isArray(report4_id) ? report4_id[0] : report4_id || null;
  const complaintNumberFromQuery = Array.isArray(complaint_number)
    ? complaint_number[0]
    : complaint_number || "";

  // Initial form state
  const initialFormState = useMemo(
    () => ({
      salutation: "", 
      salutation_is_other: false,
      salutation_is_complainant: false,
      salutation_name: "", // human-readable position/salutation name for payload position_name
      position_other_text: "",
      refNo: complaintNumberFromQuery || "", // reference_number
      date: null, // reference_date (will be converted with toYMD)
      subject: "", // subject
      bookNo: "", // complaint_number และ document_number (ใช้ค่าเดียวกัน)
      date2: null, // complaint_number_date และ document_date (ใช้ค่าเดียวกัน)
      signer: "", // signature_authority_user_id
      department: "", // department_id
      confidentiality: null, // confidentiality_level
      urgency: null, // urgency_level
      proposeFor: "",
      decision: "",
      attachment: "",
      details: "", // remarks
      note: "", // remarks (alias for details)
    }),
    []
  );

  useEffect(() => {
    if (complaintNumberFromQuery && !form.refNo) {
      setForm(prev => ({ ...prev, refNo: complaintNumberFromQuery }));
    }
  }, [complaintNumberFromQuery]);

  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loadedReportId, setLoadedReportId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  // เพิ่ม state สำหรับเก็บไฟล์จริง
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [existingAttachments, setExistingAttachments] = useState([]);
  // Track initial & previous refNo for edit mode date auto-update logic
  const initialRefNoRef = useRef(null);
  const prevRefNoRef = useRef(null);

  // Capture initial refNo when editing (after data load fills form.refNo)
  useEffect(() => {
    if (isEditing && form.refNo && initialRefNoRef.current === null) {
      initialRefNoRef.current = form.refNo;
      prevRefNoRef.current = form.refNo;
    }
  }, [isEditing, form.refNo]);

  // Auto derive date from refNo (pattern MOF-<BEYYYYMMDD>-xxxxx)
  useEffect(() => {
    if (!form.refNo) return;
    const raw = form.refNo.trim();
    if (prevRefNoRef.current === raw) return; // no actual change
    const match = /^MOF-(\d{8})-/i.exec(raw);
    if (!match) { prevRefNoRef.current = raw; return; }
    const beDate = match[1];
    const beYear = parseInt(beDate.slice(0, 4), 10);
    if (Number.isNaN(beYear)) { prevRefNoRef.current = raw; return; }
    const month = beDate.slice(4, 6);
    const day = beDate.slice(6, 8);
    const ceYear = beYear - 543;
    if (ceYear < 1900 || ceYear > 2600) { prevRefNoRef.current = raw; return; }
    const iso = `${ceYear.toString().padStart(4, '0')}-${month}-${day}`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) { prevRefNoRef.current = raw; return; }
    const dObj = new Date(iso);
    if (Number.isNaN(dObj.getTime())) { prevRefNoRef.current = raw; return; }
    if ((dObj.getMonth() + 1) !== parseInt(month, 10) || dObj.getDate() !== parseInt(day, 10)) { prevRefNoRef.current = raw; return; }

    // Logic:
    // - Create mode: set if date empty (or we may choose always update if pattern changes and date was auto from pattern). Keep simple: if date empty -> set.
    // - Edit mode: set only if refNo changed from initial refNo.
    const refChangedFromInitial = !initialRefNoRef.current || raw !== initialRefNoRef.current;
    if (!isEditing) {
      if (!form.date) setForm(prev => ({ ...prev, date: iso }));
    } else if (refChangedFromInitial) {
      setForm(prev => ({ ...prev, date: iso }));
    }
    prevRefNoRef.current = raw;
  }, [form.refNo, isEditing, form.date]);

  // ฟิลด์ที่จำเป็นต้องกรอก
  // NOTE: Removed 'department' from hard required fields per user request.
  // If salutation is normal (not other/complainant) and department omitted, we still allow save.
  const requiredFields = [
    "salutation", // position_id (เรียนถึง)
    "refNo",
    "date",
    "subject",
    "signer",
    // "department", // removed: no longer strictly required
    "confidentiality",
    "urgency",
    "proposeFor",
    "decision",
    // attachment: allow empty if editing and there are existing attachments already
    "attachment",
  ];

  // ฟังก์ชันตรวจสอบว่าฟิลด์จำเป็นหรือไม่
  const isRequired = useCallback(
    (fieldName) => {
      return requiredFields.includes(fieldName);
    },
    [requiredFields]
  );

  // ฟังก์ชันสร้าง label พร้อม * สีแดง
  const createLabel = useCallback(
    (text, fieldName) => {
      return (
        <span>
          {text}
          {isRequired(fieldName) && (
            <span style={{ color: "red", marginLeft: 4 }}>*</span>
          )}
        </span>
      );
    },
    [isRequired]
  );

  // ฟังก์ชันรับ error ของฟิลด์
  const getFieldError = useCallback(
    (fieldName) => {
      return errors[fieldName] || null;
    },
    [errors]
  );

  // Handler สำหรับการเปลี่ยนแปลงฟิลด์ทั่วไป
  const handleChange = useCallback(
    (nameOrEvent, value, options = {}) => {
      let name, finalValue;

      // Handle different input formats
      if (typeof nameOrEvent === 'string') {
        name = nameOrEvent;
        finalValue = typeof value === "object" && value !== null && value.value !== undefined ? value.value : value;
      } else if (nameOrEvent && nameOrEvent.target) {
        // Event object: handleChange(event)
        const { name: eventName, value: eventValue } = nameOrEvent.target;
        name = eventName;
        finalValue = typeof eventValue === "object" && eventValue !== null && eventValue.value !== undefined ? eventValue.value : eventValue;
      } else {
        console.error("Invalid handleChange arguments:", nameOrEvent, value);
        return;
      }

      console.log("🔥 handleChange:", name, "=", finalValue);

      setForm((prev) => {
        const next = {
          ...prev,
          [name]: finalValue,
          ...(name === 'details' && { note: finalValue }),
          ...(name === 'note' && { details: finalValue }),
        };
        // Auto capture human label for salutation if option object supplied
        if (name === 'salutation') {
          let labelCandidate = '';
            if (value && typeof value === 'object') {
              labelCandidate = value.label || value.name || value.title || '';
            }
          // If coming via event but we stored original object in options.originalOption
          if (!labelCandidate && options && options.originalOption) {
            const opt = options.originalOption;
            labelCandidate = opt.label || opt.name || opt.title || '';
          }
          if (labelCandidate && !next.salutation_name) {
            next.salutation_name = labelCandidate;
          }
        }
        return next;
      });

      // ล้าง error ของฟิลด์ที่กำลังแก้ไข
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: null }));
      }
    },
    [errors]
  );

  // Handler สำหรับ DateThaiPickerService
  const handleDateChange = useCallback(
    (thaiDate, fieldName = 'date') => {
      console.log("📅 handleDateChange:", fieldName, "=", thaiDate);

      setForm((prev) => ({ ...prev, [fieldName]: thaiDate }));

      // ล้าง error ของวันที่
      if (errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: null }));
      }
    },
    [errors]
  );

  // Handler สำหรับ file upload (รองรับ InputFile: File | File[] | null)
  const handleFileUpload = useCallback(
    (input) => {
      console.log("📎 handleFileUpload:", input);

      if (!input) {
        setUploadedFiles([]);
        setForm((prev) => ({ ...prev, attachment: "" }));
        setFileInputKey((k) => k + 1);
        return;
      }

      let files = [];
      if (input instanceof File) {
        files = [input];
      } else if (Array.isArray(input) && input.length > 0 && input[0] instanceof File) {
        files = input;
      } else {
        // Unknown input, ignore
        return;
      }

      setUploadedFiles(files);
      const fileNames = files.map((f) => f.name).join(", ");
      setForm((prev) => ({ ...prev, attachment: fileNames }));
      if (errors.attachment) {
        setErrors((prev) => ({ ...prev, attachment: null }));
      }
    },
    [errors.attachment]
  );

  // Handler สำหรับ legacy file change (รองรับ input file ธรรมดา)
  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      console.log("📁 handleFileChange:", file?.name);

      if (file) {
        // เก็บไฟล์จริง
        setUploadedFiles([file]);

        setForm((prev) => ({
          ...prev,
          attachment: file.name,
        }));

        // ล้าง error ของไฟล์
        if (errors.attachment) {
          setErrors((prev) => ({ ...prev, attachment: null }));
        }
      }
    },
    [errors.attachment]
  );

  // ฟังก์ชันล้างฟอร์ม - แก้ไขให้ล้างไฟล์ด้วย
  const handleClear = useCallback(() => {
    console.log("🧹 handleClear: Clearing form");
    setForm(initialFormState);
    setErrors({});
    setUploadedFiles([]); // ล้างไฟล์ที่อัปโหลด
    setFileInputKey((k) => k + 1);
  }, [initialFormState]);

  // ฟังก์ชันตรวจสอบข้อมูลที่จำเป็น
  const validateRequiredFields = useCallback(() => {
    const fieldsConfig = [
      { field: "salutation", label: "เรียนถึง" },
      { field: "refNo", label: "เลขที่ สป.กค." },
      { field: "date", label: "วันที่" },
      { field: "subject", label: "เรื่อง" },
      { field: "signer", label: "ผู้ลงนาม" },
      // department removed from required validation
      { field: "position_other_text", label: "ระบุตำแหน่ง/ผู้ร้อง" },
      { field: "confidentiality", label: "ชั้นความลับ" },
      { field: "urgency", label: "ชั้นความเร่งด่วน" },
      { field: "proposeFor", label: "เสนอเพื่อ" },
      { field: "decision", label: "ผลการพิจารณา" },
      { field: "attachment", label: "เอกสารแนบ" },
    ];

    const newErrors = {};
    const missingFields = [];

    fieldsConfig.forEach(({ field, label }) => {
      // Skip attachment requirement when editing if existing attachments present
      if (field === 'attachment' && isEditing && existingAttachments.length > 0) return;

      // Conditional: if salutation other/complainant, treat position_other_text as required and department optional
      const useCustom = form.salutation_is_other || form.salutation_is_complainant;
  if (field === 'department') return; // department never required now
      if (field === 'position_other_text' && !useCustom) return; // only required when using custom

      const value = form[field];
      if (value === undefined || value === null || value === "") {
        newErrors[field] = `กรุณากรอก${label}`;
        missingFields.push({ field, label });
      }
    });

    console.log("🔍 validateRequiredFields:", { missingFields, newErrors });
    setErrors(newErrors);
    return missingFields;
  }, [form]);

  // ฟังก์ชันอัปโหลดไฟล์ - Multi-strategy fallback (เฉพาะ type4)
  const uploadFiles = useCallback(async (reportId) => {
    if (!uploadedFiles || uploadedFiles.length === 0) {
      console.log("ℹ️ No files to upload");
      return [];
    }

    console.log("📤 Uploading files:", uploadedFiles.map(f => f.name));

    const buildFormData = (key = 'files') => {
      const formData = new FormData();
      if (key === 'file' && uploadedFiles.length === 1) {
        formData.append('file', uploadedFiles[0], uploadedFiles[0].name);
      } else {
        uploadedFiles.forEach((f) => formData.append(key, f, f.name));
      }
      return formData;
    };

    let uploadOk = false;
    let lastErrorMsg = '';

    // Attempt 1: /outgoing-reports4/{id}/attachments (key: files)
    try {
      const up1 = await axiosInstance.post(`/outgoing-reports4/${reportId}/attachments`, buildFormData('files'));
      uploadOk = !!(up1 && (up1.status >= 200 && up1.status < 300));
      console.log("✅ Upload attempt #1 (type4) succeeded");
    } catch (err1) {
      const data = err1?.response?.data;
      lastErrorMsg = data?.res_data?.error || data?.res_message || err1.message || '';
      console.error('Upload attempt #1 (type4) failed', data || err1);
    }

    // Attempt 2: /outgoing-reports4/{id}/attachments (key: attachments)
    if (!uploadOk) {
      try {
        const up2 = await axiosInstance.post(`/outgoing-reports4/${reportId}/attachments`, buildFormData('attachments'));
        uploadOk = !!(up2 && (up2.status >= 200 && up2.status < 300));
        if (uploadOk) console.log("✅ Upload attempt #2 (attachments key) succeeded");
      } catch (err2) {
        const data = err2?.response?.data;
        lastErrorMsg = data?.res_data?.error || data?.res_message || err2.message || lastErrorMsg;
        console.error('Upload attempt #2 (attachments key) failed', data || err2);
      }
    }

    // Attempt 3: single file key (if only one file)
    if (!uploadOk && uploadedFiles.length === 1) {
      try {
        const up3 = await axiosInstance.post(`/outgoing-reports4/${reportId}/attachments`, buildFormData('file'));
        uploadOk = !!(up3 && (up3.status >= 200 && up3.status < 300));
        if (uploadOk) {
          console.log("✅ Upload attempt #3 (single file key) succeeded");
        }
      } catch (err3) {
        const data = err3?.response?.data;
        lastErrorMsg = data?.res_data?.error || data?.res_message || err3.message || lastErrorMsg;
        console.error('Upload attempt #3 (single file key) failed', data || err3);
      }
    }

    // Attempt 4: generic endpoint /outgoing-reports/{id}/attachments (key: files)
    if (!uploadOk) {
      try {
        const up4 = await UploadOutgoingReportAttachments(buildFormData('files'), reportId);
        uploadOk = !!(up4 && (up4.success === true || up4.res_code === '0001' || up4.data));
        if (!uploadOk) {
          lastErrorMsg = up4?.res_data?.error || up4?.res_message || up4?.message || lastErrorMsg;
        } else {
          console.log("✅ Upload attempt #4 (generic) succeeded");
        }
      } catch (err4) {
        const data = err4?.response?.data;
        lastErrorMsg = data?.res_data?.error || data?.res_message || err4.message || lastErrorMsg;
        console.error('Upload attempt #4 (generic) failed', data || err4);
      }
    }

    if (!uploadOk) {
      console.warn('⚠️ บันทึกรายงานสำเร็จแต่แนบไฟล์ไม่สำเร็จ', lastErrorMsg);
      throw new Error(lastErrorMsg || 'ระบบไม่สามารถแนบไฟล์ได้');
    }

    return uploadedFiles.map(f => ({ name: f.name, success: true }));
  }, [uploadedFiles]);

  // ฟังก์ชันสร้าง request body ตาม format ที่กำหนด - แก้ไข position_id
  const createRequestBody = useCallback(() => {
    // Map numbers (select values) to API expected string labels
    const confidentialityNumberToString = (val) => {
      const map = { 1: 'ปกติ', 2: 'ลับ', 3: 'ลับมาก', 4: 'ลับที่สุด' };
      if (typeof val === 'string') return map[Number(val)] || val; // already string label or numeric string
      return map[val] || null;
    };
    const urgencyNumberToString = (val) => {
      // Sample body from user shows 'ด่วน', 'ด่วนมาก', 'ด่วนที่สุด'
      const map = { 1: 'ปกติ', 2: 'ด่วน', 3: 'ด่วนมาก', 4: 'ด่วนที่สุด' };
      if (typeof val === 'string') return map[Number(val)] || val; // keep original if already label
      return map[val] || null;
    };
    const useCustomRecipient = form.salutation_is_other || form.salutation_is_complainant;
    // Extract real position id (salutation) regardless of object/string shape
    const extractPositionId = (val) => {
      if (!val) return null;
      if (typeof val === 'string') return val.trim();
      if (typeof val === 'object') {
        return (
          val.id ||
          val.value ||
          val.position_id ||
          val.positionId ||
          (val.position && (val.position.id || val.position.position_id)) ||
          null
        );
      }
      return null;
    };
    let positionId = extractPositionId(form.salutation);
    if (positionId && typeof positionId === 'string') positionId = positionId.trim();
    // Do NOT fall back to a mock UUID anymore; let validation ensure presence.
    const otherText = useCustomRecipient ? (form.position_other_text || '').trim() : null;
    // Derive a non-null position_name (backend returns position_name=null now; user wants value)
    let positionName = form.salutation_name || "";
    if (useCustomRecipient && otherText) {
      positionName = otherText; // prefer user-entered custom text
    }
    if (!positionName) {
      // fallback: use otherText (if any) else id (so it's never null)
      positionName = otherText || positionId || "";
    }
    const body = {
      position_id: positionId || null,
      position_name: positionName, // ensure not null (empty string if truly nothing)
      position_label: positionName, // compatibility synonyms
      position_title: positionName,
      reference_number: (form.refNo || "").trim(),
      reference_date: toYMD(form.date),
      subject: (form.subject || "").trim(),
      complaint_number: (form.refNo || "").trim(),
      complaint_number_date: toYMD(form.date2),
      document_number: (form.bookNo || "").trim(),
      document_date: toYMD(form.date2),
      signature_authority_user_id: form.signer,
      confidentiality_level: confidentialityNumberToString(form.confidentiality),
      urgency_level: urgencyNumberToString(form.urgency),
      remarks: form.note || form.details || "",
      propose_for: form.proposeFor,
      decision: form.decision,
      attachment: form.attachment,
      proposal_purpose: form.proposeFor,
      consideration_result: form.decision,
      complaint_id: complaintId,
      // Provide richer position object for backend consumption
      position: positionId ? {
        id: positionId,
        name: positionName || undefined,
        label: positionName || undefined,
        title: positionName || undefined,
        other_text: otherText || null,
      } : undefined,
      // BACKWARD COMPAT: Some backend endpoints still read root-level position_other_text
      ...(otherText ? { position_other_text: otherText } : {}),
      ...(useCustomRecipient ? { custom_recipient: otherText || '', custom_recipient_type: form.salutation_is_complainant ? 'COMPLAINANT' : 'OTHER' } : {}),
    };
    // Include department_id only if NOT custom recipient and user actually selected a department (non-empty)
    if (!useCustomRecipient && form.department) {
      body.department_id = form.department; // don't send null when empty to avoid backend forcing selection
    }

    console.log("📦 createRequestBody:", body);
    return body;
  }, [form, complaintId]);

  // ฟังก์ชันบันทึกข้อมูล - รองรับทั้ง create และ update
  const handleSave = useCallback(async () => {
    console.log("💾 handleSave: Starting save process");
    // Recompute custom recipient flag locally for this scope
    const useCustomRecipient = form.salutation_is_other || form.salutation_is_complainant;

    const missingFields = validateRequiredFields();

    if (missingFields.length > 0) {
      const missingFieldNames = missingFields
        .map(({ label }) => label)
        .join(", ");

      console.log("❌ Missing fields:", missingFieldNames);

      alertError(
        "ข้อมูลไม่ครบถ้วน",
        `กรุณากรอกข้อมูลในฟิลด์: ${missingFieldNames}`
      );
      return;
    }

    try {
      setIsLoading(true);
      showLoading("กำลังบันทึกข้อมูล...");

      const requestBody = createRequestBody();
      console.log("🚀 Sending request with body:", requestBody, "editing:", isEditing, "target:", loadedReportId || report4Id);

      let effectiveId = loadedReportId || report4Id;
      let response;
      if (isEditing && effectiveId) {
        // UPDATE flow
        console.log("✏️ Updating existing outgoing report4", effectiveId);
        response = await UpdateOutgoingReport4(effectiveId, requestBody);
      } else {
        // CREATE flow
        response = await CreateOutgoingReport4(requestBody);
      }
      console.log("✅ Main data saved/updated:", response);

      // ดึงรหัสรายงานให้แน่นอน (create หรือ update return)
      const createdId = response?.id || response?.res_data?.id || effectiveId || null;
      if (!createdId) {
        closeAlert();
        setIsLoading(false);
        await alertError("ไม่พบรหัสรายงาน", "ระบบไม่สามารถดึงรหัสรายงานได้ กรุณาลองใหม่อีกครั้ง");
        return;
      }
      effectiveId = createdId;

      // Persist salutation locally (กรณี backend ไม่ส่ง position_id กลับมาให้ตอนโหลด)
      try {
        if (typeof window !== 'undefined' && form.salutation) {
          localStorage.setItem(`report4_position_${effectiveId}`, form.salutation);
          if (form.salutation_name) {
            localStorage.setItem(`report4_position_name_${effectiveId}`, form.salutation_name);
          }
        }
      } catch (e) {
        console.warn('ไม่สามารถบันทึกตำแหน่งลง localStorage', e);
      }
      try {
        if (typeof window !== 'undefined') {
          const key = `report4_custom_recipient_${effectiveId}`;
          if (useCustomRecipient && form.position_other_text) {
            localStorage.setItem(key, JSON.stringify({
              text: (form.position_other_text || '').trim(),
              type: form.salutation_is_complainant ? 'COMPLAINANT' : 'OTHER'
            }));
          } else {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        console.warn('ไม่สามารถบันทึก custom_recipient ลง localStorage', e);
      }

      // อัปโหลดไฟล์เฉพาะกรณีที่มีไฟล์ใหม่ (ไฟล์ existingAttachments จัดการหน้า component)
  if (uploadedFiles.length > 0) {
        console.log("📤 Starting file upload for report ID:", effectiveId);
        showLoading("กำลังอัปโหลดไฟล์...");
        await uploadFiles(effectiveId);
        console.log("✅ Files uploaded successfully");
      }

      closeAlert();
      const reportId = effectiveId;

      const successMessage = `
          <div style="text-align: center; line-height: 1.6;">
            <p style="margin-bottom: 15px; font-size: 16px;">บันทึกแบบรายงานส่งหน่วยงานที่เกี่ยวข้องเรียบร้อยแล้ว</p>
            <p style="margin-bottom: 10px; color: #666;">รหัสรายงาน: <strong>${reportId}</strong></p>
            <p style="margin-bottom: 10px; color: #666;">เรื่อง: <strong>${form.subject}</strong></p>
            ${uploadedFiles.length > 0
          ? `<p style="color: #666;">ไฟล์แนบ: <strong>${uploadedFiles.map(f => f.name).join(", ")}</strong></p>`
          : ""
        }
          </div>
        `;

  await alertSuccess("บันทึกสำเร็จ!", successMessage, true);
  router.push(`/admin/box/list`);

      // Reset form after successful save
      handleClear();

    } catch (error) {
      closeAlert();
      setIsLoading(false);

      console.error("❌ Save error:", error);

      alertError(
        "เกิดข้อผิดพลาด",
        error?.message || "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง"
      );
    }
  }, [form, validateRequiredFields, createRequestBody, uploadFiles, uploadedFiles, handleClear, isEditing, loadedReportId, report4Id]);

  // ฟังก์ชันสำหรับรีเซ็ตข้อมูลเฉพาะฟิลด์
  const resetField = useCallback((fieldName) => {
    console.log("🔄 resetField:", fieldName);
    setForm((prev) => ({ ...prev, [fieldName]: "" }));
    setErrors((prev) => ({ ...prev, [fieldName]: null }));
  }, []);

  // ฟังก์ชันสำหรับอัพเดทฟิลด์เฉพาะ
  const updateField = useCallback(
    (fieldName, value) => {
      console.log("📝 updateField:", fieldName, "=", value);
      setForm((prev) => ({
        ...prev,
        [fieldName]: value,
        // Sync details and note fields
        ...(fieldName === 'details' && { note: value }),
        ...(fieldName === 'note' && { details: value }),
      }));

      // ล้าง error ของฟิลด์ที่อัพเดท
      if (errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: null }));
      }
    },
    [errors]
  );

  // ฟังก์ชันตรวจสอบว่าฟอร์มมีการเปลี่ยนแปลงหรือไม่
  const hasFormChanges = useCallback(() => {
    return Object.keys(initialFormState).some(
      (key) => form[key] !== initialFormState[key]
    ) || uploadedFiles.length > 0;
  }, [form, initialFormState, uploadedFiles]);

  // ฟังก์ชันตรวจสอบว่าฟอร์มพร้อมส่งหรือไม่
  const isFormValid = useCallback(() => {
    const useCustom = form.salutation_is_other || form.salutation_is_complainant;
    return requiredFields.every((field) => {
      if (field === 'attachment' && isEditing && existingAttachments.length > 0) return true;
      const value = form[field];
      return value !== undefined && value !== null && value !== "";
    }) && (!useCustom || (form.position_other_text && form.position_other_text.trim() !== ""));
  }, [form, requiredFields, isEditing, existingAttachments]);

  // canSave focuses on required-only validation like other forms
  const canSave = useCallback(() => {
    const useCustom = form.salutation_is_other || form.salutation_is_complainant;
    if (useCustom && (!form.position_other_text || form.position_other_text.trim() === "")) return false;
    return requiredFields.every((f) => {
      if (f === 'attachment' && isEditing && existingAttachments.length > 0) return true;
      const v = form[f];
      return !(v === undefined || v === null || v === "");
    });
  }, [form, requiredFields, isEditing, existingAttachments]);

  // โหลดข้อมูลเพื่อแก้ไขเมื่อมี report4_id ใน query (หรือ id ที่เป็น type4)
  useEffect(() => {
    const targetId = report4Id; // ใช้ query report4_id ชัดเจน
    if (!targetId) return;
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const res = await GetOutgoingReport4ById(targetId);
        const d = res?.res_data || res?.data || res;
        if (!d || cancelled) return;
        setIsEditing(true);
        setLoadedReportId(d.id);
        // map fields
        handleChange("refNo", d.reference_number || d.complaint_number || d.document_number || "");
  if (d.reference_date) handleDateChange(toYMD(d.reference_date), "date");
        if (d.document_date) handleDateChange(d.document_date, "date2");
        else if (d.complaint_number_date) handleDateChange(d.complaint_number_date, "date2");
        handleChange("subject", d.subject || "");
        handleChange("bookNo", d.document_number || "");
        handleChange("signer", d.signature_authority_user_id || d.signature_authority_user?.id || "");
        handleChange("department", d.department_id || d.department?.id || "");
        // position_id -> salutation (เรียนถึง)
        if (d.position_id || d.position?.id) {
          handleChange("salutation", d.position_id || d.position?.id);
          const incomingName = d.position_name || d.position?.name || d.position?.position_name || d.position?.title || "";
          if (incomingName) handleChange({ target: { name: 'salutation_name', value: incomingName } });
        } else {
          // Try alternate sources for position id (บาง API อาจคืนอยู่คนละโครงสร้าง)
          const altPositionId = d.signature_authority_user?.position_id
            || d.signature_authority_user?.position?.id
            || d.signature_authority_user?.positionId
            || d.signature_authority_user?.position?.position_id
            || d.signature_authority?.position_id
            || d.signature_authority?.position?.id
            || d.positionId;
          if (altPositionId) {
            console.log("ℹ️ Using alternate position_id source for salutation:", altPositionId);
            handleChange("salutation", altPositionId);
            const altName = d.signature_authority_user?.position_name || d.signature_authority_user?.position?.name || d.signature_authority?.position_name || d.signature_authority?.position?.name;
            if (altName) handleChange({ target: { name: 'salutation_name', value: altName } });
          } else {
            console.log("⚠️ ไม่พบ position_id ในข้อมูลที่โหลดมา จะใช้ค่า fallback เมื่อบันทึก");
          }
        }
        // If backend returns custom recipient (legacy) or position.other_text, map to flags & text
        if (d.custom_recipient || (d.position && d.position.other_text)) {
          const rawText = d.custom_recipient || d.position?.other_text || '';
          const isComplainant = (d.custom_recipient_type === 'COMPLAINANT');
          // Heuristic: if backend omitted custom_recipient_type but other_text present and user selected complainant previously, fallback remains false.
          handleChange({ target: { name: 'salutation_is_other', value: !isComplainant } });
          handleChange({ target: { name: 'salutation_is_complainant', value: isComplainant } });
          handleChange({ target: { name: 'position_other_text', value: rawText } });
          // When custom recipient exists treat its text as salutation_name for easier display
          if (rawText) handleChange({ target: { name: 'salutation_name', value: rawText } });
          handleChange({ target: { name: 'department', value: '' } }); // clear department in custom flow
        }
      // Convert incoming string labels to numeric select value if needed
      const confidentialityStringToNumber = (val) => {
        if (val == null || val === '') return '';
        const map = { 'ปกติ': 1, 'ลับ': 2, 'ลับมาก': 3, 'ลับที่สุด': 4 };
        if (typeof val === 'number') return val;
        return map[val] || '';
      };
      const urgencyStringToNumber = (val) => {
        if (val == null || val === '') return '';
        const map = { 'ปกติ': 1, 'ด่วน': 2, 'เร่งด่วน': 2, 'ด่วนมาก': 3, 'เร่งด่วนมาก': 3, 'ด่วนที่สุด': 4, 'เร่งด่วนที่สุด': 4 };
        if (typeof val === 'number') return val;
        return map[val] || '';
      };
      if (d.confidentiality_level != null) handleChange("confidentiality", confidentialityStringToNumber(d.confidentiality_level));
      if (d.urgency_level != null) handleChange("urgency", urgencyStringToNumber(d.urgency_level));
        handleChange("proposeFor", d.propose_for || d.proposal_purpose || "");
        handleChange("decision", d.decision || d.consideration_result || "");
        if (d.remarks) handleChange("note", d.remarks);
        const atts = Array.isArray(d.attachments) ? d.attachments : [];
        setExistingAttachments(atts);
        if (atts.length) {
          const names = atts.map(a => a.original_name || a.file_name || a.name || "").filter(Boolean).join(", ");
          if (names) handleChange("attachment", names);
        }
        setTimeout(() => {
          try {
            if (typeof window !== 'undefined') {
              const key = `report4_position_${d.id}`;
              if (!form.salutation) {
                const stored = localStorage.getItem(key);
                if (stored) {
                  console.log('⬅️ ใช้ salutation จาก localStorage:', stored);
                  handleChange('salutation', stored);
                  // If we don't have a name yet and position object in response had name, already set above. Otherwise leave for user selection logic.
                }
              }
              if (!form.salutation_name) {
                const storedName = localStorage.getItem(`report4_position_name_${d.id}`);
                if (storedName) {
                  handleChange({ target: { name: 'salutation_name', value: storedName } });
                }
              }
              if (!d.custom_recipient) {
                const ck = `report4_custom_recipient_${d.id}`;
                const storedCustom = localStorage.getItem(ck);
                if (storedCustom) {
                  try {
                    const parsed = JSON.parse(storedCustom);
                    if (parsed && parsed.text) {
                      const isComplainant = parsed.type === 'COMPLAINANT';
                      handleChange({ target: { name: 'salutation_is_other', value: !isComplainant } });
                      handleChange({ target: { name: 'salutation_is_complainant', value: isComplainant } });
                      handleChange({ target: { name: 'position_other_text', value: parsed.text } });
                      handleChange({ target: { name: 'department', value: '' } });
                      console.log('⬅️ ใช้ custom_recipient จาก localStorage:', parsed);
                    }
                  } catch (pe) {
                    console.warn('Parse custom_recipient localStorage ล้มเหลว', pe);
                  }
                }
              }
            }
          } catch (e) {
            console.warn('อ่าน localStorage salutation ไม่ได้', e);
          }
        }, 0);
      } catch (e) {
        console.error("Load outgoing-report4 for edit failed", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [report4Id]);

  return {
    // State
    form,
    errors,
    isLoading,
    id,
    isEditing,
    report4Id: loadedReportId || report4Id,
    uploadedFiles, // เพิ่มไฟล์ที่อัปโหลด
  existingAttachments,
    fileInputKey,

    // Validation helpers
    isRequired,
    createLabel,
    getFieldError,
    isFormValid,
    canSave,
    hasFormChanges,

    // Form handlers
    handleChange,
    handleDateChange,
    handleFileUpload,
    handleFileChange,
    handleClear,
    handleSave,

    // Utility functions
    validateRequiredFields,
    resetField,
    updateField,
    createRequestBody,
    uploadFiles, // เพิ่มฟังก์ชันอัปโหลดไฟล์
  setExistingAttachments,
  removeExistingAttachment: (attachmentId) => {
    setExistingAttachments(prev => {
      const updated = prev.filter(a => a.id !== attachmentId);
      const names = updated.map(a => a.original_name || a.file_name || a.name || "").filter(Boolean).join(", ");
      setForm(f => ({ ...f, attachment: names }));
      return updated;
    });
  },
  };
};

export default useInformRelatedParties;