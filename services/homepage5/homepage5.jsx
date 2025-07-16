import React from "react";
import { useRouter } from "next/router"; // นำเข้า useRouter สำหรับการนำทาง

export default function Homepage5() {
  const router = useRouter(); // ใช้ useRouter

  // ฟังก์ชันสำหรับการคลิกที่ภาพ (ทั้งแบนเนอร์และแถวรูปเล็ก)
  const handleImageClick = (imageUrl) => {
    // ใช้ฟังก์ชันเพื่อให้ไปยังหน้าที่ต้องการเมื่อคลิก
    router.push(`/news?imageUrl=${imageUrl}`); // ตัวอย่างการส่งค่า imageUrl ไปยังหน้าต่างๆ
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* หัวข้อของหน้า */}
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
        onClick={() => handleImageClick("https://picsum.photos/1200/400?random=1")}
      >
        <img
          src="https://picsum.photos/1200/400?random=1"
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
            มอบสัญญาเช่าที่ราชพัสดุ
          </h3>
          <p style={{ margin: "5px 0 0", fontSize: "14px" }}>
            ธนารักษ์อัจฉริยะ “สัญญาเช่าที่ราชพัสดุ พลิกชีวิตประชาชน”
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
  {[...Array(4)].map((_, index) => (
    <div
      key={index}
      style={{
        flex: "0 0 auto", // กำหนดให้แต่ละรูปมีขนาดคงที่
        width: "calc(25% - 10px)", // ให้แต่ละรูปมีความกว้าง 1/4
        position: "relative",
        overflow: "hidden",
        borderRadius: "8px",
      }}
      onClick={() => handleImageClick(`https://picsum.photos/1200/400?random=${index + 2}`)}
    >
      <img
        src={`https://picsum.photos/1200/400?random=${index + 2}`}
        alt={`ข่าวประชาสัมพันธ์ ${index + 1}`}
        style={{
          width: "100%",
          height: "200px", // ปรับให้ความสูงของรูปมากขึ้น
          display: "block",
          objectFit: "cover", // ให้รูปครอบคลุมพื้นที่ที่กำหนด
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
          มอบสัญญาเช่าที่ราชพัสดุ
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
          ธนารักษ์อัจฉริยะ “สัญญาเช่าที่ราชพัสดุ พลิกชีวิตประชาชน”
        </p>
      </div>
    </div>
  ))}
</div>


    </div>
  );
}
