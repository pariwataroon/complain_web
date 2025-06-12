import React, { useState, useCallback } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import SelectField from "@services/SelectField/SelectField";
import InputText from "@services/InputText/InputText";
import ButtonService from "@services/ButtonService/ButtonService";
import { Box, Typography } from "@mui/material";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import {
  alertSuccess,
  alertError,
  showLoading,
  closeAlert,
} from "@utils/Alerts";

const ForwardtoagencyComponents = () => {
  const router = useRouter();
  const { id } = router.query;

  const [form, setForm] = useState({
    salutation: "",
    refNo: "",
    date1: null,
    subject: "",
    bookNo: "",
    date2: null,
    signer: "",
    department: "",
    confidentiality: "",
    urgency: "",
    attachment: "",
    note: "",
  });

  // ใช้ useCallback เพื่อป้องกัน re-render loop
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    // แก้ไข: ตรวจสอบว่า value ไม่ใช่ object
    const finalValue =
      typeof value === "object" && value !== null ? value.value || "" : value;
    setForm((prev) => ({ ...prev, [name]: finalValue }));
  }, []);

  // Handler สำหรับ DateThaiPickerService - ใช้ useCallback
  const handleDateChange = useCallback(
    (field) => (thaiDate) => {
      setForm((prev) => ({ ...prev, [field]: thaiDate }));
    },
    []
  );

  // Handler สำหรับ file upload - ใช้ useCallback
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((prev) => ({
        ...prev,
        attachment: file.name,
      }));
    }
  }, []);

  // Clear form handler - ใช้ useCallback
  const handleClear = useCallback(() => {
    setForm({
      salutation: "",
      refNo: "",
      date1: null,
      subject: "",
      bookNo: "",
      date2: null,
      signer: "",
      department: "",
      confidentiality: "",
      urgency: "",
      attachment: "",
      note: "",
    });
  }, []);

  // ฟังก์ชันตรวจสอบข้อมูลที่จำเป็น
  const validateRequiredFields = () => {
    const requiredFields = [
      { field: "salutation", label: "เรียน" },
      { field: "refNo", label: "เลข สป.กค." },
      { field: "date1", label: "วันที่ (แรก)" },
      { field: "subject", label: "เรื่อง" },
      { field: "bookNo", label: "เลขที่หนังสือ" },
      { field: "date2", label: "วันที่ (สอง)" },
      { field: "signer", label: "ผู้ลงนาม" },
      { field: "department", label: "หน่วยงาน" },
      { field: "confidentiality", label: "ชั้นความลับ" },
      { field: "urgency", label: "ชั้นความเร่งด่วน" },
      { field: "attachment", label: "เอกสารแนบ" },
    ];

    const missingFields = requiredFields.filter(({ field }) => {
      const value = form[field];
      return !value || value === "" || value === null;
    });

    return missingFields;
  };

  // Save form handler - ใช้ useCallback และเพิ่ม validation + alerts
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
        "บันทึกแบบรายงานส่งหน่วยงานที่เกี่ยวข้องเรียบร้อยแล้ว"
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
  }, [form, router]);

  // Options สำหรับ SelectField - แก้ไขให้แน่ใจว่าเป็น format ที่ถูกต้อง
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

  const signerOptions = [
    { value: "signer1", label: "นายสมชาย ใจดี" },
    { value: "signer2", label: "นางสุดา มีสุข" },
    { value: "signer3", label: "นายอนุชา เจริญ" },
    { value: "signer4", label: "นางสาวปิยะดา สมศรี" },
    { value: "signer5", label: "นายวิชัย รุ่งเรือง" },
  ];

  // แก้ไข: หน่วยงานในกระทรวงต่างๆ ของไทย
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

    // กระทรวงมหาดไทย
    { value: "dopa", label: "กรมการปกครอง" },
    { value: "dpt", label: "กรมส่งเสริมการปกครองท้องถิ่น" },
    { value: "dpw", label: "กรมโยธาธิการและผังเมือง" },
    { value: "disaster_prevention", label: "กรมป้องกันและบรรเทาสาธารณภัย" },

    // กระทรวงการคลัง
    { value: "rd", label: "กรมสรรพากร" },
    { value: "customs", label: "กรมศุลกากร" },
    { value: "treasury", label: "กรมบัญชีกลาง" },
    { value: "excise", label: "กรมสรรพสามิต" },
    { value: "lands", label: "กรมธนารักษ์" },

    // กระทรวงศึกษาธิการ
    { value: "moe", label: "สำนักงานปลัดกระทรวงศึกษาธิการ" },
    { value: "obec", label: "สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน" },
    { value: "ohec", label: "สำนักงานคณะกรรมการการอุดมศึกษา" },
    { value: "ovec", label: "สำนักงานคณะกรรมการการอาชีวศึกษา" },

    // กระทรวงสาธารณสุข
    { value: "moph", label: "สำนักงานปลัดกระทรวงสาธารณสุข" },
    { value: "ddc", label: "กรมควบคุมโรค" },
    { value: "fda", label: "สำนักงานคณะกรรมการอาหารและยา" },
    { value: "dmh", label: "กรมสุขภาพจิต" },

    // กระทรวงแรงงาน
    { value: "doe", label: "กรมการจัดหางาน" },
    { value: "dlpw", label: "กรมสวัสดิการและคุ้มครองแรงงาน" },
    { value: "dsd", label: "กรมพัฒนาฝีมือแรงงาน" },

    // กระทรวงยุติธรรม
    { value: "corrections", label: "กรมราชทัณฑ์" },
    { value: "probation", label: "กรมคุมประพฤติ" },
    { value: "legal_execution", label: "กรมบังคับคดี" },
    { value: "rights_liberty", label: "กรมคุ้มครองสิทธิและเสรีภาพ" },

    // กระทรวงเกษตรและสหกรณ์
    { value: "doa", label: "กรมส่งเสริมการเกษตร" },
    { value: "fisheries", label: "กรมประมง" },
    { value: "livestock", label: "กรมปศุสัตว์" },
    { value: "cooperatives", label: "กรมส่งเสริมสหกรณ์" },

    // กระทรวงพาณิชย์
    { value: "dbd", label: "กรมพัฒนาธุรกิจการค้า" },
    { value: "dit", label: "กรมการค้าต่างประเทศ" },
    { value: "dip", label: "กรมทรัพย์สินทางปัญญา" },

    // กระทรวงอุตสาหกรรม
    { value: "diw", label: "กรมโรงงานอุตสาหกรรม" },
    { value: "tisi", label: "สำนักงานมาตรฐานผลิตภัณฑ์อุตสาหกรรม" },

    // กระทรวงพลังงาน
    { value: "doae", label: "กรมพัฒนาพลังงานทดแทนและอนุรักษ์พลังงาน" },
    { value: "dmf", label: "กรมเชื้อเพลิงธรรมชาติ" },

    // กระทรวงทรัพยากรธรรมชาติและสิ่งแวดล้อม
    { value: "pcd", label: "กรมควบคุมมลพิษ" },
    { value: "dnp", label: "กรมอุทยานแห่งชาติ สัตว์ป่า และพันธุ์พืช" },
    { value: "marine", label: "กรมทรัพยากรทางทะเลและชายฝั่ง" },

    // กระทรวงการท่องเที่ยวและกีฬา
    { value: "tat", label: "การท่องเที่ยวแห่งประเทศไทย" },
    { value: "sports_authority", label: "การกีฬาแห่งประเทศไทย" },

    // กระทรวงเทคโนโลยีสารสนเทศและการสื่อสาร
    {
      value: "nbtc",
      label:
        "สำนักงานคณะกรรมการกิจการกระจายเสียง กิจการโทรทัศน์ และกิจการโทรคมนาคมแห่งชาติ",
    },
    { value: "etda", label: "สำนักงานพัฒนาเศรษฐกิจดิจิทัลแห่งชาติ" },

    // กระทรวงวัฒนธรรม
    { value: "culture", label: "กรมส่งเสริมวัฒนธรรม" },
    { value: "fine_arts", label: "กรมศิลปากร" },

    // กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์
    { value: "dop", label: "กรมพัฒนาสังคมและสวัสดิการ" },
    { value: "dosa", label: "กรมกิจการผู้สูงอายุ" },

    // หน่วยงานอิสระ
    { value: "ombudsman", label: "สำนักงานผู้ตรวจการแผ่นดิน" },
    {
      value: "nacc",
      label: "สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตแห่งชาติ",
    },
    { value: "nhrct", label: "สำนักงานคณะกรรมการสิทธิมนุษยชนแห่งชาติ" },
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
        {/* top gradient bar */}
        <Box
          sx={{
            background: "linear-gradient(to right, #1223a5, #2499ff)",
            height: 50,
            borderTopRightRadius: 12,
          }}
        />

        {/* centered title */}
        <Box sx={{ textAlign: "center", py: 2 }}>
          <Typography variant="h5" fontWeight="bold" color="#1120A3">
            แบบรายงานส่งหน่วยงานที่เกี่ยวข้อง
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
          <Typography variant="h5" fontWeight="bold" color="#1120A3">
            ข้อมูลเรื่องร้องทุกข์
          </Typography>

          {/* row 1: เรียน | เลข สป.กค. | วันที่ */}
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
              label={
                <span>
                  เรียน<span style={{ color: "red", marginLeft: 4 }}>*</span>
                </span>
              }
              name="salutation"
              value={form.salutation}
              onChange={handleChange}
              options={salutationOptions}
            />
            <InputText
              label={
                <span>
                  เลข สป.กค.
                  <span style={{ color: "red", marginLeft: 4 }}>*</span>
                </span>
              }
              inputLabel="กรอกเลข สป.กค."
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
                value={form.date1}
                onChange={handleDateChange("date1")}
                placeholder="เลือกวันที่"
              />
            </Box>
          </Box>

          {/* row 2: เรื่อง */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr" }}>
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

          {/* row 3: เลขที่หนังสือ | วันที่ | ผู้ลงนาม */}
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
            <InputText
              label={
                <span>
                  เลขที่หนังสือ
                  <span style={{ color: "red", marginLeft: 2 }}>*</span>
                </span>
              }
              inputLabel="กรอกเลขที่หนังสือ"
              name="bookNo"
              value={form.bookNo}
              onChange={handleChange}
            />
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <DateThaiPickerService
                label={
                  <span>
                    วันที่<span style={{ color: "red", marginLeft: 2 }}>*</span>
                  </span>
                }
                value={form.date2}
                onChange={handleDateChange("date2")}
                placeholder="เลือกวันที่"
              />
            </Box>
            <SelectField
              label={
                <span>
                  ผู้ลงนาม
                  <span style={{ color: "red", marginLeft: 2 }}>*</span>
                </span>
              }
              name="signer"
              value={form.signer}
              onChange={handleChange}
              options={signerOptions}
            />
          </Box>

          {/* row 4: หน่วยงาน */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr" }}>
            <SelectField
              label={
                <span>
                  หน่วยงาน
                  <span style={{ color: "red", marginLeft: 2 }}>*</span>
                </span>
              }
              name="department"
              value={form.department}
              onChange={handleChange}
              options={departmentOptions}
            />
          </Box>

          {/* row 5: ชั้นความลับ | ชั้นความเร่งด่วน */}
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
              options={confidentialityOptions}
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
              options={urgencyOptions}
            />
          </Box>

          {/* row 6: เอกสารแนบ */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr",
              position: "relative",
            }}
          >
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
                        style={{ width: 24, height: 24 }}
                      />
                    </label>
                  </>
                ),
              }}
            />
          </Box>

          {/* row 7: หมายเหตุ */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr" }}>
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

export default ForwardtoagencyComponents;
