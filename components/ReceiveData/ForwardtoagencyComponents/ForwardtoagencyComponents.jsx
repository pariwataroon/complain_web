import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { Controller } from "react-hook-form";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import SelectField from "@services/SelectField/SelectField";
import InputText from "@services/InputText/InputText";
import ButtonService from "@services/ButtonService/ButtonService";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseIcon from "@mui/icons-material/Close";
import InputFile from "@services/InputFile/InputFile";
import { DeleteOutgoingReportAttachment } from "@pages/api/outgoinreports/outgoinreports";
import { useForwardToAgencyForm } from "@hooks/admin/forwardtoagency/useForwardToAgencyForm";
import SelectFieldSignatureAuthority from "@services/SelectFieldSignatureAuthority/SelectFieldSignatureAuthority";
import SelectFieldsalutation from "@services/SelectFieldsalutation/SelectFieldsalutation";
import SelectFieldDepartment from "@services/SelectFieldDepartment/SelectFieldDepartment";
import { GetOutgoingReportOptions } from "@pages/api/allselect/allselect";
import { GetOutgoingReportById } from "@pages/api/outgoinreports/outgoinreports";
import { GetReDocumentComplaints, GetReferenceComplaints } from "@pages/api/complaint/complaint";
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

function parseComplaintNumberToThaiDate(val) {
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
  return new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
}

// Flexible parser for various date representations returned by APIs
function parseFlexibleDate(dateStr, complaintNumber) {
  if (!dateStr && !complaintNumber) return null;

  // Try direct Date parse first
  if (dateStr) {
    const d1 = new Date(dateStr);
    if (!isNaN(d1.getTime())) return d1;

    // Try digits-only YYYYMMDD or YYYYMMDDhhmmss
    const digits = String(dateStr).replace(/\D/g, "");
    if (digits.length >= 8) {
      const raw = digits.slice(0, 8);
      let year = parseInt(raw.slice(0, 4), 10);
      const month = parseInt(raw.slice(4, 6), 10);
      const day = parseInt(raw.slice(6, 8), 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        if (year > 2400) year -= 543; // Buddhist year fallback
        const formatted = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const d2 = new Date(formatted);
        if (!isNaN(d2.getTime())) return d2;
      }
    }
  }

  // As a last resort, try deriving date from complaint number pattern
  if (complaintNumber) {
    const d3 = parseComplaintNumberToThaiDate(complaintNumber);
    if (d3) return d3;
  }

  return null;
}

