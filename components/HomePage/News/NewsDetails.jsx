import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  Grid,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import dayjs from "dayjs";
import { createNews, updateNews, getNewsById } from "@pages/api/news/news";
import ImageUpload from "@services/ImageUpload/ImageUpload";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import { showConfirm2 } from "@utils/Alerts";
import BreadcrumbsServiceF from "@services/BreadCrumbs/breadcrumbsFunction";
import RichTextEditor from "@services/RichTextEditor/RichTextEditor";

export default function NewsDetails() {
  const router = useRouter();
  const { query, isReady } = router;
  const { id, method } = query;
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));

  // สเตทต่างๆ สำหรับเก็บข้อมูลข่าวสาร  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [pinTop, setPinTop] = useState(false);
  const [publish, setPublish] = useState(true);
  const [expireDate, setExpireDate] = useState(dayjs().add(21, "day"));
  const [images, setImages] = useState([]); // เก็บข้อมูลรูปภาพ
  const [coverImageUrl, setCoverImageUrl] = useState(""); // รูปภาพหลัก
  const [galleryImages, setGalleryImages] = useState([]); // รูปภาพในแกลเลอรี
  const [additionalLinks, setAdditionalLinks] = useState([]);
  const [displayStartDate, setDisplayStartDate] = useState(dayjs());
  const [displayEndDate, setDisplayEndDate] = useState(dayjs().add(180, "days"));
  const [isDirty, setIsDirty] = useState(false);

  // ฟังก์ชันดึงข้อมูลข่าวสารเมื่อแก้ไข
  useEffect(() => {
    if (isReady && method === "EditNew" && id) {
      const fetchNews = async () => {
        try {
          const newsData = await getNewsById(id); // ดึงข้อมูลข่าวจาก ID
          console.log("Fetched News:", newsData);
          if (newsData) {
            setTitle(newsData.title || "");
            setContent(newsData.content || "");
            setUrl(newsData.url || "");
            setPinTop(newsData.pinTop || false);
            setPublish(newsData.is_published || true);
            setExpireDate(newsData.expireDate || dayjs().add(21, "day"));
            setCoverImageUrl(newsData.cover_image_url || "");
            setGalleryImages(newsData.gallery_images || []);
            setAdditionalLinks(newsData.additional_links || []);
            setDisplayStartDate(dayjs(newsData.display_start_date));
            setDisplayEndDate(dayjs(newsData.display_end_date));
          }
        } catch (error) {
          console.error("Error fetching news by ID:", error);
        }
      };

      fetchNews();
    }
  }, [isReady, method, id]); // ใช้ `id` และ `method` ใน `useEffect`

  // ฟังก์ชันจัดการการอัพเดทรูปภาพจาก ImageUpload
  const handleImagesUpdate = (newImages) => {
    console.log("Images from ImageUpload:", newImages);
    setImages(newImages);
    setGalleryImages(newImages); // ตั้งค่า gallery_images
    // ตั้งรูปแรกเป็น cover_image_url
    if (newImages && newImages.length > 0) {
      setCoverImageUrl(newImages[0]);
    } else {
      setCoverImageUrl("");
    }
    setIsDirty(true);
  };

  const handleSubmit = async () => {
    console.log("Before submit - Images:", images);
    console.log("Before submit - Gallery Images:", galleryImages);
    console.log("Before submit - Cover Image URL:", coverImageUrl);
    console.log("Before submit - Additional Links:", additionalLinks);


    const newData = {
      title,
      content,
      cover_image_url: coverImageUrl, // ส่ง cover_image_url
      gallery_images: galleryImages, // ส่ง gallery_images 
      additional_links: additionalLinks, // ส่ง additional_links
      is_published: publish,
      display_start_date: displayStartDate.toISOString(),
      display_end_date: displayEndDate.toISOString(),
      date: dayjs().format("D MMM YYYY"),
      update: dayjs().format("D MMM YYYY"),
      status: `หายไปในวันที่ ${dayjs(expireDate).format("D MMM YYYY")} (21 วัน)`,
      views: 0,
    };

    console.log("Data to send:", newData);

    try {
      if (id) {
        // ถ้าเป็นการแก้ไขข่าว
        await updateNews(id, newData);
      } else {
        // ถ้าเป็นการสร้างข่าวใหม่
        const createdNews = await createNews(newData);
      }

      router.push("/admin/homepage/news"); // นำทางไปยังหน้ารายการข่าว
    } catch (error) {
      console.error("Error submitting the data", error.message);
    }
  };

  // ฟังก์ชันสำหรับการยืนยันการยกเลิก
  const handleBreadcrumbClick = async (url) => {
    if (!isDirty) {
      router.push(url);
      return;
    }

    const confirmed = await showConfirm2(
      `<span style="color:#932626;">ยกเลิกการแสดงข่าวสาร</span>`,
      `<div><strong style="color:#932626;">การยกเลิกแสดงข่าวสารจะเป็นการย้ายรายการนี้ไปยังคลังเก็บข้อมูลในฐานข้อมูล<br />
      ซึ่งสามารถกู้คืนได้จากระบบหากจำเป็น และจะไม่แสดงผลในหน้านี้อีก<br /><br />
      ยืนยันการยกเลิกแสดงข่าวสารนี้หรือไม่?</strong>
        </div>`,
      "ยืนยัน",
      "ยกเลิก",
      800
    );

    if (confirmed) {
      setIsDirty(false);
      router.push(url);
    }
  };

  const breadcrumbItems = [
    {
      label: (
        <span style={{ color: "#1120A3" }}>
          กำหนดข่าวสาร
        </span>
      ),
      icon: (
        <img
          src="/icons/config.png"
          alt="icon"
          style={{
            width: "24px",
            height: "24px",
            marginBottom: "-8px",
            borderRadius: "50%",
            border: "2px solid #1120A3",
            padding: "2px",
          }}
        />
      ),
      onClick: () => handleBreadcrumbClick("/admin/homepage/news"),
    },
    {
      label: (
        <span style={{ color: "#1120A3" }}>
          {method === "EditNew" ? "แก้ไขข่าวสาร" : "เพิ่มข่าวสาร"}
        </span>
      ),
    },
  ];

  return (
    <Box sx={{ background: "#f5f7fb", py: isSmDown ? 2 : 4, minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ maxWidth: { xs: "100%", md: "1400px" }, px: { xs: 1, sm: 2, md: 4 } }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: isSmDown ? 1 : 2 }}>
          <BreadcrumbsServiceF items={breadcrumbItems} />
        </Stack>
        <Box
          sx={{
            border: "2px solid #007AFF",
            borderRadius: 2,
            background: "#fff",
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            mx: { xs: 0, md: "auto" },
          }}
        >
          <Box sx={{ height: 30, background: "linear-gradient(to right, #1223A5, #2499FF)" }} />
          <Box sx={{ p: { xs: 2, sm: 3, md: 5 } }}>
            <Stack spacing={isSmDown ? 2 : 3}>
              <Typography color="#1120A3" fontWeight="bold" fontSize={isSmDown ? 14 : 16}>
                หัวข้อข่าวสาร
              </Typography>
              <TextField
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{
                  border: "1px solid #007AFF",
                  borderRadius: 2,
                  "& fieldset": { border: "none" },
                  fontSize: isSmDown ? 14 : 16,
                }}
                InputProps={{
                  style: { fontSize: isSmDown ? 14 : 16 },
                }}
              />


              <Typography color="#1120A3" fontWeight="bold" fontSize={isSmDown ? 14 : 16}>
                เนื้อหาข่าวสาร
              </Typography>
              <Box>
                <RichTextEditor value={content} onChange={setContent} />
              </Box>

              {/* <Typography color="#1120A3" fontWeight="bold" fontSize={isSmDown ? 14 : 16}>
                แนบลิงก์ URL
              </Typography>
              <TextField
                fullWidth
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                sx={{
                  border: "1px solid #007AFF",
                  borderRadius: 2,
                  "& fieldset": { border: "none" },
                  fontSize: isSmDown ? 14 : 16,
                }}
                InputProps={{
                  style: { fontSize: isSmDown ? 14 : 16 },
                }}
              /> */}

              {/* เพิ่มส่วน Additional Links */}
              <Typography color="#1120A3" fontWeight="bold" fontSize={isSmDown ? 14 : 16}>
                ลิงก์เพิ่มเติม
              </Typography>
              <Box>
                {additionalLinks.map((link, index) => (
                  <Box key={index} sx={{ 
                    border: "1px solid #007AFF", 
                    borderRadius: 2, 
                    p: 2, 
                    mb: 2,
                    backgroundColor: "#f8f9ff"
                  }}>
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        label="ชื่อลิงก์"
                        value={link.title || ""}
                        onChange={(e) => {
                          const newLinks = [...additionalLinks];
                          newLinks[index] = { ...newLinks[index], title: e.target.value };
                          setAdditionalLinks(newLinks);
                          setIsDirty(true);
                        }}
                        size="small"
                      />
                      <TextField
                        fullWidth
                        label="URL"
                        value={link.url || ""}
                        onChange={(e) => {
                          const newLinks = [...additionalLinks];
                          newLinks[index] = { ...newLinks[index], url: e.target.value };
                          setAdditionalLinks(newLinks);
                          setIsDirty(true);
                        }}
                        size="small"
                      />
                      <TextField
                        fullWidth
                        label="คำอธิบาย"
                        value={link.description || ""}
                        onChange={(e) => {
                          const newLinks = [...additionalLinks];
                          newLinks[index] = { ...newLinks[index], description: e.target.value };
                          setAdditionalLinks(newLinks);
                          setIsDirty(true);
                        }}
                        size="small"
                        multiline
                        rows={2}
                      />
                      <Button
                        color="error"
                        onClick={() => {
                          const newLinks = additionalLinks.filter((_, i) => i !== index);
                          setAdditionalLinks(newLinks);
                          setIsDirty(true);
                        }}
                        size="small"
                      >
                        ลบลิงก์
                      </Button>
                    </Stack>
                  </Box>
                ))}
                <Button
                  onClick={() => {
                    const newLinks = [...additionalLinks, { title: "", url: "", description: "" }];
                    setAdditionalLinks(newLinks);
                    setIsDirty(true);
                  }}
                  variant="outlined"
                  sx={{ mb: 2 }}
                >
                  เพิ่มลิงก์

                </Button>
              </Box>

              <Stack spacing={isSmDown ? 1 : 2}>
                <Box display="flex" justifyContent={isSmDown ? "flex-start" : "flex-end"}>
                  <Stack direction={isSmDown ? "column" : "row"} spacing={isSmDown ? 1 : 2}>
                    <FormControlLabel
                      control={<Checkbox checked={pinTop} onChange={(e) => setPinTop(e.target.checked)} />}
                      label="แสดงผลยอด"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={publish} onChange={(e) => setPublish(e.target.checked)} />}
                      label="กำหนดระยะเวลา"
                    />
                  </Stack>
                </Box>
                <Grid container spacing={isSmDown ? 1 : 2} alignItems="flex-start">
                  <Grid item xs={12} md={8}>
                    <ImageUpload images={images} setImages={handleImagesUpdate} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ minWidth: 220, mt: isSmDown ? 2 : 0 }}>
                      <DateThaiPickerService name="expireDate" onChange={setExpireDate} />
                    </Box>
                  </Grid>
                </Grid>
              </Stack>

              <Box textAlign="center" mt={isSmDown ? 2 : 4}>
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  sx={{
                    background: "#1120A3",
                    borderRadius: 2,
                    fontWeight: "bold",
                    width: isSmDown ? "100%" : 230,
                    height: isSmDown ? 44 : 56,
                    fontSize: isSmDown ? 14 : 16,
                  }}
                >
                  โพสต์
                </Button>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
