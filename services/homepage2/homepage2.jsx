import React from "react";

const Homepage2 = () => {
  return <div style={{ position: "relative", minHeight: "20vh", width: "100%" }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
      }}
    >
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: "bold",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          color: "#1120A3",
          marginLeft: "20%",
        }}
      >
        HOTLINE
        <span style={{ fontSize: "3rem", marginTop: "10px" }}>1689</span>
      </h1>

      <h1
        style={{
          fontSize: "2rem",
          fontWeight: "bold",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          color: "#1120A3",
          marginRight: "15%",
        }}
      >
        สำนักตรวจสอบและประเมินผล
        <span style={{ fontSize: "2rem", marginTop: "10px" }}>
          สำนักงานปลัดกระทรวงการคลัง
        </span>
      </h1>
    </div>
  </div>
};

export default Homepage2;
