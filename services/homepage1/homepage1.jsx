import React from "react";

const Homepage1 = () => {
  return (
    <div
      style={{
        backgroundImage: "url('/images/bg01.png')", // เปลี่ยนชื่อไฟล์ตามที่มีอยู่ใน public
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "70vh",
        width: "100%",
      }}
    ></div>
  );
};

export default Homepage1;
