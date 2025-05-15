import React, { useState } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from "@mui/material";
import styles from "./PopularQuestionsStats.module.scss";

const mockData = {
  "มกราคม 2568": [
    "ประเทศไทยมีแนวทางจัดการหนี้สาธารณะอย่างไรให้เกิดความยั่งยืน (7 ม.ค. 2568)",
    "จะมีการปรับโครงสร้างภาษีบุคคลธรรมดาหรือไม่ (7 ม.ค. 2568)",
    "กระทรวงการคลังมีแนวทางการกระตุ้นเศรษฐกิจปีนี้อย่างไร (6 ม.ค. 2568)",
    "กระทรวงการคลังมีโครงการช่วยเหลือผู้มีรายได้น้อยอย่างไรบ้างในปีนี้ (5 ม.ค. 2568)",
    "มีแนวทางสนับสนุนการลงทุนจากประเทศเพิ่มหรือไม่ (4 ม.ค. 2568)",
  ],
  "กุมภาพันธ์ 2568": ["คำถามตัวอย่างจาก ก.พ."],
};

const PopularQuestionsStats = () => {
  const [selectedMonth, setSelectedMonth] = useState("มกราคม 2568");

  return (
    <Box className={styles["question-container"]}>
      <Box className={styles["question-header"]}>
        <Typography variant="h6">
          คำถามใหม่ ณ เดือน{selectedMonth}
        </Typography>
        <FormControl size="small" className={styles.dropdown}>
          <InputLabel>เดือน</InputLabel>
          <Select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            label="เดือน"
          >
            {Object.keys(mockData).map((month) => (
              <MenuItem key={month} value={month}>
                {month}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <ul className={styles["question-list"]}>
        {(mockData[selectedMonth] || []).map((q, i) => (
          <li key={i}>
            <span className={styles["number-circle"]}>{i + 1}</span>
            <span className={styles["question-text"]}>{q}</span>
          </li>
        ))}
      </ul>
    </Box>
  );
};

export default PopularQuestionsStats;
