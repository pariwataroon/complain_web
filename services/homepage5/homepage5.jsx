import React from "react";

export default function Homepage5() {
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
      >
        <img
          src="https://picsum.photos/1200/400?random=1"
          alt="ข่าวสารและประชาสัมพันธ์"
          style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }}
        />

        {/* กล่องข้อความซ้อนบนภาพ */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "20px",
            width: "calc(100% - 40px)",
            color: "#fff",
            background: "rgba(0, 0, 0, 0.5)",
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

      {/* คำอธิบายใต้ภาพแบนเนอร์ */}
      <p style={{ marginBottom: "20px", fontSize: "16px", lineHeight: "1.5" }}>
        เนื้อหาข่าวสารและประชาสัมพันธ์เกี่ยวกับกิจกรรมล่าสุดหรือข้อมูลสำคัญต่าง
        ๆ สามารถอธิบายรายละเอียดเพิ่มเติมได้ที่นี่
      </p>

      {/* แถวรูปเล็ก 4 รูป */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "10px",
          marginTop: "20px",
        }}
      >
        {[
          "https://picsum.photos/300/200?random=2",
          "https://picsum.photos/300/200?random=3",
          "https://picsum.photos/300/200?random=4",
          "https://picsum.photos/300/200?random=5",
        ].map((imgUrl, index) => (
          <div
            key={index}
            style={{
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <img
              src={imgUrl}
              alt={`ข่าวประชาสัมพันธ์ ${index + 1}`}
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                objectFit: "cover",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
