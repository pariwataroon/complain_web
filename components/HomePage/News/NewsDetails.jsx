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
  const [showViews, setShowViews] = useState(true);
  const [showAlways, setShowAlways] = useState(false);
  const [expireDate, setExpireDate] = useState(null); // เปลี่ยนเป็น null
  const [images, setImages] = useState([]);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [galleryImages, setGalleryImages] = useState([]);
  const [additionalLinks, setAdditionalLinks] = useState([
    { title: "Line", url: "", description: "" },
    { title: "Facebook", url: "", description: "" },
    { title: "Twitter", url: "", description: "" }
  ]);
  const [displayStartDate, setDisplayStartDate] = useState(dayjs());
  const [displayEndDate, setDisplayEndDate] = useState(null); // เปลี่ยนเป็น null
  const [isDirty, setIsDirty] = useState(false);

  // ฟังก์ชันดึงข้อมูลข่าวสารเมื่อแก้ไข
  useEffect(() => {
    if (isReady && method === "EditNew" && id) {
      const fetchNews = async () => {
        try {
          const newsData = await getNewsById(id);
          console.log("Fetched News:", newsData);
          if (newsData) {
            setTitle(newsData.title || "");
            setContent(newsData.content || "");
            setUrl(newsData.url || "");
            setShowViews(newsData.show_views !== undefined ? newsData.show_views : true);
            setShowAlways(newsData.show_always || false);
            
            // ดึงข้อมูลรูปภาพ
            setCoverImageUrl(newsData.cover_image_url || "");
            setGalleryImages(newsData.gallery_images || []);
            setImages(newsData.gallery_images || []); // ตั้งค่า images ด้วย
            
            // ดึงข้อมูลวันที่ - แปลงให้เป็น dayjs object ที่ถูกต้อง
            if (newsData.display_end_date) {
              try {
                const endDate = dayjs(newsData.display_end_date);
                if (endDate.isValid()) {
                  setExpireDate(endDate);
                  setDisplayEndDate(endDate);
                } else {
                  setExpireDate(null);
                  setDisplayEndDate(null);
                }
              } catch (dateError) {
                console.error("Error parsing display_end_date:", dateError);
                setExpireDate(null);
                setDisplayEndDate(null);
              }
            } else {
              setExpireDate(null);
              setDisplayEndDate(null);
            }
            
            if (newsData.display_start_date) {
              try {
                const startDate = dayjs(newsData.display_start_date);
                if (startDate.isValid()) {
                  setDisplayStartDate(startDate);
                }
              } catch (dateError) {
                console.error("Error parsing display_start_date:", dateError);
              }
            }
            
            // จัดการ additional_links
            if (newsData.additional_links && newsData.additional_links.length > 0) {
              const defaultLinks = [
                { title: "Line", url: "", description: "" },
                { title: "Facebook", url: "", description: "" },
                { title: "Twitter", url: "", description: "" }
              ];
              
              newsData.additional_links.forEach((link, index) => {
                if (index < 3) {
                  defaultLinks[index] = { ...defaultLinks[index], ...link };
                }
              });
              
              setAdditionalLinks(defaultLinks);
            }
          }
        } catch (error) {
          console.error("Error fetching news by ID:", error);
        }
      };

      fetchNews();
    } else if (isReady && method !== "EditNew") {
      // สำหรับโหมด create ให้ตั้งค่าเริ่มต้นเป็น null
      setExpireDate(null);
      setDisplayEndDate(null);
      setDisplayStartDate(dayjs()); // วันที่เริ่มต้นเป็นวันนี้
    }
  }, [isReady, method, id]);

  // ฟังก์ชันจัดการการอัพเดทรูปภาพจาก ImageUpload
  const handleImagesUpdate = (newImages) => {
    console.log("Images from ImageUpload:", newImages);
    setImages(newImages);
    setGalleryImages(newImages);
    if (newImages && newImages.length > 0) {
      setCoverImageUrl(newImages[0]);
    } else {
      setCoverImageUrl("");
    }
    setIsDirty(true);
  };

  // ฟังก์ชันจัดการการเปลี่ยนแปลงวันที่สิ้นสุด
  const handleExpireDateChange = (newDate) => {
    try {
      const validDate = dayjs(newDate);

      if (validDate.isValid()) {
        // ตรวจสอบว่าผู้ใช้เลือกวันที่เกิน 1000 วันหรือไม่
        const daysDifference = validDate.diff(dayjs(), "day");

        if (daysDifference > 1000) {
          // หากเกิน 1000 วันให้แสดง "ไม่จำกัด"
          setExpireDate(null);
          setDisplayEndDate(null);
          setIsDirty(true);
          return; // ไม่ต้องตั้งค่าเวลาใด ๆ
        }

        // หากวันที่ไม่เกิน 1000 วัน
        setExpireDate(validDate);
        setDisplayEndDate(validDate);
        setIsDirty(true);
      } else {
        // หากวันที่ไม่ถูกต้องให้ตั้งเป็น null
        setExpireDate(null);
        setDisplayEndDate(null);
      }
    } catch (error) {
      console.error("Error handling date change:", error);
      setExpireDate(null);
      setDisplayEndDate(null);
    }
  };

  const handleSubmit = async () => {
    console.log("Before submit - Images:", images);
    console.log("Before submit - Gallery Images:", galleryImages);
    console.log("Before submit - Cover Image URL:", coverImageUrl);
    console.log("Before submit - Additional Links:", additionalLinks);

    // เช็คว่าถ้าไม่ใช่ showAlways แต่ไม่ได้เลือกวันที่
    if (!showAlways && (!expireDate || !expireDate.isValid())) {
      alert("กรุณาเลือกวันที่สิ้นสุดการแสดงผล");
      return;
    }

    const cleanedGalleryImages = galleryImages.map(img => 
      img.startsWith('blob:') ? img.replace('blob:', '') : img
    );
    const cleanedCoverImageUrl = coverImageUrl.startsWith('blob:') 
      ? coverImageUrl.replace('blob:', '') 
      : coverImageUrl;

    // กำหนดวันที่แสดงผลตาม showAlways
    let finalDisplayStartDate, finalDisplayEndDate;
    
    if (showAlways) {
      // แสดงผลตลอด - ไม่ส่งวันที่
      finalDisplayStartDate = null;
      finalDisplayEndDate = null;
    } else {
      // ใช้ระยะเวลาที่กำหนด
      finalDisplayStartDate = displayStartDate.toISOString();
      finalDisplayEndDate = displayEndDate ? displayEndDate.toISOString() : null;
    }

    // ปรับปรุงการกำหนด status
    let status;
    if (showAlways) {
      status = "ไม่จำกัดเวลา";
    } else {
      status = expireDate ? `แสดงผลถึงวันที่ ${dayjs(expireDate).format("D MMM YYYY")}` : "ไม่ได้กำหนดวันที่";
    }

    const newData = {
      title,
      content,
      cover_image_url: cleanedCoverImageUrl,
      gallery_images: cleanedGalleryImages,
      additional_links: additionalLinks,
      show_views: showViews,
      show_always: showAlways,
      ...(showAlways ? {} : {
        display_start_date: finalDisplayStartDate,
        display_end_date: finalDisplayEndDate,
      }),
      date: dayjs().format("D MMM YYYY"),
      update: dayjs().format("D MMM YYYY"),
      status: status,
      views: 0,
      pinTop: false,
    };

    console.log("Data to send:", newData);

    try {
      if (id) {
        await updateNews(id, newData);
      } else {
        const createData = {
          ...newData,
          display_start_date: showAlways 
            ? dayjs().toISOString() 
            : dayjs().toISOString(),
        };
        const createdNews = await createNews(createData);
      }

      router.push("/admin/homepage/news");
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
                onChange={(e) => {
                  setTitle(e.target.value);
                  setIsDirty(true);
                }}
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
                <RichTextEditor 
                  value={content} 
                  onChange={(value) => {
                    setContent(value);
                    setIsDirty(true);
                  }} 
                />
              </Box>

              {/* ส่วน Additional Links - 3 ลิงก์ตายตัว */}
              <Typography color="#1120A3" fontWeight="bold" fontSize={isSmDown ? 14 : 16}>
                ลิงก์โซเชียลมีเดีย
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
                      <Typography variant="h6" color="#1120A3" fontWeight="bold">
                        {link.title}
                      </Typography>
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
                        placeholder={`ใส่ลิงก์ ${link.title} ของคุณ`}
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
                        placeholder={`คำอธิบายสำหรับ ${link.title}`}
                      />
                    </Stack>
                  </Box>
                ))}
              </Box>

              <Stack spacing={isSmDown ? 1 : 2}>
                {/* ส่วนเลือกประเภทการแสดงผล */}
                <Box display="flex" justifyContent={isSmDown ? "flex-start" : "flex-end"}>
                  <Stack direction={isSmDown ? "column" : "row"} spacing={isSmDown ? 1 : 2}>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={showAlways} 
                          onChange={(e) => {
                            setShowAlways(e.target.checked);
                            setIsDirty(true);
                          }} 
                        />
                      }
                      label="แสดงผลตลอด"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={!showAlways} 
                          onChange={(e) => {
                            setShowAlways(!e.target.checked);
                            setIsDirty(true);
                          }} 
                        />
                      }
                      label="กำหนดระยะเวลา"
                    />
                  </Stack>
                </Box>

                {/* ส่วนอัพโหลดรูปภาพและเลือกวันที่ */}
                <Grid container spacing={isSmDown ? 1 : 2} alignItems="flex-start">
                  <Grid item xs={12} md={showAlways ? 12 : 8}>
                    <ImageUpload images={images} setImages={handleImagesUpdate} />
                  </Grid>
                  {!showAlways && (
                    <Grid item xs={12} md={4}>
                      <Box sx={{ minWidth: 220, mt: isSmDown ? 2 : 0 }}>
                        <Typography color="#1120A3" fontWeight="bold" fontSize={isSmDown ? 12 : 14} sx={{ mb: 1 }}>
                          วันที่สิ้นสุดการแสดงผล
                        </Typography>
                        <DateThaiPickerService 
                          name="expireDate" 
                          value={expireDate?.isValid() ? expireDate.toDate() : null}
                          onChange={handleExpireDateChange}
                          placeholder="เลือกวันที่สิ้นสุด"
                        />
                      </Box>
                    </Grid>
                  )}
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