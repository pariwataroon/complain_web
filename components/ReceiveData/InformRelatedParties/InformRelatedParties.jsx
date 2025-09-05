import React, { useState, useEffect, useRef, useCallback } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import SelectField from "@services/SelectField/SelectField";
import InputText from "@services/InputText/InputText";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import ButtonService from "@services/ButtonService/ButtonService";
import InputFile from "@services/InputFile/InputFile";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseIcon from "@mui/icons-material/Close";
import useInformRelatedParties from "@hooks/admin/InformRelatedParties/useInformRelatedParties";
import SelectFieldSignatureAuthority from "@services/SelectFieldSignatureAuthority/SelectFieldSignatureAuthority";
import SelectFieldDepartment from "@services/SelectFieldDepartment/SelectFieldDepartment";
import { GetOutgoingReportOptions } from "@pages/api/allselect/allselect";
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
  } = useInformRelatedParties();

  // State สำหรับ dynamic data
  const [selectedSigner, setSelectedSigner] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [confidentialityOptions, setConfidentialityOptions] = useState([]);
  const [urgencyOptions, setUrgencyOptions] = useState([]);
  const [proposeForOptions, setProposeForOptions] = useState([]);
  const [decisionOptions, setDecisionOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [openSearchDialog, setOpenSearchDialog] = useState(false);
  const [openSearchDialog2, setOpenSearchDialog2] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const inputRef = useRef();

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
    console.log("👤 handleSignerSelect:", userInfo);
    setSelectedSigner(userInfo);
    // ล้างหน่วยงานที่เลือกไว้เมื่อเปลี่ยนผู้ลงนาม
    setSelectedDepartment(null);
    // อัพเดทค่าใน form
    handleChange("department", "");
  };

  const handleDepartmentSelect = (department) => {
    console.log("🏢 handleDepartmentSelect:", department);
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
  };

  // Custom date change handlers for different date fields
  const handleMainDateChange = (thaiDate) => {
    handleDateChange(thaiDate, 'date');
  };

  const handleDate2Change = (thaiDate) => {
    handleDateChange(thaiDate, 'date2');
  };
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
            แบบรายงานแจ้งผลการให้ผู้เกี่ยวข้องทราบ
          </Typography>
        </Box>
                {/* --- NEW: Tab Switch for Department / Complainant --- */}
                <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
                  <Box sx={{ display: "flex", ml: 3 }}>
                    <Button
                      disableRipple
                      variant="text"
                      color="inherit"
                      sx={{
                        borderRadius: 0,
                        fontWeight: 600,
                        px: 3,
                        py: 1.2,
                        fontSize: "1.06rem",
                        minWidth: 0,
                        bgcolor: "transparent",
                        color: tabSelected === "department" ? "#1120A3" : "#666",
                        borderBottom: tabSelected === "department" ? "2.5px solid #1120A3" : "2.5px solid transparent",
                        boxShadow: "none",
                        transition: "color 0.15s, border-bottom 0.15s",
                        "&:hover": {
                          bgcolor: "transparent",
                          color: "#1120A3",
                        },
                      }}
                      onClick={() => setTabSelected("department")}
                    >
                      หน่วยงาน
                    </Button>
                    <Button
                      disableRipple
                      variant="text"
                      color="inherit"
                      sx={{
                        borderRadius: 0,
                        fontWeight: 600,
                        px: 3,
                        py: 1.2,
                        fontSize: "1.06rem",
                        minWidth: 0,
                        bgcolor: "transparent",
                        color: tabSelected === "complainant" ? "#1120A3" : "#666",
                        borderBottom: tabSelected === "complainant" ? "2.5px solid #1120A3" : "2.5px solid transparent",
                        boxShadow: "none",
                        transition: "color 0.15s, border-bottom 0.15s",
                        "&:hover": {
                          bgcolor: "transparent",
                          color: "#1120A3",
                        },
                      }}
                      onClick={() => setTabSelected("complainant")}
                    >
                      ผู้ร้อง
                    </Button>
                  </Box>
                </Box>
                {/* --- END TAB SWITCH --- */}
        <Box
          component="form"
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            p: { xs: 2, sm: 3, md: 5 },
          }}
        >
          {/* row 1: เลขที่ สป.กค. | วันที่ */}
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
                label={createLabel("เลข สป.กค.", "refNo")}
                inputLabel="กรอกเลข สป.กค."
                name="refNo"
                value={form.refNo}
                onChange={handleChange}
                error={!!getFieldError("refNo")}
                helperText={getFieldError("refNo")}
              />
            </Box>

            <Box sx={{ 
              alignSelf: { xs: "flex-start", sm: "flex-end" }, 
              display: "flex", 
              alignItems: "flex-end",
              mt: { xs: 0, sm: 0 }
            }}>
              <IconButton
                onClick={() => setOpenSearchDialog2(true)}
                sx={{
                  height: "40px",
                  width: "40px",
                  color: "blue",
                  marginBottom: '18px'
                }}
              >
                <SearchIcon />
              </IconButton>
            </Box>

            <Box sx={{ flex: 1 }}>
              <DateThaiPickerService
                label={createLabel("วันที่", "date")}
                value={form.date}
                onChange={handleMainDateChange}
                placeholder="เลือกวันที่"
                error={!!getFieldError("date")}
                helperText={getFieldError("date")}
              />
            </Box>
          </Box>

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

          {/* row 3: ผู้ลงนาม | หน่วยงาน/ผู้ร้อง */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
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

        {tabSelected === "department" ? (
          <SelectFieldDepartment
            label={createLabel("หน่วยงาน", "department")}
            name="department"
            value={selectedDepartment}
            onChange={handleDepartmentSelect}
            onDepartmentSelect={handleDepartmentSelect}
            filterBySignerId={selectedSigner?.id ?? selectedSigner?.value}
            error={!!getFieldError("department")}
            helperText={getFieldError("department")}
            disabled={!selectedSigner}
            placeholder={selectedSigner ? "เลือกหน่วยงาน" : "เลือกผู้ลงนามก่อน"}
          />
        ) : (
          <SelectFieldDepartment
            label={createLabel("ผู้ร้อง", "department")}
            name="department"
            value={selectedDepartment}
            onChange={handleDepartmentSelect}
            onDepartmentSelect={handleDepartmentSelect}
            filterBySignerId={selectedSigner?.id ?? selectedSigner?.value}
            error={!!getFieldError("department")}
            helperText={getFieldError("department")}
            disabled={!selectedSigner}
            placeholder={selectedSigner ? "เลือกผู้ร้อง" : "เลือกผู้ลงนามก่อน"}
          />
        )}
      </Box>
          {/* row 4: ชั้นความลับ | ชั้นความเร่งด่วน */}
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

          {/* row 5: เสนอเพื่อ | ผลการพิจารณา */}
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

          {/* row 6: เอกสารแนบ - เปลี่ยนเป็น InputFile */}
          <Box sx={{ position: "relative" }}>
            <InputFile
              label={createLabel("เอกสารแนบ", "attachment")}
              name="attachment"
              onChange={handleFileUpload}
              error={!!getFieldError("attachment")}
              helperText={getFieldError("attachment") || "หมายเหตุ : แนบหลักฐาน เช่น สัญญา รูปภาพ หรือ หมายศาล รองรับไฟล์ .pdf .doc .docx .jpg .jpeg .png และไม่เกิน 10 MB"}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              maxFiles={3}
              maxSizeMB={10}
            />
          </Box>

          {/* row 7: รายละเอียด */}
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

export default InformRelatedParties;