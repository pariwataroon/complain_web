import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Box, Typography, Grid, Button, CardMedia, Stack, Tooltip } from "@mui/material";
import { getDisplayableNews } from "@pages/api/news/news"; // Fetch news data from API

const Homepage5 = () => {
  const router = useRouter();
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // URL สำหรับรูปสำรอง
  const fallbackImage =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpe8Naj6LbXz7o_Gn6S9GszsfiRNZ5t3xJxA&s";

  useEffect(() => {
    const fetchDisplayableNews = async () => {
      try {
        const newsData = await getDisplayableNews(0, 10, "");
        const filteredNewsData = newsData
          .filter((news) => news.is_published)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); 

        setNewsList(filteredNewsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching displayable news:", error);
        setLoading(false);
      }
    };

    fetchDisplayableNews();
  }, []);

  const handleImageClick = (id) => {
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
      <h2 style={{ marginBottom: "20px", fontSize: "24px", fontWeight: "bold" }}>
        ข่าวสารและประชาสัมพันธ์
      </h2>

      {/* ภาพแบนเนอร์ใหญ่ */}
      <div
        style={{
          position: "relative",
          marginBottom: "20px",
          overflow: "hidden",
          width: "100%",
            height: "400px",
          borderRadius: "8px",
        }}
        onClick={() => handleImageClick(newsList[0]?.id)}
      >
        <img
          src={newsList[0]?.cover_image_url || fallbackImage}
          alt={newsList[0]?.title}
          style={{
            width: '100%',
            height: '100%', 
            display: 'block',
            objectFit: 'cover',
            maxWidth: '100%', 
          }}
          onError={(e) => (e.target.src = fallbackImage)}
        />
        <div
            style={{
              position: "absolute",
              bottom: "0",
              left: "0",
              width: "100%",
              height: "100px", // ความสูงของเอฟเฟ็กต์
              background: "linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.5) 70%)", // เอฟเฟ็กต์สีดำที่ค่อยๆ จางลง

            }}
          />

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
          <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "bold"}}>
            {newsList[0]?.title}
          </h3>
        </div>
      </div>

      {/* แถวรูปเล็ก 4 รูป */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "20px",
          overflowX: "auto",
          whiteSpace: "nowrap",
        }}
      >
        {newsList.slice(1).map((item, index) => (
          <div
          key={index}
          style={{
            flex: "0 0 auto",
            width: "calc(30% - 60px)",
            height: "200px",
            position: "relative",
            overflow: "hidden",
            borderRadius: "8px",
          }}
          onClick={() => handleImageClick(item.id)}
        >
          <img
            src={item.cover_image_url || fallbackImage}
            alt={item.title}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              objectFit: "cover",
              transition: "all 0.3s ease", // เพิ่มการเคลื่อนไหวให้เรียบเนียน
            }}
            onError={(e) => (e.target.src = fallbackImage)}
          />
          <div
            style={{
              position: "absolute",
              bottom: "0",
              left: "0",
              width: "100%",
              height: "100px", // ความสูงของเอฟเฟ็กต์
              background: "linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.5) 70%)", // เอฟเฟ็กต์สีดำที่ค่อยๆ จางลง

            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              left: "10px",
              width: "calc(100% - 40px)",
              color: "#fff",
              padding: "10px",
              borderRadius: "8px",
              boxSizing: "border-box",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "14px",
                fontWeight: "bold",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.title}
            </h3>
          </div>
        </div>

        ))}
      </div>
    </div>
  );
};

export default Homepage5;
