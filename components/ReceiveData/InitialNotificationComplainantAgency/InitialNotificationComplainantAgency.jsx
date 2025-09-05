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
import SelectFieldDepartment from "@services/SelectFieldDepartment/SelectFieldDepartment";
import { GetOutgoingReportOptions } from "@pages/api/allselect/allselect";
import { GetOutgoingReport2ById } from "@pages/api/outgoinreports/outgoinreports";
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

const InitialNotificationComplainantAgency = () => {
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
  } = useInitialNotificationComplainantAgency();
  const router = useRouter();

  const pickId = (o) => o?.id ?? o?.value ?? o;
  const pickPositionId = (u) =>
    u?.position_id ?? u?.position?.id ?? u?.positionId ?? null;

  // State สำหรับ dynamic data
  const [selectedSigner, setSelectedSigner] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [confidentialityOptions, setConfidentialityOptions] = useState([]);
  const [urgencyOptions, setUrgencyOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [openSearchDialog, setOpenSearchDialog] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const inputRef = useRef();

    // --- เปลี่ยน useEffect เปิด Dialog ให้ยิง API ---
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
  
        console.log("API response", response);
  
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
      setOpenSearchDialog(false);
    };
  
    const onClear = () => {
      setSearchText("");
      handleSearch("");
      inputRef.current?.focus();
    };
  
  useEffect(() => {
    if (openSearchDialog) {
      setSearchText("");
      handleSearch("");
      inputRef.current?.focus();
    }
  }, [openSearchDialog]);

  // ฟังก์ชันจัดการเมื่อมีการเลือกผู้ลงนาม
  const handleSignerSelect = (userInfo) => {

    handleChange({ target: { name: "signer", value: pickId(userInfo) } });

  // ใส่ position_id (ไม่มี UI) ลง form
    handleChange({ target: { name: "position_id", value: pickPositionId(userInfo) } });

    setSelectedSigner(userInfo);
     // เซ็ต signer id (เผื่อคอมโพเนนต์ไม่ได้ยิง onChange ให้)
    if (userInfo?.id) {   
      handleChange({ target: { name: "signer", value: userInfo.id } });
    }
    // ดึง position_id จาก userInfo (ลองหลายคีย์ไว้ให้)
    const posId =
      userInfo?.position_id ||
      userInfo?.position?.id ||
      userInfo?.positionId ||
      "";
    handleChange({ target: { name: "position_id", value: posId } });

    setSelectedDepartment(null);
    handleChange({ target: { name: "department", value: "" } });
  }

  const handleDepartmentSelect = (department) => {
    setSelectedDepartment(department);
    if (department?.id) {
      handleChange({ target: { name: "department", value: department.id } });
    }
  };

  // ฟังก์ชันดึงข้อมูล options
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

  // โหลดข้อมูล options เมื่อ component mount
  useEffect(() => {
    fetchOptions();
  }, []);

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

        // Core ids / numbers
        handleChange({ target: { name: 'complaint_number', value: d.complaint_number || d.reference_number || '' } });
        handleChange({ target: { name: 'complaint_id', value: d.complaint_id || '' } });
        handleChange({ target: { name: 'refNo', value: d.document_number || '' } });

        // Subject & salutation
        handleChange({ target: { name: 'subject', value: d.subject || '' } });
        if (d.salutation) handleChange({ target: { name: 'salutation', value: d.salutation } });

        // Date (priority: complaint_number_date > document_date > created_at)
        const dateSrc = d.complaint_number_date || d.document_date || d.created_at;
        if (dateSrc) {
          const dt = new Date(dateSrc);
          if (!isNaN(dt.getTime())) handleDateChange(dt);
        }

        // Confidentiality / Urgency
        if (d.confidentiality_level !== undefined && d.confidentiality_level !== null)
          handleChange({ target: { name: 'confidentiality', value: d.confidentiality_level } });
        if (d.urgency_level !== undefined && d.urgency_level !== null)
          handleChange({ target: { name: 'urgency', value: d.urgency_level } });

        // Signer and Department
        handleChange({ target: { name: 'signer', value: d.signature_authority_user?.id || d.signature_authority_user_id || '' } });
        handleChange({ target: { name: 'department', value: d.department?.id || d.department_id || '' } });

        // Remarks -> note
        if (d.remarks) handleChange({ target: { name: 'note', value: d.remarks } });

        // Show existing attachments as names (user still re-uploads if needed)
        const atts = Array.isArray(d.attachments) ? d.attachments : [];
        if (atts.length) {
          const names = atts.map(a => a.original_name || a.file_name || a.name || '').filter(Boolean).join(', ');
          if (names) handleChange({ target: { name: 'attachment', value: names } });
        }
      } catch (err) {
        console.error('Failed to prefill type2 report by id', err);
      }
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
         {/* Row 1: เรียน | เลขที่หนังสือ | วันที่ */}
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "4fr 4fr 4fr",
              },
              width: "100%",
            }}
          >
            <SelectFieldsalutation
              label={createLabel("เรียน/ถึง", "salutation")}
              name="salutation"
              value={form.salutation}
              onChange={handleChange}
              error={!!getFieldError("salutation")}
              helperText={getFieldError("salutation")}
            />
            {/* เลขที่หนังสือ */}
            <InputText
              label={createLabel("เลขที่หนังสือ", "refNo")}
              inputLabel="กรอกเลขที่หนังสือ"
              name="refNo"
              value={form.refNo}
              onChange={handleChange}
              error={!!getFieldError("refNo")}
              helperText={getFieldError("refNo")}
              sx={{ flex: 1 }}
            />
            {/* วันที่ (ใช้ร่วมทั้งเอกสารและเลข สป.กค.) */}
            <DateThaiPickerService
              label={createLabel("วันที่", "date")}
              value={form.date}
              onChange={handleDateChange}
              placeholder="เลือกวันที่"
              error={!!getFieldError("date")}
              helperText={getFieldError("date")}
            />
          </Box>

          {/* Row 1.1: เลข สป.กค. | วันที่ (จัดแนวยาว 2 ช่อง) */}
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "8fr 4fr",
              },
              width: "100%",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <InputText
                label={createLabel("เลข สป.กค.", "complaint_number")}
                inputLabel="กรอกเลข สป.กค."
                name="complaint_number"
                value={form.complaint_number || ""}
                onChange={handleChange}
                onBlur={(e) => handleChange(e)}
                onPaste={(e) => { setTimeout(() => { handleChange({ target: { name: 'complaint_number', value: e.target.value } }); }, 0); }}
                error={!!getFieldError("complaint_number")}
                helperText={getFieldError("complaint_number")}
              />
              <IconButton
                onClick={() => setOpenSearchDialog(true)}
                sx={{ ml: 1, color: "blue", marginTop: "10px" }}
              >
                <SearchIcon />
              </IconButton>
            </Box>
            <DateThaiPickerService
              label={createLabel("วันที่", "date")}
              value={form.date}
              onChange={handleDateChange}
              placeholder="เลือกวันที่"
              error={!!getFieldError("date")}
              helperText={getFieldError("date")}
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

          {/* Row 2: เรื่อง* */}
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
         

          {/* Row 4: หน่วยงาน / ผู้ร้อง* (เปิดใช้งานให้เลือกได้เพื่อไม่ให้ validation ค้าง) */}
          <Box>
            <SelectFieldDepartment
              label={createLabel("หน่วยงาน / ผู้ร้อง", "department")}
              name="department"
              value={form.department}
              onChange={handleChange}
              filterBySignerId={pickId(selectedSigner)}
              onDepartmentSelect={handleDepartmentSelect}
              error={!!getFieldError("department")}
              helperText={getFieldError("department")}
              disabled={!selectedSigner}
              placeholder={selectedSigner ? "เลือกหน่วยงาน" : "เลือกผู้ลงนามก่อน"}
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

          {/* Row 6: เอกสารแนบ* */}
          <Box sx={{ position: "relative" }}>
            <InputFile
              label={createLabel("เอกสารประกอบการร้องเรียน", "attachment")}
              name="attachment"
              onChange={handleFileUpload}
              error={!!getFieldError("attachment")}
              helperText={getFieldError("attachment") || "หมายเหตุ : แนบหลักฐาน เช่น สัญญา รูปภาพ หรือ หมายศาล รองรับไฟล์ .pdf .doc .docx .jpg .jpeg .png และไม่เกิน 10 MB"}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              maxFiles={3}
              maxSizeMB={10}
              multiple
            />
          </Box>

          {/* Row 7: หมายเหตุ */}
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
              label={isLoading ? "กำลังบันทึก..." : "บันทึก"}
              variant="contained"
              iconRight={<CheckOutlinedIcon />}
              onClick={handleSave}
              disabled={isLoading || !isFormValid() || optionsLoading}
              sx={{
                backgroundColor: isFormValid() && !isLoading && !optionsLoading ? "#2196F3" : "#cccccc",
                color: "#FFF",
                width: "100%",
                height: "55px",
                fontSize: "20px",
                fontWeight: "600",
                "&:hover": {
                  backgroundColor: isFormValid() && !isLoading && !optionsLoading ? "#1976D2" : "#cccccc",
                  transform: isFormValid() && !isLoading && !optionsLoading ? "translateY(-1px)" : "none",
                  boxShadow: isFormValid() && !isLoading && !optionsLoading ? "0 6px 16px rgba(33, 150, 243, 0.4)" : "none",
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