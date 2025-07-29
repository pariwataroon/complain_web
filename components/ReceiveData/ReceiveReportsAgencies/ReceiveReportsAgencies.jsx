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
import { alertWarning, alertSuccess } from "@utils/Alerts";

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

const AGENCY_OPTIONS = [
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
  { value: "อื่นๆ", label: "อื่นๆ" },
];

const ReceiveReportsAgencies = () => {
  const { id } = useRouter().query;

  // Initial form state
  const initialFormState = useMemo(
    () => ({
      referenceNo: "",
      date: null,
      processStep: "",
      confidentiality: "",
      urgency: "",
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

    // Required fields validation
    if (!form.referenceNo.trim()) {
      missingFields.push("เลขที่อ้างอิง(เลข สรร.สารบัญ)");
    }

    if (!form.date) {
      missingFields.push("วันที่");
    }

    if (!form.processStep) {
      missingFields.push("ขั้นตอนการดำเนินการ");
    }

    if (!form.confidentiality) {
      missingFields.push("ชั้นความลับ");
    }

    if (!form.urgency) {
      missingFields.push("ชั้นความเร่งด่วน");
    }

    if (!form.agency) {
      missingFields.push("หน่วยงาน");
    }

    if (!form.investigateGk.trim()) {
      missingFields.push("เลขสป.กค.");
    }

    if (!form.investigateDate) {
      missingFields.push("วันที่ (เลขสป.กค.)");
    }

    if (!form.documentNo.trim()) {
      missingFields.push("เลขที่หนังสือ");
    }

    if (!form.documentDate) {
      missingFields.push("วันที่ (เลขที่หนังสือ)");
    }

    if (!form.receiveWorkDate) {
      missingFields.push("วันที่รับงานของเจ้าหน้าที่");
    }

    if (!form.submitWorkDate) {
      missingFields.push("วันที่เสนองาน ผอ.สรร.");
    }

    if (!form.origin.trim()) {
      missingFields.push("ต้นเรื่อง");
    }

    if (!form.subject.trim()) {
      missingFields.push("เรื่อง");
    }

    if (!form.attachment.trim()) {
      missingFields.push("เอกสารแนบ");
    }

    // Show warning alert if there are missing fields
    if (missingFields.length > 0) {
      const message = `กรุณากรอกข้อมูลให้ครบถ้วน:\n${missingFields
        .map((field) => `• ${field}`)
        .join("\n")}`;
      alertWarning("ข้อมูลไม่ครบถ้วน", message);
    }

    return missingFields.length === 0;
  }, [form]);

  // Memoized handlers
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Handler สำหรับ DateThaiPickerService
  const handleDateChange = useCallback(
    (fieldName) => (thaiDate) => {
      setForm((prev) => ({ ...prev, [fieldName]: thaiDate }));
    },
    []
  );

  const handleClear = useCallback(() => {
    setForm(initialFormState);
  }, [initialFormState]);

  const handleSave = useCallback(() => {
    if (validateForm()) {
      console.log("Form data:", form);
      // TODO: save form
      alertSuccess("สำเร็จ", "บันทึกข้อมูลเรียบร้อยแล้ว");
    }
  }, [form, validateForm]);

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
              name="agency"
              value={form.agency}
              onChange={handleChange}
              options={AGENCY_OPTIONS}
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
              columnGap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
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
                value={form.documentDate}
                onChange={handleDateChange("documentDate")}
                placeholder="เลือกวันที่"
              />
            </Box>
          </Box>

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
          <Box sx={{ position: "relative" }}>
            <InputText
              label={
                <span>
                  เอกสารแนบ
                  <span style={{ color: "red", marginLeft: 4 }}>*</span>
                </span>
              }
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
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
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
