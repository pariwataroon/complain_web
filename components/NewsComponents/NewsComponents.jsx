import React, { useMemo, useState, useEffect } from "react";
import { sanitizeForDisplay } from "@utils/sanitizeNewsHtml";
import { useRouter } from "next/router";
import { getPublishedNewsById } from "@pages/api/news/news"; // API function to get the news by ID
import styles from "./NewsComponent.module.scss"; // เพิ่มการ import สไตล์จากไฟล์ SCSS
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import VisibilityIcon from "@mui/icons-material/Visibility";
import HistoryIcon from "@mui/icons-material/History";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";

// ฟังก์ชันสำหรับแสดงไอคอน Line
const LineIcon = () => (
  <img src="/icons/lineicon.png" alt="Line Icon" width="24px" height="24px" />
);

const NewsComponent = () => {
  const router = useRouter();
  const { id } = router.query;
  const [newsData, setNewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  // ฟังก์ชันดึงข้อมูลข่าวสารตาม ID
  const fetchNews = async () => {
    try {
      const data = await getPublishedNewsById(id);
      if (data && data.res_data) {
        setNewsData(data.res_data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching news by ID:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchNews();
    }
  }, [id]);

  // กรณีที่ไม่สามารถโหลดภาพได้
  const fallbackImage =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpe8Naj6LbXz7o_Gn6S9GszsfiRNZ5t3xJxA&s";

  // ฟังก์ชันคัดลอก URL
  const handleCopyLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl).catch((error) => {
      console.error("ไม่สามารถคัดลอกลิงก์ได้:", error);
    });
  };

  // ฟังก์ชันเปิด URL จากข้อมูลใน additional_links
  const handleShareClick = (title) => {
    const link = newsData?.additional_links?.find(
      (link) => link.title.toLowerCase() === title.toLowerCase()
    );
    if (link) {
      window.open(link.url, "_blank"); // เปิด URL ในแท็บใหม่
    } else {
      // console.log("URL not found for:", title); // ถ้าไม่พบ URL
    }
  };

  // ฟังก์ชันเช็คว่า URL มีหรือไม่
  const isLinkAvailable = (title) => {
    return newsData?.additional_links?.some(
      (link) =>
        link.title.toLowerCase() === title.toLowerCase() && link.url
    );
  };

  const safeContent = useMemo(() => {
    if (typeof window === "undefined") return newsData?.content || "";
    return sanitizeForDisplay(newsData?.content || "", {
      imgBase: "https://complain.mof.go.th/api",
    });
  }, [newsData?.content]);

  // ย้าย early return มาไว้หลัง hooks ทั้งหมด
  if (loading) return <div>กำลังโหลดข้อมูล...</div>;
  if (!newsData) return <div>ไม่พบข้อมูลข่าวสาร</div>;

  // เปิด Dialog เพื่อแสดงภาพขนาดใหญ่
  const handleImageClick = (url) => {
    setSelectedImage(url); // ตั้งค่าภาพที่เลือก
    setOpenImageDialog(true); // เปิด Dialog
  };

  // ปิด Dialog
  const handleCloseDialog = () => {
    setOpenImageDialog(false);
  };

  return (
    <div className={styles.newsContainer}>
      {/* ส่วนหัวของข่าวสาร */}
      <div className={styles.headerImage}>
        <img
          style={{
          width: '100%',
          height: '100%',
          display: 'block',
          objectFit: 'cover',
          maxWidth: '100%', 
        }}
          src={newsData?.cover_image_url || fallbackImage}
          alt="ข่าวสารหัวข้อ"
          className={styles.coverImage}
          onError={(e) => (e.target.src = fallbackImage)}
        />
      </div>

      {/* ชื่อข่าวสาร */}
      <h1 className={styles.newsTitle}>{newsData?.title}</h1>

      <div className={styles.metaInfo}>
        <CalendarTodayIcon fontSize="small" />
        <span>{`วันที่เผยแพร่ข้อมูล ${new Date(
          newsData?.created_at
        ).toLocaleDateString("th-TH")}`}</span>

        <HistoryIcon fontSize="small" />
        <span>{`วันที่ปรับปรุงข้อมูล ${new Date(
          newsData?.updated_at
        ).toLocaleDateString("th-TH")}`}</span>

        <VisibilityIcon fontSize="small" />
        <span>{`${newsData?.view_count} view`}</span>

        {/* ปุ่มแชร์ */}
        <div className={styles.shareButtons}>
          <button
            className={`${styles.shareButton} ${styles.link}`}
            onClick={handleCopyLink}
            disabled={!isLinkAvailable("line")} // Disable if no URL available for Line
          >
            <ContentCopyIcon fontSize="small" />
          </button>
          <button
            className={`${styles.shareButton} ${styles.line}`}
            onClick={() => handleShareClick("Line")}
            disabled={!isLinkAvailable("Line")} // Disable if no URL available for Line
          >
            <LineIcon />
          </button>
          <button
            className={`${styles.shareButton} ${styles.facebook}`}
            onClick={() => handleShareClick("Facebook")}
            disabled={!isLinkAvailable("Facebook")} // Disable if no URL available for Facebook
          >
            <FacebookIcon fontSize="small" />
          </button>
          <button
            className={`${styles.shareButton} ${styles.twitter}`}
            onClick={() => handleShareClick("Twitter")}
            disabled={!isLinkAvailable("Twitter")} // Disable if no URL available for Twitter
          >
            <TwitterIcon fontSize="small" />
          </button>
        </div>
      </div>

      {/* เนื้อหาข่าวสาร */}
      <div
        className={styles.newsContent}
        dangerouslySetInnerHTML={{ __html: safeContent }}
      />

      {/* รูปภาพกิจกรรม */}
      <div className={styles.galleryTitle}>รูปภาพกิจกรรม</div>

      {/* แกลเลอรี่ของรูปภาพ */}
      <div className={styles.galleryContainer}>
        {newsData?.gallery_images && newsData.gallery_images.length > 0 ? (
          newsData.gallery_images.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`กิจกรรม ${index + 1}`}
              className={styles.galleryImage}
              onError={(e) => (e.target.src = fallbackImage)}
              onClick={() => handleImageClick(url)} // เปิด Dialog เมื่อคลิก
            />
          ))
        ) : (
          <p>ไม่พบรูปภาพกิจกรรม</p>
        )}
      </div>

      {/* Dialog สำหรับแสดงภาพขนาดใหญ่ */}
      <Dialog
  open={openImageDialog}
  onClose={handleCloseDialog}
  sx={{
    "& .MuiDialog-paper": {
      boxShadow: "none",
      borderRadius: "8px",
      padding: 0,
    },
  }}
>
  <DialogContent sx={{ p: 0, overflow: "hidden" }}>
    <img
      src={selectedImage}
      alt="Selected Image"
      style={{ width: "500px", height: "auto", display: "block" }}
      onError={(e) => (e.target.src = fallbackImage)}
    />
  </DialogContent>
</Dialog>

    </div>
  );
};

export default NewsComponent;
