import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getPublishedNewsById } from "@pages/api/news/news"; // API function to get the news by ID
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
  const router = useRouter();
  const { id } = router.query; // Get the news ID from the URL
  const [newsData, setNewsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    try {
      const data = await getPublishedNewsById(id); // Fetch news data by ID
      if (data && data.res_data) {
        setNewsData(data.res_data); // Set the news data
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching news by ID:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchNews(); // Fetch news data when the `id` changes
    }
  }, [id]);

  if (loading) return <div>กำลังโหลดข้อมูล...</div>;
  if (!newsData) return <div>ไม่พบข้อมูลข่าวสาร</div>;

  return (
    <div className={styles.newsContainer}>
      <div className={styles.headerImage}>
        <img src={newsData?.cover_image_url} alt="ข่าวสารหัวข้อ" />
      </div>

      <h1 className={styles.newsTitle}>{newsData?.title}</h1>

      <div className={styles.metaInfo}>
        <CalendarTodayIcon fontSize="small" />
        <span>{`วันที่เผยแพร่ข้อมูล ${new Date(newsData?.created_at).toLocaleDateString('th-TH')}`}</span>

        <HistoryIcon fontSize="small" />
        <span>{`วันที่ปรับปรุงข้อมูล ${new Date(newsData?.updated_at).toLocaleDateString('th-TH')}`}</span>

        <VisibilityIcon fontSize="small" />
        <span>{`${newsData?.view_count} view`}</span>

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
        <p>{newsData?.content}</p>
      </div>

      <div className={styles.galleryTitle}>รูปภาพกิจกรรม</div>

      <div className={styles.galleryContainer}>
        {newsData?.gallery_images && newsData.gallery_images.length > 0 ? (
          newsData.gallery_images.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`กิจกรรม ${index + 1}`}
              className={styles.galleryImage}
            />
          ))
        ) : (
          <p>ไม่พบรูปภาพกิจกรรม</p>
        )}
      </div>
    </div>
  );
};

export default NewsComponent;
