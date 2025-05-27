import React, { useState } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import SelectField from "@services/SelectField/SelectField";
import InputText from "@services/InputText/InputText";
import InputDateNoTime from "@services/InputDateNoTime/InputDateNoTime";
import ButtonService from "@services/ButtonService/ButtonService";
import { Box, Typography, IconButton } from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseIcon from "@mui/icons-material/Close";

const ForwardtoagencyComponents = () => {
  const { id } = useRouter().query;
  const [form, setForm] = useState({
    salutation: "",
    refNo: "",
    date1: "",
    subject: "",
    bookNo: "",
    date2: "",
    signer: "",
    department: "",
    confidentiality: "",
    urgency: "",
    attachment: "",
    note: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
              externalOptions={
                [
                  /* … */
                ]
              }
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
            <Box sx={{ mt: { xs: 0, sm: 0, md: 1.9 } }}>
              <InputDateNoTime
                label={
                  <span>
                    วันที่<span style={{ color: "red", marginLeft: 4 }}>*</span>
                  </span>
                }
                name="date1"
                value={form.date1}
                onChange={handleChange}
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
            <Box sx={{ mt: { xs: 0, sm: 0, md: 1.9 } }}>
              <InputDateNoTime
                label={
                  <span>
                    วันที่<span style={{ color: "red", marginLeft: 2 }}>*</span>
                  </span>
                }
                name="date2"
                value={form.date2}
                onChange={handleChange}
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
              externalOptions={
                [
                  /* … */
                ]
              }
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
              externalOptions={
                [
                  /* … */
                ]
              }
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
              externalOptions={
                [
                  /* … */
                ]
              }
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
              externalOptions={
                [
                  /* … */
                ]
              }
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
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setForm((prev) => ({
                            ...prev,
                            attachment: file.name,
                          }));
                        }
                      }}
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
            px: { xs: 2, sm: 2, md: 0 }, // เพิ่ม padding ซ้าย-ขวา เมื่อขนาดหน้าจอเป็น sm หรือต่ำกว่า
          }}
        >
          <Box sx={{ width: { xs: "100%", md: "18%" } }}>
            <ButtonService
              label="ล้าง"
              variant="outlined"
              iconLeft={<CloseIcon />}
              onClick={() => {
                /* TODO: clear form */
              }}
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
              onClick={() => {
                /* TODO: save form */
              }}
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
