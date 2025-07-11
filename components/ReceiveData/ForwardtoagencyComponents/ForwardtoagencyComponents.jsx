import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Controller } from "react-hook-form";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import SelectField from "@services/SelectField/SelectField";
import InputText from "@services/InputText/InputText";
import ButtonService from "@services/ButtonService/ButtonService";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import { Box, Typography, TextField } from "@mui/material";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseIcon from "@mui/icons-material/Close";
import InputFile from "@services/InputFile/InputFile";
import { useForwardToAgencyForm } from "@hooks/admin/forwardtoagency/useForwardToAgencyForm";
import SelectFieldSignatureAuthority from "@services/SelectFieldSignatureAuthority/SelectFieldSignatureAuthority";
import SelectFieldsalutation from "@services/SelectFieldsalutation/SelectFieldsalutation";
import SelectFieldDepartment from "@services/SelectFieldDepartment/SelectFieldDepartment";
import { GetOutgoingReportOptions } from "@pages/api/allselect/allselect";

const ForwardtoagencyComponents = () => {
  const router = useRouter();
  const { id } = router.query;

  const [selectedSigner, setSelectedSigner] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [confidentialityOptions, setConfidentialityOptions] = useState([]);
  const [urgencyOptions, setUrgencyOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const onSubmit = async (data) => {
    const result = await handleSave(data);
    if (result?.success) {
      // Reset component-specific state
      setSelectedSigner(null);
      setSelectedDepartment(null);
    }
  };
  useEffect(() => {
    if (isSubmitted) {
      setSelectedSigner(null);
      setSelectedDepartment(null);
      setIsSubmitted(false);
    }
  }, [isSubmitted]);
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
      console.error("❌ fetchOptions error:", error);

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
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "6fr 3fr 3fr",
              },
            }}
          >
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
                />
              )}
            />

            <Controller
              name="refNo"
              control={control}
              render={({ field }) => (
                <InputText
                  label={createLabel("เลข สป.กค.", "refNo")}
                  inputLabel="กรอกเลข สป.กค."
                  name="refNo"
                  value={field.value}
                  onChange={field.onChange}
                  error={!!getFieldError("refNo")}
                  helperText={getFieldError("refNo")}
                />
              )}
            />

            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Controller
                name="date1"
                control={control}
                render={({ field }) => (
                  <DateThaiPickerService
                    label={createLabel("วันที่", "date1")}
                    value={field.value}
                    onChange={handleDateChange("date1")}
                    placeholder="เลือกวันที่"
                    error={!!getFieldError("date1")}
                    helperText={getFieldError("date1")}
                    maxDate={new Date().toISOString()}
                  />
                )}
              />
            </Box>
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
            <Controller
              name="bookNo"
              control={control}
              render={({ field }) => (
                <InputText
                  label={createLabel("เลขที่หนังสือ", "bookNo")}
                  inputLabel="กรอกเลขที่หนังสือ"
                  name="bookNo"
                  value={field.value}
                  onChange={field.onChange}
                  error={!!getFieldError("bookNo")}
                  helperText={getFieldError("bookNo")}
                />
              )}
            />

            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Controller
                name="date2"
                control={control}
                render={({ field }) => (
                  <DateThaiPickerService
                    label={createLabel("วันที่", "date2")}
                    value={field.value}
                    onChange={handleDateChange("date2")}
                    placeholder="เลือกวันที่"
                    error={!!getFieldError("date2")}
                    helperText={getFieldError("date2")}
                    maxDate={new Date().toISOString()}
                  />
                )}
              />
            </Box>

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
