import { Box, Typography, FormControl, Select, MenuItem } from "@mui/material";
import { useState } from "react";
import styles from "./PopularNewsStats.module.scss";

const PopularNewsStats = () => {
  const [selectedMonth, setSelectedMonth] = useState("มกราคม");

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  return (
    <Box className={styles.popularNewsStats}>
      <Typography variant="h6" fontWeight="bold" className={styles.title}>
        สถิติข่าวสารที่ได้รับความนิยม มีผู้เข้าชมมากที่สุด 5 อันดับแรก ณ เดือนมกราคม 2568
      </Typography>
      
      <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 2 }}>
        <Typography variant="body1" sx={{ marginRight: 2 }}>
          เดือน :
        </Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <Select
            value={selectedMonth}
            onChange={handleMonthChange}
            displayEmpty
            variant="outlined"
            sx={{ 
              backgroundColor: "#fff",
              borderRadius: "4px",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#ccc"
              }
            }}
          >
            <MenuItem value="มกราคม">มกราคม</MenuItem>
            <MenuItem value="กุมภาพันธ์">กุมภาพันธ์</MenuItem>
            <MenuItem value="มีนาคม">มีนาคม</MenuItem>
            <MenuItem value="เมษายน">เมษายน</MenuItem>
            <MenuItem value="พฤษภาคม">พฤษภาคม</MenuItem>
            <MenuItem value="มิถุนายน">มิถุนายน</MenuItem>
            <MenuItem value="กรกฎาคม">กรกฎาคม</MenuItem>
            <MenuItem value="สิงหาคม">สิงหาคม</MenuItem>
            <MenuItem value="กันยายน">กันยายน</MenuItem>
            <MenuItem value="ตุลาคม">ตุลาคม</MenuItem>
            <MenuItem value="พฤศจิกายน">พฤศจิกายน</MenuItem>
            <MenuItem value="ธันวาคม">ธันวาคม</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <div className={styles.newsList}>
        <div className={styles.newsItem}>
          <div className={styles.rankWrapper} >
            <Typography variant="body1" className={styles.rank}>1</Typography>
          </div>
          <Typography variant="body1" className={styles.newsTitle}>แสดงความยินดี บสย. วันคล้ายวันสถาปนาก้าวสู่ปีที่ 34</Typography>
          <Typography variant="body2" className={styles.viewCount}>519</Typography>
        </div>
        <div className={styles.newsItem}>
          <div className={styles.rankWrapper} >
            <Typography variant="body1" className={styles.rank}>2</Typography>
          </div>
          <Typography variant="body1" className={styles.newsTitle}>พิธีมอบรางวัลองค์กรที่มีความเป็นเลิศในการบริหารจัดการด้านการเงินการคลัง ครั้งที่ 10 ประจำปีงบประมาณ พ.ศ. 2566</Typography>
          <Typography variant="body2" className={styles.viewCount}>489</Typography>
        </div>
        <div className={styles.newsItem}>
          <div className={styles.rankWrapper} >
            <Typography variant="body1" className={styles.rank}>3</Typography>
          </div>
          <Typography variant="body1" className={styles.newsTitle}>ตรวจราชการ จ.ปทุมธานี</Typography>
          <Typography variant="body2" className={styles.viewCount}>319</Typography>
        </div>
        <div className={styles.newsItem}>
          <div className={styles.rankWrapper} >
            <Typography variant="body1" className={styles.rank}>4</Typography>
          </div>
          <Typography variant="body1" className={styles.newsTitle}>เปิดโครงการ "สภาก กซ. สัญจรทั่วไทย"</Typography>
          <Typography variant="body2" className={styles.viewCount}>212</Typography>
        </div>
        <div className={styles.newsItem}>
          <div className={styles.rankWrapper} >
            <Typography variant="body1" className={styles.rank}>5</Typography>
          </div>
          <Typography variant="body1" className={styles.newsTitle}>พิธีมอบสัญญาเช่าที่ราชพัสดุ ประจำปีงบประมาณ พ.ศ. 2568 ภายใต้โครงการอนุรักษ์เฮือราษฎร์ "สัญญาเช่าที่ดิน พลิกชีวิตประชาชน"</Typography>
          <Typography variant="body2" className={styles.viewCount}>111</Typography>
        </div>
      </div>
    </Box>
  );
};

export default PopularNewsStats;
