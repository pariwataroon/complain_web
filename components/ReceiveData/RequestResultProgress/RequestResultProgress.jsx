import React, { useState, useEffect } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import SelectField from "@services/SelectField/SelectField";
import InputText from "@services/InputText/InputText";
import ButtonService from "@services/ButtonService/ButtonService";
import InputFile from "@services/InputFile/InputFile";
import { Box, Typography } from "@mui/material";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import useRequestResultProgress from "@hooks/admin/useRequestResultProgress/useRequestResultProgress";
import SelectFieldsalutation from "@services/SelectFieldsalutation/SelectFieldsalutation";
import SelectFieldSignatureAuthority from "@services/SelectFieldSignatureAuthority/SelectFieldSignatureAuthority";
import SelectFieldDepartment from "@services/SelectFieldDepartment/SelectFieldDepartment";
import { GetOutgoingReportOptions } from "@pages/api/allselect/allselect";

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
  } = useRequestResultProgress();

  const [selectedSigner, setSelectedSigner] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [confidentialityOptions, setConfidentialityOptions] = useState([]);
  const [urgencyOptions, setUrgencyOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const handleSignerSelect = (userInfo) => {
    setSelectedSigner(userInfo);
    setSelectedDepartment(null);
    handleChange({ target: { name: "department", value: "" } });
  };

  const handleDepartmentSelect = (department) => {
    setSelectedDepartment(department);
  };

  const fetchOptions = async () => {
    try {
      setOptionsLoading(true);

      const confidentialityData = await GetOutgoingReportOptions("confidentiality_levels");
      const urgencyData = await GetOutgoingReportOptions("urgency_levels");

      setConfidentialityOptions(confidentialityData);
      setUrgencyOptions(urgencyData);

    } catch (error) {
      console.error("❌ Error fetching options:", {
        user: "vampirebeam",
        timestamp: "2025-06-16 18:31:49",
        component: "RequestResultProgress",
        error: error.message,
        stack: error.stack
      });

      setConfidentialityOptions([
        { value: "ปกติ", label: "ปกติ" },
        { value: "ลับ", label: "ลับ" },
        { value: "ลับมาก", label: "ลับมาก" },
        { value: "ลับที่สุด", label: "ลับที่สุด" },
      ]);

      setUrgencyOptions([
        { value: "ปกติ", label: "ปกติ" },
        { value: "เร่งด่วน", label: "เร่งด่วน" },
        { value: "เร่งด่วนมาก", label: "เร่งด่วนมาก" },
        { value: "เร่งด่วนที่สุด", label: "เร่งด่วนที่สุด" },
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
          {/* Row 1: เรียน | เลขที่หนังสือ* | วันที่* */}
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
            <SelectFieldsalutation
              label={createLabel("เรียน", "salutation")}
              name="salutation"
              value={form.salutation}
              onChange={handleChange}
              error={!!getFieldError("salutation")}
              helperText={getFieldError("salutation")}
            />

            <InputText
              label={createLabel("เลขที่หนังสือ", "refNo")}
              inputLabel="กรอกเลขที่หนังสือ"
              name="refNo"
              value={form.refNo}
              onChange={handleChange}
              error={!!getFieldError("refNo")}
              helperText={getFieldError("refNo")}
            />

            <Box sx={{ position: "relative", zIndex: 1 }}>
              <DateThaiPickerService
                label={createLabel("วันที่", "date")}
                value={form.date}
                onChange={handleDateChange}
                placeholder="เลือกวันที่"
                error={!!getFieldError("date")}
                helperText={getFieldError("date")}
              />
            </Box>
          </Box>

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

          {/* Row 4: หน่วยงาน / ผู้ร้อง* */}
          <Box>
            <SelectFieldDepartment
              label={createLabel("หน่วยงาน / ผู้ร้อง", "department")}
              name="department"
              value={form.department}
              onChange={handleChange}
              onDepartmentSelect={handleDepartmentSelect}
              filterBySignerId={selectedSigner?.value}
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

export default RequestResultProgress;