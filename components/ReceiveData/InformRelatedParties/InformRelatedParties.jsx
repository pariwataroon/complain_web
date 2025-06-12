import React, { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import SelectField from "@services/SelectField/SelectField";
import InputText from "@services/InputText/InputText";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import ButtonService from "@services/ButtonService/ButtonService";
import { Box, Typography } from "@mui/material";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseIcon from "@mui/icons-material/Close";
import {
  alertSuccess,
  alertError,
  showLoading,
  closeAlert,
} from "@utils/Alerts";

// Constants สำหรับ options (ย้ายออกมาข้างนอกเพื่อ performance)
const SIGNER_OPTIONS = [
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

const DEPARTMENT_OPTIONS = [
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
  { value: "ประชาชน", label: "ประชาชน" },
  { value: "นิติบุคคล", label: "นิติบุคคล" },
  { value: "อื่นๆ", label: "อื่นๆ" },
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

const PROPOSE_FOR_OPTIONS = [
  { value: "ทราบ", label: "ทราบ" },
  { value: "พิจารณา", label: "พิจารณา" },
  { value: "อนุมัติ", label: "อนุมัติ" },
  { value: "ดำเนินการ", label: "ดำเนินการ" },
  { value: "ตรวจสอบ", label: "ตรวจสอบ" },
  { value: "ติดตาม", label: "ติดตาม" },
  { value: "ประสานงาน", label: "ประสานงาน" },
  { value: "รายงาน", label: "รายงาน" },
];

const DECISION_OPTIONS = [
  { value: "อนุมัติ", label: "อนุมัติ" },
  { value: "ไม่อนุมัติ", label: "ไม่อนุมัติ" },
  { value: "พิจารณาแล้ว", label: "พิจารณาแล้ว" },
  { value: "ทราบแล้ว", label: "ทราบแล้ว" },
  { value: "ดำเนินการแล้ว", label: "ดำเนินการแล้ว" },
  { value: "ส่งต่อ", label: "ส่งต่อ" },
  { value: "ชี้แจง", label: "ชี้แจง" },
  { value: "แก้ไข", label: "แก้ไข" },
  { value: "ยกเลิก", label: "ยกเลิก" },
  { value: "รอการพิจารณา", label: "รอการพิจารณา" },
];

const InformRelatedParties = () => {
  const router = useRouter();
  const { id } = router.query;

  // Initial form state
  const initialFormState = useMemo(
    () => ({
      refNo: "",
      date: null, // เปลี่ยนเป็น null สำหรับ DateThaiPickerService
      subject: "",
      signer: "",
      department: "",
      confidentiality: "",
      urgency: "",
      proposeFor: "",
      decision: "",
      attachment: "",
      details: "",
    }),
    []
  );

  const [form, setForm] = useState(initialFormState);

  // ฟังก์ชันตรวจสอบข้อมูลที่จำเป็น
  const validateRequiredFields = useCallback(() => {
    const requiredFields = [
      { field: "refNo", label: "เลขที่ สป.กค." },
      { field: "date", label: "วันที่" },
      { field: "subject", label: "เรื่อง" },
      { field: "signer", label: "ผู้ลงนาม" },
      { field: "department", label: "หน่วยงาน / ผู้ร้อง / อื่นๆ" },
      { field: "confidentiality", label: "ชั้นความลับ" },
      { field: "urgency", label: "ชั้นความเร่งด่วน" },
      { field: "proposeFor", label: "เสนอเพื่อ" },
      { field: "decision", label: "ผลการพิจารณา" },
      { field: "attachment", label: "เอกสารแนบ" },
    ];

    const missingFields = requiredFields.filter(({ field }) => {
      const value = form[field];
      return !value || value === "" || value === null;
    });

    return missingFields;
  }, [form]);

  // Memoized handlers
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    // แก้ไข: ตรวจสอบว่า value ไม่ใช่ object
    const finalValue =
      typeof value === "object" && value !== null ? value.value || "" : value;
    setForm((prev) => ({ ...prev, [name]: finalValue }));
  }, []);

  // Handler สำหรับ DateThaiPickerService
  const handleDateChange = useCallback((thaiDate) => {
    setForm((prev) => ({ ...prev, date: thaiDate }));
  }, []);

  const handleClear = useCallback(() => {
    setForm(initialFormState);
  }, [initialFormState]);

  // Save form handler - เพิ่ม validation + alerts
  const handleSave = useCallback(async () => {
    console.log("Form data:", form);

    // ตรวจสอบฟิลด์ที่จำเป็น
    const missingFields = validateRequiredFields();

    if (missingFields.length > 0) {
      const missingFieldNames = missingFields
        .map(({ label }) => label)
        .join(", ");
      alertError(
        "ข้อมูลไม่ครบถ้วน",
        `กรุณากรอกข้อมูลในฟิลด์: ${missingFieldNames}`
      );
      return;
    }

    try {
      // แสดง loading
      showLoading("กำลังบันทึกข้อมูล...");

      // จำลองการส่งข้อมูลไปยัง API (ใช้ setTimeout เพื่อจำลอง)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // ปิด loading
      closeAlert();

      // แสดงความสำเร็จ
      await alertSuccess(
        "บันทึกสำเร็จ",
        "บันทึกแบบรายงานแจ้งผลการให้ผู้เกี่ยวข้องทราบเรียบร้อยแล้ว"
      );

      // TODO: เปลี่ยนเส้นทางหรือ refresh ข้อมูลหลังจากบันทึกสำเร็จ
      // router.push('/some-success-page');
    } catch (error) {
      // ปิด loading
      closeAlert();

      // แสดงข้อผิดพลาด
      console.error("Save error:", error);
      alertError(
        "เกิดข้อผิดพลาด",
        "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง"
      );
    }
  }, [form, router, validateRequiredFields]);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((prev) => ({
        ...prev,
        attachment: file.name,
      }));
    }
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
              label={
                <span>
                  เลขที่ สป.กค.
                  <span style={{ color: "red", marginLeft: 4 }}>*</span>
                </span>
              }
              inputLabel="กรอกเลขที่ สป.กค."
              name="refNo"
              value={form.refNo}
              onChange={handleChange}
            />
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <DateThaiPickerService
                label={
                  <span>
                    วันที่<span style={{ color: "red", marginLeft: 4 }}>*</span>
                  </span>
                }
                value={form.date}
                onChange={handleDateChange}
                placeholder="เลือกวันที่"
              />
            </Box>
          </Box>

          {/* row 2: เรื่อง */}
          <Box>
            <InputText
              label={
                <span>
                  เรื่อง<span style={{ color: "red", marginLeft: 2 }}>*</span>
                </span>
              }
              inputLabel="กรอกเรื่อง"
              name="subject"
              value={form.subject}
              onChange={handleChange}
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
            <SelectField
              label={
                <span>
                  ผู้ลงนาม<span style={{ color: "red", marginLeft: 2 }}>*</span>
                </span>
              }
              name="signer"
              value={form.signer}
              onChange={handleChange}
              options={SIGNER_OPTIONS}
            />
            <SelectField
              label={
                <span>
                  หน่วยงาน / ผู้ร้อง / อื่นๆ
                  <span style={{ color: "red", marginLeft: 2 }}>*</span>
                </span>
              }
              name="department"
              value={form.department}
              onChange={handleChange}
              options={DEPARTMENT_OPTIONS}
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
              label={
                <span>
                  ชั้นความลับ
                  <span style={{ color: "red", marginLeft: 2 }}>*</span>
                </span>
              }
              name="confidentiality"
              value={form.confidentiality}
              onChange={handleChange}
              options={CONFIDENTIALITY_OPTIONS}
            />
            <SelectField
              label={
                <span>
                  ชั้นความเร่งด่วน
                  <span style={{ color: "red", marginLeft: 2 }}>*</span>
                </span>
              }
              name="urgency"
              value={form.urgency}
              onChange={handleChange}
              options={URGENCY_OPTIONS}
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
              label={
                <span>
                  เสนอเพื่อ
                  <span style={{ color: "red", marginLeft: 2 }}>*</span>
                </span>
              }
              name="proposeFor"
              value={form.proposeFor}
              onChange={handleChange}
              options={PROPOSE_FOR_OPTIONS}
            />
            <SelectField
              label={
                <span>
                  ผลการพิจารณา
                  <span style={{ color: "red", marginLeft: 2 }}>*</span>
                </span>
              }
              name="decision"
              value={form.decision}
              onChange={handleChange}
              options={DECISION_OPTIONS}
            />
          </Box>

          {/* row 6: เอกสารแนบ */}
          <Box sx={{ position: "relative" }}>
            <InputText
              label="เอกสารแนบ*"
              inputLabel="เลือกไฟล์"
              name="attachment"
              value={form.attachment}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <>
                    <input
                      type="file"
                      id="attachment-upload"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                    <label
                      htmlFor="attachment-upload"
                      style={{ cursor: "pointer" }}
                    >
                      <img
                        src="/icons/Add.png"
                        alt="add"
                        style={{ width: 24, height: 24, marginTop: 6 }}
                      />
                    </label>
                  </>
                ),
              }}
            />
          </Box>

          {/* row 7: รายละเอียด */}
          <Box>
            <InputText
              label="รายละเอียด"
              inputLabel="กรอกรายละเอียด"
              name="details"
              value={form.details}
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

export default InformRelatedParties;
