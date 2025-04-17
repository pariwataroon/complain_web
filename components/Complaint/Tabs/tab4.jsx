import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  FormControlLabel,
  Checkbox,
} from "@mui/material";


const Tab4 = ({
  stepKey,
  updateStepData,
  onAccepted = () => { },
}) => {
  const [accepted, setAccepted] = useState(false);

  const handleCheckChange = (e) => {
    const value = e.target.checked;
    setAccepted(value);
    onAccepted(value);

    updateStepData(stepKey, "general", { accepted: value });
  };


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
      <Paper sx={{ mt: -1, p: 4, borderRadius: 2 }}>
        {/* Title */}
        <Typography
          variant="h5"
          align="center"
          sx={{ color: "#0B1F8F", mb: 3, fontWeight: 800 }}
        >
          นโยบายการแจ้งเรื่องร้องทุกข์
        </Typography>

        {/* วัตถุประสงค์ */}
        <Typography
          variant="h5"
          sx={{ color: "#0B1F8F", fontWeight: 800 }}
        >
          วัตถุประสงค์
        </Typography>
        <Typography variant="subtitle1"  sx={{ mb: 2, lineHeight: 1.6 }}>
          เว็บไซต์นี้จัดทำขึ้นเพื่อให้ประชาชนสามารถแจ้งเรื่องราวร้องทุกข์
          แจ้งเบาะแส เสนอความคิดเห็น ได้อย่างสะดวก รวดเร็ว และโปร่งใส
          โดยข้อมูลที่แจ้งจะถูกนำไปพิจารณา และดำเนินการตามขั้นตอนที่เหมาะสม
        </Typography>

        {/* ข้อกำหนดการยื่นเรื่องราวร้องทุกข์ */}
        <Typography
          variant="h5"
          sx={{ color: "#0B1F8F", fontWeight: 800 }}
        >
          ข้อกำหนดการยื่นเรื่องราวร้องทุกข์
        </Typography>
        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
          <li>
            <Typography variant="subtitle1">
              เรื่องที่นำมาร้องเรียน/ร้องทุกข์ ต้องเป็นเรื่องที่ใช้ถ้อยคำสุภาพและเป็นกรณีผู้ร้องได้รับความเดือดร้อน
              หรือเสียหาย หรือขอความช่วยเหลืออันเนื่องมาจากเจ้าหน้าที่ หรือหน่วยงานในสังกัดกระทรวงการคลัง
            </Typography>
          </li>
          <li>
            <Typography variant="subtitle1">
              ผู้ร้องเรียนต้องระบุเรื่องอันเป็นเหตุให้ต้องร้องเรียน/ร้องทุกข์ พร้อมทั้งข้อเท็จจริง หรือพฤติการณ์ของเรื่องที่ร้องเรียน/ร้องทุกข์
              <br />
              ได้อย่างชัดเจนว่า ได้รับความเดือดร้อนหรือเสียหายอย่างไร ต้องการให้แก้ไข ดำเนินการอย่างไร
              หรือชี้ช่องทางเบาะแสเกี่ยวกับพฤติกรรมของเจ้าหน้าที่ หน่วยงาน ได้ชัดแจ้งเพียงพอที่สามารถดำเนินการ สืบสวน สอบสวนได้
            </Typography>
          </li>
          <li>
            <Typography variant="subtitle1">
              ระบุพยานเอกสาร พยานวัตถุ และพยานบุคคล (ถ้ามี)
            </Typography>
          </li>
        </Box>


        {/* การรับรองความถูกต้องของข้อมูล */}
        <Typography
          variant="h5"
          sx={{ color: "#0B1F8F", fontWeight: 800 }}
        >
          การรับรองความถูกต้องของข้อมูล
        </Typography>
        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
          <li>
            <Typography variant="subtitle1">
              ผู้ร้องเรียนต้องรับผิดชอบต่อข้อมูลที่ให้ไว้ และยินยอมให้หน่วยงานที่เกี่ยวข้องนำข้อมูลไปใช้ในการตรวจสอบและดำเนินการ
            </Typography>
          </li>
          <li>
            <Typography variant="subtitle1">
              หากผู้ร้องนำความเท็จมาร้องเรียน/ร้องทุกข์ ซึ่งทำให้ผู้อื่นได้รับความเสียหาย ผู้ร้องต้องรับผิดชอบต่อความเสียหายนั้นทุกประการ

            </Typography>
          </li>
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={accepted}
              onChange={handleCheckChange}
            />
          }
          label="ข้าพเจ้ายอมรับว่าข้อเท็จจริงที่ได้ยื่นเรื่องร้องเรียน/ร้องทุกข์ข้างต้นเป็นความจริงทุกประการ"
          sx={{ mb: 3 }}
        />

       
      </Paper>
    </Box>
  );
};

export default Tab4;
