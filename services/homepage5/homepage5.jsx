import React from "react";

export default function Homepage5() {
  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* หัวข้อของหน้า */}
      <h2 style={{ marginBottom: "20px" }}>ข่าวสารและประชาสัมพันธ์</h2>

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
          style={{ width: "100%", height: "auto", display: "block" }}
        />

        {/* กล่องข้อความซ้อนบนภาพ */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            color: "#fff",
            background: "rgba(0, 0, 0, 0.5)",
            padding: "10px",
          }}
        >
          <h3 style={{ margin: 0 }}>มอบสัญญาเช่าที่ราชพัสดุ</h3>
          <p style={{ margin: "5px 0 0" }}>
            ธนารักษ์อัจฉริยะ “สัญญาเช่าที่ราชพัสดุ พลิกชีวิตประชาชน”
          </p>
        </div>
      </div>

      {/* คำอธิบายใต้ภาพแบนเนอร์ */}
      <p style={{ marginBottom: "20px" }}>
        เนื้อหาข่าวสารและประชาสัมพันธ์เกี่ยวกับกิจกรรมล่าสุดหรือข้อมูลสำคัญต่าง
        ๆ สามารถอธิบายรายละเอียดเพิ่มเติมได้ที่นี่
      </p>

      {/* แถวรูปเล็ก 4 รูป */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          justifyContent: "space-between",
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
              flex: "1 1 calc(25% - 10px)",
              minWidth: "200px",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <img
              src={imgUrl}
              alt={`ข่าวประชาสัมพันธ์ ${index + 1}`}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
