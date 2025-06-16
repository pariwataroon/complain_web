import React from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import SelectField from "@services/SelectField/SelectField";
import InputText from "@services/InputText/InputText";
import ButtonService from "@services/ButtonService/ButtonService";
import InputFile from "@services/InputFile/InputFile";
import { Box, Typography } from "@mui/material";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import useInitialNotificationComplainantAgency from "@hooks/admin/InitialNotificationComplainantAgency/useInitialNotificationComplainantAgency";

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

  // Options สำหรับ SelectField
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
    { value: "complainant", label: "ผู้ร้องเรียน" },
    { value: "dlt", label: "กรมการขนส่งทางบก" },
    { value: "dmt", label: "กรมการขนส่งทางน้ำและพาณิชยนาวี" },
    { value: "caat", label: "การบินพลเรือนแห่งประเทศไทย" },
    { value: "doh", label: "กรมทางหลวง" },
    { value: "rrd", label: "กรมทางหลวงชนบท" },
    { value: "srt", label: "การรถไฟแห่งประเทศไทย" },
    { value: "port_authority", label: "การท่าเรือแห่งประเทศไทย" },
    { value: "expressway", label: "การทางพิเศษแห่งประเทศไทย" },
    { value: "dopa", label: "กรมการปกครอง" },
    { value: "dpt", label: "กรมส่งเสริมการปกครองท้องถิ่น" },
    { value: "dpw", label: "กรมโยธาธิการและผังเมือง" },
    { value: "disaster_prevention", label: "กรมป้องกันและบรรเทาสาธารณภัย" },
    { value: "rd", label: "กรมสรรพากร" },
    { value: "customs", label: "กรมศุลกากร" },
    { value: "treasury", label: "กรมบัญชีกลาง" },
    { value: "excise", label: "กรมสรรพสามิต" },
    { value: "lands", label: "กรมธนารักษ์" },
    { value: "moe", label: "สำนักงานปลัดกระทรวงศึกษาธิการ" },
    { value: "obec", label: "สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน" },
    { value: "ohec", label: "สำนักงานคณะกรรมการการอุดมศึกษา" },
    { value: "ovec", label: "สำนักงานคณะกรรมการการอาชีวศึกษา" },
    { value: "moph", label: "สำนักงานปลัดกระทรวงสาธารณสุข" },
    { value: "ddc", label: "กรมควบคุมโรค" },
    { value: "fda", label: "สำนักงานคณะกรรมการอาหารและยา" },
    { value: "dmh", label: "กรมสุขภาพจิต" },
    { value: "ombudsman", label: "สำนักงานผู้ตรวจการแผ่นดิน" },
    { value: "nacc", label: "สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตแห่งชาติ" },
    { value: "nhrct", label: "สำนักงานคณะกรรมการสิทธิมนุษยชนแห่งชาติ" },
  ];

  const signerOptions = [
    { value: "signer1", label: "นายสมชาย ใจดี" },
    { value: "signer2", label: "นางสุดา มีสุข" },
    { value: "signer3", label: "นายอนุชา เจริญ" },
    { value: "signer4", label: "นางสาวปิยะดา สมศรี" },
    { value: "signer5", label: "นายวิชัย รุ่งเรือง" },
    { value: "signer6", label: "นางวิไล สุขสมบูรณ์" },
    { value: "signer7", label: "นายธนาคาร เจริญรุ่งเรือง" },
    { value: "signer8", label: "นางสาวจิราพร มั่งคั่ง" },
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
            ข้อมูลเรื่องร้องทุกข์
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
            <SelectField
              label={createLabel("เรียน", "salutation")}
              name="salutation"
              value={form.salutation}
              onChange={handleChange}
              options={salutationOptions}
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

          {/* Row 3: หน่วยงาน / ผู้ร้อง* */}
          <Box>
            <SelectField
              label={createLabel("หน่วยงาน / ผู้ร้อง", "department")}
              name="department"
              value={form.department}
              onChange={handleChange}
              options={departmentOptions}
              error={!!getFieldError("department")}
              helperText={getFieldError("department")}
            />
          </Box>

          {/* Row 4: ผู้ลงนาม* */}
          <Box>
            <SelectField
              label={createLabel("ผู้ลงนาม", "signer")}
              name="signer"
              value={form.signer}
              onChange={handleChange}
              options={signerOptions}
              error={!!getFieldError("signer")}
              helperText={getFieldError("signer")}
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
            />
            <SelectField
              label={createLabel("ชั้นความเร่งด่วน", "urgency")}
              name="urgency"
              value={form.urgency}
              onChange={handleChange}
              options={urgencyOptions}
              error={!!getFieldError("urgency")}
              helperText={getFieldError("urgency")}
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
              onClick={handleClear}
              disabled={isLoading}
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
              label={isLoading ? "กำลังบันทึก..." : "บันทึก"}
              variant="contained"
              iconRight={<CheckOutlinedIcon />}
              onClick={handleSave}
              disabled={isLoading || !isFormValid()}
              sx={{
                backgroundColor: "#2196F3",
                color: "#FFF",
                width: "100%",
                height: "55px",
                fontSize: "24px",
                opacity: isLoading || !isFormValid() ? 0.6 : 1,
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default InitialNotificationComplainantAgency;