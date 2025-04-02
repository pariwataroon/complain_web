import React, { useState } from "react";
import styles from "./NewsComponent.module.scss";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import VisibilityIcon from "@mui/icons-material/Visibility";
import HistoryIcon from "@mui/icons-material/History";
const LineIcon = () => (
  <img src="/icons/lineicon.png" alt="Line Icon" width="24px" height="24px" />
);

const NewsComponent = () => {
  // สามารถปรับจำนวนรูปภาพตามที่ต้องการ - ระบบจะปรับการแสดงผลอัตโนมัติ
  const imageUrls = [
    "https://picsum.photos/300/200?random=2",
    "https://picsum.photos/300/200?random=3",
    "https://picsum.photos/300/200?random=4",
    "https://picsum.photos/300/200?random=5",
    "https://picsum.photos/300/200?random=6",
    "https://picsum.photos/300/200?random=7",
    "https://picsum.photos/300/200?random=8",
    "https://picsum.photos/300/200?random=9",
  ];

  const [selectedImage, setSelectedImage] = useState(null);

  const openModal = (imageUrl) => {
    console.log(imageUrl);
    setSelectedImage(imageUrl); // Set selected image for modal
  };

  const closeModal = () => {
    setSelectedImage(null); // Close modal
  };

  // Prevent closing modal when clicking on the image itself
  const handleImageClick = (e) => {
    e.stopPropagation();
  };

  // ฟังก์ชันสำหรับกำหนด class ของ grid ตามจำนวนรูปภาพ
  const getGridClassName = () => {
    const count = imageUrls.length;

    if (count === 1) return styles.singleImage;
    if (count === 2) return styles.twoImages;
    if (count === 3) return styles.threeImages;
    if (count === 4) return styles.fourImages;
    if (count === 5) return styles.fiveImages;
    if (count === 6) return styles.sixImages;
    if (count === 7) return styles.sevenImages;
    if (count === 8) return styles.eightImages;

    return styles.eightImages; // default for more than 8 images
  };

  return (
    <div className={styles.newsContainer}>
      <div className={styles.headerImage}>
        <img src="/images/exampleNews01.png" alt="No Gift Policy 2568 Header" />
      </div>

      <h1 className={styles.newsTitle}>
        NO GIFT POLICY 2568 การมอบนโยบายงดรับของขวัญและของกำนัลทุกชนิด
        จากการปฏิบัติหน้าที่ประจำปีงบประมาณ พ.ศ. 2568 และการส่งเสริมคุณธรรม
        และจริยธรรมในการปฏิบัติงาน
      </h1>

      <div className={styles.metaInfo}>
        <CalendarTodayIcon fontSize="small" />
        <span>วันที่เผยแพร่ข้อมูล 17 ม.ค. 2568</span>

        <HistoryIcon fontSize="small" />
        <span>วันที่ปรับปรุงข้อมูล 18 ม.ค. 2568</span>

        <VisibilityIcon fontSize="small" />
        <span>1,235 view</span>
        <div className={styles.shareButtons}>
          <button className={`${styles.shareButton} ${styles.link}`}>
            <ContentCopyIcon fontSize="small" />
          </button>
          <button className={`${styles.shareButton} ${styles.line}`}>
            <LineIcon />
          </button>
          <button className={`${styles.shareButton} ${styles.facebook}`}>
            <FacebookIcon fontSize="small" />
          </button>
          <button className={`${styles.shareButton} ${styles.twitter}`}>
            <TwitterIcon fontSize="small" />
          </button>
        </div>
      </div>

      <div className={styles.newsContent}>
        <p>
          เมื่อวันที่ 17 มกราคม 2568 ณ อาคารการพัฒนาอาคารสุด จัดกิจกรรม
          นายจารุรัช พงษ์ประภาส อธิบดีกรมการพัฒนา ประกาศนโยบายมาตรฐานแนวปฏิบัติ
          "การไม่รับของขวัญและของกำนัลทุกชนิด (No Gift Policy) ประจำปีงบประมาณ
          พ.ศ. 2568 โดยได้เน้นย้ำข้าราชการและเจ้าหน้าที่ปฏิบัติตามนโยบาย
          โดยไม่ใช้ตำแหน่งหน้าที่หรือการปฏิบัติหน้าที่
          เพื่อแสวงหาประโยชน์ที่มิควรได้ปฏิบัติหน้าที่
        </p>
      </div>

      <div className={styles.galleryTitle}>รูปภาพกิจกรรม</div>

      {imageUrls.length > 0 && (
        <div className={`${styles.imageGrid} ${getGridClassName()}`}>
          {imageUrls.map((url, index) => (
            <div
              key={index}
              className={styles.imageItem}
              onClick={() => openModal(url)}
            >
              <img src={url} alt={`กิจกรรม ${index + 1}`} />
            </div>
          ))}
        </div>
      )}

      {/* Modal for showing the full image */}
      <div
        className={`${styles.modal} ${selectedImage ? styles.active : ""}`}
        onClick={closeModal}
      >
        {selectedImage && (
          <img
            src={selectedImage}
            alt="Selected Activity"
            onClick={handleImageClick}
          />
        )}
      </div>
    </div>
  );
};

export default NewsComponent;
