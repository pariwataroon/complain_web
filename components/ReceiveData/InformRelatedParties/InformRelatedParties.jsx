import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import SelectField from "@services/SelectField/SelectField";
import InputText from "@services/InputText/InputText";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import ButtonService from "@services/ButtonService/ButtonService";
import InputFile from "@services/InputFile/InputFile";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseIcon from "@mui/icons-material/Close";
import useInformRelatedParties from "@hooks/admin/InformRelatedParties/useInformRelatedParties";
import SelectFieldsalutation from "@services/SelectFieldsalutation/SelectFieldsalutation";
import SelectFieldSignatureAuthority from "@services/SelectFieldSignatureAuthority/SelectFieldSignatureAuthority";
import SelectFieldDepartment from "@services/SelectFieldDepartment/SelectFieldDepartment";
import SelectFieldDepartmentOutside from "@services/SelectFieldDepartmentoutside/SelectFieldDepartmentoutside";
import { GetOutgoingReportOptions } from "@pages/api/allselect/allselect";
import { DeleteOutgoingReportAttachment, DeleteOutgoingReport4Attachment, GetOutgoingReportById } from "@pages/api/outgoinreports/outgoinreports";
import { GetReferenceComplaints, GetReDocumentComplaints } from "@pages/api/complaint/complaint";
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
  Tabs,
  Tab,
} from "@mui/material";

