import { useEffect, useState, useRef, useCallback } from "react";
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
    handleDateChange,
    handleFileUpload,
    handleClear,
    handleSave,
    isFormValid,
    updateField,
  } = useRequestResultProgress();

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
    updateField("refNoDisplay", ref.document_number || "");  
    updateField("refNo",        ref.complaint_number || ""); 
    setOpenSearchDialog(false);
  };

  const onClear = () => {
    setSearchText("");
    handleSearch("");
    inputRef.current?.focus();
  };

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
      setValue("refNo1", ref.reference_number, { shouldValidate: true, shouldDirty: true });
      setOpenSearchDialog2(false);
    };
  
    const onClear2 = () => {
      setSearchText("");
      handleSearch2("");
      inputRef.current?.focus();
    };

useEffect(() => {
  if (openSearchDialog) {
    setSearchText("");
    handleSearch("");
    inputRef.current?.focus();
  }
}, [openSearchDialog]);

  const normalizeOptions = (labelsInOrder) =>
  labelsInOrder.map((label, idx) => ({
    value: idx + 1,
    label,
  }));


  const handleSignerSelect = (userInfo) => {
    setSelectedSigner(userInfo);
    handleChange({ target: { name: "signer", value: userInfo?.id ?? userInfo?.value ?? "" } });
    updateField("signer_meta", userInfo);

    const signerPosId =
      userInfo?.position_id ??
      userInfo?.position?.id ??
      userInfo?.positionId ??
      null;
    updateField("position_id", signerPosId || "");
    setSelectedDepartment(null);
    handleChange({ target: { name: "department", value: "" } });
    updateField("department_meta", null);
  };

  const handleDepartmentSelect = (department) => {
    setSelectedDepartment(department);
    if (department) {
      handleChange({ target: { name: "department", value: department?.id ?? department?.value ?? "" } });
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
          }}
        >
           {/* Row 1: เรียน | เลขที่หนังสือ* (with search) | วันที่* */}
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
            <SelectFieldsalutation
              label={createLabel("เรียน", "salutation")}
              name="salutation"
              value={form.salutation}
              onChange={handleChange}
              error={!!getFieldError("salutation")}
              helperText={getFieldError("salutation")}
            />

            {/* เลขที่หนังสือ + icon */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <InputText
                label={createLabel("เลขที่หนังสือ", "refNo")}
                inputLabel="กรอกเลขที่หนังสือ"
                name="refNoDisplay"       
                value={form.refNoDisplay}
                onChange={(e)=>updateField("refNoDisplay", e.target.value)} 
                // onChange={handleChange}
                error={!!getFieldError("refNo")}
                helperText={getFieldError("refNo")}
                sx={{ flex: 1 }}
              />
            </Box>

            {/* วันที่ */}
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
                                {item.document_number}
                                {/* {item.} */}
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
                label={createLabel("สป กค.", "refNo1")}
                inputLabel="สป กค"
                name="refNoDisplay"       
                value={form.refNoDisplay}
                onChange={(e)=>updateField("refNoDisplay", e.target.value)} 
                // onChange={handleChange}
                error={!!getFieldError("refNo1")}
                helperText={getFieldError("refNo1")}
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
                                {/* {item.} */}
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

          {/* Row 4: หน่วยงาน / ผู้ร้อง* */}
          <Box>
            <SelectFieldDepartment
              label={createLabel("หน่วยงาน / ผู้ร้อง", "department")}
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

          {/* Row 6: เอกสารแนบ* - เปลี่ยนเป็น InputFile */}
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
              label={isLoading ? "กำลังบันทึก..." : "บันทึก"}
              variant="contained"
              iconRight={<CheckOutlinedIcon />}
              onClick={() => handleSave()}
              disabled={isLoading || optionsLoading}
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

export default RequestResultProgress;