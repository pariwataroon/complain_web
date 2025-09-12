import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import SelectField from "@services/SelectField/SelectField";
import InputText from "@services/InputText/InputText";
import ButtonService from "@services/ButtonService/ButtonService";
import InputFile from "@services/InputFile/InputFile";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import useRequestResultProgress from "@hooks/admin/useRequestResultProgress/useRequestResultProgress";
import SelectFieldsalutation from "@services/SelectFieldsalutation/SelectFieldsalutation";
import SelectFieldSignatureAuthority from "@services/SelectFieldSignatureAuthority/SelectFieldSignatureAuthority";
import SelectFieldDepartment from "@services/SelectFieldDepartment/SelectFieldDepartment";
import { GetOutgoingReportOptions } from "@pages/api/allselect/allselect";
import { GetOutgoingReport3ById, DeleteOutgoingReport3Attachment } from "@pages/api/outgoinreports/outgoinreports";
import { GetReDocumentComplaints } from "@pages/api/complaint/complaint";
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

const RequestResultProgress = () => {
  const {
    form,
    errors,
    isLoading,
    createLabel,
    getFieldError,
    handleChange,
  // handleDateChange removed in hook
  handleFileChange,
    handleClear,
    handleSave,
    isFormValid,
    updateField,
  canSave,
  fileInputKey,
  isEditing,
  editReportId,
  } = useRequestResultProgress();
  const router = useRouter();

  // ยกเลิกการ auto sync docDate จาก refDate ตามคำขอ: คงเหลือเฉพาะ auto ของ refDate จากเลข สป.กค.

  // State สำหรับ dynamic data
  const [selectedSigner, setSelectedSigner] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [confidentialityOptions, setConfidentialityOptions] = useState([]);
  const [urgencyOptions, setUrgencyOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [openSearchDialog, setOpenSearchDialog] = useState(false);
  const [openSearchDialog2, setOpenSearchDialog2] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const inputRef = useRef();
  const [existingAttachments, setExistingAttachments] = useState([]);

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

  // Normalize SelectField onChange payloads (event | value | option)
  const makeSelectHandler = useCallback(
    (fieldName) => (evOrVal) => {
      const value = evOrVal?.target?.value ?? evOrVal?.value ?? evOrVal ?? "";
      updateField(fieldName, value);
    },
    [updateField]
  );

  // Prefill when editing existing type2 report via /[id] (เหมือน InitialNotificationComplainantAgency)
  useEffect(() => {
    const editId = router?.query?.id;
    if (!editId) return;
    let cancelled = false;
    (async () => {
      try {
        console.log("id to fetch", editId); 
        const res = await GetOutgoingReport3ById(editId);
        const d = res?.res_data || res?.data || res;
        if (cancelled || !d) return;

        // Core ids / numbers
        updateField('complaint_number', d.complaint_number || d.reference_number || '');
        updateField('complaint_id', d.complaint_id || '');
  // เลข สป.กค. ต้องใช้ complaint_number (fallback reference_number) ไม่ใช่ document_number
  updateField('refNo', d.complaint_number || d.reference_number || d.document_number || '');
        updateField('docNo', d.document_number || '');
        updateField('subject', d.subject || '');
        updateField('salutation', d.position?.id || "");
        const posName = d.position?.name || d.position_name || "";
        const isOther = posName === "อื่นๆ";
        updateField('salutation_is_other', !!isOther);
        if (isOther) updateField('position_other_text', d.position_other_text || "");
        // ผู้ลงนาม: setSelectedSigner และ updateField("signer", id)
        const signerObj = d.signature_authority_user || null;
        const signerId = d.signature_authority_user?.id || d.signature_authority_user_id || '';
        setSelectedSigner(signerObj);
        updateField("signer", signerId);
        updateField("signer_meta", signerObj);
        const posId =
          signerObj?.position_id ||
          signerObj?.position?.id ||
          signerObj?.positionId ||
          "";
        updateField("position_id", posId);

        // หน่วยงาน (id และ object)
        updateField("department", d.department?.id || "");
        const deptObj = d.department
          ? {
              value: d.department.id,
              label: d.department.name,
              code: d.department.code || "",
              shortName: d.department.shortName || "",
            }
          : null;
        setSelectedDepartment(deptObj);
        updateField("department_meta", deptObj);

        // Date preload: map to picker struct
        const refSrc = d.complaint_number_date || d.document_date || d.created_at;
        if (refSrc) {
          const dt = new Date(refSrc);
          if(!isNaN(dt.getTime())){
            updateField('refDate', { day: dt.getDate(), month: dt.getMonth()+1, year: dt.getFullYear(), buddhistYear: dt.getFullYear()+543 });
          }
        }

        // Confidentiality / Urgency
        if (d.confidentiality_level !== undefined && d.confidentiality_level !== null)
          updateField('confidentiality', d.confidentiality_level);
        if (d.urgency_level !== undefined && d.urgency_level !== null)
          updateField('urgency', d.urgency_level);

        // หมายเหตุ
        if (d.remarks) updateField('note', d.remarks);

        // Attachments
        const atts = Array.isArray(d.attachments) ? d.attachments : [];
        setExistingAttachments(atts);
        if (atts.length) {
          const names = atts.map(a => a.original_name || a.file_name || a.name || '').filter(Boolean).join(', ');
          if (names) updateField('attachment', names);
        }
      } catch (err) {
        console.error('Failed to prefill type2 report by id', err);
      }
    })();
    return () => { cancelled = true; };
  }, [router?.query?.id]);

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

  const handleSelectReference = (ref) => {
    updateField("refNo", ref.complaint_number || "");
    if (ref?.complaint_id || ref?.id) {
      updateField("complaint_id", ref.complaint_id || ref.id);
    }
    setOpenSearchDialog(false);
  };

  const onClear = () => {
    setSearchText("");
    handleSearch("");
    inputRef.current?.focus();
  };

  const normalizeOptions = (labelsInOrder) =>
    labelsInOrder.map((label, idx) => ({
      value: idx + 1,
      label,
    }));

  const handleSignerSelect = (userInfo) => {
    const nextId = userInfo?.id ?? userInfo?.value ?? "";
    const currId = selectedSigner?.id ?? selectedSigner?.value ?? "";
    if (nextId === currId) return; // no change
    setSelectedSigner(userInfo);
    updateField("signer", nextId);
    updateField("signer_meta", userInfo);

    const signerPosId =
      userInfo?.position_id ??
      userInfo?.position?.id ??
      userInfo?.positionId ??
      null;
    updateField("position_id", signerPosId || "");
  // Previously clearing department forced user to reselect; now we retain existing department.
  // If future logic needs remap department by signer, add mapping here.
  };

  const handleDepartmentSelect = (department) => {
    const nextId = department?.id ?? department?.value ?? "";
    const currId = selectedDepartment?.id ?? selectedDepartment?.value ?? "";
    if (nextId === currId) return; // no change
    setSelectedDepartment(department);
    if (department) {
      updateField("department", nextId);
      updateField("department_meta", department);
    }
  };

  const fetchOptions = async () => {
    try {
      setOptionsLoading(true);

      const confidentialityLabels = ["ปกติ", "ลับ", "ลับมาก", "ลับที่สุด"];
      const urgencyLabels = ["ปกติ", "เร่งด่วน", "เร่งด่วนมาก", "เร่งด่วนที่สุด"];

      setConfidentialityOptions(normalizeOptions(confidentialityLabels));
      setUrgencyOptions(normalizeOptions(urgencyLabels));
    } catch (error) {
      console.error("❌ Error:", error);
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
    handleClear();
    setSelectedSigner(null);
    setSelectedDepartment(null);
    updateField("signer_meta", null);
    updateField("department_meta", null);
  };

  const handleRefNoBlur = useCallback((e) => {
    handleChange(e);
  }, [handleChange]);

  const handleRefNoPaste = useCallback((e) => {
    setTimeout(() => {
      const val = e.target?.value || "";
      handleChange({ target: { name: 'refNo', value: val } });
    }, 0);
  }, [handleChange]);

  const [tabSelected, setTabSelected] = useState("department");

  return (
    <Box
      px={{ xs: 2, sm: 3, md: 5, lg: 8 }}
      pt={{ xs: 2, sm: 3, md: 4 }}
      pb={{ xs: 2, sm: 3, md: 8 }}
    >
      <BreadcrumbsService
        items={[
          {
            label: "แบบรายงานขอทราบผลการพิจารณา / ผลความคืบหน้า",
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

        {/* Centered form title */}
        <Box sx={{ textAlign: "center", py: 2 }}>
          <Typography variant="h5" fontWeight="bold" color="#1120A3">
            แบบรายงานขอทราบผลการพิจารณา / ผลความคืบหน้า
          </Typography>
        </Box>
        <Box
          component="form"
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            p: { xs: 2, sm: 3, md: 5 },
            pl: { xs: 3, sm: 6, md: 14, lg: 18, xl: 24 },
            pr: { xs: 2, sm: 3, md: 5, lg: 6 },
            transition: 'padding .2s ease',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              width: '100%',
              alignItems: 'flex-start',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: 'repeat(4, 1fr)'
              }
            }}
          >
            <Box>
              <SelectFieldsalutation
                label={createLabel('เรียน', 'salutation')}
                name="salutation"
                value={form.salutation}
                onChange={handleChange}
                onUserSelect={(opt) => {
                  const label = (opt?.name || opt?.label || '').trim();
                  const isCustom = label === 'อื่นๆ' || label === 'ผู้ร้อง';
                  handleChange({ target: { name: 'salutation_is_other', value: isCustom } });
                  if (!isCustom) handleChange({ target: { name: 'position_other_text', value: '' } });
                  if (isCustom) updateField('department', '');
                  try {
                    if (!isCustom) {
                      const posId = opt?.id || opt?.value || '';
                      if (posId) updateField('position_id', posId);
                      if (posId) updateField('salutation', posId);
                    } else {
                      updateField('position_id', null);
                    }
                  } catch(e){ console.warn('salutation mapping error', e); }
                }}
                error={!!getFieldError('salutation')}
                helperText={getFieldError('salutation')}
              />
            </Box>
            {!form.salutation_is_other && (
              <Box>
                <SelectFieldDepartment
                  label={createLabel('หน่วยงาน / ผู้ร้อง', 'department')}
                  name="department"
                  value={selectedDepartment}
                  onChange={handleDepartmentSelect}
                  onDepartmentSelect={handleDepartmentSelect}
                  filterBySignerId={selectedSigner?.id ?? selectedSigner?.value}
                  error={!!getFieldError('department')}
                  helperText={getFieldError('department')}
                  placeholder='เลือกหน่วยงาน / ผู้ร้อง'
                />
              </Box>
            )}
            <Box>
              <InputText
                label={createLabel('เลขที่หนังสือ', 'docNo')}
                inputLabel="กรอกเลขที่หนังสือ"
                name="docNo"
                value={form.docNo}
                onChange={handleChange}
                error={!!getFieldError('docNo')}
                helperText={getFieldError('docNo')}
              />
            </Box>
            <Box>
              <DateThaiPickerService
                label={createLabel('วันที่หนังสือ', 'docDate')}
                value={form.docDate}
                onChange={(d)=> updateField('docDate', d)}
                placeholder="เลือกวันที่หนังสือ"
                error={!!getFieldError('docDate')}
                helperText={getFieldError('docDate')}
                sx={{ width: '100%' }}
              />
            </Box>
            {(form.salutation_is_other || form.position_other_text) && (
              <Box sx={{ gridColumn: { xs: '1', sm: '1 / span 2', md: '1 / span 2' } }}>
                <InputText
                  label={createLabel('ระบุตำแหน่ง (อื่นๆ/ผู้ร้อง)', 'position_other_text')}
                  inputLabel="กรอกตำแหน่ง (อื่นๆ/ผู้ร้อง)"
                  name="position_other_text"
                  value={form.position_other_text || ''}
                  onChange={handleChange}
                  error={!!getFieldError('position_other_text')}
                  helperText={getFieldError('position_other_text')}
                />
              </Box>
            )}
          </Box>

          {/* Row 2: เรื่อง* */}
          <Box
            sx={{
              display:'grid',
              gap:2,
              gridTemplateColumns:{ xs:'1fr', md:'1fr 1fr 1fr' },
              width:'100%'
            }}
          >
            <Box sx={{ gridColumn:{ xs:'1', md:'1 / span 3'} }}>
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
          </Box>

           <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "6fr 4fr 3fr",
              },
              width: "100%",
            }}
          >

            {/* เลขที่หนังสือ + icon */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <InputText
                label={createLabel("เลข สรร.", "refNo")}
                inputLabel="กรอกเลข สรร."
                name="refNo"
                value={form.refNo}
                onChange={handleChange}
                onBlur={handleRefNoBlur}
                onPaste={handleRefNoPaste}
                error={!!getFieldError("refNo")}
                helperText={getFieldError("refNo")}
                sx={{ flex: 1 }}
              />
              <IconButton
                onClick={() => setOpenSearchDialog(true)}
                sx={{
                  ml: 1,
                  color: "blue",
                  marginTop: "10px",
                }}
              >
                <SearchIcon />
              </IconButton>
            </Box>
            <DateThaiPickerService
              label={createLabel("วันที่ สรร.", "refDate")}
              value={form.refDate}
              onChange={(d)=>updateField('refDate', d)}
              placeholder="เลือกวันที่ สรร."
              error={!!getFieldError("refDate")}
              helperText={getFieldError("refDate")}
              sx={{ width:'100%' }}
            />
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
                                {item.complaint_number}
                                {item.subject}
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

          {/* Row 3: ผู้ลงนาม* */}
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

          {/* Row 5: ชั้นความลับ*, ชั้นความเร่งด่วน* */}
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
              onChange={makeSelectHandler("confidentiality")}
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
              onChange={makeSelectHandler("urgency")}
              options={urgencyOptions}
              error={!!getFieldError("urgency")}
              helperText={getFieldError("urgency")}
              disabled={optionsLoading}
              placeholder={optionsLoading ? "กำลังโหลด..." : "เลือกชั้นความเร่งด่วน"}
            />
          </Box>

          {/* Row 6: เอกสารแนบ* - เปลี่ยนเป็น InputFile */}
          <Box sx={{ position: "relative" }}>
            <InputFile
              key={fileInputKey}
              label={createLabel("เอกสารประกอบการร้องเรียน", "attachment")}
              name="attachment"
              onChange={handleFileChange}
              error={!!getFieldError("attachment")}
              helperText={getFieldError("attachment") || "หมายเหตุ : แนบหลักฐาน เช่น สัญญา รูปภาพ หรือ หมายศาล รองรับไฟล์ .pdf .doc .docx .jpg .jpeg .png และไม่เกิน 10 MB"}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              maxFiles={3}
              maxSizeMB={10}
              existingFiles={existingAttachments}
              getFileUrl={(att) => buildFileUrl(att.file_path)}
              onDeleteExisting={async (att) => {
                const reportId = router?.query?.id || null;
                if (!reportId || !att?.id) return false;
                const res = await DeleteOutgoingReport3Attachment({
                  outgoing_report_id: reportId,
                  attachment_id: att.id,
                });
                if (res?.success === false) {
                  alert(res?.res_message || "ลบไฟล์ไม่สำเร็จ");
                  return false;
                }
                setExistingAttachments((prev) => prev.filter((x) => x.id !== att.id));
                return true;
              }}
            />
          </Box>

          {/* Row 7: หมายเหตุ */}
          <Box>
            <InputText
              label="หมายเหตุ"
              inputLabel="กรอกหมายเหตุ (ถ้ามี)"
              name="note"
              value={form.note}
              onChange={handleChange}
              multiline
              rows={4}
              helperText="ระบุข้อมูลเพิ่มเติมที่ต้องการแจ้ง"
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
              label={isLoading ? "กำลังบันทึก..." : (isEditing ? "อัพเดต" : "บันทึก")}
              variant="contained"
              iconRight={<CheckOutlinedIcon />}
              onClick={() => handleSave()}
              disabled={isLoading || (!canSave() && !isEditing) || optionsLoading}
              sx={{
                backgroundColor: (canSave() || isEditing) && !isLoading && !optionsLoading ? "#2196F3" : "#cccccc",
                color: "#FFF",
                width: "100%",
                height: "55px",
                fontSize: "20px",
                fontWeight: "600",
                "&:hover": {
                  backgroundColor: (canSave() || isEditing) && !isLoading && !optionsLoading ? "#1976D2" : "#cccccc",
                  transform: (canSave() || isEditing) && !isLoading && !optionsLoading ? "translateY(-1px)" : "none",
                  boxShadow: (canSave() || isEditing) && !isLoading && !optionsLoading ? "0 6px 16px rgba(33, 150, 243, 0.4)" : "none",
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

export default RequestResultProgress;