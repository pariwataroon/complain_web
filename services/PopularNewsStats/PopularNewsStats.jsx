import { Box, Typography, FormControl, Select, MenuItem } from "@mui/material";
import { useState, useMemo } from "react";
import styles from "./PopularNewsStats.module.scss";

const PopularNewsStats = () => {
  const [selectedMonth, setSelectedMonth] = useState("มิถุนายน"); // ตั้งเป็นเดือนปัจจุบัน

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  // Mock data ตามเดือน
  const newsDataByMonth = {
    "มกราคม": [
      {
        rank: 1,
        title: "แสดงความยินดี บสย. วันคล้ายวันสถาปนาก้าวสู่ปีที่ 34",
        viewCount: 519
      },
      {
        rank: 2,
        title: "พิธีมอบรางวัลองค์กรที่มีความเป็นเลิศในการบริหารจัดการด้านการเงินการคลัง ครั้งที่ 10",
        viewCount: 489
      },
      {
        rank: 3,
        title: "ตรวจราชการ จ.ปทุมธานี",
        viewCount: 319
      },
      {
        rank: 4,
        title: "เปิดโครงการ \"สภาก กซ. สัญจรทั่วไทย\"",
        viewCount: 212
      },
      {
        rank: 5,
        title: "พิธีมอบสัญญาเช่าที่ราชพัสดุ ประจำปีงบประมาณ พ.ศ. 2568",
        viewCount: 111
      }
    ],
    "กุมภาพันธ์": [
      {
        rank: 1,
        title: "การประชุมคณะกรรมการบริหาร บสย. ครั้งที่ 2/2568",
        viewCount: 642
      },
      {
        rank: 2,
        title: "โครงการพัฒนาบุคลากรสู่ความเป็นเลิศ ปี 2568",
        viewCount: 534
      },
      {
        rank: 3,
        title: "การตรวจสอบระบบคุณภาพองค์กร ISO 9001:2015",
        viewCount: 428
      },
      {
        rank: 4,
        title: "แนวทางการดำเนินงานตามนโยบายรัฐบาลดิจิทัล",
        viewCount: 356
      },
      {
        rank: 5,
        title: "การประเมินผลการปฏิบัติราชการประจำปี 2567",
        viewCount: 289
      }
    ],
    "มีนาคม": [
      {
        rank: 1,
        title: "งานแสดงสินค้าและบริการ OTOP ระดับจังหวัด",
        viewCount: 758
      },
      {
        rank: 2,
        title: "โครงการส่งเสริมการท่องเที่ยวชุมชน \"เที่ยวไทยแบบย่นยั่ง\"",
        viewCount: 612
      },
      {
        rank: 3,
        title: "การฝึกอบรมเชิงปฏิบัติการ \"การจัดการข้อมูลดิจิทัล\"",
        viewCount: 445
      },
      {
        rank: 4,
        title: "แนวทางการส่งเสริมเกษตรอินทรีย์ในพื้นที่ชนบท",
        viewCount: 387
      },
      {
        rank: 5,
        title: "การพัฒนาระบบสารสนเทศเพื่อการบริหารจัดการ",
        viewCount: 314
      }
    ],
    "เมษายน": [
      {
        rank: 1,
        title: "เทศกาลสงกรานต์ \"รักษ์น้ำ รักษ์ไทย\" ประจำปี 2568",
        viewCount: 891
      },
      {
        rank: 2,
        title: "โครงการอนุรักษ์วัฒนธรรมไทยสู่อนุชนรุ่นหลัง",
        viewCount: 687
      },
      {
        rank: 3,
        title: "การประกวดหมู่บ้านท่องเที่ยว OTOP ดีเด่น",
        viewCount: 523
      },
      {
        rank: 4,
        title: "นโยบายการส่งเสริมการลงทุนในพื้นที่เศรษฐกิจพิเศษ",
        viewCount: 456
      },
      {
        rank: 5,
        title: "การประชุมสัมมนาเครือข่ายพัฒนาท้องถิ่น",
        viewCount: 392
      }
    ],
    "พฤษภาคม": [
      {
        rank: 1,
        title: "พระราชพิธีบรมราชาภิเษก วันคล้ายวันฉัตรมงคล",
        viewCount: 1245
      },
      {
        rank: 2,
        title: "โครงการพัฒนาเกษตรกรรมยั่งยืน \"เกษตรสีเขียว\"",
        viewCount: 834
      },
      {
        rank: 3,
        title: "การประชุมหารือแนวทางการพัฒนาเศรษฐกิจฐานราก",
        viewCount: 687
      },
      {
        rank: 4,
        title: "โครงการส่งเสริมการศึกษาตลอดชีวิตในชุมชน",
        viewCount: 542
      },
      {
        rank: 5,
        title: "การติดตามประเมินผลโครงการพัฒนาท้องถิ่น",
        viewCount: 423
      }
    ],
    "มิถุนายน": [
      {
        rank: 1,
        title: "การดำเนินงานโครงการพัฒนาดิจิทัลไทยแลนด์ 4.0",
        viewCount: 892
      },
      {
        rank: 2,
        title: "งานประชุมสัมมนาเครือข่ายองค์กรปกครองส่วนท้องถิ่น",
        viewCount: 745
      },
      {
        rank: 3,
        title: "โครงการส่งเสริมการผลิตพลังงานหมุนเวียนในชุมชน",
        viewCount: 634
      },
      {
        rank: 4,
        title: "การอบรมเชิงปฏิบัติการ \"การจัดการขยะชุมชนแบบครบวงจร\"",
        viewCount: 521
      },
      {
        rank: 5,
        title: "แนวทางการส่งเสริมการท่องเที่ยวเชิงวัฒนธรรม",
        viewCount: 456
      }
    ],
    "กรกฎาคม": [
      {
        rank: 1,
        title: "เฉลิมพระเกียรติ วันเฉลิมพระชนมพรรษา พระบาทสมเด็จพระเจ้าอยู่หัว",
        viewCount: 1156
      },
      {
        rank: 2,
        title: "โครงการส่งเสริมการเรียนรู้ตลอดชีวิตในยุคดิจิทัล",
        viewCount: 723
      },
      {
        rank: 3,
        title: "การประชุมคณะกรรมการพัฒนาเศรษฐกิจและสังคมแห่งชาติ",
        viewCount: 612
      },
      {
        rank: 4,
        title: "แนวทางการส่งเสริมการลงทุนในภาคการเกษตร",
        viewCount: 489
      },
      {
        rank: 5,
        title: "โครงการพัฒนาสมรรถนะบุคลากรภาครัฐ",
        viewCount: 387
      }
    ],
    "สิงหาคม": [
      {
        rank: 1,
        title: "เฉลิมพระเกียรติ วันคล้ายวันเฉลิมพระชนมพรรษา สมเด็จพระนางเจ้าฯ",
        viewCount: 1034
      },
      {
        rank: 2,
        title: "การประชุมสัมมนาแนวทางการส่งเสริมการท่องเที่ยวยั่งยืน",
        viewCount: 678
      },
      {
        rank: 3,
        title: "โครงการพัฒนาเทคโนโลยีสารสนเทศเพื่อการบริการประชาชน",
        viewCount: 567
      },
      {
        rank: 4,
        title: "การอบรมหลักสูตร \"ผู้นำการเปลี่ยนแปลงดิจิทัล\"",
        viewCount: 445
      },
      {
        rank: 5,
        title: "แนวทางการส่งเสริมเศรษฐกิจสร้างสรรค์ในชุมชน",
        viewCount: 356
      }
    ],
    "กันยายน": [
      {
        rank: 1,
        title: "การประชุมสมัชชาใหญ่สหประชาชาติ สมัยที่ 78",
        viewCount: 934
      },
      {
        rank: 2,
        title: "โครงการส่งเสริมการพัฒนาเด็กปฐมวัยแบบองค์รวม",
        viewCount: 723
      },
      {
        rank: 3,
        title: "การประชุมหารือแนวทางการจัดการน้ำอย่างยั่งยืน",
        viewCount: 612
      },
      {
        rank: 4,
        title: "โครงการส่งเสริมการใช้พลังงานทดแทนในชุมชน",
        viewCount: 534
      },
      {
        rank: 5,
        title: "การอบรมเชิงปฏิบัติการ \"การบริหารจัดการความเสี่ยง\"",
        viewCount: 445
      }
    ],
    "ตุลาคม": [
      {
        rank: 1,
        title: "วันปิยมหาราช วันคล้ายวันสวรรคต พระบาทสมเด็จพระจุลจอมเกล้าเจ้าอยู่หัว",
        viewCount: 1267
      },
      {
        rank: 2,
        title: "โครงการส่งเสริมการผลิตและการตลาดสินค้าเกษตรปลอดภัย",
        viewCount: 834
      },
      {
        rank: 3,
        title: "การประชุมสัมมนา \"การพัฒนาเมืองอัจฉริยะ (Smart City)\"",
        viewCount: 723
      },
      {
        rank: 4,
        title: "แนวทางการส่งเสริมการศึกษาเพื่อพัฒนาทักษะแห่งศตวรรษที่ 21",
        viewCount: 612
      },
      {
        rank: 5,
        title: "โครงการอนุรักษ์และพัฒนาแหล่งท่องเที่ยวเชิงประวัติศาสตร์",
        viewCount: 489
      }
    ],
    "พฤศจิกายน": [
      {
        rank: 1,
        title: "ลอยกระทง ประเพณีไทยสู่สากล \"งามอย่างไทย ใสอย่างน้ำ\"",
        viewCount: 1045
      },
      {
        rank: 2,
        title: "การประชุมสุดยอดเอเปค (APEC Summit) ประจำปี 2568",
        viewCount: 789
      },
      {
        rank: 3,
        title: "โครงการส่งเสริมการพัฒนาเทคโนโลยีสะอาดในอุตสาหกรรม",
        viewCount: 667
      },
      {
        rank: 4,
        title: "การอบรมหลักสูตร \"การบริหารจัดการน้ำแบบบูรณาการ\"",
        viewCount: 534
      },
      {
        rank: 5,
        title: "แนวทางการส่งเสริมการค้าขายผ่านแพลตฟอร์มดิจิทัล",
        viewCount: 423
      }
    ],
    "ธันวาคม": [
      {
        rank: 1,
        title: "วันคล้ายวันเฉลิมพระชนมพรรษา พระบาทสมเด็จพระเจ้าอยู่หัว",
        viewCount: 1534
      },
      {
        rank: 2,
        title: "การประชุมสรุปผลการดำเนินงานประจำปี 2568",
        viewCount: 923
      },
      {
        rank: 3,
        title: "โครงการส่งเสริมการท่องเที่ยวช่วงเทศกาลปีใหม่",
        viewCount: 812
      },
      {
        rank: 4,
        title: "การวางแผนการพัฒนาเศรษฐกิจและสังคมประจำปี 2569",
        viewCount: 687
      },
      {
        rank: 5,
        title: "โครงการส่งเสริมการใช้เทคโนโลยีดิจิทัลในการศึกษา",
        viewCount: 534
      }
    ]
  };

  // ใช้ useMemo เพื่อ optimize การคำนวณ
  const currentNewsData = useMemo(() => {
    return newsDataByMonth[selectedMonth] || newsDataByMonth["มิถุนายน"];
  }, [selectedMonth]);

  return (
    <Box className={styles.popularNewsStats}>
      {/* Header with gradient background */}
      <div className={styles.header}>
        <Typography variant="h6" className={styles.title}>
          สถิติข่าวสารที่ได้รับความนิยม มีผู้เข้าชมมากที่สุด 5 อันดับแรก ณ เดือน{selectedMonth} 2568
        </Typography>
      </div>

      {/* Content area */}
      <div className={styles.content}>
        {/* Month selector */}
        <Box className={styles.monthSelector}>
          <Typography variant="body1" className={styles.monthLabel}>
            เดือน :
          </Typography>
          <FormControl className={styles.selectControl}>
            <Select
              value={selectedMonth}
              onChange={handleMonthChange}
              displayEmpty
              variant="outlined"
              className={styles.monthSelect}
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

        {/* News list */}
        <div className={styles.newsList}>
          {currentNewsData.map((news, index) => (
            <div key={`${selectedMonth}-${index}`} className={styles.newsItem}>
              <div className={`${styles.rankWrapper} ${styles[`rank${news.rank}`]}`}>
                <Typography variant="body1" className={styles.rank}>
                  {news.rank}
                </Typography>
              </div>
              <Typography variant="body1" className={styles.newsTitle}>
                {news.title}
              </Typography>
              <Typography variant="body2" className={styles.viewCount}>
                {news.viewCount}
              </Typography>
            </div>
          ))}
        </div>

      </div>
    </Box>
  );
};

export default PopularNewsStats;