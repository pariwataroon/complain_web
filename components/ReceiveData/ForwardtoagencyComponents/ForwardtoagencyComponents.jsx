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
import { useForwardToAgencyForm } from "@hooks/admin/forwardtoagency/useForwardToAgencyForm";
import SelectFieldSignatureAuthority from "@services/SelectFieldSignatureAuthority/SelectFieldSignatureAuthority";
import SelectFieldsalutation from "@services/SelectFieldsalutation/SelectFieldsalutation";
import SelectFieldDepartment from "@services/SelectFieldDepartment/SelectFieldDepartment";
import { GetOutgoingReportOptions } from "@pages/api/allselect/allselect";
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
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          setValue("complaint_number_date", `${yyyy}-${mm}-${dd}`, {
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

  // Prefill from query params when navigating from FollowComp
  useEffect(() => {
    if (!router || !router.query) return;
    const { complaint_id, complaint_number } = router.query;
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
  }, [router?.query, setValue]);

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
          onSubmit={handleSubmit(handleSave)}
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
                  label={createLabel("เรียน", "salutation")}
                  name="salutation"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={!!getFieldError("salutation")}
                  helperText={getFieldError("salutation")}
                  sx={{ position: "relative", zIndex: 1, width: { xs: "80%", sm: "auto" } }}
                />
              )}
            />

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
                />
              )}
            />
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
