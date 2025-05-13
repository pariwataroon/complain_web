import { Box, Typography } from "@mui/material";
// import { Swiper, SwiperSlide } from "swiper/react";
// import 'swiper/css';
// import 'swiper/css/pagination';
// import { Pagination } from 'swiper';

const PopularQuestionsStats = () => {
  const questions = [
    {
      id: 1,
      text: "ประเทศไทยมีแนวทางจัดการหนี้สาธารณะอย่างไรให้เกิดความยั่งยืน (7 ม.ค. 2568)",
    },
    {
      id: 2,
      text: "จะมีการปรับโครงสร้างภาษีบุคคลธรรมดาหรือไม่ (7 ม.ค. 2568)",
    },
    {
      id: 3,
      text: "กระทรวงการคลังมีแนวทางการกระตุ้นเศรษฐกิจปีนี้อย่างไร (6 ม.ค. 2568)",
    },
    {
      id: 4,
      text: "กระทรวงการคลังมีโครงการช่วยเหลือผู้มีรายได้ต่ำอย่างไรบ้างในปีนี้ (5 ม.ค. 2568)",
    },
    {
      id: 5,
      text: "มีแนวทางสนับสนุนการลงทุนจากประเทศเพิ่มหรือไม่ (4 ม.ค. 2568)",
    },
  ];

  return (
    <Box sx={{ background: "#fbe8c2", borderRadius: 2, p: 3, boxShadow: 2 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
        คำถามใหม่
      </Typography>
      {/* <Swiper
        spaceBetween={10}
        slidesPerView={1}
        loop={true}
        // pagination={{
        //   clickable: true,
        //   dynamicBullets: true,
        // }}
        // modules={[Pagination]}
        className="mySwiper"
      >
        {questions.map((question) => (
          <SwiperSlide key={question.id}>
            <Box
              sx={{
                background: "#fff",
                borderRadius: 2,
                p: 3,
                boxShadow: 2,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="body1">{question.text}</Typography>
            </Box>
          </SwiperSlide>
        ))}
      </Swiper> */}
    </Box>
  );
};

export default PopularQuestionsStats;
