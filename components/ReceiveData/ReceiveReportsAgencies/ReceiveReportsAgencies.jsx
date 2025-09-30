import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import SelectField from "@services/SelectField/SelectField";
import InputText from "@services/InputText/InputText";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import ButtonService from "@services/ButtonService/ButtonService";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { alertWarning, alertSuccess, closeAlert } from "@utils/Alerts";
import {
  GetReferenceComplaints,
  GetReDocumentComplaints,
} from "@pages/api/complaint/complaint";
import SearchIcon from "@mui/icons-material/Search";
import DescriptionIcon from "@mui/icons-material/Description";
import ClearIcon from "@mui/icons-material/Clear";
import IconButton from "@mui/material/IconButton";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  TextField,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  CreateOutgoingReport5,
  UpdateOutgoingReport5,
  GetOutgoingReport5ById,
  DeleteOutgoingReport5Attachment,
  getDepartmentsPrefix,
  UploadOutgoingReport5Attachments,
} from "@pages/api/outgoinreports/outgoinreports";
import axiosInstance from "@pages/api/axiosInstance";

// Constants สำหรับ options
const PROCESS_STEP_OPTIONS = [
  { value: "รับเรื่อง", label: "รับเรื่อง" },
  { value: "ตรวจสอบเอกสาร", label: "ตรวจสอบเอกสาร" },
  { value: "ส่งต่อหน่วยงาน", label: "ส่งต่อหน่วยงาน" },
  { value: "ดำเนินการสอบสวน", label: "ดำเนินการสอบสวน" },
  { value: "รายงานผล", label: "รายงานผล" },
  { value: "ติดตามผล", label: "ติดตามผล" },
  { value: "ปิดเรื่อง", label: "ปิดเรื่อง" },
];

const CONFIDENTIALITY_OPTIONS = [
  { value: "ปกติ", label: "ปกติ" },
  { value: "ลับ", label: "ลับ" },
  { value: "ลับมาก", label: "ลับมาก" },
  { value: "ลับที่สุด", label: "ลับที่สุด" },
];

const URGENCY_OPTIONS = [
  { value: "ปกติ", label: "ปกติ" },
  { value: "เร่งด่วน", label: "เร่งด่วน" },
  { value: "เร่งด่วนมาก", label: "เร่งด่วนมาก" },
  { value: "เร่งด่วนที่สุด", label: "เร่งด่วนที่สุด" },
];

function generateReceiveNumber() {
  return "AUTO-" + Date.now();
}
function generateReceiveDate() {
  return new Date().toISOString();
}

