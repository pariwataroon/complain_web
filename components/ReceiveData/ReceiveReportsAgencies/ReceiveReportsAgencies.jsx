import React, { useState, useMemo, useCallback, useRef, useEffect} from "react";
import { useRouter } from "next/router";
import { useForm, Controller } from "react-hook-form";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import SelectField from "@services/SelectField/SelectField";
import InputFile from "@services/InputFile/InputFile";
import SelectFieldSignatureAuthority from "@services/SelectFieldSignatureAuthority/SelectFieldSignatureAuthority";
import SelectFieldsalutation from "@services/SelectFieldsalutation/SelectFieldsalutation";
import SelectFieldDepartment from "@services/SelectFieldDepartment/SelectFieldDepartment";
import InputText from "@services/InputText/InputText";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import ButtonService from "@services/ButtonService/ButtonService";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { alertWarning, alertSuccess } from "@utils/Alerts";
import { GetComplaintsWithSearch } from "@pages/api/complaint/complaint";
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
import { CreateOutgoingReport5, getDepartmentsPrefix } from "@pages/api/outgoinreports/outgoinreports";
import { GetEnhancedComplaints } from "@pages/complaint/index"
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

const ReceiveReportsAgencies = () => {
  const { id } = useRouter().query;

  const [openSearchDialog, setOpenSearchDialog] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const inputRef = useRef();
  const [departments, setDepartments] = useState([]);

  const { control, setValue, formState: { errors } } = useForm({
    defaultValues: {
      attachment: null,
      documentNo: "",
    },
  });

useEffect(() => {
  const fetchDepartments = async () => {
    try {
      const res = await getDepartmentsPrefix();
      console.log("📌 getDepartmentsPrefix res:", res); // 👈 ดูว่ากลับมาแบบไหน
      const data = res?.res_data || res; // เผื่อว่า API ส่ง array ตรงๆ

      if (Array.isArray(data)) {
        const mapped = data.map((dep) => ({
          value: dep.id,    // ✅ UUID
          label: dep.name,  // ✅ ชื่อ
        }));
        setDepartments(mapped);
      } else {
        setDepartments([]);
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
      setDepartments([]);
    }
  };
  fetchDepartments();
}, []);



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
      const response = await GetComplaintsWithSearch({
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
    const num = ref?.complaint_number || "";
    setForm((prev) => ({ ...prev, documentNo: num }));
    setValue("documentNo", num, { shouldValidate: false, shouldDirty: true });
    setOpenSearchDialog(false);
  };

  const onClear = () => {
    setSearchText("");
    handleSearch("");
    inputRef.current?.focus();
  };

  const handleFileUpload = (files) => {
    handleFileChange(files);
  };

  // Initial form state
  const initialFormState = useMemo(
    () => ({
      referenceNo: "",
      date: null,
      processStep: "",
      confidentiality: "",
      urgency: "",
      departmentId: "",
      agency: "",
      investigateGk: "",
      investigateDate: null,
      documentNo: "",
      documentDate: null,
      receiveWorkDate: null,
      submitWorkDate: null,
      origin: "",
      subject: "",
      attachment: "",
      remarks: "",
    }),
    []
  );

  const [form, setForm] = useState(initialFormState);

  // Validation function
  const validateForm = useCallback(() => {
    const missingFields = [];
    if (!form.referenceNo.trim()) missingFields.push("เลขที่อ้างอิง(เลข สรร.สารบัญ)");
    if (!form.date) missingFields.push("วันที่");
    if (!form.processStep) missingFields.push("ขั้นตอนการดำเนินการ");
    if (!form.confidentiality) missingFields.push("ชั้นความลับ");
    if (!form.urgency) missingFields.push("ชั้นความเร่งด่วน");
    if (!form.departmentId) missingFields.push("หน่วยงาน");
    if (!form.investigateGk.trim()) missingFields.push("เลขสป.กค.");
    if (!form.investigateDate) missingFields.push("วันที่ (เลขสป.กค.)");
    if (!form.documentNo.trim()) missingFields.push("เลขที่หนังสือ");
    if (!form.documentDate) missingFields.push("วันที่ (เลขที่หนังสือ)");
    if (!form.receiveWorkDate) missingFields.push("วันที่รับงานของเจ้าหน้าที่");
    if (!form.submitWorkDate) missingFields.push("วันที่เสนองาน ผอ.สรร.");
    if (!form.origin.trim()) missingFields.push("ต้นเรื่อง");
    if (!form.subject.trim()) missingFields.push("เรื่อง");
    if (!form.attachment.trim()) missingFields.push("เอกสารแนบ");

    if (missingFields.length > 0) {
      const message = `กรุณากรอกข้อมูลให้ครบถ้วน:\n${missingFields.map((f) => `• ${f}`).join("\n")}`;
      alertWarning("ข้อมูลไม่ครบถ้วน", message);
    }
    return missingFields.length === 0;
  }, [form]);

  // Memoized handlers
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  // ✅ เพิ่ม handleDateChange ที่หายไป
  const handleDateChange = useCallback(
    (fieldName) => (thaiDate) => {
      setForm((prev) => ({ ...prev, [fieldName]: thaiDate }));
    },
    []
  );

  const handleClear = useCallback(() => {
    setForm(initialFormState);
  }, [initialFormState]);

  const handleSave = useCallback(async () => {
  if (validateForm()) {
    try {
      const payload = {
  receive_number: form.referenceNo,
  receive_date: form.date,
  agency_reference_number: form.investigateGk,
  agency_reference_date: form.investigateDate,
  internal_register_number: form.documentNo,
  internal_register_date: form.documentDate,
  present_to_director_date: form.submitWorkDate,
  complaint_number: form.documentNo,
  complaint_number_date: form.date,
  subject: form.subject,
  document_number: form.documentNo,
  document_date: form.documentDate,
  signature_authority_user_id: form.signatureAuthorityId,
  department_id: form.departmentId,
  user_id: form.userId,
  confidentiality_level: form.confidentiality,
  urgency_level: form.urgency,
  complaint_id: id,
  remarks: form.remarks,
};



      const res = await CreateOutgoingReport5(payload);
      console.log("CreateOutgoingReport5 success:", res);
      alertSuccess("สำเร็จ", "บันทึกข้อมูลเรียบร้อยแล้ว");
    } catch (error) {
      console.error("❌ handleSave error:", error?.response?.data || error);
      alertWarning("ผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้");
    }
  }
}, [form, id, validateForm]);

  const handleFileChange = useCallback((payload) => {
    let files = [];
    if (payload?.target?.files) files = Array.from(payload.target.files);
    else if (Array.isArray(payload)) files = payload;
    else if (payload && typeof payload === "object" && "length" in payload) files = Array.from(payload);
    else if (payload?.file) files = [payload.file];
    const names = files.map((f) => f?.name).filter(Boolean).join(", ");
    setForm((prev) => ({ ...prev, attachment: names || "" }));
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
    width: "100%", // ใช้ความกว้างเต็มหน้าจอ
    maxWidth: { xs: "100%", sm: "auto" }, // ความกว้าง 100% สำหรับหน้าจอขนาดเล็ก และ auto สำหรับขนาดใหญ่
    overflow: "hidden", // ป้องกันไม่ให้กล่องล้นขอบ
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
            <InputText
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
              sx={{ width: {xs: "80%", sm: "auto"}}}
            />
            <Box sx={{ position: "relative", zIndex: 1, width: {xs: "80%", sm: "auto"}}}>
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
            </Box>
            <Box sx={{ position: "relative", zIndex: 1, width: {xs: "80%", sm: "auto"}}}>
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
              onChange={handleChange}
              options={PROCESS_STEP_OPTIONS}
              // sx={{ width: {xs: "80%", sm: "auto"}}}
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
              onChange={handleChange}
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
              onChange={handleChange}
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
              name="departmentId" // ✅ เก็บ UUID ของหน่วยงาน
              value={form.departmentId}
              onChange={handleChange}
              options={departments} // ✅ ใช้ options จาก API
            />
          </Box>
          {/* แถวที่ 4: เลขสป.กค. | วันที่ */}
          <Box
            sx={{
              display: "grid",
              columnGap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            }}
          >
            <InputText
              label={
                <span>
                  เลขสป.กค.
                  <span style={{ color: "red", marginLeft: 4 }}>*</span>
                </span>
              }
              inputLabel="กรอกเลขสป.กค."
              name="investigateGk"
              value={form.investigateGk}
              onChange={handleChange}
              sx={{ width: {xs: "80%", sm: "auto"}}}
            />
            <Box sx={{ position: "relative", zIndex: 1, width: {xs: "80%", sm: "auto"}}}>
              <DateThaiPickerService
                label={
                  <span>
                    วันที่
                    <span style={{ color: "red", marginLeft: 4 }}>*</span>
                  </span>
                }
                value={form.investigateDate}
                onChange={handleDateChange("investigateDate")}
                sx={{ width: {xs: "80%", sm: "auto"}}}
                placeholder="เลือกวันที่"
              />
            </Box>
          </Box>

          {/* แถวที่ 5: เลขที่หนังสือ | วันที่ */}
         <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, // เหมือนแถวอื่น
              alignItems: "center",
            }}
          >
            {/* ซ้าย: เลขที่หนังสือ + ปุ่มค้นหา (อยู่นอก input และข้างๆ) */}
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
                <IconButton
                  onClick={() => setOpenSearchDialog(true)}
                  onMouseDown={(e) => e.preventDefault()}
                  aria-label="ค้นหาเลขที่อ้างอิง"
                  title="ค้นหาเลขที่อ้างอิง"
                  sx={{
                    width: 40,
                    height: 40,
                    color: "blue",
                  }}
                >
                  <SearchIcon />
                </IconButton>
              </Box>
            </Box>

            {/* ขวา: วันที่ */}
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
            }}>
            <DialogTitle
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
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
                <div style={{ textAlign: "center", padding: 24 }}>
                  <CircularProgress color="primary" />
                  <div style={{ marginTop: 8, color: "#888" }}>กำลังค้นหา...</div>
                </div>
              ) : searchResults.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#bdbdbd" }}>
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
                      const isMaster = !!item.is_master; // fallback ถ้า undefined
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
                              {item.complaint_type} - {item.complaint_number}
                            </span>
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>

                  {/* Legend (ถ้าไม่ต้องการสามารถลบได้) */}
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
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
            <Box sx={{ position: "relative", zIndex: 1, width: {xs: "80%", sm: "auto"}}}>
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
            <Box sx={{ position: "relative", zIndex: 1, width: {xs: "80%", sm: "auto"}}}>
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
          <Box>
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
          </Box>

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
          <Controller
            name="attachment"
            control={control}
            render={({ field }) => (
              <InputFile
                label="เอกสารประกอบการร้องเรียน"
                name={field.name}
                onChange={(files) => {
                  field.onChange(files);
                  handleFileChange(files);
                }}
                error={Boolean(errors?.attachment)}
                helperText={
                  errors?.attachment?.message ||
                  "หมายเหตุ : แนบหลักฐาน เช่น สัญญา รูปภาพ หรือ หมายศาล รองรับไฟล์ .pdf .doc .docx .jpg .jpeg .png และไม่เกิน 10 MB"
                }
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                maxFiles={3}
                maxSizeMB={10}
              />
            )}
          />

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
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ReceiveReportsAgencies;
