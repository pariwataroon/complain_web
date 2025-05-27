import React, { useState } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import SelectField from "@services/SelectField/SelectField";
import InputText from "@services/InputText/InputText";
import InputDateNoTime from "@services/InputDateNoTime/InputDateNoTime";
import ButtonService from "@services/ButtonService/ButtonService";
import { Box, Typography } from "@mui/material";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseIcon from "@mui/icons-material/Close";

const InitialNotificationComplainantAgency = () => {
  const { id } = useRouter().query;
  const [form, setForm] = useState({
    salutation: "",
    refNo: "",
    date: "",
    subject: "",
    department: "",
    signer: "",
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
              label={
                <span>
                  เรียน<span style={{ color: "red", marginLeft: 4 }}>*</span>
                </span>
              }
              name="salutation"
              value={form.salutation}
              onChange={handleChange}
            />
            <InputText
              label={
                <span>
                  เลขที่หนังสือ
                  <span style={{ color: "red", marginLeft: 4 }}>*</span>
                </span>
              }
              inputLabel="กรอกเลขที่หนังสือ"
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
                name="date"
                value={form.date}
                onChange={handleChange}
              />
            </Box>
          </Box>

          {/* Row 2: เรื่อง* */}
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

          {/* Row 3: หน่วยงาน / ผู้ร้อง* */}
          <Box>
            <SelectField
              label={
                <span>
                  หน่วยงาน / ผู้ร้อง
                  <span style={{ color: "red", marginLeft: 2 }}>*</span>
                </span>
              }
              name="department"
              value={form.department}
              onChange={handleChange}
            />
          </Box>

          {/* Row 4: ผู้ลงนาม* */}
          <Box>
            <SelectField
              label={
                <span>
                  ผู้ลงนาม<span style={{ color: "red", marginLeft: 2 }}>*</span>
                </span>
              }
              name="signer"
              value={form.signer}
              onChange={handleChange}
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
              label={
                <span>
                  ชั้นความลับ
                  <span style={{ color: "red", marginLeft: 2 }}>*</span>
                </span>
              }
              name="confidentiality"
              value={form.confidentiality}
              onChange={handleChange}
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
            />
          </Box>

          {/* Row 6: เอกสารแนบ* */}
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
                        style={{ width: 24, height: 24, marginTop: 6 }}
                      />
                    </label>
                  </>
                ),
              }}
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

export default InitialNotificationComplainantAgency;
