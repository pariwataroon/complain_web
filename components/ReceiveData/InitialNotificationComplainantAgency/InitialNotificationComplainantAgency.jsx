import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import SelectField from "@services/SelectField/SelectField";
import InputText from "@services/InputText/InputText";
import ButtonService from "@services/ButtonService/ButtonService";
import InputFile from "@services/InputFile/InputFile";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import useInitialNotificationComplainantAgency from "@hooks/admin/InitialNotificationComplainantAgency/useInitialNotificationComplainantAgency";
import SelectFieldsalutation from "@services/SelectFieldsalutation/SelectFieldsalutation";
import SelectFieldSignatureAuthority from "@services/SelectFieldSignatureAuthority/SelectFieldSignatureAuthority";
import SelectFieldDepartmentoutside from "@services/SelectFieldDepartmentoutside/SelectFieldDepartmentoutside";
import { GetOutgoingReportOptions } from "@pages/api/allselect/allselect";
import { GetOutgoingReport2ById } from "@pages/api/outgoinreports/outgoinreports";
import { GetReDocumentComplaints } from "@pages/api/complaint/complaint";
import { DeleteOutgoingReportAttachment } from "@pages/api/outgoinreports/outgoinreports";
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

const InitialNotificationComplainantAgency = () => {
  const {
  form,
  errors,
  isLoading,
  createLabel,
  getFieldError,
  handleChange,
  handleDocumentDateChange,
  handleComplaintNumberDateChange,
  handleFileUpload,
  handleClear,
  handleSave,
  isFormValid,
  isRequired,
  fileInputKey,
  canSave,
  existingAttachments,
  handleDeleteExistingAttachment,
} = useInitialNotificationComplainantAgency();

  const router = useRouter();

  const pickId = (o) => o?.id ?? o?.value ?? o;
  const pickPositionId = (u) =>
    u?.position_id ?? u?.position?.id ?? u?.positionId ?? null;

  // State สำหรับ dynamic data
  const [selectedSigner, setSelectedSigner] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [confidentialityOptions, setConfidentialityOptions] = useState([
    { value: "1", label: "ปกติ" },
    { value: "2", label: "ลับ" },
    { value: "3", label: "ลับมาก" },
    { value: "4", label: "ลับที่สุด" },
  ]);
  const [urgencyOptions, setUrgencyOptions] = useState([
    { value: "1", label: "ปกติ" },
    { value: "2", label: "เร่งด่วน" },
    { value: "3", label: "เร่งด่วนมาก" },
    { value: "4", label: "เร่งด่วนที่สุด" },
  ]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const [openSearchDialog, setOpenSearchDialog] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const inputRef = useRef();

  // Read-only list of attachments already on the server for this report
  // const [existingAttachments, setExistingAttachments] = useState([]);

  // Build absolute URL from file_path and normalize Windows-style paths (same as Forward component)
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
      setSearchText(""); // reset input
      handleSearch(""); // โหลดรายการทั้งหมดทันทีที่เปิด (keyword ว่าง)
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
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectReference = (ref) => {
    handleChange({
      target: { name: "refNo", value: ref.document_number }
    });
    handleChange({
      target: { name: "complaint_id", value: ref.id }
    });
    if (ref?.complaint_number) {
      handleChange({
        target: { name: "complaint_number", value: ref.complaint_number }
      });
    }
    if (ref?.complaint_number_date) {
      handleComplaintNumberDateChange(ref.complaint_number_date);
    }
    if (ref?.document_date) {
      handleDocumentDateChange(ref.document_date);
    }
    setOpenSearchDialog(false);
  };

  const onClear = () => {
    setSearchText("");
    handleSearch("");
    inputRef.current?.focus();
  };

  // ฟังก์ชันจัดการเมื่อมีการเลือกผู้ลงนาม (ฉบับปรับปรุงตามต้นแบบที่ดีที่สุด)
  const handleSignerSelect = (userInfo) => {
    setSelectedSigner(userInfo);

    const signerId = userInfo?.id ?? userInfo?.value ?? "";
    handleChange({ target: { name: "signer", value: signerId } });

    const posId =
      userInfo?.position_id ??
      userInfo?.position?.id ??
      userInfo?.positionId ??
      "";

    handleChange({ target: { name: "position_id", value: posId } });

    setSelectedDepartment(null);
    handleChange({ target: { name: "department", value: "" } });
  };

  const handleDepartmentSelect = (department) => {
    if (department && department.target && Object.prototype.hasOwnProperty.call(department.target, "value")) {
      const v = department.target.value;
      handleChange({ target: { name: "department", value: v } });
      return;
    }

    setSelectedDepartment(department);
    const depId = department?.id ?? department?.value ?? "";
    handleChange({ target: { name: "department", value: depId } });
  };

  // ฟังก์ชันล้างข้อมูลที่อัพเดทแล้ว
  const handleClearExtended = () => {
    handleClear();
    setSelectedSigner(null);
    setSelectedDepartment(null);
  };

  // Prefill when editing existing type2 report via /[id]
  useEffect(() => {
    const editId = router?.query?.id;
    if (!editId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await GetOutgoingReport2ById(editId);
        const d = res?.res_data || res?.data || res;
        if (cancelled || !d) return;

        handleChange({ target: { name: 'complaint_number', value: d.complaint_number || d.reference_number || '' } });
        handleChange({ target: { name: 'complaint_id', value: d.complaint_id || '' } });
        handleChange({ target: { name: 'refNo', value: d.document_number || '' } });

        handleChange({ target: { name: 'subject', value: d.subject || '' } });

        handleChange({ target: { name: 'salutation', value: d.position?.id || "" } });
        const posName = (d.position?.name || '').trim();
        const specialList = ['อื่นๆ','ผู้ร้อง','ผู้ร้องเรียน'];
        const isOther = specialList.includes(posName);
        handleChange({ target: { name: 'salutation_is_other', value: isOther } });
        if (isOther) {
          if (d.position_other_text) {
            handleChange({ target: { name: 'position_other_text', value: d.position_other_text } });
          }
          // clear department in special case
          handleChange({ target: { name: 'department', value: '' } });
          setSelectedDepartment(null);
        }

        const signerObj = d.signature_authority_user || null;
        const signerId = d.signature_authority_user?.id || d.signature_authority_user_id || '';
        setSelectedSigner(signerObj);
        handleChange({ target: { name: 'signer', value: signerId } });
        const posId =
          signerObj?.position_id ||
          signerObj?.position?.id ||
          signerObj?.positionId ||
          "";
        handleChange({ target: { name: 'position_id', value: posId } });

        if (!isOther) {
          handleChange({ target: { name: 'department', value: d.department?.id || "" } });
          const deptObj = d.department
            ? {
                value: d.department.id,
                label: d.department.name,
                code: d.department.code || "",
                shortName: d.department.short_name || d.department.shortName || "",
              }
            : null;
          setSelectedDepartment(deptObj);
        }

        if (d.document_date) {
          handleDocumentDateChange(d.document_date);
        }

        if (d.complaint_number_date) {
          handleComplaintNumberDateChange(d.complaint_number_date);
        }

        if (d.confidentiality_level !== undefined && d.confidentiality_level !== null)
          handleChange({ target: { name: 'confidentiality', value: String(d.confidentiality_level) } });
        if (d.urgency_level !== undefined && d.urgency_level !== null)
          handleChange({ target: { name: 'urgency', value: String(d.urgency_level) } });

        if (d.remarks) handleChange({ target: { name: 'note', value: d.remarks } });

        const atts = Array.isArray(d.attachments) ? d.attachments : [];
        setExistingAttachments(atts);
        if (atts.length) {
          const names = atts.map(a => a.original_name || a.file_name || a.name || '').filter(Boolean).join(', ');
          if (names) handleChange({ target: { name: 'attachment', value: names } });
        }
      } catch (err) {}
    })();
    return () => { cancelled = true; };
  }, [router?.query?.id]);

  return (
    <Box
      px={{ xs: 2, sm: 3, md: 5, lg: 8 }}
      pt={{ xs: 2, sm: 3, md: 4 }}
      pb={{ xs: 2, sm: 3, md: 8 }}
    >
      <BreadcrumbsService
        items={[
          {
            label:
              "แบบรายงานแจ้งผู้ร้องเรียน / ส่วนราชการที่ส่งเรื่องมากระทรวงทราบเบื้องต้น",
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
        <Box
          sx={{
            background: "linear-gradient(to right, #1223a5, #2499ff)",
            height: 50,
            borderTopRightRadius: 12,
          }}
        />

        <Box sx={{ textAlign: "center", py: 2 }}>
          <Typography variant="h5" fontWeight="bold" color="#1120A3">
            แบบรายงานแจ้งผู้ร้องเรียน / ส่วนราชการที่ส่งเรื่องมากระทรวงทราบเบื้องต้น
          </Typography>
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
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(4,1fr)' } }}>
            <SelectFieldsalutation
              label={createLabel('เรียน/ถึง', 'salutation')}
              name='salutation'
              value={form.salutation}
              onChange={handleChange}
              onUserSelect={(opt) => {
                const label = (opt?.name || opt?.label || '').trim();
                const specialList = ['อื่นๆ','ผู้ร้อง','ผู้ร้องเรียน'];
                const isOther = specialList.includes(label);
                handleChange({ target: { name: 'salutation_is_other', value: isOther } });
                if (isOther) {
                  handleChange({ target: { name: 'department', value: '' } });
                  setSelectedDepartment(null);
                } else {
                  handleChange({ target: { name: 'position_other_text', value: '' } });
                }
              }}
              error={!!getFieldError('salutation')}
              helperText={getFieldError('salutation')}
            />
      {!(form.salutation_is_other) && (
              <SelectFieldDepartmentoutside
                label={createLabel('หน่วยงาน / ผู้ร้อง', 'department')}
                name='department'
                value={selectedDepartment}
                onChange={handleDepartmentSelect}
                onDepartmentSelect={handleDepartmentSelect}
                // remove dependency on signer selection
                error={!!getFieldError('department')}
                helperText={getFieldError('department')}
        disabled={false}
        placeholder='เลือกหน่วยงาน / ผู้ร้อง'
              />
            )}
            <InputText
              label={createLabel('เลขที่หนังสือ', 'refNo')}
              inputLabel='กรอกเลขที่หนังสือ'
              name='refNo'
              value={form.refNo}
              onChange={handleChange}
              error={!!getFieldError('refNo')}
              helperText={getFieldError('refNo')}
            />
            <DateThaiPickerService
              label={createLabel('วันที่หนังสือ', 'document_date')}
              value={form.document_date}
              onChange={handleDocumentDateChange}
              placeholder='เลือกวันที่หนังสือ'
              error={!!getFieldError('document_date')}
              helperText={getFieldError('document_date')}
            />
            {/* Second row in the same grid (span logic) */}
            {form.salutation_is_other && (
              <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                <InputText
                  label={createLabel('ระบุตำแหน่ง (อื่นๆ)', 'position_other_text')}
                  inputLabel='กรอกตำแหน่ง (อื่นๆ)'
                  name='position_other_text'
                  value={form.position_other_text || ''}
                  onChange={handleChange}
                  error={!!getFieldError('position_other_text')}
                  helperText={getFieldError('position_other_text')}
                />
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <InputText
                label={createLabel('เลข สป.กค.', 'complaint_number')}
                inputLabel='กรอกเลข สป.กค.'
                name='complaint_number'
                value={form.complaint_number || ''}
                onChange={handleChange}
                onBlur={(e) => handleChange(e)}
                onPaste={(e) => { setTimeout(() => { handleChange({ target: { name: 'complaint_number', value: e.target.value } }); }, 0); }}
                error={!!getFieldError('complaint_number')}
                helperText={getFieldError('complaint_number')}
              />
              <IconButton onClick={() => setOpenSearchDialog(true)} sx={{ ml: 1, color: 'blue', mt: '10px' }}>
                <SearchIcon />
              </IconButton>
            </Box>
            <DateThaiPickerService
              label={createLabel('วันที่ สป.กค.', 'complaint_number_date')}
              value={form.complaint_number_date}
              onChange={handleComplaintNumberDateChange}
              placeholder='เลือกวันที่ สป.กค.'
              error={!!getFieldError('complaint_number_date')}
              helperText={getFieldError('complaint_number_date')}
            />
          </Box>

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

          <Box>
            <SelectFieldSignatureAuthority
              label={createLabel("ผู้ลงนาม", "signer")}
              name="signer"
              value={form.signer}
              onChange={handleChange}
              onUserSelect={handleSignerSelect}
              error={!!getFieldError("signer")}
              helperText={getFieldError("signer")}
              required={true}
              placeholder="เลือกผู้ลงนาม"
              showUserInfo={false}
            />
          </Box>

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
              // ! ไม่ส่ง displayEmpty, renderValue ที่ไม่ใช่ prop ของ SelectField
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
              // ! ไม่ส่ง displayEmpty, renderValue ที่ไม่ใช่ prop ของ SelectField
            />
          </Box>

          <Box sx={{ position: "relative" }}>
            <InputFile
              key={fileInputKey}
              label={createLabel("เอกสารประกอบการร้องเรียน", "attachment")}
              name="attachment"
              onChange={handleFileUpload}
              error={!!getFieldError("attachment")}
              helperText={getFieldError("attachment") || "หมายเหตุ : แนบหลักฐาน เช่น สัญญา รูปภาพ หรือ หมายศาล รองรับไฟล์ .pdf .doc .docx .jpg .jpeg .png และไม่เกิน 10 MB"}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              maxFiles={3}
              maxSizeMB={10}
              multiple={true}
              existingFiles={existingAttachments}
              getFileUrl={(att) => buildFileUrl(att.file_path)}
              onDeleteExisting={handleDeleteExistingAttachment}
            />
          </Box>

          <Box>
            <InputText
              label="หมายเหตุ"
              inputLabel="กรอกหมายเหตุ"
              name="note"
              value={form.note}
              onChange={handleChange}
              multiline
              rows={4}
              helperText="ระบุข้อมูลเพิ่มเติมที่ต้องการแจ้ง"
            />
          </Box>
        </Box>

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
              label={isLoading ? "กำลังบันทึก..." : "บันทึก"}
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

export default InitialNotificationComplainantAgency;