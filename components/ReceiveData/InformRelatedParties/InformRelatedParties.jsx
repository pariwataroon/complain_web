import React, { useState, useEffect } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import SelectField from "@services/SelectField/SelectField";
import InputText from "@services/InputText/InputText";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import ButtonService from "@services/ButtonService/ButtonService";
import InputFile from "@services/InputFile/InputFile";
import { Box, Typography } from "@mui/material";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseIcon from "@mui/icons-material/Close";
import useInformRelatedParties from "@hooks/admin/InformRelatedParties/useInformRelatedParties";
import SelectFieldSignatureAuthority from "@services/SelectFieldSignatureAuthority/SelectFieldSignatureAuthority";
import SelectFieldDepartment from "@services/SelectFieldDepartment/SelectFieldDepartment";
import { GetOutgoingReportOptions } from "@pages/api/allselect/allselect";

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

  // ฟังก์ชันจัดการเมื่อมีการเลือกผู้ลงนาม
  const handleSignerSelect = (userInfo) => {
    

    setSelectedSigner(userInfo);
    // ล้างหน่วยงานที่เลือกไว้เมื่อเปลี่ยนผู้ลงนาม
    setSelectedDepartment(null);
    // อัพเดทค่าใน form
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
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "6fr 4fr",
              },
            }}
          >
            <InputText
              label={createLabel("เลขที่ สป.กค.", "refNo")}
              inputLabel="กรอกเลขที่ สป.กค."
              name="refNo"
              value={form.refNo}
              onChange={handleChange}
              error={!!getFieldError("refNo")}
              helperText={getFieldError("refNo")}
              sx={{ position: "relative", zIndex: 1, width: {xs: "80%", sm: "auto"}}}
            />

            <Box sx={{ position: "relative", zIndex: 1, width: {xs: "80%", sm: "auto"}}}>
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

          {/* row 3: ผู้ลงนาม | หน่วยงาน/ผู้ร้อง/อื่นๆ */}
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
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

            <SelectFieldDepartment
              label={createLabel("หน่วยงาน / ผู้ร้อง / อื่นๆ", "department")}
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