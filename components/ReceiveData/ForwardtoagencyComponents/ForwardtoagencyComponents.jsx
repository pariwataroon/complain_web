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

const ForwardtoagencyComponents = () => {
  const router = useRouter();
  const { id } = router.query;

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
        limit: 100,
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
          limit: 100,
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
      // เซ็ตเลข สป.กค. (รองรับทั้ง complaint_number และ reference_number)
      setValue(
        "complaint_number",
        ref.complaint_number || ref.reference_number || "",
        { shouldValidate: true, shouldDirty: true }
      );
      // เก็บ complaint_id เพื่อส่งไปกับ body
      setValue(
        "complaint_id",
        ref.id || ref.complaint_id || "",
        { shouldValidate: true, shouldDirty: true }
      );
      // เติมวันที่อัตโนมัติหากมี (รองรับทั้ง complaint_number_date และ reference_date)
      const dateStr = ref.complaint_number_date || ref.reference_date;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          // Store as Date object to match yup.date() and DateThaiPicker expectations
          setValue("complaint_number_date", d, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
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
  } = useForwardToAgencyForm();

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
      // Core fields
  // กรณี 'อื่นๆ' ให้ตั้งค่า flag และเติมข้อความประกอบ
      const posName = d.position?.name || "";
  const isOther = posName === "อื่นๆ" || !!d.position_other_text;
  const positionId = d.position_id || d.position?.id || "";
  setValue("salutation", positionId, { shouldDirty: false, shouldValidate: true });
  setValue("salutation_is_other", !!isOther, { shouldDirty: false });
      if (isOther && d.position_other_text) {
        setValue("position_other_text", d.position_other_text, { shouldDirty: false, shouldValidate: true });
      }

      setValue(
        "complaint_number",
        d.complaint_number || d.reference_number || "",
        { shouldDirty: false, shouldValidate: true }
      );
      setValue("complaint_id", d.complaint_id || d.related_complaint?.id || "", { shouldDirty: false });

      const cnumDate = d.complaint_number_date || d.reference_date;
  if (cnumDate) setValue("complaint_number_date", new Date(cnumDate), { shouldDirty: false, shouldValidate: true });

  setValue("subject", d.subject || d.related_complaint?.subject || "", { shouldDirty: false, shouldValidate: true });

  setValue("document_number", d.document_number || "", { shouldDirty: false, shouldValidate: true });
  if (d.document_date) setValue("document_date", new Date(d.document_date), { shouldDirty: false, shouldValidate: true });

  const signerId = d.signature_authority_user?.id || d.signature_authority_user_id || "";
  setValue("signer", signerId, { shouldDirty: false, shouldValidate: true });
  if (signerId) setSelectedSigner({ value: signerId });

  // Prefill department if present
  const deptId = d.department?.id || d.department_id || "";
  setValue("department", deptId, { shouldDirty: false, shouldValidate: true });

      // Note/Remarks
  setValue("note", d.remarks || "", { shouldDirty: false });

      // Store labels temporarily to map after options load
      setPendingPrefill({
        confidentialityLabel: d.confidentiality_level || "",
        urgencyLabel: d.urgency_level || "",
      });

  // Attachments (read-only display)
  const atts = Array.isArray(d.attachments) ? d.attachments : [];
  setExistingAttachments(atts);
      // Validate the form after initial prefill of required fields
      try { await trigger(); } catch {}
    },
    [setValue, trigger]
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
    if (created_at) {
      const d = new Date(String(created_at));
      if (!isNaN(d.getTime())) {
        setValue("complaint_number_date", d, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
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
    setSelectedSigner(userInfo);
    setSelectedDepartment(null);
    setValue("department", "");
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

  const handleDepartmentChange = (department) => {
    setSelectedDepartment(department);
    if (department) {
      setValue("department", department.id);
    } else {
      setValue("department", "");
    }
  };

  const handleDepartmentSelect = (department) => {
    setSelectedDepartment(department);
  };

 const fetchOptions = async () => {
    try {
      setOptionsLoading(true);

      const confidentialityData = await GetOutgoingReportOptions("confidentiality_levels");
      const urgencyData = await GetOutgoingReportOptions("urgency_levels");

      const normalizeOptions = (data) =>
        data.map((opt, idx) => ({
          value: idx + 1,
          label: opt.label || opt.value || `ตัวเลือก ${idx + 1}`,
        }));

      setConfidentialityOptions(normalizeOptions(confidentialityData));
      setUrgencyOptions(normalizeOptions(urgencyData));

    } catch (error) {

      setConfidentialityOptions([
        { value: 1, label: "ปกติ" },
        { value: 2, label: "ลับ" },
        { value: 3, label: "ลับมาก" },
        { value: 4, label: "ลับที่สุด" },
      ]);

      setUrgencyOptions([
        { value: 1, label: "ปกติ" },
        { value: 2, label: "เร่งด่วน" },
        { value: 3, label: "เร่งด่วนมาก" },
        { value: 4, label: "เร่งด่วนที่สุด" },
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

          {/* Row 1: เรียน | เลข สป.กค. | วันที่ */}
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
                    const isOther = (opt?.name || opt?.label) === "อื่นๆ";
                    setValue("salutation_is_other", isOther, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                    if (!isOther) {
                      // Clear other text and validation immediately
                      setValue("position_other_text", "", { shouldValidate: true, shouldDirty: true });
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

            {/* เลข สป.กค. */}
            <Controller
              name="complaint_number"
              control={control}
              render={({ field }) => (
                <InputText
                  label={createLabel("เลข สป.กค.", "complaint_number")}
                  inputLabel="กรอกเลข สป.กค."
                  name="complaint_number"
                  value={field.value}
                  onChange={field.onChange}
                  error={!!getFieldError("complaint_number")}
                  helperText={getFieldError("complaint_number")}
                  sx={{ position: "relative", zIndex: 1, width: { xs: "80%", sm: "auto" } }}
                />
              )}
            />

            {/* ปุ่มค้นหาเลข สป.กค. */}
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

            {/* วันที่ของเลข สป.กค. */}
            <Controller
              name="complaint_number_date"
              control={control}
              render={({ field }) => (
                <DateThaiPickerService
                  label={createLabel("วันที่", "complaint_number_date")}
                  value={field.value}
                  onChange={handleDateChange("complaint_number_date")}
                  placeholder="เลือกวันที่"
                  error={!!getFieldError("complaint_number_date")}
                  helperText={getFieldError("complaint_number_date")}
                  maxDate={new Date().toISOString()}
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
                    label={createLabel("วันที่", "document_date")}
                    value={field.value}
                    onChange={handleDateChange("document_date")}
                    placeholder="เลือกวันที่"
                    error={!!getFieldError("document_date")}
                    helperText={getFieldError("document_date")}
                    maxDate={new Date().toISOString()}
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
                  onDepartmentChange={handleDepartmentChange}
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

          {/* Row 4: หน่วยงาน */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr" }}>
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
                  filterBySignerId={selectedSigner?.value}
                  error={!!getFieldError("department")}
                  helperText={getFieldError("department")}
                  required={isRequired("department")}
                  disabled={!selectedSigner}
                  placeholder={
                    selectedSigner ? "เลือกหน่วยงาน" : "เลือกผู้ลงนามก่อน"
                  }
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
