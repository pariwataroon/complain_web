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
    "มีแนวทางสนับสนุนการลงทุนจากประเทศเพื่อนบ้านเพิ่มหรือไม่ (4 ม.ค. 2568)",
  ],
  "กุมภาพันธ์ 2568": [
    "แนวทางการพัฒนาระบบการเงินการคลังดิจิทัลในปี 2568 (15 ก.พ. 2568)",
    "การปรับปรุงกฎหมายภาษีเพื่อรองรับเศรษฐกิจดิจิทัล (14 ก.พ. 2568)",
    "มาตรการสนับสนุนการส่งออกในช่วงเศรษฐกิจโลกชะลอตัว (13 ก.พ. 2568)",
    "แนวทางการบริหารจัดการเงินสำรองระหว่างประเทศ (12 ก.พ. 2568)",
    "การส่งเสริมการลงทุนในโครงสร้างพื้นฐานดิจิทัล (11 ก.พ. 2568)",
  ],
  "มีนาคม 2568": [
    "นโยบายการส่งเสริมการใช้เทคโนโลยี Blockchain ในภาครัฐ (20 มี.ค. 2568)",
    "แนวทางการพัฒนาตลาดทุนเพื่อ SMEs และ Startup (19 มี.ค. 2568)",
    "การปรับปรุงระบบจัดเก็บภาษีให้มีประสิทธิภาพมากขึ้น (18 มี.ค. 2568)",
    "มาตรการป้องกันความเสี่ยงทางการเงินจากภัยไซเบอร์ (17 มี.ค. 2568)",
    "แนวทางการส่งเสริมการออมและการลงทุนของประชาชน (16 มี.ค. 2568)",
  ],
  "เมษายน 2568": [
    "การพัฒนาระบบการชำระเงินแบบไร้เงินสดในประเทศ (25 เม.ย. 2568)",
    "นโยบายการส่งเสริมการใช้สกุลเงินดิจิทัลของธนาคารกลาง (24 เม.ย. 2568)",
    "แนวทางการจัดการเงินเฟ้อและเสถียรภาพทางเศรษฐกิจ (23 เม.ย. 2568)",
    "การส่งเสริมการลงทุนในพลังงานหมุนเวียนและเทคโนโลยีสะอาด (22 เม.ย. 2568)",
    "มาตรการสนับสนุนผู้ประกอบการรายย่อยในยุคดิจิทัล (21 เม.ย. 2568)",
  ],
  "พฤษภาคม 2568": [
    "การบูรณาการระบบข้อมูลการเงินการคลังภาครัฐ (30 พ.ค. 2568)",
    "นโยบายการส่งเสริมการค้าชายแดนในภูมิภาคอาเซียน (29 พ.ค. 2568)",
    "แนวทางการพัฒนาตลาดตราสารหนี้ภาครัฐและเอกชน (28 พ.ค. 2568)",
    "การส่งเสริมการใช้เทคโนโลยี AI ในการบริหารการเงินการคลัง (27 พ.ค. 2568)",
    "มาตรการป้องกันการฟอกเงินและการสนับสนุนการก่อการร้าย (26 พ.ค. 2568)",
  ],
  "มิถุนายน 2568": [
    "แนวทางการพัฒนาระบบประกันภัยดิจิทัลในประเทศไทย (16 มิ.ย. 2568)",
    "การส่งเสริมการลงทุนในโครงการคาร์บอนเครดิต (15 มิ.ย. 2568)",
    "นโยบายการสนับสนุนการพัฒนาธุรกิจฟินเทคในไทย (14 มิ.ย. 2568)",
    "แนวทางการบริหารจัดการหนี้ครัวเรือนอย่างยั่งยืน (13 มิ.ย. 2568)",
    "การพัฒนาระบบการเงินการคลังเพื่อรองรับการท่องเที่ยว (12 มิ.ย. 2568)",
  ],
};

const PopularQuestionsStats = () => {
  const [selectedMonth, setSelectedMonth] = useState("มิถุนายน 2568"); // ตั้งเป็นเดือนปัจจุบัน

  return (
    <Box className={styles["question-container"]}>
      {/* Header */}
      <div className={styles["question-header"]}>
        <Typography variant="h6" className={styles.title}>
          คำถามใหม่ ณ เดือน{selectedMonth}
        </Typography>
      </div>

      {/* Content Area */}
      <div className={styles["question-content"]}>
        {/* Month Selector */}
        <Box className={styles["month-selector"]}>
          <Typography variant="body1" className={styles["month-label"]}>
            เดือน :
          </Typography>
          <FormControl size="small" className={styles.dropdown}>
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              displayEmpty
              variant="outlined"
              className={styles["month-select"]}
            >
              {Object.keys(mockData).map((month) => (
                <MenuItem key={month} value={month}>
                  {month}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Questions List */}
        <ul className={styles["question-list"]}>
          {(mockData[selectedMonth] || []).map((q, i) => (
            <li key={i} className={styles["question-item"]}>
              <span className={styles["number-circle"]}>{i + 1}</span>
              <span className={styles["question-text"]}>{q}</span>
            </li>
          ))}
        </ul>

        {/* Progress Indicator */}
        <div className={styles["progress-indicator"]}>
          <div className={styles["progress-bar"]}></div>
        </div>
      </div>
    </Box>
  );
};

export default PopularQuestionsStats;