const ForwardtoagencyComponents = () => {
  const router = useRouter();
  const { id } = router.query;

  const [autoSetComplaintNumberDate, setAutoSetComplaintNumberDate] = useState(false);
  const [selectedSigner, setSelectedSigner] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [confidentialityOptions, setConfidentialityOptions] = useState([]);
  const [urgencyOptions, setUrgencyOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [openSearchDialog, setOpenSearchDialog] = useState(false);
  const [openSearchDialog2, setOpenSearchDialog2] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const inputRef = useRef();
  // Keep labels from API until options are loaded, then map to select values
  const [pendingPrefill, setPendingPrefill] = useState(null);
  // Read-only list of attachments already on the server for this report
  const [existingAttachments, setExistingAttachments] = useState([]);

  // Build absolute URL from file_path and normalize Windows-style paths
  const normalizeFilePath = useCallback((p) => {
    if (!p) return "";
    let s = String(p);
    // Replace backslashes with slashes
    s = s.replace(/\\\\/g, "/").replace(/\\/g, "/");
    // Trim any local prefix before /uploads
    const idx = s.lastIndexOf("/uploads/");
    if (idx !== -1) s = s.substring(idx);
    if (!s.startsWith("/")) s = `/${s}`;
    return s;
  }, []);

  const buildFileUrl = useCallback((p) => {
    if (!p) return "";
    const normalized = normalizeFilePath(p);
    if (/^https?:\/\//i.test(normalized)) return normalized;
  // Use API base without trailing slash and strip version segment like /v1
  const baseRaw = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
  const base = baseRaw.replace(/\/api\/v\d+$/, "/api");
  return `${base}${normalized}`;
  }, [normalizeFilePath]);
  const onSubmit = async (data) => {
    const confidentialityObj = confidentialityOptions.find(
      opt => String(opt.value) === String(data.confidentiality)
    );
    const urgencyObj = urgencyOptions.find(
      opt => String(opt.value) === String(data.urgency)
    );

    const submitData = {
      ...data,
      confidentiality: confidentialityObj?.label ?? "",
      urgency: urgencyObj?.label ?? "",
    };
    const result = await handleSave(submitData);
    if (result?.success) {
      setSelectedSigner(null);
      setSelectedDepartment(null);
    }
  };

  useEffect(() => {
    if (openSearchDialog) {
      setSearchText("");
      handleSearch("");
      inputRef.current?.focus();
    }
  }, [openSearchDialog]);

  const handleSearch = async (keyword) => {
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
        label: item.complaint_number || "",
        value: item.complaint_number || "",
      }));
      setSearchResults(results);
    } catch (err) {
      setSearchResults([]);
      console.error("handleSearch error", err);
    } finally {
      setSearchLoading(false);
    }
  };
  
    // const handleSelectReference = (ref) => {
    //   setValue("document_number", ref.document_number, { shouldValidate: true, shouldDirty: true });
    //   if (ref.document_date) {
    //     setValue("document_date", new Date(ref.document_date), { shouldValidate: true, shouldDirty: true });
    //   }
    //   setOpenSearchDialog(false);
    // };
  
    const onClear = () => {
      setSearchText("");
      handleSearch("");
      inputRef.current?.focus();
    };

    useEffect(() => {
    if (openSearchDialog2) {
      setSearchText("");
      handleSearch2("");
      inputRef.current?.focus();
    }
  }, [openSearchDialog2]);

  
    const handleSearch2 = async (keyword) => {
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
          label: item.reference_number || "",
          value: item.reference_number || "",
        }));
  
        setSearchResults(results);
      } catch (err) {
        setSearchResults([]);
        console.error("handleSearch2 error", err);
      } finally {
        setSearchLoading(false);
      }
    };
  
    const handleSelectReference2 = (ref) => {
      if (!ref) {
        setOpenSearchDialog2(false);
        return;
      }

      // เซ็ตเลข สรร. (รองรับทั้ง complaint_number และ reference_number)
      const chosenNumber = ref.complaint_number || ref.reference_number || "";
      setValue(
        "complaint_number",
        chosenNumber,
        { shouldValidate: true, shouldDirty: true }
      );

      // เก็บ complaint_id เพื่อส่งไปกับ body
      setValue(
        "complaint_id",
        ref.id || ref.complaint_id || "",
        { shouldValidate: true, shouldDirty: true }
      );

      // เติมวันที่อัตโนมัติ: try multiple formats and fallbacks
      const dateStr = ref.complaint_number_date || ref.reference_date || ref.date || null;
      const parsed = parseFlexibleDate(dateStr, chosenNumber);
      if (parsed) {
        // Store as Date object to match yup.date() and DateThaiPicker expectations
        setValue("complaint_number_date", parsed, {
          shouldValidate: true,
          shouldDirty: true,
        });
        // Prevent the auto-from-number heuristic from overwriting our programmatic date
        setAutoSetComplaintNumberDate(true);
      }

      setOpenSearchDialog2(false);
    };
  
    const onClear2 = () => {
      setSearchText("");
      handleSearch2("");
      inputRef.current?.focus();
    };

  useEffect(() => {
    if (isSubmitted) {
      setSelectedSigner(null);
      setSelectedDepartment(null);
      setIsSubmitted(false);
    }
  }, [isSubmitted]);

  useEffect(() => {
    if (openSearchDialog) {
      setSearchText("");
      handleSearch("");
      inputRef.current?.focus();
    }
  }, [openSearchDialog]);
  const {
    control,
    handleSubmit,
    setValue,
    trigger,
  watch,
    errors,
    isValid,
    isDirty,
    handleFileChange,
    handleDateChange,
    handleClear,
    handleSave,
    getFieldError,
    isRequired,
    getCurrentFormData,
    fileInputKey, // Get the fileInputKey
    reset,
  } = useForwardToAgencyForm();

  useEffect(() => {
  const isEditMode = !!router?.query?.id;
  const cnum = watch("complaint_number");
  const cnumDate = watch("complaint_number_date");
  if (!isEditMode && cnum && !cnumDate && !autoSetComplaintNumberDate) {
    const autoDate = parseComplaintNumberToThaiDate(cnum);
    setValue("complaint_number_date", autoDate, { shouldValidate: true, shouldDirty: true });
    setAutoSetComplaintNumberDate(true);
  }
}, [watch("complaint_number"), autoSetComplaintNumberDate, router?.query?.id, setValue]);

  // Helper: map option label to value and set field
  const setSelectByLabel = useCallback(
    (fieldName, label, options) => {
      if (!label || !Array.isArray(options) || options.length === 0) return;
      const match = options.find(
        (opt) => String(opt.label).trim() === String(label).trim()
      );
      if (match) {
        setValue(fieldName, match.value, { shouldDirty: false });
      }
    },
    [setValue]
  );

