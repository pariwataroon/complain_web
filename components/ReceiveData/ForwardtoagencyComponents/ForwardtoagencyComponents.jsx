import React, { useState } from "react";
import { useRouter } from "next/router";
import { Controller } from "react-hook-form";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import SelectField from "@services/SelectField/SelectField";
import InputText from "@services/InputText/InputText";
import ButtonService from "@services/ButtonService/ButtonService";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import { Box, Typography } from "@mui/material";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseIcon from "@mui/icons-material/Close";
import InputFile from "@services/InputFile/InputFile";
import { useForwardToAgencyForm } from "@hooks/admin/forwardtoagency/useForwardToAgencyForm";
import SelectFieldsupervisor from "@services/SelectFieldSupervisor/SelectFieldSupervisor";

const ForwardtoagencyComponents = () => {
  const router = useRouter();
  const { id } = router.query;

  // State สำหรับเก็บข้อมูลผู้ลงนามที่เลือก
  const [selectedSigner, setSelectedSigner] = useState(null);

  const {
    control,
    handleSubmit,
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
  } = useForwardToAgencyForm();

  // ฟังก์ชันจัดการเมื่อมีการเลือกผู้ลงนาม
  const handleSignerSelect = (userInfo) => {
    console.log("✍️ Signer selected:", {
      user: "vampirebeam",
      timestamp: "2025-06-16 13:55:05",
      selectedSigner: userInfo ? {
        id: userInfo.value,
        name: userInfo.label,
        fullName: userInfo.fullName,
        email: userInfo.email
      } : null
    });
    setSelectedSigner(userInfo);
  };

  // Options data
  const salutationOptions = [
    { value: "director_general", label: "อธิบดี" },
    { value: "deputy_director_general", label: "รองอธิบดี" },
    { value: "director", label: "ผู้อำนวยการ" },
    { value: "deputy_director", label: "รองผู้อำนวยการ" },
    { value: "secretary_general", label: "เลขาธิการ" },
    { value: "deputy_secretary_general", label: "รองเลขาธิการ" },
    { value: "minister", label: "รัฐมนตรี" },
    { value: "deputy_minister", label: "รองรัฐมนตรี" },
  ];

  const departmentOptions = [
    // กระทรวงคมนาคม
    { value: "dlt", label: "กรมการขนส่งทางบก" },
    { value: "dmt", label: "กรมการขนส่งทางน้ำและพาณิชยนาวี" },
    { value: "caat", label: "การบินพลเรือนแห่งประเทศไทย" },
    { value: "doh", label: "กรมทางหลวง" },
    { value: "rrd", label: "กรมทางหลวงชนบท" },
    { value: "srt", label: "การรถไฟแห่งประเทศไทย" },
    { value: "port_authority", label: "การท่าเรือแห่งประเทศไทย" },
    { value: "expressway", label: "การทางพิเศษแห่งประเทศไทย" },
    { value: "airports", label: "ท่าอากาศยานแห่งประเทศไทย" },
    { value: "transport_ministry", label: "สำนักงานปลัดกระทรวงคมนาคม" },

    // กระทรวงมหาดไทย
    { value: "dopa", label: "กรมการปกครอง" },
    { value: "dpt", label: "กรมส่งเสริมการปกครองท้องถิ่น" },
    { value: "dpw", label: "กรมโยธาธิการและผังเมือง" },
    { value: "disaster_prevention", label: "กรมป้องกันและบรรเทาสาธารณภัย" },
    { value: "interior_ministry", label: "สำนักงานปลัดกระทรวงมหาดไทย" },
    { value: "provincial_admin", label: "กรมการปกครองส่วนท้องถิ่น" },

    // กระทรวงการคลัง
    { value: "rd", label: "กรมสรรพากร" },
    { value: "customs", label: "กรมศุลกากร" },
    { value: "treasury", label: "กรมบัญชีกลาง" },
    { value: "excise", label: "กรมสรรพสามิต" },
    { value: "lands", label: "กรมธนารักษ์" },
    { value: "finance_ministry", label: "สำนักงานปลัดกระทรวงการคลัง" },
    { value: "public_debt", label: "สำนักงานบริหารหนี้สาธารณะ" },

    // กระทรวงศึกษาธิการ
    { value: "moe", label: "สำนักงานปลัดกระทรวงศึกษาธิการ" },
    { value: "obec", label: "สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน" },
    { value: "ohec", label: "สำนักงานคณะกรรมการการอุดมศึกษา" },
    { value: "ovec", label: "สำนักงานคณะกรรมการการอาชีวศึกษา" },
    { value: "onec", label: "สำนักงานคณะกรรมการการศึกษาแห่งชาติ" },

    // กระทรวงสาธารณสุข
    { value: "moph", label: "สำนักงานปลัดกระทรวงสาธารณสุข" },
    { value: "ddc", label: "กรมควบคุมโรค" },
    { value: "fda", label: "สำนักงานคณะกรรมการอาหารและยา" },
    { value: "dmh", label: "กรมสุขภาพจิต" },
    { value: "health_service", label: "กรมการแพทย์" },
    { value: "medical_science", label: "กรมวิทยาศาสตร์การแพทย์" },

    // กระทรวงแรงงาน
    { value: "doe", label: "กรมการจัดหางาน" },
    { value: "dlpw", label: "กรมสวัสดิการและคุ้มครองแรงงาน" },
    { value: "dsd", label: "กรมพัฒนาฝีมือแรงงาน" },
    { value: "labor_ministry", label: "สำนักงานปลัดกระทรวงแรงงาน" },

    // กระทรวงยุติธรรม
    { value: "corrections", label: "กรมราชทัณฑ์" },
    { value: "probation", label: "กรมคุมประพฤติ" },
    { value: "legal_execution", label: "กรมบังคับคดี" },
    { value: "rights_liberty", label: "กรมคุ้มครองสิทธิและเสรีภาพ" },
    { value: "justice_ministry", label: "สำนักงานปลัดกระทรวงยุติธรรม" },

    // กระทรวงเกษตรและสหกรณ์
    { value: "doa", label: "กรมส่งเสริมการเกษตร" },
    { value: "fisheries", label: "กรมประมง" },
    { value: "livestock", label: "กรมปศุสัตว์" },
    { value: "cooperatives", label: "กรมส่งเสริมสหกรณ์" },
    { value: "agriculture_ministry", label: "สำนักงานปลัดกระทรวงเกษตรและสหกรณ์" },
    { value: "irrigation", label: "กรมชลประทาน" },

    // กระทรวงพาณิชย์
    { value: "dbd", label: "กรมพัฒนาธุรกิจการค้า" },
    { value: "dit", label: "กรมการค้าต่างประเทศ" },
    { value: "dip", label: "กรมทรัพย์สินทางปัญญา" },
    { value: "commerce_ministry", label: "สำนักงานปลัดกระทรวงพาณิชย์" },

    // กระทรวงอุตสาหกรรม
    { value: "diw", label: "กรมโรงงานอุตสาหกรรม" },
    { value: "tisi", label: "สำนักงานมาตรฐานผลิตภัณฑ์อุตสาหกรรม" },
    { value: "industry_ministry", label: "สำนักงานปลัดกระทรวงอุตสาหกรรม" },

    // กระทรวงพลังงาน
    { value: "doae", label: "กรมพัฒนาพลังงานทดแทนและอนุรักษ์พลังงาน" },
    { value: "dmf", label: "กรมเชื้อเพลิงธรรมชาติ" },
    { value: "energy_ministry", label: "สำนักงานปลัดกระทรวงพลังงาน" },

    // กระทรวงทรัพยากรธรรมชาติและสิ่งแวดล้อม
    { value: "pcd", label: "กรมควบคุมมลพิษ" },
    { value: "dnp", label: "กรมอุทยานแห่งชาติ สัตว์ป่า และพันธุ์พืช" },
    { value: "marine", label: "กรมทรัพยากรทางทะเลและชายฝั่ง" },
    { value: "environment_ministry", label: "สำนักงานปลัดกระทรวงทรัพยากรธรรมชาติและสิ่งแวดล้อม" },
    { value: "groundwater", label: "กรมทรัพยากรน้ำบาดาล" },

    // กระทรวงการท่องเที่ยวและกีฬา
    { value: "tat", label: "การท่องเที่ยวแห่งประเทศไทย" },
    { value: "sports_authority", label: "การกีฬาแห่งประเทศไทย" },
    { value: "tourism_ministry", label: "สำนักงานปลัดกระทรวงการท่องเที่ยวและกีฬา" },

    // กระทรวงเทคโนโลยีสารสนเทศและการสื่อสาร
    { value: "nbtc", label: "สำนักงานคณะกรรมการกิจการกระจายเสียง กิจการโทรทัศน์ และกิจการโทรคมนาคมแห่งชาติ" },
    { value: "etda", label: "สำนักงานพัฒนาเศรษฐกิจดิจิทัลแห่งชาติ" },
    { value: "ict_ministry", label: "สำนักงานปลัดกระทรวงเทคโนโลยีสารสนเทศและการสื่อสาร" },

    // กระทรวงวัฒนธรรม
    { value: "culture", label: "กรมส่งเสริมวัฒนธรรม" },
    { value: "fine_arts", label: "กรมศิลปากร" },
    { value: "culture_ministry", label: "สำนักงานปลัดกระทรวงวัฒนธรรม" },

    // กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์
    { value: "dop", label: "กรมพัฒนาสังคมและสวัสดิการ" },
    { value: "dosa", label: "กรมกิจการผู้สูงอายุ" },
    { value: "social_ministry", label: "สำนักงานปลัดกระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์" },

    // หน่วยงานอิสระ และหน่วยงานพิเศษ
    { value: "ombudsman", label: "สำนักงานผู้ตรวจการแผ่นดิน" },
    { value: "nacc", label: "สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตแห่งชาติ" },
    { value: "nhrct", label: "สำนักงานคณะกรรมการสิทธิมนุษยชนแห่งชาติ" },
    { value: "election_commission", label: "สำนักงานคณะกรรมการการเลือกตั้ง" },
    { value: "audit_commission", label: "สำนักงานการตรวจเงินแผ่นดิน" },
    { value: "civil_service", label: "สำนักงานคณะกรรมการข้าราชการพลเรือน" },

    // กรุงเทพมหานคร และ หน่วยงานท้องถิ่น
    { value: "bangkok", label: "กรุงเทพมหานคร" },
    { value: "pattaya", label: "เมืองพัทยา" },

    // หน่วยงานภายใต้สำนักนายกรัฐมนตรี
    { value: "cabinet_secretariat", label: "สำนักเลขาธิการคณะรัฐมนตรี" },
    { value: "national_security", label: "สำนักงานสภาความมั่นคงแห่งชาติ" },
    { value: "budget_bureau", label: "สำนักงบประมาณ" },
    { value: "civil_service_commission", label: "สำนักงานคณะกรรมการข้าราชการพลเรือน" },

    // หน่วยงานตำรวจ และ ทหาร
    { value: "royal_thai_police", label: "สำนักงานตำรวจแห่งชาติ" },
    { value: "defense_ministry", label: "กระทรวงกลาโหม" },
    { value: "army", label: "กองทัพบก" },
    { value: "navy", label: "กองทัพเรือ" },
    { value: "air_force", label: "กองทัพอากาศ" },
  ];

  const confidentialityOptions = [
    { value: "normal", label: "ปกติ" },
    { value: "confidential", label: "ลับ" },
    { value: "secret", label: "ลับมาก" },
    { value: "top_secret", label: "ลับที่สุด" },
  ];

  const urgencyOptions = [
    { value: "normal", label: "ปกติ" },
    { value: "urgent", label: "ด่วน" },
    { value: "very_urgent", label: "ด่วนมาก" },
    { value: "extremely_urgent", label: "ด่วนที่สุด" },
  ];

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
                <SelectField
                  label={createLabel("เรียน", "salutation")}
                  name="salutation"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  options={salutationOptions}
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

            {/* ใช้ SelectFieldsupervisor Service */}
            <Controller
              name="signer"
              control={control}
              render={({ field }) => (
                <SelectFieldsupervisor
                  label="ผู้ลงนาม"
                  name="signer"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onUserSelect={handleSignerSelect}
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
                <SelectField
                  label={createLabel("หน่วยงาน", "department")}
                  name="department"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  options={departmentOptions}
                  error={!!getFieldError("department")}
                  helperText={getFieldError("department")}
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
                  label={createLabel("เอกสารประกอบการร้องเรียน", "attachment")}
                  name="attachment"
                  onChange={handleFileUpload}
                  error={getFieldError("attachment")}
                  helperText={getFieldError("attachment") || "หมายเหตุ : แนบหลักฐาน เช่น สัญญา รูปภาพ หรือ หมายศาล รองรับไฟล์ .pdf .doc .docx .jpg .jpeg .png และไม่เกิน 10 MB"}
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
                  helperText={getFieldError("note") || "ระบุข้อมูลเพิ่มเติมที่ต้องการแจ้ง"}
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
              onClick={handleSubmit(handleSave)}
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
                  boxShadow: isValid ? "0 6px 16px rgba(33, 150, 243, 0.4)" : "none",
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