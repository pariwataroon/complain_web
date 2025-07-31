import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Box, Typography, Grid, Button, CardMedia, Stack, Tooltip } from "@mui/material";
import { getDisplayableNews } from "@pages/api/news/news"; // Fetch news data from API

const Homepage5 = () => {
  const router = useRouter();
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch displayable news when the component mounts
  useEffect(() => {
    const fetchDisplayableNews = async () => {
      try {
        const newsData = await getDisplayableNews(0, 10, ""); // Fetch displayable news

        // Filter the news by 'is_published' and sort the news items by 'created_at' from latest to oldest
        const filteredNewsData = newsData
          .filter((news) => news.is_published) // Filter only the news that is published
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Sort by created_at

        setNewsList(filteredNewsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching displayable news:", error);
        setLoading(false);
      }
    };

    fetchDisplayableNews();
  }, []); // Runs only once when the component is mounted

  const handleImageClick = (id) => {
    // Redirect to the news detail page when a news item is clicked
    router.push(`/news?id=${id}`);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <Typography variant="h6">กำลังโหลดข้อมูล...</Typography>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Title of the page */}
      <h2 style={{ marginBottom: "20px", fontSize: "24px", fontWeight: "bold" }}>
        ข่าวสารและประชาสัมพันธ์
      </h2>

      {/* ภาพแบนเนอร์ใหญ่ */}
      <div
        style={{
          position: "relative",
          marginBottom: "20px",
          overflow: "hidden",
          borderRadius: "8px",
        }}
        onClick={() => handleImageClick(newsList[0]?.id)} // คลิกไปที่ข่าวแรก
      >
        <img
          src={newsList[0]?.cover_image_url || "https://picsum.photos/1200/400?random=1"} // ใช้ภาพจาก API หรือภาพตัวอย่าง
          alt="ข่าวสารและประชาสัมพันธ์"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            objectFit: "cover",
          }}
        />

        {/* กล่องข้อความซ้อนบนภาพ */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "20px",
            width: "calc(100% - 40px)",
            color: "#fff",
            padding: "10px",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>
            {newsList[0]?.title || "มอบสัญญาเช่าที่ราชพัสดุ"}
          </h3>
          <p style={{ margin: "5px 0 0", fontSize: "14px" }}>
            {newsList[0]?.content || "ธนารักษ์อัจฉริยะ “สัญญาเช่าที่ราชพัสดุ พลิกชีวิตประชาชน”"}
          </p>
        </div>
      </div>

      {/* แถวรูปเล็ก 4 รูป */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "20px",
          overflowX: "auto", // ให้สามารถเลื่อนแนวนอนได้
          whiteSpace: "nowrap", // ป้องกันการหักบรรทัด
        }}
      >
        {newsList.slice(1, 5).map((item, index) => (
          <div
            key={index}
            style={{
              flex: "0 0 auto", // กำหนดให้แต่ละรูปมีขนาดคงที่
              width: "calc(25% - 10px)", // ให้แต่ละรูปมีความกว้าง 1/4
              position: "relative",
              overflow: "hidden",
              borderRadius: "8px",
            }}
            onClick={() => handleImageClick(item.id)} // คลิกไปที่ข่าวที่เลือก
          >
            <img
              src={item.cover_image_url || "https://picsum.photos/1200/400?random=" + (index + 2)}
              alt={`ข่าวประชาสัมพันธ์ ${index + 1}`}
              style={{
                width: "100%",
                height: "auto", // ปรับให้สูงเท่ากับภาพแบนเนอร์
                display: "block",
                objectFit: "cover", // ให้รูปครอบคลุมพื้นที่ที่กำหนด
              }}
            />

            {/* กล่องข้อความซ้อนบนภาพ */}
            <div
              style={{
                position: "absolute",
                bottom: "20px",
                left: "10px",
                width: "calc(100% - 40px)",
                color: "#fff",
                padding: "10px",
                borderRadius: "8px",
                boxSizing: "border-box", // ป้องกันข้อความออกนอกขอบ
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: "bold",
                  whiteSpace: "nowrap", // ทำให้ข้อความไม่ขยายไปเกิน
                  overflow: "hidden",
                  textOverflow: "ellipsis", // ถ้าข้อความยาวเกินจะตัด
                }}
              >
                {item.title || "มอบสัญญาเช่าที่ราชพัสดุ"}
              </h3>
              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: "12px",
                  whiteSpace: "nowrap", // ทำให้ข้อความไม่ขยายไปเกิน
                  overflow: "hidden",
                  textOverflow: "ellipsis", // ถ้าข้อความยาวเกินจะตัด
                }}
              >
                {item.content || "ธนารักษ์อัจฉริยะ “สัญญาเช่าที่ราชพัสดุ พลิกชีวิตประชาชน”"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Homepage5;
