import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import ButtonService from "@services/ButtonService/ButtonService";

const Tab4 = ({ onBack = () => {}, onSubmit = () => {} }) => {
  const [accepted, setAccepted] = useState(false);

  return (
    <Box>
      {/* Yellow gradient header bar */}
      <Box
        sx={{
          height: 40,
          background: "linear-gradient(to right, #EDC458, #FEFAEF)",
          borderTopRightRadius: 8,
        }}
      />
      {/* Main white card */}
      <Paper sx={{ mt: -1, p: 4, borderRadius: 2 }}>
        {/* Title */}
        <Typography
          variant="h5"
          align="center"
          sx={{ color: "#0B1F8F", mb: 3 }}
        >
          นโยบายการแจ้งเรื่องร้องทุกข์
        </Typography>

        {/* วัตถุประสงค์ */}
        <Typography
          variant="subtitle1"
          sx={{ color: "#0B1F8F", fontWeight: "bold" }}
        >
          วัตถุประสงค์
        </Typography>
        <Typography sx={{ mb: 2, lineHeight: 1.6 }}>
          เว็บไซต์นี้จัดทำขึ้นเพื่อให้ประชาชนสามารถแจ้งเรื่องราวร้องทุกข์
          แจ้งเบาะแส เสนอความคิดเห็น ได้อย่างสะดวก รวดเร็ว และโปร่งใส
          โดยข้อมูลที่แจ้งจะถูกนำไปพิจารณา และดำเนินการตามขั้นตอนที่เหมาะสม
        </Typography>

        {/* ข้อกำหนดการยื่นเรื่องราวร้องทุกข์ */}
        <Typography
          variant="subtitle1"
          sx={{ color: "#0B1F8F", fontWeight: "bold" }}
        >
          ข้อกำหนดการยื่นเรื่องราวร้องทุกข์
        </Typography>
        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
          <li>
            เรื่องที่ร้องเรียน/ร้องทุกข์
            ต้องเป็นเรื่องที่มีชื่อหรือศักยภาพและผู้ร้องได้รับความเดือดร้อนหรือเสียหาย
          </li>
          <li>
            ผู้ร้องเรียนต้องระบุเหตุอันเป็นเหตุให้ต้องร้องเรียน/ร้องทุกข์
            พร้อมข้อมูลพฤติการณ์ของเรื่อง
          </li>
          <li>ระบุพยานเอกสาร พยานวัตถุ และพยานบุคคล (ถ้ามี)</li>
        </Box>

        {/* การรับรองความถูกต้องของข้อมูล */}
        <Typography
          variant="subtitle1"
          sx={{ color: "#0B1F8F", fontWeight: "bold" }}
        >
          การรับรองความถูกต้องของข้อมูล
        </Typography>
        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
          <li>
            ผู้ร้องเรียนต้องรับผิดชอบต่อข้อมูลที่ให้
            และยินยอมให้ใช้ข้อมูลในการตรวจสอบและดำเนินการ
          </li>
          <li>
            หากแจ้งข้อมูลเท็จ ผู้ร้องเรียนต้องรับผิดชอบต่อความเสียหายที่เกิดขึ้น
          </li>
        </Box>

        {/* Confirmation checkbox */}
        <FormControlLabel
          control={
            <Checkbox
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
          }
          label="ข้าพเจ้ายอมรับว่าข้อเท็จจริงที่ได้ยื่นเรื่องร้องเรียน/ร้องทุกข์ข้างต้นเป็นความจริงทุกประการ"
          sx={{ mb: 3 }}
        />

        {/* Navigation Buttons */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
          <ButtonService
            label="ย้อนกลับ"
            variant="outlined"
            onClick={onBack}
            color="#EDC458"
            disabled={false}
            sx={{ width: "auto" }}
          />
          <ButtonService
            label="แจ้งเรื่องร้องทุกข์"
            variant="contained"
            onClick={onSubmit}
            color="#EDC458"
            disabled={!accepted}
            sx={{ width: "auto" }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default Tab4;