const ReceiveReportsAgencies = () => {
  const router = useRouter();
  const { id, complaint_id, complaint_number, outgoing_report5_id, report5_id } = router.query;
  const outgoingReport5Id = outgoing_report5_id || report5_id || null;
  const complaintId =
    (Array.isArray(id) ? id[0] : id) ||
    (Array.isArray(complaint_id) ? complaint_id[0] : complaint_id) ||
    null;

  const [openSearchDialog, setOpenSearchDialog] = useState(false);
  const [openSearchDialog2, setOpenSearchDialog2] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const inputRef = useRef();
  const [departments, setDepartments] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [existingData, setExistingData] = useState(null);

  const { setValue } = useForm({
    defaultValues: {
      attachment: null,
      documentNo: "",
    },
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);

  const initialFormState = useMemo(
    () => ({
      referenceNo: "",
      date: null,
      processStep: "",
      confidentiality: "ปกติ",
      urgency: "ปกติ",
      departmentId: "",
      agency: "",
      investigateGk: "",
      investigateDate: null,
      documentNo: "",
      documentDate: null,
      receiveWorkDate: null,
      submitWorkDate: null,
      subject: "",
      remarks: "",
    }),
    []
  );

  const [form, setForm] = useState(initialFormState);

  // --- Embed / extract fallback for fieldsที่ backend ไม่ส่งกลับ (process_step, receive_work_date) ---
  const PROCESS_TAG = '[PROCESS_STEP]:';
  const RECEIVE_WORK_TAG = '[RECEIVE_WORK_DATE]:';
  const stripEmbeddedTags = (text = '') => text
    .split(/\n/)
    .filter(line => line.trim() && !line.startsWith(PROCESS_TAG) && !line.startsWith(RECEIVE_WORK_TAG))
    .join('\n');
  const extractEmbedded = (text = '') => {
    let processStep = null, receiveWorkDate = null;
    text.split(/\n/).forEach(line => {
      if (line.startsWith(PROCESS_TAG)) processStep = line.replace(PROCESS_TAG,'').trim();
      if (line.startsWith(RECEIVE_WORK_TAG)) receiveWorkDate = line.replace(RECEIVE_WORK_TAG,'').trim();
    });
    return { processStep, receiveWorkDate };
  };

  const parseInvestigateGk = useCallback((raw) => {
    if (!raw || typeof raw !== "string") return null;
    const match = raw.match(/MOF-(\d{8})-\d+/i);
    if (!match) return null;
    const dateStr = match[1];
    let year = parseInt(dateStr.slice(0, 4), 10);
    const month = parseInt(dateStr.slice(4, 6), 10);
    const day = parseInt(dateStr.slice(6, 8), 10);
    if (year > 2400) year = year - 543;
    const d = new Date(year, month - 1, day);
    if (isNaN(d.getTime())) return null;
    return {
      day: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      buddhistYear: d.getFullYear() + 543,
    };
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await getDepartmentsPrefix();
        const data = res?.res_data || res;
        if (Array.isArray(data)) {
          const mapped = data.map((dep) => ({
            value: dep.id,
            label: dep.name,
          }));
          setDepartments(mapped);
        } else {
          setDepartments([]);
        }
      } catch (err) {
        setDepartments([]);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (complaint_number) {
      const parsed = parseInvestigateGk(complaint_number);
      setForm((prev) => ({
        ...prev,
        investigateGk: complaint_number,
        investigateDate: parsed || prev.investigateDate,
      }));
    }
  }, [complaint_number, parseInvestigateGk]);

  const handleSearch = useCallback(async (keyword) => {
    setSearchLoading(true);
    try {
      const response = await GetReDocumentComplaints({
        skip: 0,
        limit: 10000,
        search: keyword || "",
      });
      const items = Array.isArray(response?.res_data?.items)
        ? response.res_data.items
        : [];
      const results = items.map((item) => ({
        ...item,
        label: item.document_number || "",
        value: item.document_number || "",
      }));
      setSearchResults(results);
    } catch (err) {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSelectReference = useCallback(
    (ref) => {
      const num = ref?.document_number || "";
      setForm((prev) => ({
        ...prev,
        documentNo: num,
      }));
      setValue("documentNo", num, { shouldValidate: false, shouldDirty: true });
      setOpenSearchDialog(false);
    },
    [setValue]
  );

  const onClear = useCallback(() => {
    setSearchText("");
    setSearchResults([]);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (openSearchDialog) {
      setSearchText("");
      setSearchResults([]);
      inputRef.current?.focus();
    }
  }, [openSearchDialog]);

  const handleSearch2 = useCallback(async (keyword) => {
    setSearchLoading(true);
    try {
      const response = await GetReferenceComplaints({
        skip: 0,
        limit: 10000,
        search: keyword || "",
      });
      const items = Array.isArray(response?.res_data?.items)
        ? response.res_data.items
        : [];
      const results = items.map((item) => ({
        ...item,
        label: item.complaint_number || "",
        value: item.complaint_number || "",
      }));
      setSearchResults(results);
    } catch (err) {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const onClear2 = useCallback(() => {
    setSearchText("");
    setSearchResults([]);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (openSearchDialog2) {
      setSearchText("");
      setSearchResults([]);
      inputRef.current?.focus();
    }
  }, [openSearchDialog2]);

  const handleFileUpload = useCallback((files) => {
    let processedFiles = [];
    if (files?.target?.files) processedFiles = Array.from(files.target.files);
    else if (Array.isArray(files)) processedFiles = files;
    else if (files && typeof files === "object" && "length" in files)
      processedFiles = Array.from(files);
    else if (files?.file) processedFiles = [files.file];
    setUploadedFiles(processedFiles);
  }, []);

  const handleSelectReference2 = useCallback(
    (ref) => {
      const num = ref?.complaint_number || "";
      const obj = parseInvestigateGk(num);
      setForm((prev) => ({
        ...prev,
        investigateGk: num,
        investigateDate: obj,
      }));
      setValue("investigateGk", num, {
        shouldValidate: false,
        shouldDirty: true,
      });
      setOpenSearchDialog2(false);
    },
    [parseInvestigateGk, setValue]
  );

  const toISO = (v) => {
    if (!v) return null;
    try {
      const pad = (n) => String(n).padStart(2, '0');
      if (typeof v === 'object' && v.day && v.month && v.year) {
        return `${v.year}-${pad(v.month)}-${pad(v.day)}T00:00:00Z`;
      }
      const d = new Date(v);
      if (isNaN(d.getTime())) return null;
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}T00:00:00Z`;
    } catch (e) { return null; }
  };

  const handleInvestigateBlur = useCallback(
    (e) => {
      const val = e?.target?.value || "";
      const obj = parseInvestigateGk(val);
      if (obj) {
        setForm((prev) => ({
          ...prev,
          investigateGk: val,
          investigateDate: obj,
        }));
      }
    },
    [parseInvestigateGk]
  );

  const handleInvestigatePaste = useCallback(
    (e) => {
      const pasted = e?.clipboardData?.getData("Text") || "";
      const obj = parseInvestigateGk(pasted);
      if (obj) {
        setForm((prev) => ({
          ...prev,
          investigateGk: pasted,
          investigateDate: obj,
        }));
      }
    },
    [parseInvestigateGk]
  );

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e?.target ?? {};
      if (!name) return;
      if (name === "investigateGk") {
        const obj = parseInvestigateGk(value);
        if (obj) {
          setForm((prev) => ({
            ...prev,
            investigateGk: value,
            investigateDate: obj,
          }));
          return;
        }
      }
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    [parseInvestigateGk]
  );

  const handleDateChange = useCallback(
    (fieldName) => (thaiDate) => {
      setForm((prev) => ({
        ...prev,
        [fieldName]: thaiDate,
      }));
    },
    []
  );

  const handleClear = useCallback(() => {
    setForm(initialFormState);
    setUploadedFiles([]);
  }, [initialFormState]);

  const makeSelectHandler = useCallback(
    (fieldName) => (evOrVal) => {
      const value = evOrVal?.target?.value ?? evOrVal?.value ?? evOrVal ?? "";
      setForm((prev) => ({
        ...prev,
        [fieldName]: value,
      }));
    },
    []
  );

  const canSave = useMemo(() => {
    const f = form;
    const base = [
      f.processStep, f.confidentiality, f.urgency,
      f.departmentId, f.investigateGk?.trim(), f.investigateDate, f.documentNo?.trim(),
      f.documentDate, f.receiveWorkDate, f.submitWorkDate, f.subject?.trim()
    ];
    if (!base.every(Boolean)) return false;
    if (isEditing) return true;
    return uploadedFiles.length > 0;
  }, [form, uploadedFiles, isEditing]);

  // Prefill (edit mode)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!outgoingReport5Id) return;
      try {
        const res = await GetOutgoingReport5ById(outgoingReport5Id);
        const d = res?.res_data || res?.data || res;
        if (!d || cancelled) return;
        setIsEditing(true);
        setExistingData(d);
        const parseDate = (iso) => {
          if (!iso) return null; const dt = new Date(iso); if (isNaN(dt.getTime())) return null; return { day: dt.getDate(), month: dt.getMonth()+1, year: dt.getFullYear(), buddhistYear: dt.getFullYear()+543 };
        };
        const processStepRaw = (
          d.process_step || d.processStatus || d.process_status || d.step ||
          d.status_step || d.workflow_step || d.current_step || d.phase || d.stage
        );
        const processStepMap = {
          receive: 'รับเรื่อง',
          received: 'รับเรื่อง',
          review: 'ตรวจสอบเอกสาร',
          verifying: 'ตรวจสอบเอกสาร',
          forward: 'ส่งต่อหน่วยงาน',
          forwarded: 'ส่งต่อหน่วยงาน',
          investigate: 'ดำเนินการสอบสวน',
          investigation: 'ดำเนินการสอบสวน',
          report: 'รายงานผล',
          reporting: 'รายงานผล',
          followup: 'ติดตามผล',
          follow_up: 'ติดตามผล',
          close: 'ปิดเรื่อง',
          closed: 'ปิดเรื่อง'
        };
        let normalizedProcessStep = processStepRaw;
        if (processStepRaw && !PROCESS_STEP_OPTIONS.some(o => o.value === processStepRaw)) {
          const key = String(processStepRaw).toLowerCase();
          normalizedProcessStep = processStepMap[key] || processStepRaw;
        }
        const receiveWorkDateRaw = (
          d.receive_work_date || d.receive_staff_date || d.staff_receive_date ||
          d.officer_receive_date || d.receive_working_date || d.receiveWorkDate || d.receiveDateWork
        );
        const embedded = extractEmbedded(d.remarks || '');
        const receiveWorkDateParsed = parseDate(receiveWorkDateRaw || embedded.receiveWorkDate);
        setForm((prev) => ({
          ...prev,
          referenceNo: d.receive_number || d.reference_number || d.receive_no || prev.referenceNo,
          date: parseDate(d.receive_date || d.reference_date) || prev.date,
          processStep: normalizedProcessStep || embedded.processStep || prev.processStep,
          confidentiality: d.confidentiality_level || d.confidentiality || prev.confidentiality,
          urgency: d.urgency_level || d.urgency || prev.urgency,
          departmentId: d.department_id || d.department?.id || prev.departmentId,
          investigateGk: d.agency_reference_number || d.complaint_number || prev.investigateGk,
          investigateDate: parseDate(d.agency_reference_date || d.complaint_number_date) || prev.investigateDate,
          documentNo: d.internal_register_number || d.document_number || prev.documentNo,
          documentDate: parseDate(d.internal_register_date || d.document_date) || prev.documentDate,
          receiveWorkDate: receiveWorkDateParsed || prev.receiveWorkDate,
          submitWorkDate: parseDate(d.present_to_director_date) || prev.submitWorkDate,
          subject: d.subject || prev.subject,
          remarks: stripEmbeddedTags(d.remarks || prev.remarks || ''),
        }));
        setExistingAttachments(Array.isArray(d.attachments) ? d.attachments : []);
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, [outgoingReport5Id]);

  const handleDeleteExistingAttachment = useCallback(async (att) => {
    if (!att?.id || !outgoingReport5Id) return;
    const res = await DeleteOutgoingReport5Attachment({ outgoing_report_id: outgoingReport5Id, attachment_id: att.id });
    if (res?.success === false) {
      alertWarning('ลบไฟล์ไม่สำเร็จ', res?.res_message || 'ไม่สามารถลบไฟล์ได้');
      return;
    }
    setExistingAttachments(prev => prev.filter(x => x.id !== att.id));
  }, [outgoingReport5Id]);

// ...โค้ดข้างบน unchanged...

const handleSave = useCallback(async () => {
  const missingFields = [];
  if (!form.processStep) missingFields.push("ขั้นตอนการดำเนินการ");
  if (!form.confidentiality) missingFields.push("ชั้นความลับ");
  if (!form.urgency) missingFields.push("ชั้นความเร่งด่วน");
  if (!form.departmentId) missingFields.push("หน่วยงาน");
  if (!form.investigateGk?.trim()) missingFields.push("เลขสป.กค.");
  if (!form.investigateDate) missingFields.push("วันที่ (เลขสป.กค.)");
  if (!form.documentNo?.trim()) missingFields.push("เลขที่หนังสือ");
  if (!form.documentDate) missingFields.push("วันที่ (เลขที่หนังสือ)");
  if (!form.receiveWorkDate) missingFields.push("วันที่รับงานของเจ้าหน้าที่");
  if (!form.submitWorkDate) missingFields.push("วันที่เสนองาน ผอ.สรร.");
  if (!form.subject?.trim()) missingFields.push("เรื่อง");
  if (uploadedFiles.length === 0 && !(isEditing && existingAttachments.length > 0)) missingFields.push("เอกสารแนบ");
  if (missingFields.length > 0) {
    const message = `กรุณากรอกข้อมูลให้ครบถ้วน:\n${missingFields.map((f) => `• ${f}`).join("\n")}`;
    alertWarning("ข้อมูลไม่ครบถ้วน", message);
    return;
  }
  try {
    const baseRemarksClean = stripEmbeddedTags(form.remarks || '');
    const embedLines = [];
    if (form.processStep) embedLines.push(`${PROCESS_TAG}${form.processStep}`);
    if (form.receiveWorkDate) {
      const dtStr = toISO(form.receiveWorkDate)?.slice(0,10);
      if (dtStr) embedLines.push(`${RECEIVE_WORK_TAG}${dtStr}`);
    }
    const mergedRemarks = [baseRemarksClean, ...embedLines].filter(Boolean).join('\n');

    // ==== Auto-generate required fields ====
    const receiveNumber = form.referenceNo?.trim()
      || existingData?.receive_number
      || generateReceiveNumber();
    const receiveDate = form.date
      ? toISO(form.date)
      : existingData?.receive_date
        ? existingData.receive_date
        : generateReceiveDate();

    const payload = {
      receive_number: receiveNumber,
      receive_date: receiveDate,
      agency_reference_number: form.investigateGk,
      agency_reference_date: toISO(form.investigateDate),
      internal_register_number: form.documentNo,
      internal_register_date: toISO(form.documentDate),
      present_to_director_date: toISO(form.submitWorkDate),
      receive_work_date: toISO(form.receiveWorkDate),
      receive_staff_date: toISO(form.receiveWorkDate),
      staff_receive_date: toISO(form.receiveWorkDate),
      complaint_number: form.investigateGk,
      complaint_number_date: toISO(form.investigateDate),
      subject: form.subject,
      document_number: form.documentNo,
      document_date: toISO(form.documentDate),
      process_step: form.processStep,
      process_status: form.processStep,
      processStatus: form.processStep,
      step: form.processStep,
      current_step: form.processStep,
      signature_authority_user_id: form.signatureAuthorityId,
      department_id: form.departmentId,
      user_id: form.userId,
      confidentiality_level: form.confidentiality,
      urgency_level: form.urgency,
      complaint_id: complaintId,
      remarks: mergedRemarks,
    };

    Object.keys(payload).forEach(k => {
      if (payload[k] === undefined || payload[k] === null) delete payload[k];
    });

    let finalPayload = payload;
    if (isEditing) {
      finalPayload = { ...payload };
      delete finalPayload.complaint_id;
      if (!form.investigateGk) delete finalPayload.complaint_number;
      if (!finalPayload.complaint_number) delete finalPayload.complaint_number_date;
    }

    let res;
    if (isEditing && outgoingReport5Id) {
      res = await UpdateOutgoingReport5(outgoingReport5Id, finalPayload);
    } else {
      res = await CreateOutgoingReport5(finalPayload);
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
          if (cur && typeof cur === "object") {
            if (Object.prototype.hasOwnProperty.call(cur, "id") && cur.id)
              return cur.id;
            Object.values(cur).forEach((v) => {
              if (v && typeof v === "object") stack.push(v);
            });
          }
        }
      } catch (_) {}
      return null;
    };

    const resCode = res?.res_code ?? res?.data?.res_code ?? res?.status;
    const resMsg =
      res?.res_data?.error ??
      res?.data?.res_data?.error ??
      res?.res_message ??
      "";

    if (
      resCode === "4090" ||
      resCode === 409 ||
      /CONFLICT/i.test(res?.res_message || "") ||
      /มีอยู่แล้ว|duplicate|exists|ซ้ำ/i.test(resMsg)
    ) {
      alertWarning(
        "เลขอ้างอิงซ้ำ",
        resMsg || `เลขรับเรื่อง ${form.referenceNo} มีอยู่แล้ว`
      );
      return;
    }

    const reportId = extractReportId(res);

    if (!reportId) {
      alertWarning("ไม่พบรหัสรายงาน", "ระบบไม่สามารถดึงรหัสรายงานที่บันทึกได้");
      return;
    }

    if (uploadedFiles.length) {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
      ];
      const oversize = uploadedFiles.find((f) => f.size > 10 * 1024 * 1024);
      if (oversize) {
        alertWarning("ไฟล์ใหญ่เกินไป", `ไฟล์ ${oversize.name} เกิน 10MB`);
        return;
      }
      const invalid = uploadedFiles.find(
        (f) => !allowedTypes.includes(f.type)
      );
      if (invalid) {
        alertWarning(
          "ประเภทไฟล์ไม่ถูกต้อง",
          `ไฟล์ ${invalid.name} ไม่รองรับ`
        );
        return;
      }

      const fd = new FormData();
      uploadedFiles.forEach((f) => {
        fd.append("files", f, f.name);
      });

      let uploadSucceeded = false;
      try {
        const upRes = await UploadOutgoingReport5Attachments(fd, reportId);
        uploadSucceeded = !!(
          upRes &&
          (upRes.success === true ||
            upRes.res_code === "0001" ||
            upRes.success !== false)
        );

        if (
          !uploadSucceeded &&
          (upRes?.res_code === "4040" ||
            upRes?.res_code === "404" ||
            /NOT_FOUND/i.test(upRes?.res_message || ""))
        ) {
          try {
            const altRes = await axiosInstance.post(
              `/outgoing-reports5/${reportId}/attachments`,
              fd
            );
            uploadSucceeded = !!altRes?.data;
          } catch (altErr) {}
        }

        if (!uploadSucceeded && upRes?.res_message) {
          alertWarning("ไม่สามารถอัพโหลดไฟล์ได้", upRes.res_message);
        }
      } catch (err) {
        alertWarning(
          "ไม่สามารถอัพโหลดไฟล์ได้",
          err?.response?.data?.res_message ||
            err?.message ||
            "เกิดข้อผิดพลาดในการอัพโหลดไฟล์"
        );
      }
    }

    const successMessage = `
      <div style="text-align:center; line-height:1.6;">
        <p style="margin-bottom:12px; font-size:16px;">${isEditing ? 'อัปเดต' : 'บันทึก'}แบบรายงานส่งหน่วยงานที่เกี่ยวข้องเรียบร้อยแล้ว</p>
        <p style="margin-bottom:8px; color:#666;">รหัสรายงาน: <strong>${reportId}</strong></p>
        <p style="margin-bottom:8px; color:#666;">เรื่อง: <strong>${form.subject || "-"}</strong></p>
        ${uploadedFiles.length > 0
          ? `<p style="margin-bottom:0; color:#666;">ไฟล์แนบ: <strong>${uploadedFiles.map(f => f.name).join(', ')}</strong></p>`
          : ""}
      </div>
    `;

    if (isEditing && reportId) {
      try { await GetOutgoingReport5ById(reportId); } catch (verErr) {}
    }

    closeAlert();
    await alertSuccess("บันทึกสำเร็จ!", successMessage, true);

    // --------- REDIRECT LOGIC AFTER SUBMIT ----------
    const returnUrl = router?.query?.returnUrl || router?.query?.from;
    const cid = router?.query?.complaint_id || router?.query?.id || data.complaint_id;

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
    handleClear();
  } catch (error) {
    const code = error?.response?.data?.res_code || error?.response?.status;
    const serverMsg =
      error?.response?.data?.res_data?.error ||
      error?.response?.data?.res_message ||
      error?.message ||
      "";

    if (
      code === "4090" ||
      code === 409 ||
      /มีอยู่แล้ว|duplicate|exists|ซ้ำ/i.test(serverMsg)
    ) {
      alertWarning(
        "เลขอ้างอิงซ้ำ",
        serverMsg || `เลขรับเรื่อง ${form.referenceNo} มีอยู่แล้ว`
      );
      return;
    }
    alertWarning("ผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้");
  }
}, [form, uploadedFiles, complaintId, router, isEditing, existingAttachments, outgoingReport5Id, existingData, handleClear]);
  // load existing record (prefill)
 useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!outgoingReport5Id) return;
      try {
        const res = await GetOutgoingReport5ById(outgoingReport5Id);
        const d = res?.res_data || res?.data || res;
        if (!d || cancelled) return;
        setIsEditing(true);
        setExistingData(d);
        const parseDate = (iso) => {
          if (!iso) return null; const dt = new Date(iso); if (isNaN(dt.getTime())) return null; return { day: dt.getDate(), month: dt.getMonth()+1, year: dt.getFullYear(), buddhistYear: dt.getFullYear()+543 };
        };
        const processStepRaw = (
          d.process_step || d.processStatus || d.process_status || d.step ||
          d.status_step || d.workflow_step || d.current_step || d.phase || d.stage
        );
        const processStepMap = {
          receive: 'รับเรื่อง',
          received: 'รับเรื่อง',
          review: 'ตรวจสอบเอกสาร',
          verifying: 'ตรวจสอบเอกสาร',
          forward: 'ส่งต่อหน่วยงาน',
          forwarded: 'ส่งต่อหน่วยงาน',
          investigate: 'ดำเนินการสอบสวน',
          investigation: 'ดำเนินการสอบสวน',
          report: 'รายงานผล',
          reporting: 'รายงานผล',
          followup: 'ติดตามผล',
          follow_up: 'ติดตามผล',
          close: 'ปิดเรื่อง',
          closed: 'ปิดเรื่อง'
        };
        let normalizedProcessStep = processStepRaw;
        if (processStepRaw && !PROCESS_STEP_OPTIONS.some(o => o.value === processStepRaw)) {
          const key = String(processStepRaw).toLowerCase();
          normalizedProcessStep = processStepMap[key] || processStepRaw;
        }
        const receiveWorkDateRaw = (
          d.receive_work_date || d.receive_staff_date || d.staff_receive_date ||
          d.officer_receive_date || d.receive_working_date || d.receiveWorkDate || d.receiveDateWork
        );
        const embedded = extractEmbedded(d.remarks || '');
        const receiveWorkDateParsed = parseDate(receiveWorkDateRaw || embedded.receiveWorkDate);
        setForm((prev) => ({
          ...prev,
          referenceNo: d.receive_number || d.reference_number || d.receive_no || prev.referenceNo,
          date: parseDate(d.receive_date || d.reference_date) || prev.date,
          processStep: normalizedProcessStep || embedded.processStep || prev.processStep,
          confidentiality: d.confidentiality_level || d.confidentiality || prev.confidentiality,
          urgency: d.urgency_level || d.urgency || prev.urgency,
          departmentId: d.department_id || d.department?.id || prev.departmentId,
          investigateGk: d.agency_reference_number || d.complaint_number || prev.investigateGk,
          investigateDate: parseDate(d.agency_reference_date || d.complaint_number_date) || prev.investigateDate,
          documentNo: d.internal_register_number || d.document_number || prev.documentNo,
          documentDate: parseDate(d.internal_register_date || d.document_date) || prev.documentDate,
          receiveWorkDate: receiveWorkDateParsed || prev.receiveWorkDate,
          submitWorkDate: parseDate(d.present_to_director_date) || prev.submitWorkDate,
          subject: d.subject || prev.subject,
          remarks: stripEmbeddedTags(d.remarks || prev.remarks || ''),
        }));
        setExistingAttachments(Array.isArray(d.attachments) ? d.attachments : []);
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, [outgoingReport5Id]);


  return (
    <Box
      px={{ xs: 2, sm: 3, md: 5, lg: 8 }}
      pt={{ xs: 2, sm: 3, md: 4 }}
      pb={{ xs: 2, sm: 3, md: 8 }}
    >
      <BreadcrumbsService
        items={[
          {
            label: "จัดการข้อมูลในระบบ",
            icon: (
              <img
                src="/icons/Pencil.png"
                alt="pencil"
                style={{ width: 24, height: 24, marginBottom: -8 }}
              />
            ),
          },
          {
            label: "รับเรื่องรายงานผลการพิจารณาจากหน่วยงาน",
          },
        ]}
      />

      <Box
        sx={{
          border: "2px solid #2499FF",
          borderTopRightRadius: 15,
          width: "100%",
          maxWidth: { xs: "100%", sm: "auto" },
          overflow: "hidden",
        }}
      >
        {/* top gradient */}
        <Box
          sx={{
            background: "linear-gradient(to right, #1223a5, #2499ff)",
            height: 50,
            borderTopRightRadius: 12,
          }}
        />

        {/* subtitle */}
        <Box sx={{ textAlign: "center", py: 2 }}>
          <Typography variant="h5" fontWeight="bold" color="#1120A3">
            แบบรับเรื่องรายงานผลการพิจารณาจากหน่วยงาน
          </Typography>
        </Box>

        <Box sx={{ px: { xs: 2, sm: 3, md: 5 }, pb: 2 }}>
          <Typography variant="h6" fontWeight="bold" color="#1120A3">
            ข้อมูลเรื่องร้องทุกข์
          </Typography>
        </Box>

        <Box
          component="form"
          sx={{
            display: "flex",
            flexDirection: "column",
            px: { xs: 2, sm: 3, md: 5 },
          }}
        >
          {/* แถวที่ 1: เลขที่อ้างอิง(เลข สรร.สารบัญ) | วันที่ | ขั้นตอนการดำเนินการ */}
          <Box
            sx={{
              display: "grid",
              columnGap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "4fr 3fr 4fr",
              },
              width: "100%",
            }}
          >
            {/* <InputText
              label={
                <span>
                  เลขที่อ้างอิง(เลข สรร.สารบัญ)
                  <span style={{ color: "red", marginLeft: 4 }}>*</span>
                </span>
              }
              inputLabel="กรอกเลขที่อ้างอิง"
              name="referenceNo"
              value={form.referenceNo}
              onChange={handleChange}
              sx={{ width: { xs: "80%", sm: "auto" } }}
            />
            <Box
              sx={{
                position: "relative",
                zIndex: 1,
                width: { xs: "80%", sm: "auto" },
              }}
            >
              <DateThaiPickerService
                label={
                  <span>
                    วันที่
                    <span style={{ color: "red", marginLeft: 4 }}>*</span>
                  </span>
                }
                value={form.date}
                onChange={handleDateChange("date")}
                placeholder="เลือกวันที่"
              />
            </Box> */}
            <Box
              sx={{
                position: "relative",
                zIndex: 1,
                width: { xs: "80%", sm: "auto" },
              }}
            >
              <SelectField
                label={
                  <span>
                    ขั้นตอนการดำเนินการ
                    <span style={{ color: "red", marginLeft: 4 }}>*</span>
                  </span>
                }
                inputLabel="เลือกขั้นตอนการดำเนินการ"
                name="processStep"
                value={form.processStep}
                onChange={makeSelectHandler("processStep")}
                options={PROCESS_STEP_OPTIONS}
              />
            </Box>
          </Box>

          {/* แถวที่ 2: ชั้นความลับ | ชั้นความเร่งด่วน */}
          <Box
            sx={{
              display: "grid",
              columnGap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            }}
          >
            <SelectField
              label={
                <span>
                  ชั้นความลับ
                  <span style={{ color: "red", marginLeft: 4 }}>*</span>
                </span>
              }
              inputLabel="เลือกชั้นความลับ"
              name="confidentiality"
              value={form.confidentiality}
              onChange={makeSelectHandler("confidentiality")}
              options={CONFIDENTIALITY_OPTIONS}
            />
            <SelectField
              label={
                <span>
                  ชั้นความเร่งด่วน
                  <span style={{ color: "red", marginLeft: 4 }}>*</span>
                </span>
              }
              inputLabel="เลือกชั้นความเร่งด่วน"
              name="urgency"
              value={form.urgency}
              onChange={makeSelectHandler("urgency")}
              options={URGENCY_OPTIONS}
            />
          </Box>

          {/* แถวที่ 3: หน่วยงาน */}
          <Box>
            <SelectField
              label={
                <span>
                  หน่วยงาน
                  <span style={{ color: "red", marginLeft: 4 }}>*</span>
                </span>
              }
              inputLabel="เลือกหน่วยงาน"
              name="departmentId"
              value={form.departmentId}
              onChange={makeSelectHandler("departmentId")}
              options={departments}
            />
          </Box>

          {/* แถวที่ 4: เลขสป.กค. | วันที่ */}
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                columnGap: 1,
                alignItems: "center",
                width: "100%",
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <InputText
                  label={
                    <span>
                      เลขสรร.
                      <span style={{ color: "red", marginLeft: 4 }}>*</span>
                    </span>
                  }
                  inputLabel="กรอกเลขสรร."
                  name="investigateGk"
                  value={form.investigateGk}
                  onChange={handleChange}
                  onBlur={handleInvestigateBlur}
                  onPaste={handleInvestigatePaste}
                  sx={{ width: "100%" }}
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mt: "12px",
                }}
              >
                <IconButton
                  onClick={() => setOpenSearchDialog2(true)}
                  onMouseDown={(e) => e.preventDefault()}
                  aria-label="กรอกเลขสรร."
                  title="กรอกเลขสรร."
                  sx={{ width: 40, height: 40, color: "blue", p: 0 }}
                >
                  <SearchIcon />
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ width: "100%", position: "relative", zIndex: 1 }}>
              <DateThaiPickerService
                label={
                  <span>
                    วันที่ เลขสรร.<span style={{ color: "red", marginLeft: 4 }}>*</span>
                  </span>
                }
                value={form.investigateDate}
                onChange={handleDateChange("investigateDate")}
                placeholder="เลือกวันที่"
              />
            </Box>
          </Box>

          {/* Dialog สำหรับค้นหาเลข สป.กค. */}
          <Dialog
            open={openSearchDialog2}
            onClose={() => setOpenSearchDialog2(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              style: {
                borderRadius: 12,
                background: "#f7fafd",
                height: 500,
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              },
            }}
          >
            <DialogTitle
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <SearchIcon color="primary" />
              ค้นหาเลขที่อ้างอิง
            </DialogTitle>

            <DialogContent>
              <TextField
                inputRef={inputRef}
                fullWidth
                size="small"
                placeholder="พิมพ์คำค้นหาเลขที่อ้างอิง หรือชื่อเรื่อง..."
                value={searchText}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchText(val);
                  handleSearch2(val);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchText ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={onClear2}
                        aria-label="clear search"
                        edge="end"
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                  style: {
                    background: "#fff",
                    borderRadius: 8,
                  },
                }}
                sx={{ mb: 2 }}
              />

              {searchLoading ? (
                <div style={{ textAlign: "center", padding: 24 }}>
                  <CircularProgress color="primary" />
                  <div style={{ marginTop: 8, color: "#888" }}>
                    กำลังค้นหา...
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <div
                  style={{ textAlign: "center", padding: 32, color: "#bdbdbd" }}
                >
                  <DescriptionIcon
                    sx={{ fontSize: 48, mb: 2 }}
                    color="disabled"
                  />
                  <div>ไม่พบรายการเลขที่อ้างอิง</div>
                </div>
              ) : (
                <>
                  <List
                    sx={{
                      maxHeight: 320,
                      overflow: "auto",
                      "&::-webkit-scrollbar": {
                        width: "8px",
                        background: "#f0f4fa",
                        borderRadius: "8px",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        background: "#90caf9",
                        borderRadius: "8px",
                      },
                      "&::-webkit-scrollbar-thumb:hover": {
                        background: "#64b5f6",
                      },
                    }}
                  >
                    {searchResults.map((item) => {
                      const isMaster = !!item.is_master;
                      return (
                        <ListItem key={item.id} disablePadding>
                          <ListItemButton
                            onClick={() => handleSelectReference2(item)}
                            sx={{
                              py: 1.5,
                              px: 2,
                              borderRadius: 2,
                              mb: 0.5,
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                              "&:hover": {
                                background: "#e3f2fd",
                              },
                            }}
                          >
                            <span
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                backgroundColor: isMaster
                                  ? "#2ecc71"
                                  : "#bdbdbd",
                                border: "2px solid #fff",
                                boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
                                flexShrink: 0,
                              }}
                              title={isMaster ? "Master" : "Non-master"}
                            />
                            <DescriptionIcon color="info" sx={{ mr: 0.5 }} />
                            <span style={{ fontWeight: 500 }}>
                              {item.complaint_number}
                              <span style={{ marginLeft: 8 }}>
                                {item.subject}
                              </span>
                            </span>
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>

                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      marginTop: 8,
                      fontSize: 12,
                      color: "#555",
                      padding: "0 4px",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: "#2ecc71",
                          boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
                        }}
                      />
                      Master
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: "#bdbdbd",
                          boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
                        }}
                      />
                      Non-master
                    </div>
                  </div>
                </>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                onClick={() => setOpenSearchDialog2(false)}
                variant="outlined"
                color="inherit"
              >
                ปิด
              </Button>
            </DialogActions>
          </Dialog>

          {/* แถวที่ 5: เลขที่หนังสือ | วันที่ */}
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                columnGap: 1,
                alignItems: "center",
                width: "100%",
              }}
            >
              <InputText
                label={
                  <span>
                    เลขที่หนังสือ
                    <span style={{ color: "red", marginLeft: 4 }}>*</span>
                  </span>
                }
                inputLabel="กรอกเลขที่หนังสือ"
                name="documentNo"
                value={form.documentNo}
                onChange={handleChange}
                sx={{ width: "100%" }}
              />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mt: "12px",
                }}
              >
                {/* Search button commented out */}
              </Box>
            </Box>

            <Box sx={{ width: "100%", position: "relative", zIndex: 1 }}>
              <DateThaiPickerService
                label={
                  <span>
                    วันที่
                    <span style={{ color: "red", marginLeft: 4 }}>*</span>
                  </span>
                }
                value={form.documentDate}
                onChange={handleDateChange("documentDate")}
                placeholder="เลือกวันที่"
              />
            </Box>
          </Box>

          {/* Dialog สำหรับค้นหาเลขที่หนังสือ */}
          <Dialog
            open={openSearchDialog}
            onClose={() => setOpenSearchDialog(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              style: {
                borderRadius: 12,
                background: "#f7fafd",
                height: 500,
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              },
            }}
          >
            <DialogTitle
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <SearchIcon color="primary" />
              ค้นหาเลขที่อ้างอิง
            </DialogTitle>

            <DialogContent>
              <TextField
                inputRef={inputRef}
                fullWidth
                size="small"
                placeholder="พิมพ์คำค้นหาเลขที่อ้างอิง หรือชื่อเรื่อง..."
                value={searchText}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchText(val);
                  handleSearch(val);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchText ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={onClear}
                        aria-label="clear search"
                        edge="end"
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                  style: {
                    background: "#fff",
                    borderRadius: 8,
                  },
                }}
                sx={{ mb: 2 }}
              />

              {searchLoading ? (
                <div style={{ textAlign: "center", padding: 24 }}>
                  <CircularProgress color="primary" />
                  <div style={{ marginTop: 8, color: "#888" }}>
                    กำลังค้นหา...
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <div
                  style={{ textAlign: "center", padding: 32, color: "#bdbdbd" }}
                >
                  <DescriptionIcon
                    sx={{ fontSize: 48, mb: 2 }}
                    color="disabled"
                  />
                  <div>ไม่พบรายการเลขที่อ้างอิง</div>
                </div>
              ) : (
                <>
                  <List
                    sx={{
                      maxHeight: 320,
                      overflow: "auto",
                      "&::-webkit-scrollbar": {
                        width: "8px",
                        background: "#f0f4fa",
                        borderRadius: "8px",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        background: "#90caf9",
                        borderRadius: "8px",
                      },
                      "&::-webkit-scrollbar-thumb:hover": {
                        background: "#64b5f6",
                      },
                    }}
                  >
                    {searchResults.map((item) => {
                      const isMaster = !!item.is_master;
                      return (
                        <ListItem key={item.id} disablePadding>
                          <ListItemButton
                            onClick={() => handleSelectReference(item)}
                            sx={{
                              py: 1.5,
                              px: 2,
                              borderRadius: 2,
                              mb: 0.5,
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                              "&:hover": {
                                background: "#e3f2fd",
                              },
                            }}
                          >
                            <span
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                backgroundColor: isMaster
                                  ? "#2ecc71"
                                  : "#bdbdbd",
                                border: "2px solid #fff",
                                boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
                                flexShrink: 0,
                              }}
                              title={isMaster ? "Master" : "Non-master"}
                            />
                            <DescriptionIcon color="info" sx={{ mr: 0.5 }} />
                            <span style={{ fontWeight: 500 }}>
                              {item.document_number}
                            </span>
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>

                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      marginTop: 8,
                      fontSize: 12,
                      color: "#555",
                      padding: "0 4px",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: "#2ecc71",
                          boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
                        }}
                      />
                      Master
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: "#bdbdbd",
                          boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
                        }}
                      />
                      Non-master
                    </div>
                  </div>
                </>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                onClick={() => setOpenSearchDialog(false)}
                variant="outlined"
                color="inherit"
              >
                ปิด
              </Button>
            </DialogActions>
          </Dialog>

          {/* แถวที่ 6: วันที่รับงานของเจ้าหน้าที่ | วันที่เสนองาน ผอ.สรร. */}
          <Box
            sx={{
              display: "grid",
              columnGap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            }}
          >
            <Box
              sx={{
                position: "relative",
                zIndex: 1,
                width: { xs: "80%", sm: "auto" },
              }}
            >
              <DateThaiPickerService
                label={
                  <span>
                    วันที่รับงานของเจ้าหน้าที่
                    <span style={{ color: "red", marginLeft: 4 }}>*</span>
                  </span>
                }
                value={form.receiveWorkDate}
                onChange={handleDateChange("receiveWorkDate")}
                placeholder="เลือกวันที่"
              />
            </Box>
            <Box
              sx={{
                position: "relative",
                zIndex: 1,
                width: { xs: "80%", sm: "auto" },
              }}
            >
              <DateThaiPickerService
                label={
                  <span>
                    วันที่เสนองาน ผอ.สรร.
                    <span style={{ color: "red", marginLeft: 4 }}>*</span>
                  </span>
                }
                value={form.submitWorkDate}
                onChange={handleDateChange("submitWorkDate")}
                placeholder="เลือกวันที่"
              />
            </Box>
          </Box>

          {/* แถวที่ 7: ต้นเรื่อง */}
          {/* <Box>
            <InputText
              label={
                <span>
                  ต้นเรื่อง
                  <span style={{ color: "red", marginLeft: 4 }}>*</span>
                </span>
              }
              inputLabel="กรอกต้นเรื่อง"
              name="origin"
              value={form.origin}
              onChange={handleChange}
            />
          </Box> */}

          {/* แถวที่ 8: เรื่อง */}
          <Box>
            <InputText
              label={
                <span>
                  เรื่อง
                  <span style={{ color: "red", marginLeft: 4 }}>*</span>
                </span>
              }
              inputLabel="กรอกเรื่อง"
              name="subject"
              value={form.subject}
              onChange={handleChange}
            />
          </Box>

          {/* แถวที่ 9: เอกสารแนบ */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
              เอกสารประกอบการร้องเรียน
              <span style={{ color: "red", marginLeft: 4 }}>*</span>
            </Typography>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "16px"
              }}
            />
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
              หมายเหตุ : แนบหลักฐาน เช่น สัญญา รูปภาพ หรือ หมายศาล รองรับไฟล์ .pdf .doc .docx .jpg .jpeg .png และไม่เกิน 10 MB
            </Typography>
              {isEditing && existingAttachments.length > 0 && (
                <Box sx={{ mt: 1, p:1, border: '1px solid #e0e0e0', borderRadius: 1, background:'#fafafa' }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>ไฟล์ที่มีอยู่</Typography>
                  {existingAttachments.map(att => (
                    <Box key={att.id} sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', py:0.5, borderBottom:'1px dashed #ddd', '&:last-child':{borderBottom:'none'} }}>
                      <Typography variant="body2" sx={{ maxWidth:'70%', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{att.file_name || att.name}</Typography>
                      <Box sx={{ display:'flex', gap:1 }}>
                        {att.file_url || att.url ? (
                          <Button size="small" variant="outlined" onClick={()=> window.open(att.file_url || att.url, '_blank')} sx={{ fontSize:12, py:0.3 }}>เปิด</Button>
                        ) : null}
                        <Button size="small" color="error" variant="outlined" onClick={()=> handleDeleteExistingAttachment(att)} sx={{ fontSize:12, py:0.3 }}>ลบ</Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            {uploadedFiles.length > 0 && (
              <Typography variant="body2" sx={{ mt: 1, color: "green" }}>
                ไฟล์ที่เลือก: {uploadedFiles.map(f => f.name).join(', ')}
              </Typography>
            )}
          </Box>

          {/* แถวที่ 10: หมายเหตุ (multiline) */}
          <Box>
            <InputText
              label="หมายเหตุ"
              inputLabel="กรอกหมายเหตุ"
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              multiline
              rows={4}
            />
          </Box>
        </Box>

        {/* action buttons */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "center",
            gap: 2,
            mb: 4,
            px: { xs: 2, sm: 2, md: 0 },
          }}
        >
          <Box sx={{ width: { xs: "100%", md: "18%" } }}>
            <ButtonService
              label="ล้าง"
              variant="outlined"
              iconLeft={<CloseIcon />}
              onClick={handleClear}
              sx={{
                borderColor: "#50ADFF",
                color: "#50ADFF",
                width: "100%",
                height: "55px",
                fontSize: "24px",
              }}
            />
          </Box>
          <Box sx={{ width: { xs: "100%", md: "18%" } }}>
            <ButtonService
              label="บันทึก"
              variant="contained"
              iconRight={<CheckOutlinedIcon />}
              onClick={handleSave}
              sx={{
                backgroundColor: "#2196F3",
                color: "#FFF",
                width: "100%",
                height: "55px",
                fontSize: "24px",
              }}
              disabled={!canSave}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ReceiveReportsAgencies;