const InformRelatedParties = () => {
  const {
    form,
    errors,
    isLoading,
    createLabel,
    getFieldError,
    handleChange,
    handleDateChange,
    handleFileUpload,
    handleClear,
    handleSave,
    isFormValid,
    fileInputKey,
    canSave,
    isEditing,
  report4Id,
  existingAttachments,
  setExistingAttachments,
  } = useInformRelatedParties();

  // State สำหรับ dynamic data
  const [selectedSigner, setSelectedSigner] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [confidentialityOptions, setConfidentialityOptions] = useState([]);
  const [urgencyOptions, setUrgencyOptions] = useState([]);
  const [proposeForOptions, setProposeForOptions] = useState([]);
  const [decisionOptions, setDecisionOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [deliveryMethodOptions, setDeliveryMethodOptions] = useState([
    { value: 'ระบบสารบรรณ', label: 'ระบบสารบรรณ' },
    { value: 'ไปรษณีย์', label: 'ไปรษณีย์' },
    { value: 'อีเมล', label: 'อีเมล' },
    { value: 'โทรสาร', label: 'โทรสาร' },
    { value: 'อื่นๆ', label: 'อื่นๆ' },
  ]);
  const [openSearchDialog, setOpenSearchDialog] = useState(false);
  const [openSearchDialog2, setOpenSearchDialog2] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const inputRef = useRef();
  const router = useRouter();

  // Existing attachments (when editing) and helpers to view/delete
  // existingAttachments now managed inside hook; we just consume
  // existingAttachments handled by hook
  const normalizeFilePath = useCallback((p) => {
    if (!p) return "";
    let s = String(p);
    s = s.replace(/\\\\/g, "/").replace(/\\/g, "/");
    const idx = s.lastIndexOf("/uploads/");
    if (idx !== -1) s = s.substring(idx);
    if (!s.startsWith("/")) s = `/${s}`;
    return s;
  }, []);
  const buildFileUrl = useCallback((p) => {
    if (!p) return "";
    const normalized = normalizeFilePath(p);
    if (/^https?:\/\//i.test(normalized)) return normalized;
    const baseRaw = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
    const base = baseRaw.replace(/\/api\/v\d+$/, "/api");
    return `${base}${normalized}`;
  }, [normalizeFilePath]);

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
  
    const handleSelectReference = (ref) => {
      handleChange("bookNo", ref.document_number, { shouldValidate: true, shouldDirty: true });
      setOpenSearchDialog(false);
    };
  
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
          label: item.complaint_number || "",
          value: item.complaint_number || "",
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
      const number = ref.complaint_number || ref.reference_number || "";
      handleChange("refNo", number);

      const setYMD = (dstr) => {
        const d = new Date(dstr);
        if (isNaN(d.getTime())) return null;
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      };

      if (ref.reference_date) {
        handleDateChange(setYMD(ref.reference_date), "date");
      }
      if (ref.complaint_number_date) {
        handleDateChange(setYMD(ref.complaint_number_date), "date2");
      }

      setOpenSearchDialog2(false);
    };
  
    const onClear2 = () => {
      setSearchText("");
      handleSearch2("");
      inputRef.current?.focus();
    };

  // ฟังก์ชันจัดการเมื่อมีการเลือกผู้ลงนาม
  const handleSignerSelect = (userInfo) => {
    setSelectedSigner(userInfo);
    // set signer id and position id into form
    const signerId = userInfo?.id ?? userInfo?.value ?? "";
    const positionId = userInfo?.position_id ?? userInfo?.position?.id ?? userInfo?.positionId ?? "";
    handleChange({ target: { name: "signer", value: signerId } });
    if (positionId) handleChange({ target: { name: "salutation", value: positionId } });
    // Do NOT clear department anymore; user can pre-select department without signer.
  };

  const handleDepartmentSelect = (department) => {
    setSelectedDepartment(department);
    const deptId = department?.id ?? department?.value ?? "";
    handleChange({ target: { name: "department", value: deptId } });
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

      setProposeForOptions([
        { value: "ทราบ", label: "เพื่อทราบ" },
        { value: "อนุมัติ", label: "เพื่อทราบไว้ชั้นหนึ่ง" },
        { value: "พิจารณา", label: "เพื่อพิจารณา" },
        { value: "พิจารณา2", label: "เพื่อรับไว้เป็นข้อมูล" },
      ]);

      setDecisionOptions([
        { value: "รับทราบ", label: "ทราบ" },
        { value: "อนุมัติ", label: "ทราบไว้ชั้นหนึ่ง" },
        { value: "ยุติเรื่อง", label: "ยุติเรื่องได้" },
        { value: "เพิ่มเติม", label: "เห็นชอบ" },
        { value: "ดำเนินการ", label: "อยู่ระหว่างดำเนินการ" },
      ]);

    } catch (error) {
      console.error("⚠️ fetchOptions error:", error);

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

      setProposeForOptions([
        { value: "ทราบ", label: "ทราบ" },
        { value: "พิจารณา", label: "พิจารณา" },
        { value: "อนุมัติ", label: "อนุมัติ" },
        { value: "ดำเนินการ", label: "ดำเนินการ" },
      ]);

      setDecisionOptions([
        { value: "รับทราบ", label: "รับทราบ" },
        { value: "อนุมัติ", label: "อนุมัติ" },
        { value: "ไม่อนุมัติ", label: "ไม่อนุมัติ" },
        { value: "เพิ่มเติม", label: "ต้องการข้อมูลเพิ่มเติม" },
      ]);
    } finally {
      setOptionsLoading(false);
    }
  };

  // โหลดข้อมูล options เมื่อ component mount
  useEffect(() => {
    fetchOptions();
  }, []);

  // ฟังก์ชันล้างข้อมูลที่อัพเดทแล้ว
  const handleClearExtended = () => {
    console.log("🧹 handleClearExtended: Extended clearing");
    handleClear();
    setSelectedSigner(null);
    setSelectedDepartment(null);
  setExistingAttachments([]);
  };

  useEffect(() => {
    if (isEditing && form.department && !selectedDepartment) {
      setSelectedDepartment({ id: form.department, value: form.department, label: form.department });
    }
  }, [isEditing, form.department, selectedDepartment]);

  useEffect(() => {
    if (isEditing && form.signer && !selectedSigner) {
      setSelectedSigner({ id: form.signer, value: form.signer, label: form.signer });
    }
  }, [isEditing, form.signer, selectedSigner]);

  // Custom date change handlers for different date fields
  const handleMainDateChange = (thaiDate) => {
    handleDateChange(thaiDate, 'date');
  };

  const handleDate2Change = (thaiDate) => {
    handleDateChange(thaiDate, 'date2');
  };
  // Tab: inspector | complainant | other
  const [tabSelected, setTabSelected] = useState(form?.reportType || "inspector");

  const handleTabChange = (e, val) => {
    setTabSelected(val);
    // Persist the selection into form so it can be sent to API
    handleChange("reportType", val);
    if (val === 'other') {
      // Clear internal department select when switching to 'other'
      setSelectedDepartment(null);
      handleChange({ target: { name: 'department', value: '' } });
    }
  };

  // Keep tabSelected in sync with loaded form.reportType (especially on edit load)
  useEffect(() => {
    if (form?.reportType && tabSelected !== form.reportType) {
      setTabSelected(form.reportType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form?.reportType]);

  // Remove legacy prefill (replacement handled inside hook).

  return (
    <Box
      px={{ xs: 2, sm: 3, md: 5, lg: 8 }}
      pt={{ xs: 2, sm: 3, md: 4 }}
      pb={{ xs: 2, sm: 3, md: 8 }}
    >
      <BreadcrumbsService
        items={[
          {
            label: "แบบรายงานแจ้งผลการให้ผู้เกี่ยวข้องทราบ",
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
            {tabSelected === 'inspector' && (isEditing ? 'แก้ไขรายงานผู้ตรวจฯ' : 'รายงานผู้ตรวจฯ')}
            {tabSelected === 'complainant' && (isEditing ? 'แก้ไขแจ้งผลผู้ร้อง' : 'แจ้งผลผู้ร้อง')}
            {tabSelected === 'other' && (isEditing ? 'แก้ไขแจ้งหน่วยงานอื่น' : 'แจ้งหน่วยงานอื่น')}
          </Typography>
        </Box>
        {/* tabs header */}
        <Box sx={{ px: { xs: 2, sm: 3, md: 5 }, pt: 1 }}>
          <Tabs
            value={tabSelected}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="report type tabs"
          >
            <Tab value="inspector" label="รายงานผู้ตรวจฯ" />
            <Tab value="complainant" label="แจ้งผลผู้ร้อง" />
            <Tab value="other" label="แจ้งหน่วยงานอื่น" />
          </Tabs>
        </Box>

        <Box
          component="form"
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            p: { xs: 2, sm: 3, md: 5 },
          }}
        >
          {/* row: เลข สรร. | วันที่ เลขสรร. */}
          <Box
            sx={{
              display: 'grid',
              columnGap: 2,
              rowGap: 2,
              alignItems: 'flex-end',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(2, 1fr)'
              },
              width: '100%'
            }}
          >
      <Box>
              <Box sx={{ display:'flex', alignItems:'flex-end', gap:1 }}>
                <Box sx={{ flex:1 }}>
                  <InputText
                    label={createLabel('เลข สรร.', 'refNo')}
                    inputLabel='กรอกเลข สรร.'
                    name='refNo'
                    value={form.refNo}
                    onChange={handleChange}
                    error={!!getFieldError('refNo')}
                    helperText={getFieldError('refNo')}
                  />
                </Box>
                <IconButton
                  onClick={() => setOpenSearchDialog2(true)}
                  sx={{
                    height: 40,
                    width: 40,
                    color: 'blue',
                    mt: { xs: '22px', md: '22px' },
                    marginBottom: 2
                  }}
                  size='small'
                >
                  <SearchIcon />
                </IconButton>
              </Box>
            </Box>
              <Box sx={{ position: 'relative' }}>
              <DateThaiPickerService
                label={createLabel('วันที่ เลขสรร.', 'date')}
                value={form.date}
                onChange={handleMainDateChange}
                placeholder='เลือกวันที่'
                error={!!getFieldError('date')}
                helperText={getFieldError('date')}
              />
            </Box>
          </Box>

          {/* ชั้นความลับ | ชั้นความเร่งด่วน */}
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            }}
          >
            <SelectField
              label={createLabel("ชั้นความลับ", "confidentiality")}
              name="confidentiality"
              value={form.confidentiality}
              onChange={handleChange}
              options={confidentialityOptions}
              error={!!getFieldError("confidentiality")}
              helperText={getFieldError("confidentiality")}
              disabled={optionsLoading}
              placeholder={optionsLoading ? "กำลังโหลด..." : "เลือกชั้นความลับ"}
            />

            <SelectField
              label={createLabel("ชั้นความเร่งด่วน", "urgency")}
              name="urgency"
              value={form.urgency}
              onChange={handleChange}
              options={urgencyOptions}
              error={!!getFieldError("urgency")}
              helperText={getFieldError("urgency")}
              disabled={optionsLoading}
              placeholder={optionsLoading ? "กำลังโหลด..." : "เลือกชั้นความเร่งด่วน"}
            />
          </Box>

          {/* ซ่อนฟิลด์เพิ่มเติมที่ไม่อยู่ในสcope ภาพ 1-2-3 */}
          {/* intentionally hidden: createdByDepartment, deliveryMethod */}

             {/* Dialog สำหรับค้นหาเลข */}
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
                        "&::-webkit-scrollbar-thumb:hover":
                          {
                            background: "#64b5f6",
                          },
                      }}
                    >
                      {searchResults.map((item) => {
                        const isMaster = !!item.is_master; 
                        return (
                          <ListItem
                            key={item.id}
                            disablePadding
                          >
                            <ListItemButton
                              onClick={() =>
                                handleSelectReference2(item)
                              }
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
                                  backgroundColor: isMaster
                                    ? "#2ecc71"
                                    : "#bdbdbd",
                                  border: "2px solid #fff",
                                  boxShadow:
                                    "0 0 0 1px rgba(0,0,0,0.15)",
                                  flexShrink: 0,
                                }}
                                title={
                                  isMaster
                                    ? "Master"
                                    : "Non-master"
                                }
                              />
                              <DescriptionIcon
                                color="info"
                                sx={{ mr: 0.5 }}
                              />
                               <span style={{ fontWeight: 500 }}>
                                {item.complaint_number}
                                {item.subject}
                                <span style={{ marginLeft: 8 }}>{item.subject}</span>
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
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: "#2ecc71",
                            boxShadow:
                              "0 0 0 1px rgba(0,0,0,0.15)",
                          }}
                        />
                        Master
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: "#bdbdbd",
                            boxShadow:
                              "0 0 0 1px rgba(0,0,0,0.15)",
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

          {/* row 2: เรื่อง */}
          {/* <Box>
            <InputText
              label={createLabel("เรื่อง", "subject")}
              inputLabel="กรอกเรื่อง"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              error={!!getFieldError("subject")}
              helperText={getFieldError("subject")}
            />
          </Box> */}

          {/* row 2.5: เพิ่มฟิลด์สำหรับ bookNo และ date2 */}
         <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            alignItems: { xs: "stretch", sm: "flex-end" },
          }}
        >
          <Box sx={{ flex: 1 }}>
            <InputText
              label="เลขที่หนังสือ/เอกสาร"
              inputLabel="กรอกเลขที่หนังสือ"
              name="bookNo"
              value={form.bookNo}
              onChange={handleChange}
              error={!!getFieldError("bookNo")}
              helperText={getFieldError("bookNo")}
            />
          </Box>

          <Box sx={{ 
            alignSelf: { xs: "flex-start", sm: "flex-end" }, 
            display: "flex", 
            alignItems: "flex-end" 
          }}>
            {/* <IconButton
              onClick={() => setOpenSearchDialog(true)}
              sx={{ height: 40, width: 40, color: 'blue',marginBottom: '18px' }}
            >
              <SearchIcon />
            </IconButton> */}
          </Box>

          <Box sx={{ flex: 1 }}>
            <DateThaiPickerService
              label="วันที่หนังสือ/เอกสาร"
              value={form.date2}
              onChange={handleDate2Change}
              placeholder="เลือกวันที่หนังสือ"
              error={!!getFieldError("date2")}
              helperText={getFieldError("date2")}
            />
          </Box>
        </Box>

      {/* Dialog สำหรับค้นหาเลข */}
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
                  "&::-webkit-scrollbar-thumb:hover":
                    {
                      background: "#64b5f6",
                    },
                }}
              >
                {searchResults.map((item) => {
                  const isMaster = !!item.is_master; // fallback ถ้า undefined
                  return (
                    <ListItem
                      key={item.id}
                      disablePadding
                    >
                      <ListItemButton
                        onClick={() =>
                          handleSelectReference(item)
                        }
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
                            backgroundColor: isMaster
                              ? "#2ecc71"
                              : "#bdbdbd",
                            border: "2px solid #fff",
                            boxShadow:
                              "0 0 0 1px rgba(0,0,0,0.15)",
                            flexShrink: 0,
                          }}
                          title={
                            isMaster
                              ? "Master"
                              : "Non-master"
                          }
                        />
                        <DescriptionIcon
                          color="info"
                          sx={{ mr: 0.5 }}
                        />
                        <span
                          style={{ fontWeight: 500 }}
                        >
                          {item.document_number}
                          {/* {item.complaint_number} */}
                        </span>
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>

              {/* Legend (ถ้าไม่ต้องการสามารถลบส่วนนี้ออกได้) */}
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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#2ecc71",
                      boxShadow:
                        "0 0 0 1px rgba(0,0,0,0.15)",
                    }}
                  />
                  Master
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#bdbdbd",
                      boxShadow:
                        "0 0 0 1px rgba(0,0,0,0.15)",
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

          {/* เรื่อง */}
          <Box>
            <InputText
              label={createLabel("เรื่อง", "subject")}
              inputLabel="กรอกเรื่อง"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              error={!!getFieldError("subject")}
              helperText={getFieldError("subject")}
            />
          </Box>

          {/* เรียน/ถึง (ย้ายมาตามลำดับที่ต้องการ) */}
          <Box>
            <SelectFieldsalutation
              label={createLabel('เรียน/ถึง', 'salutation')}
              name="salutation"
              value={form.salutation}
              onChange={handleChange}
              onUserSelect={(opt) => {
                const label = (opt?.name || opt?.label || '').trim();
                const isOther = label === 'อื่นๆ';
                const isComplainant = label === 'ผู้ร้อง';
                handleChange({ target: { name: 'salutation_is_other', value: isOther } });
                handleChange({ target: { name: 'salutation_is_complainant', value: isComplainant } });
                if (label) handleChange({ target: { name: 'salutation_name', value: label } });
                if (opt) {
                  const idVal = opt.id || opt.value || opt.position_id || '';
                  if (idVal) handleChange('salutation', { value: idVal }, { originalOption: opt });
                }
                if (!isOther) {
                  handleChange({ target: { name: 'position_other_text', value: '' } });
                }
                if (isOther || isComplainant) {
                  setSelectedDepartment(null);
                  handleChange({ target: { name: 'department', value: '' } });
                }
              }}
              error={!!getFieldError('salutation')}
              helperText={getFieldError('salutation')}
            />
          </Box>

          {(form.salutation_is_other || form.salutation_is_complainant) && (
            <Box>
              <InputText
                label={createLabel(form.salutation_is_complainant ? 'ระบุผู้ร้อง' : 'ระบุตำแหน่ง (อื่นๆ)', 'position_other_text')}
                inputLabel={form.salutation_is_complainant ? 'กรอกชื่อผู้ร้อง' : 'กรอกตำแหน่ง (อื่นๆ)'}
                name='position_other_text'
                value={form.position_other_text || ''}
                onChange={handleChange}
                error={!!getFieldError('position_other_text')}
                helperText={getFieldError('position_other_text') || (form.salutation_is_complainant ? 'พิมพ์ชื่อผู้ร้องที่ต้องการระบุ' : '')}
              />
            </Box>
          )}

          {tabSelected === "other" && (
            <>
              <Box>
                <SelectFieldDepartmentOutside
                  label="หน่วยงาน (เลือกจากรายการ)"
                  inputLabel="เลือกหน่วยงานภายนอก"
                  name="otherDepartmentId"
                  value={form.otherDepartmentId}
                  onChange={handleChange}
                  error={!!getFieldError('otherDepartmentId')}
                  helperText={getFieldError('otherDepartmentId')}
                  required={true}
                  allowCreate={false}
                />
              </Box>
              {/* <Box>
                <InputText
                  label={createLabel('หน่วยงาน (กรอกเองได้ ถ้าไม่มีในรายการ)', 'otherDepartmentName')}
                  inputLabel='กรอกหน่วยงาน (หน่วยงานอื่นที่เกี่ยวข้อง)'
                  name='otherDepartmentName'
                  value={form.otherDepartmentName || ''}
                  onChange={handleChange}
                  error={!!getFieldError('otherDepartmentName')}
                  helperText={getFieldError('otherDepartmentName')}
                />
              </Box> */}
            </>
          )}

          {/* ผู้ลงนาม */}
          <Box>
            <SelectFieldSignatureAuthority
              label={createLabel("ผู้ลงนาม", "signer")}
              name="signer"
              value={form.signer}
              onChange={handleChange}
              onUserSelect={handleSignerSelect}
              error={!!getFieldError("signer")}
              helperText={getFieldError("signer")}
              placeholder="เลือกผู้ลงนาม"
              showUserInfo={false}
            />
          </Box>
          {/* ความลับ/เร่งด่วน ย้ายขึ้นด้านบนแล้ว */}

          {/* เสนอเพื่อ | ผลการพิจารณา (เฉพาะรายงานผู้ตรวจฯ) */}
          {tabSelected === 'inspector' && (
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              }}
            >
              <SelectField
                label={createLabel("เสนอเพื่อ", "proposeFor")}
                name="proposeFor"
                value={form.proposeFor}
                onChange={handleChange}
                options={proposeForOptions}
                error={!!getFieldError("proposeFor")}
                helperText={getFieldError("proposeFor")}
                disabled={optionsLoading}
                placeholder={optionsLoading ? "กำลังโหลด..." : "เลือกวัตถุประสงค์"}
              />

              <SelectField
                label={createLabel("ผลการพิจารณา", "decision")}
                name="decision"
                value={form.decision}
                onChange={handleChange}
                options={decisionOptions}
                error={!!getFieldError("decision")}
                helperText={getFieldError("decision")}
                disabled={optionsLoading}
                placeholder={optionsLoading ? "กำลังโหลด..." : "เลือกผลการพิจารณา"}
              />
            </Box>
          )}

          {/* รายละเอียดอยู่เหนือเอกสารแนบ ทุกแท็บให้เหมือนกัน */}
          <>
            <Box>
              <InputText
                label="รายละเอียด"
                inputLabel="กรอกรายละเอียด (ถ้ามี)"
                name="details"
                value={form.details}
                onChange={handleChange}
                multiline
                rows={4}
                helperText="ระบุข้อมูลเพิ่มเติมที่ต้องการแจ้ง"
              />
            </Box>
            <Box sx={{ position: "relative" }}>
              <InputFile
                key={fileInputKey}
                label={createLabel("เอกสารแนบ", "attachment")}
                name="attachment"
                onChange={handleFileUpload}
                error={!!getFieldError("attachment")}
                helperText={getFieldError("attachment") || "หมายเหตุ : แนบหลักฐาน เช่น สัญญา รูปภาพ หรือ หมายศาล รองรับไฟล์ .pdf .doc .docx .jpg .jpeg .png และไม่เกิน 10 MB"}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                maxFiles={3}
                maxSizeMB={10}
                multiple
                existingFiles={existingAttachments}
                getFileUrl={(att) => buildFileUrl(att.file_path)}
                onDeleteExisting={async (att) => {
                  const reportId = report4Id || router?.query?.report4_id || router?.query?.id || null;
                  if (!reportId || !att?.id) return false;
                  let res = await DeleteOutgoingReport4Attachment({ outgoing_report_id: reportId, attachment_id: att.id });
                  if (res?.success === false) {
                    res = await DeleteOutgoingReportAttachment({ outgoing_report_id: reportId, attachment_id: att.id });
                  }
                  if (res?.success === false) { alert(res?.res_message || "ลบไฟล์ไม่สำเร็จ"); return false; }
                  setExistingAttachments((prev) => prev.filter((x) => x.id !== att.id));
                  const remainingNames = (existingAttachments.filter(x => x.id !== att.id).map(a => a.original_name || a.file_name || a.name || "").filter(Boolean)).join(", ");
                  handleChange("attachment", remainingNames);
                  return true;
                }}
              />
            </Box>
          </>
        </Box>

        {/* action buttons */}
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
              onClick={handleClearExtended}
              disabled={isLoading || optionsLoading}
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
              label={isLoading ? (isEditing ? "กำลังอัปเดต..." : "กำลังบันทึก...") : (isEditing ? "อัปเดต" : "บันทึก")}
              variant="contained"
              iconRight={<CheckOutlinedIcon />}
              onClick={handleSave}
              disabled={isLoading || !canSave() || optionsLoading}
              sx={{
                backgroundColor: canSave() && !isLoading && !optionsLoading ? "#2196F3" : "#cccccc",
                color: "#FFF",
                width: "100%",
                height: "55px",
                fontSize: "20px",
                fontWeight: "600",
                "&:hover": {
                  backgroundColor: canSave() && !isLoading && !optionsLoading ? "#1976D2" : "#cccccc",
                  transform: canSave() && !isLoading && !optionsLoading ? "translateY(-1px)" : "none",
                  boxShadow: canSave() && !isLoading && !optionsLoading ? "0 6px 16px rgba(33, 150, 243, 0.4)" : "none",
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

export default InformRelatedParties;