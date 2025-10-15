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
import { sanitizeForStorage } from "@utils/sanitizeNewsHtml";

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
          // console.log("Fetched News:", newsData);
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

  const fullImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `https://complain.mof.go.th/api${url}`;
  };

  const handleImagesUpdate = (newImages) => {
    const imageArray = Array.isArray(newImages) ? newImages : [];

    const updatedImages = imageArray.map(fullImageUrl);

    // console.log("🟢 Final image array:", updatedImages);

    setImages(updatedImages);
    setGalleryImages(updatedImages);
    setCoverImageUrl(updatedImages[0] || "");
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
    // เช็คว่าถ้าไม่ใช่ showAlways แต่ไม่ได้เลือกวันที่
    if (!showAlways && (!expireDate || !expireDate.isValid())) {
      alert("กรุณาเลือกวันที่สิ้นสุดการแสดงผล");
      return;
    }

    const cleanedContent = sanitizeForStorage(content, {
      imgBase: "https://complain.mof.go.th/api"
    });

    const cleanedGalleryImages = (galleryImages || [])
      .filter((img) => typeof img === "string")
      .map((img) =>
        img.startsWith("blob:") ? img.replace("blob:", "") : img
      );

    const cleanedCoverImageUrl =
      typeof coverImageUrl === "string" && coverImageUrl.trim() !== ""
        ? coverImageUrl.startsWith("blob:")
          ? coverImageUrl.replace("blob:", "")
          : coverImageUrl
        : (galleryImages.length > 0 ? galleryImages[0] : "");

    // 🎯 จัดการวันที่ให้ถูกต้อง
    let finalDisplayStartDate, finalDisplayEndDate;

    if (showAlways) {
      // แสดงผลตลอด: ใช้วันที่ไกลมาก
      finalDisplayStartDate = displayStartDate.toISOString();
      finalDisplayEndDate = dayjs().add(100, 'year').toISOString();
    } else {
      // กำหนดระยะเวลา: ต้องมี end date และต้องมากกว่า start date
      finalDisplayStartDate = displayStartDate.toISOString();

      if (!displayEndDate || !displayEndDate.isValid()) {
        alert("กรุณาเลือกวันที่สิ้นสุดการแสดงผล");
        return;
      }

      // ตรวจสอบว่า end date มากกว่า start date
      if (displayEndDate.isBefore(displayStartDate) || displayEndDate.isSame(displayStartDate)) {
        alert("วันที่สิ้นสุดต้องมากกว่าวันที่เริ่มต้น");
        return;
      }

      finalDisplayEndDate = displayEndDate.endOf('day').toISOString(); // ใช้เวลาสิ้นสุดของวัน
    }

    const newData = {
      title,
      content: cleanedContent,
      cover_image_url: cleanedCoverImageUrl,
      gallery_images: cleanedGalleryImages,
      additional_links: additionalLinks,
      show_views: showViews,
      is_published: true,
      display_start_date: finalDisplayStartDate,
      display_end_date: finalDisplayEndDate,
      show_always: showAlways,
    };

    console.log("📤 Data to send:", newData);
    console.log("🔍 is_published value:", newData.is_published);
    console.log("🔍 showAlways:", showAlways);
    console.log("🔍 finalDisplayEndDate:", finalDisplayEndDate);

    try {
      let result;
      if (id && method === "EditNew") {
        result = await updateNews(id, newData);
        console.log("✅ Update result:", result);
      } else {
        console.log("📤 Final createData:", newData);
        result = await createNews(newData);
        console.log("✅ Created news:", result);
      }

      // 🛡️ BACKUP PLAN: หาก Backend ยัง set is_published = false อยู่
      // ให้ทำการ update อีกครั้งหลังจาก save แล้ว
      if (result && result.id && !result.is_published && showAlways) {
        console.log("🔄 Backup fix: Force updating is_published to true");
        try {
          await updateNews(result.id, { 
            is_published: true,
            display_end_date: dayjs().add(100, 'year').toISOString() // ยืนยันวันที่ไกลอีกครั้ง
          });
          console.log("✅ Backup fix successful");
        } catch (backupError) {
          console.warn("⚠️ Backup fix failed:", backupError);
        }
      }

      router.push("/admin/homepage/news");
    } catch (error) {
      console.error("❌ Error submitting the data", error.message);
      console.error("❌ Full error:", error);
      console.error("❌ Response data:", error.response?.data);
      console.error("❌ Response status:", error.response?.status);

      // แสดง alert ให้เห็นชัดเจน
      alert(`เกิดข้อผิดพลาด: ${JSON.stringify(error.response?.data || error.message)}`);
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