// Helper: fill form from outgoing report data
const fillFormFromReport = useCallback(
  async (d) => {
    if (!d) return;

    // 1. Reset form before prefill to clear dirty/validation states
    await reset();

    // 2. Prepare data about position
    const posName = d.position?.name || "";
    // "อื่นๆ", "ผู้ร้อง", "ผู้ร้องเรียน" ต้องถือเป็น isOther ทั้งหมด
    const isOther = posName === "อื่นๆ" || posName === "ผู้ร้อง" || posName === "ผู้ร้องเรียน" || !!d.position_other_text;
    const positionId = d.position_id || d.position?.id || "";

    // 3. Set values for salutation and flag, make sure salutation_is_other is boolean
    setValue("salutation", positionId, { shouldDirty: true, shouldValidate: true });
    setValue("salutation_is_other", !!isOther, { shouldDirty: true, shouldValidate: true });

    // 4. For "อื่นๆ" หรือ "ผู้ร้อง"/"ผู้ร้องเรียน", force dirty/touch/validate
    if (isOther) {
      setValue("position_other_text", d.position_other_text || "", {
        shouldDirty: true,
        shouldValidate: true,
        shouldTouch: true,
      });
      // Force validate only this field after set
      await trigger("position_other_text");
    } else {
      setValue("position_other_text", "", {
        shouldDirty: true,
        shouldValidate: true,
        shouldTouch: true,
      });
    }

    // 5. Position id (if any)
    if (positionId) setValue("position_id", positionId, { shouldDirty: true });

    // 6. Complaint number and date
    setValue("complaint_number", d.complaint_number || d.reference_number || "", { shouldDirty: true, shouldValidate: true });
    setValue("complaint_id", d.complaint_id || d.related_complaint?.id || "", { shouldDirty: true });

    const cnumDate = d.complaint_number_date || d.reference_date;
    if (cnumDate) setValue("complaint_number_date", new Date(cnumDate), { shouldDirty: true, shouldValidate: true });

    // 7. Subject
    setValue("subject", d.subject || d.related_complaint?.subject || "", { shouldDirty: true, shouldValidate: true });

    // 8. Document number and date
    setValue("document_number", d.document_number || "", { shouldDirty: true, shouldValidate: true });
    if (d.document_date) setValue("document_date", new Date(d.document_date), { shouldDirty: true, shouldValidate: true });

    // 9. Signer
    const signerId = d.signature_authority_user?.id || d.signature_authority_user_id || "";
    setValue("signer", signerId, { shouldDirty: true, shouldValidate: true });
    if (signerId) setSelectedSigner({ value: signerId });

    // 10. Department
    const deptId = d.department?.id || d.department_id || "";
    setValue("original_department_id", deptId || "", { shouldDirty: true });
    if (!isOther && deptId) {
      setValue("department", deptId, { shouldDirty: true, shouldValidate: true });
    } else {
      setValue("department", "", { shouldDirty: true, shouldValidate: true });
    }

    // 11. Note
    setValue("note", d.remarks || "", { shouldDirty: true });

    // 12. Pending prefill for confidentiality/urgency (to be applied later)
    setPendingPrefill({
      confidentialityLabel: d.confidentiality_level || "",
      urgencyLabel: d.urgency_level || "",
    });

    // 13. Attachments
    const atts = Array.isArray(d.attachments) ? d.attachments : [];
    setExistingAttachments(atts);

    // 14. Validate the entire form after all values are set
    try {
      await trigger();
    } catch {}

  },
  [reset, setValue, trigger, setSelectedSigner, setPendingPrefill, setExistingAttachments]
);
  // Prefill from query params when navigating from FollowComp
  useEffect(() => {
    if (!router || !router.query) return;
    const { complaint_id, complaint_number, created_at } = router.query;
    if (complaint_id) {
      setValue("complaint_id", complaint_id, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (complaint_number) {
      setValue("complaint_number", String(complaint_number), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    // if (created_at) {
    //   const d = new Date(String(created_at));
    //   if (!isNaN(d.getTime())) {
    //     setValue("complaint_number_date", d, {
    //       shouldValidate: true,
    //       shouldDirty: true,
    //     });
    //   }
    // }
  }, [router?.query, setValue]);

  // Prefill when editing an existing type1 report via /[id]
  useEffect(() => {
    const editId = router?.query?.id;
    if (!editId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await GetOutgoingReportById(editId);
        const data = res?.res_data || res?.data || res;
        const d = data || {};
        if (cancelled || !d) return;
        // Map API fields to form
        fillFormFromReport(d);
      } catch (err) {
        console.error("Failed to prefill report by id", err);
      }
    })();
    return () => { cancelled = true; };
  }, [router?.query?.id, setValue, fillFormFromReport]);

  // Prefill when query contains outgoing_report_id (non-dynamic route)
  useEffect(() => {
    const reportId = router?.query?.outgoing_report_id;
    if (!reportId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await GetOutgoingReportById(reportId);
        const data = res?.res_data || res?.data || res;
        const d = data || {};
        if (cancelled || !d) return;
        fillFormFromReport(d);
      } catch (err) {
        console.error("Failed to prefill by outgoing_report_id", err);
      }
    })();
    return () => { cancelled = true; };
  }, [router?.query?.outgoing_report_id, fillFormFromReport]);

  // Apply pending confidentiality/urgency once options are ready
  useEffect(() => {
    if (optionsLoading) return;
    if (!pendingPrefill) return;
    const { confidentialityLabel, urgencyLabel } = pendingPrefill;
    if (confidentialityLabel) {
      setSelectByLabel("confidentiality", confidentialityLabel, confidentialityOptions);
    }
    if (urgencyLabel) {
      setSelectByLabel("urgency", urgencyLabel, urgencyOptions);
    }
    // Clear after applying
    setPendingPrefill(null);
  }, [optionsLoading, pendingPrefill, confidentialityOptions, urgencyOptions, setSelectByLabel]);

  const handleSignerSelect = (userInfo) => {
    if (!userInfo) {
      setSelectedSigner(null);
      return;
    }
    setSelectedSigner(userInfo);
    // Map signer id into form signer field (react-hook-form controller manages value externally)
    const signerId = userInfo.id || userInfo.value || userInfo.user_id || "";
    if (signerId) setValue("signer", signerId, { shouldValidate: true, shouldDirty: true });
    // If signer carries a position or department info we may optionally prefill (but do not clear existing department)
    if (userInfo.position_id || userInfo.position?.id) {
      setValue("position_id", userInfo.position_id || userInfo.position?.id, { shouldDirty: false });
    }
    // Do NOT auto clear department anymore; it's independent per latest parity rules.
  };

  const createLabel = (text, fieldName) => {
    return (
      <span>
        {text}
        {isRequired(fieldName) && (
          <span style={{ color: "red", marginLeft: 4 }}>*</span>
        )}
      </span>
    );
  };

  const handleFileUpload = (files) => {
    handleFileChange(files);
  };

  const handleDepartmentSelect = (department) => {
    // เฉพาะเมื่อมีการเลือกหน่วยงานจริงๆ เท่านั้นถึงจะ set
    // ถ้าเป็น null/undefined ไม่ต้อง clear (เก็บค่าเดิมไว้)
    if (department && department.id) {
      setSelectedDepartment(department);
      setValue("department", department.id, { shouldValidate: true, shouldDirty: true });
    }
    // ไม่ clear department ถ้าไม่มีค่าส่งมา (ป้องกันการ clear โดยไม่ตั้งใจ)
  };

 const fetchOptions = async () => {
    try {
      setOptionsLoading(true);

      const confidentialityData = await GetOutgoingReportOptions("confidentiality_levels");
      const urgencyData = await GetOutgoingReportOptions("urgency_levels");

      const normalizeOptions = (data) =>
        data.map((opt, idx) => ({
          value: opt.label || opt.value || "", // ใช้ label เป็น value string
          label: opt.label || opt.value || "",
        }));

      setConfidentialityOptions(normalizeOptions(confidentialityData));
      setUrgencyOptions(normalizeOptions(urgencyData));

    } catch (error) {

      setConfidentialityOptions([
        { value: "ปกติ", label: "ปกติ" },
        { value: "ลับ", label: "ลับ" },
        { value: "ลับมาก", label: "ลับมาก" },
        { value: "ลับที่สุด", label: "ลับที่สุด" },
      ]);

      setUrgencyOptions([
        { value: "ปกติ", label: "ปกติ" },
        { value: "เร่งด่วน", label: "เร่งด่วน" },
        { value: "เร่งด่วนมาก", label: "เร่งด่วนมาก" },
        { value: "เร่งด่วนที่สุด", label: "เร่งด่วนที่สุด" },
      ]);
    } finally {
      setOptionsLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  return (
    <Box
      px={{ xs: 2, sm: 3, md: 5, lg: 8 }}
      pt={{ xs: 2, sm: 3, md: 4 }}
      pb={{ xs: 2, sm: 3, md: 8 }}
    >
      <BreadcrumbsService
        items={[
          {
            label: "แบบรายงานส่งหน่วยงานที่เกี่ยวข้อง",
            icon: (
              <img
                src="/icons/Pencil.png"
                alt="pencil"
                style={{ width: 24, height: 24, marginBottom: -8 }}
              />
            ),
          },
        ]}
      />

      <Box sx={{ border: "2px solid #2499FF", borderTopRightRadius: 15 }}>
        {/* Top gradient bar */}
        <Box
          sx={{
            background: "linear-gradient(to right, #1223a5, #2499ff)",
            height: 50,
            borderTopRightRadius: 12,
          }}
        />

        {/* Centered title */}
        <Box sx={{ textAlign: "center", py: 2 }}>
          <Typography variant="h5" fontWeight="bold" color="#1120A3">
            แบบรายงานส่งหน่วยงานที่เกี่ยวข้อง
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            p: { xs: 2, sm: 3, md: 5 },
          }}
        >
          <Typography variant="h5" fontWeight="bold" color="#1120A3">
            ข้อมูลเรื่องร้องทุกข์
          </Typography>

          {/* Row 1: เรียน | เลข สรร. | วันที่ */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "6fr 3fr 3fr",
              },
              width: "100%",
            }}
          >
            {/* เรียน */}
            <Controller
              name="salutation"
              control={control}
              render={({ field }) => (
                <SelectFieldsalutation
                  label={createLabel("เรียน/ถึง", "salutation")}
                  name="salutation"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onUserSelect={(opt) => {
                    const label = (opt?.name || opt?.label || "").toString().trim();
                    const isOther = ["อื่นๆ", "ผู้ร้อง", "ผู้ร้องเรียน"].includes(label);
                    setValue("salutation_is_other", isOther, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                    // Sync position_id with selected salutation (needed so save uses new value)
                    const newPosId = opt?.id || opt?.value || opt?.position_id || "";
                    if (isOther) {
                      // Clear position_id so hook fallback logic can apply POSITION_FALLBACK
                      setValue("position_id", "", { shouldDirty: true, shouldValidate: false });
                    } else if (newPosId) {
                      setValue("position_id", newPosId, { shouldDirty: true, shouldValidate: false });
                    }
                    if (!isOther) {
                      // Clear other text and validation immediately
                      setValue("position_other_text", "", { shouldValidate: true, shouldDirty: true });
                    } else {
                      // When choosing ผู้ร้อง/อื่นๆ hide and clear department
                      setSelectedDepartment(null);
                      setValue("department", "", { shouldValidate: true, shouldDirty: true });
                    }
                  }}
                  // ส่งผ่านข้อความของ 'อื่นๆ' ให้ component ควบคุมร่วมกัน
                  otherText={watch("position_other_text")}
                  onOtherTextChange={(txt) =>
                    setValue("position_other_text", txt, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  error={
                    !!(
                      getFieldError("salutation") ||
                      (watch("salutation_is_other") && getFieldError("position_other_text"))
                    )
                  }
                  helperText={
                    getFieldError("salutation") ||
                    (watch("salutation_is_other") && getFieldError("position_other_text")) ||
                    ""
                  }
                  sx={{ position: "relative", zIndex: 1, width: { xs: "80%", sm: "auto" } }}
                />
              )}
            />

            {watch("salutation_is_other") && (
              <Box sx={{ flex: 1, minWidth: 240 }}>
                <Controller
                  name="position_other_text"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      label={createLabel("ระบุตำแหน่ง (อื่นๆ)", "position_other_text")}
                      inputLabel="กรอกตำแหน่ง (อื่นๆ)"
                      name="position_other_text"
                      value={field.value}
                      onChange={field.onChange}
                      error={!!getFieldError("position_other_text")}
                      helperText={getFieldError("position_other_text")}
                    />
                  )}
                />
              </Box>
            )}

            {/*  หน่วยงาน: ซ่อนเมื่อเลือก 'ผู้ร้อง' หรือ 'อื่นๆ' */}
            {!(String(watch("salutation") || "").trim() === "ผู้ร้อง" || watch("salutation_is_other")) && (
              <Controller
                name="department"
                control={control}
                render={({ field }) => (
                  <SelectFieldDepartment
                    label={createLabel("หน่วยงาน", "department")}
                    name="department"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    onDepartmentSelect={handleDepartmentSelect}
                    error={!!getFieldError("department")}
                    helperText={getFieldError("department")}
                    required={isRequired("department")}
                    placeholder={"เลือกหน่วยงาน"}
                  />
                )}
              />
            )}

            {/* เลข สรร. */}
            <Controller
              name="complaint_number"
              control={control}
              render={({ field }) => (
                <InputText
                  label={createLabel("เลข สรร.", "complaint_number")}
                  inputLabel="กรอกเลข สรร."
                  name="complaint_number"
                  value={field.value}
                  onChange={field.onChange}
                  error={!!getFieldError("complaint_number")}
                  helperText={getFieldError("complaint_number")}
                  sx={{ position: "relative", zIndex: 1, width: { xs: "80%", sm: "auto" } }}
                />
              )}
            />

            {/* ปุ่มค้นหาเลข สรร. */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <IconButton
                onClick={() => setOpenSearchDialog2(true)}
                sx={{
                  height: "40px",
                  width: "40px",
                  marginTop: "10px",
                  color: "blue",
                }}
              >
                <SearchIcon />
              </IconButton>
            </Box>

            {/* Dialog สำหรับค้นหาเลข สรร. */}
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
                {/* ช่องค้นหา */}
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

                {/* สถานะโหลด / ไม่พบ / รายการ */}
                {searchLoading ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 24,
                    }}
                  >
                    <CircularProgress color="primary" />
                    <div
                      style={{
                        marginTop: 8,
                        color: "#888",
                      }}
                    >
                      กำลังค้นหา...
                    </div>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 32,
                      color: "#bdbdbd",
                    }}
                  >
                    <DescriptionIcon sx={{ fontSize: 48, mb: 2 }} color="disabled" />
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
                              {/* จุดสถานะ is_master */}
                              <span
                                style={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: "50%",
                                  backgroundColor: isMaster ? "#2ecc71" : "#bdbdbd",
                                  border: "2px solid #fff",
                                  boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
                                  flexShrink: 0,
                                }}
                                title={isMaster ? "Master" : "Non-master"}
                              />
                              <DescriptionIcon color="info" sx={{ mr: 0.5 }} />
                              <span style={{ fontWeight: 500 }}>
                                {item.complaint_number}
                                <span style={{ marginLeft: 8 }}>{item.subject}</span>
                              </span>
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  </>
                )}
              </DialogContent>

              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => setOpenSearchDialog2(false)} variant="outlined" color="inherit">
                  ปิด
                </Button>
              </DialogActions>
            </Dialog>

            {/* วันที่ของเลข สรร. */}
            <Controller
              name="complaint_number_date"
              control={control}
              render={({ field }) => (
                <DateThaiPickerService
                  label={createLabel("วันที่ เลข สรร.", "complaint_number_date")}
                  value={field.value}
                  onChange={handleDateChange("complaint_number_date")}
                  placeholder="เลือกวันที่ เลข สรร."
                  error={!!getFieldError("complaint_number_date")}
                  helperText={getFieldError("complaint_number_date")}
                  // maxDate={new Date().toISOString()}
                />
              )}
            />
          </Box>

          {/* Row 2: เรื่อง */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr" }}>
            <Controller
              name="subject"
              control={control}
              render={({ field }) => (
                <InputText
                  label={createLabel("เรื่อง", "subject")}
                  inputLabel="กรอกเรื่อง"
                  name="subject"
                  value={field.value}
                  onChange={field.onChange}
                  error={!!getFieldError("subject")}
                  helperText={getFieldError("subject")}
                />
              )}
            />
          </Box>

          {/* Row 3: เลขที่หนังสือ | วันที่ | ผู้ลงนาม */}
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "4fr 3fr 5fr",
              },
            }}
          >
            {/* เลขที่หนังสือ */}
            <Controller
              name="document_number"
              control={control}
              render={({ field }) => (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <InputText
                    label={createLabel("เลขที่หนังสือ", "document_number")}
                    inputLabel="กรอกเลขที่หนังสือ"
                    name="document_number"
                    value={field.value}
                    onChange={field.onChange}
                    error={!!getFieldError("document_number")}
                    helperText={getFieldError("document_number")}
                    sx={{ flex: 1 }}
                  />
                </Box>
              )}
            />

            {/* วันที่หนังสือ */}
            <Box sx={{ position: "relative", zIndex: 1, width: { xs: "80%", sm: "auto" } }}>
              <Controller
                name="document_date"
                control={control}
                render={({ field }) => (
                  <DateThaiPickerService
                    label={createLabel("วันที่เลขหนังสือ", "document_date")}
                    value={field.value}
                    onChange={handleDateChange("document_date")}
                    placeholder="เลือกวันที่เลขหนังสือ"
                    error={!!getFieldError("document_date")}
                    helperText={getFieldError("document_date")}
                    // maxDate={new Date().toISOString()}
                  />
                )}
              />
            </Box>

            {/* ผู้ลงนาม */}
            <Controller
              name="signer"
              control={control}
              render={({ field }) => (
                <SelectFieldSignatureAuthority
                  label="ผู้ลงนาม"
                  name="signer"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onUserSelect={handleSignerSelect}
                  onDepartmentChange={handleDepartmentSelect}
                  error={!!getFieldError("signer")}
                  helperText={getFieldError("signer")}
                  required={isRequired("signer")}
                  placeholder="เลือกผู้ลงนาม"
                  showUserInfo={false}
                  size="small"
                  sx={{ position: "relative", zIndex: 1, width: { xs: "80%", sm: "auto" } }}
                />
              )}
            />
          </Box>

          {/* Row 5: ชั้นความลับ | ชั้นความเร่งด่วน */}
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            }}
          >
            <Controller
              name="confidentiality"
              control={control}
              render={({ field }) => (
                <SelectField
                  label={createLabel("ชั้นความลับ", "confidentiality")}
                  name="confidentiality"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  options={confidentialityOptions}
                  error={!!getFieldError("confidentiality")}
                  helperText={getFieldError("confidentiality")}
                  disabled={optionsLoading}
                  placeholder={
                    optionsLoading ? "กำลังโหลด..." : "เลือกชั้นความลับ"
                  }
                />
              )}
            />

            <Controller
              name="urgency"
              control={control}
              render={({ field }) => (
                <SelectField
                  label={createLabel("ชั้นความเร่งด่วน", "urgency")}
                  name="urgency"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  options={urgencyOptions}
                  error={!!getFieldError("urgency")}
                  helperText={getFieldError("urgency")}
                  disabled={optionsLoading}
                  placeholder={
                    optionsLoading ? "กำลังโหลด..." : "เลือกชั้นความเร่งด่วน"
                  }
                />
              )}
            />
          </Box>

          {/* Row 6: เอกสารแนบ */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr",
              position: "relative",
            }}
          >
            <Controller
              name="attachment"
              control={control}
              render={({ field }) => (
                <InputFile
                  key={fileInputKey} // Use the key here to force re-render
                  label={createLabel("เอกสารประกอบการร้องเรียน", "attachment")}
                  name="attachment"
                  onChange={handleFileUpload}
                  error={getFieldError("attachment")}
                  helperText={
                    getFieldError("attachment") ||
                    "หมายเหตุ : แนบหลักฐาน เช่น สัญญา รูปภาพ หรือ หมายศาล รองรับไฟล์ .pdf .doc .docx .jpg .jpeg .png และไม่เกิน 10 MB"
                  }
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  maxFiles={3}
                  maxSizeMB={10}
                  existingFiles={existingAttachments}
                  getFileUrl={(att) => buildFileUrl(att.file_path)}
                  onDeleteExisting={async (att) => {
                    const reportId = router?.query?.id || null;
                    if (!reportId || !att?.id) return false;
                    const res = await DeleteOutgoingReportAttachment({
                      outgoing_report_id: reportId,
                      attachment_id: att.id,
                    });
                    if (res?.success === false) {
                      alert(res?.res_message || "ลบไฟล์ไม่สำเร็จ");
                      return false;
                    }
                    // Refresh existing list in state after successful delete
                    setExistingAttachments((prev) => prev.filter((x) => x.id !== att.id));
                    return true;
                  }}
                />
              )}
            />

            {/* Existing attachments are now rendered inside InputFile with delete support */}
          </Box>

          {/* Row 7: หมายเหตุ */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr" }}>
            <Controller
              name="note"
              control={control}
              render={({ field }) => (
                <InputText
                  label={createLabel("หมายเหตุ", "note")}
                  inputLabel="กรอกหมายเหตุ (ถ้ามี)"
                  name="note"
                  value={field.value}
                  onChange={field.onChange}
                  multiline
                  rows={4}
                  error={!!getFieldError("note")}
                  helperText={
                    getFieldError("note") || "ระบุข้อมูลเพิ่มเติมที่ต้องการแจ้ง"
                  }
                />
              )}
            />
          </Box>
        </Box>

        {/* Action buttons */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "center",
            gap: 2,
            mb: 5,
            px: { xs: 2, sm: 2, md: 0 },
          }}
        >
          <Box sx={{ width: { xs: "100%", md: "18%" } }}>
            <ButtonService
              label="ล้าง"
              variant="outlined"
              iconLeft={<CloseIcon />}
              onClick={() => {
                handleClear();
                setSelectedSigner(null);
              }}
              sx={{
                borderColor: "#50ADFF",
                color: "#50ADFF",
                width: "100%",
                height: "55px",
                fontSize: "20px",
                fontWeight: "600",
                "&:hover": {
                  backgroundColor: "#50ADFF",
                  color: "#ffffff",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(80, 173, 255, 0.3)",
                },
                transition: "all 0.2s ease-in-out",
              }}
            />
          </Box>

          <Box sx={{ width: { xs: "100%", md: "18%" } }}>
            <ButtonService
              label="บันทึก"
              variant="contained"
              iconRight={<CheckOutlinedIcon />}
              onClick={handleSubmit(onSubmit)}
              disabled={!isValid}
              sx={{
                backgroundColor: isValid ? "#2196F3" : "#cccccc",
                color: "#FFF",
                width: "100%",
                height: "55px",
                fontSize: "20px",
                fontWeight: "600",
                "&:hover": {
                  backgroundColor: isValid ? "#1976D2" : "#cccccc",
                  transform: isValid ? "translateY(-1px)" : "none",
                  boxShadow: isValid
                    ? "0 6px 16px rgba(33, 150, 243, 0.4)"
                    : "none",
                },
                "&:disabled": {
                  backgroundColor: "#cccccc",
                  color: "#999999",
                  cursor: "not-allowed",
                },
                transition: "all 0.2s ease-in-out",
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ForwardtoagencyComponents;
