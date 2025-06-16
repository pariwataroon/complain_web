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
import useRequestResultProgress from "@hooks/admin/useRequestResultProgress/useRequestResultProgress";

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

  // Options สำหรับ SelectField
  const salutationOptions = [
    { value: "นายกรัฐมนตรี", label: "นายกรัฐมนตรี" },
    {
      value: "รัฐมนตรีว่าการกระทรวงมหาดไทย",
      label: "รัฐมนตรีว่าการกระทรวงมหาดไทย",
    },
    { value: "ปลัดกระทรวงมหาดไทย", label: "ปลัดกระทรวงมหาดไทย" },
    {
      value: "อธิบดีกรมส่งเสริมการปกครองท้องถิ่น",
      label: "อธิบดีกรมส่งเสริมการปกครองท้องถิ่น",
    },
    { value: "ผู้ว่าราชการจังหวัด", label: "ผู้ว่าราชการจังหวัด" },
    { value: "นายอำเภอ", label: "นายอำเภอ" },
    { value: "ปลัดอำเภอ", label: "ปลัดอำเภอ" },
    { value: "หัวหน้าส่วนราชการ", label: "หัวหน้าส่วนราชการ" },
    { value: "ผู้บัญชาการตำรวจแห่งชาติ", label: "ผู้บัญชาการตำรวจแห่งชาติ" },
    {
      value: "ผู้อำนวยการสำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตแห่งชาติ",
      label: "ผู้อำนวยการสำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตแห่งชาติ",
    },
  ];

  const departmentOptions = [
    { value: "กระทรวงมหาดไทย", label: "กระทรวงมหาดไทย" },
    {
      value: "กรมส่งเสริมการปกครองท้องถิ่น",
      label: "กรมส่งเสริมการปกครองท้องถิ่น",
    },
    { value: "กรมการปกครอง", label: "กรมการปกครอง" },
    {
      value: "กรมป้องกันและบรรเทาสาธารณภัย",
      label: "กรมป้องกันและบรรเทาสาธารณภัย",
    },
    { value: "จังหวัด", label: "จังหวัด" },
    { value: "อำเภอ", label: "อำเภอ" },
    { value: "องค์การบริหารส่วนจังหวัด", label: "องค์การบริหารส่วนจังหวัด" },
    { value: "เทศบาลเมือง", label: "เทศบาลเมือง" },
    { value: "เทศบาลตำบล", label: "เทศบาลตำบล" },
    { value: "องค์การบริหารส่วนตำบล", label: "องค์การบริหารส่วนตำบล" },
    { value: "กรุงเทพมหานคร", label: "กรุงเทพมหานคร" },
    { value: "เมืองพัทยา", label: "เมืองพัทยา" },
    {
      value: "สำนักงานคณะกรรมการการเลือกตั้ง",
      label: "สำนักงานคณะกรรมการการเลือกตั้ง",
    },
    { value: "สำนักงานตำรวจแห่งชาติ", label: "สำนักงานตำรวจแห่งชาติ" },
  ];

  const signerOptions = [
    { value: "ปลัดกระทรวงมหาดไทย", label: "ปลัดกระทรวงมหาดไทย" },
    { value: "รองปลัดกระทรวงมหาดไทย", label: "รองปลัดกระทรวงมหาดไทย" },
    {
      value: "อธิบดีกรมส่งเสริมการปกครองท้องถิ่น",
      label: "อธิบดีกรมส่งเสริมการปกครองท้องถิ่น",
    },
    {
      value: "รองอธิบดีกรมส่งเสริมการปกครองท้องถิ่น",
      label: "รองอธิบดีกรมส่งเสริมการปกครองท้องถิ่น",
    },
    {
      value: "ผู้อำนวยการสำนักงานตรวจสอบการปกครองท้องถิ่น",
      label: "ผู้อำนวยการสำนักงานตรวจสอบการปกครองท้องถิ่น",
    },
    {
      value: "รองผู้อำนวยการสำนักงานตรวจสอบการปกครองท้องถิ่น",
      label: "รองผู้อำนวยการสำนักงานตรวจสอบการปกครองท้องถิ่น",
    },
    { value: "ผู้ว่าราชการจังหวัด", label: "ผู้ว่าราชการจังหวัด" },
    { value: "รองผู้ว่าราชการจังหวัด", label: "รองผู้ว่าราชการจังหวัด" },
    { value: "อธิบดีกรมการปกครอง", label: "อธิบดีกรมการปกครอง" },
    { value: "รองอธิบดีกรมการปกครอง", label: "รองอธิบดีกรมการปกครอง" },
    {
      value: "ผู้อำนวยการกองกิจการท้องถิ่น",
      label: "ผู้อำนวยการกองกิจการท้องถิ่น",
    },
    { value: "ผู้อำนวยการกองนิติการ", label: "ผู้อำนวยการกองนิติการ" },
  ];

  const confidentialityOptions = [
    { value: "ปกติ", label: "ปกติ" },
    { value: "ลับ", label: "ลับ" },
    { value: "ลับมาก", label: "ลับมาก" },
    { value: "ลับที่สุด", label: "ลับที่สุด" },
  ];

  const urgencyOptions = [
    { value: "ปกติ", label: "ปกติ" },
    { value: "เร่งด่วน", label: "เร่งด่วน" },
    { value: "เร่งด่วนมาก", label: "เร่งด่วนมาก" },
    { value: "เร่งด่วนที่สุด", label: "เร่งด่วนที่สุด" },
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

export default RequestResultProgress;