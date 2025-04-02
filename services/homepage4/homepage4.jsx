import React from "react";

const Homepage4 = () => {
  return (
    <div
      style={{
        backgroundImage: "url('/images/bg03.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      {/* ส่วนข้อความทางซ้าย */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center", // ให้ข้อความอยู่กลาง
          alignItems: "flex-start", // จัดข้อความให้อยู่ซ้าย
          zIndex: 1,
          marginRight: "30px", // ให้ช่องว่างระหว่างข้อความและรูปภาพ
        }}
      >
        <h1
          style={{
            fontSize: "3rem",
            color: "#FFFFFF",
          }}
        >
          ยืนยันตัวตนผ่านแอป ThaID
          <span style={{ fontSize: "3rem", marginTop: "10px" }}>1689</span>
        </h1>

        <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#000000" }}>
          สำหรับตรวจสอบและประเมินผล สำหรับงานงานปกติการกระทรวงคลัง
          <span style={{ fontSize: "2rem", marginTop: "10px" }}>
            พร้อมรับฟังทุกปัญหาและข้อร้องเรียนของประชาชน มุ่งมั่นให้ขับเคลื่อนไปอย่างโปร่งใส เป็นธรรม
          </span>
          <span style={{ fontSize: "2rem", marginTop: "10px" }}>
            และรวดเร็ว เพื่อให้ทุกท่านได้รับข้อมูลที่ถูกต้องและทันสมัย
          </span>
        </p>
      
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <a
          href="https://play.google.com/store"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-block", marginTop: "20px" }}
        >
          <img
            src="Google_Play.png"
            alt="Google Play"
            style={{ width: "150px", height: "50px" }}
          />
        </a>
        <a
          href="https://apps.apple.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-block", marginTop: "20px" }}
        >
          <img
            src="App_Store.png"
            alt="App Store"
            style={{ width: "150px", height: "50px" }}
          />
        </a>
      </div>


      {/* ส่วนรูปภาพที่อยู่ขวา */}
      <div
        style={{
          position: "absolute",
          top: "43%",
          right: "20%",
          width: "400px",
        }}
      >
        <img
          src="/ThaID_logo_2.png"
          alt="ThaID Logo"
          style={{
            width: "466px",
            height: "466px",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: "48.4%",
          right: "10%",
          transform: "rotate(8deg)",
        }}
      >
        <img
          src="/iphone_MOF_CODE.png"
          alt="Mobile Phone"
          style={{
            width: "466px",
            height: "466px",
          }}
        />
      </div>
    </div>
  );
};

export default Homepage4;
