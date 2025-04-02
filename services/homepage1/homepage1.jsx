import React from "react";

const Homepage1 = () => {
  return (
    <div style={{ position: "relative", minHeight: "90vh", width: "100%" }}>
      <div
        style={{
          backgroundImage: "url('/images/bg01.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "100%",
          width: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: -1,
        }}
      >
      </div>

      <div
        style={{
          position: "absolute",
          top: "25%",
          left: "20%",
          zIndex: 1,
          width: "600px",
        }}
      >
        <img
          src="/images/iphone_MOF.png"
          alt="Mobile Phone"
          style={{
            width: "100%",
            height: "auto",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "15%",
          transform: "translateY(-50%)",
          color: "white",
        }}
      >
        <h1 style={{ fontSize: "15rem", fontWeight: "bold", display: "flex", alignItems: "center" }}>
          MOF
          <span
            style={{
              display: "inline-block",
              width: "5px",
              height: "1em",
              backgroundColor: "white",
              marginLeft: "15px",
              marginRight: "10px",
            }}
          ></span>
          <span style={{ fontSize: "3rem", marginLeft: "10px" }}>
            รับเรื่องด้วยใจ โปร่งใส ทันสมัย และเป็นธรรม
          </span>
        </h1>
      </div>
      <div style={{
        top: "40%",
        left: "60%",
        position: "absolute",
        zIndex: 1,
        display: "flex",
        gap: "10px",
        justifyContent: "center",
        alignItems: "center", 
      }}>
        <button
          style={{
            padding: "40px 40px",
            fontSize: "1rem",
            color: "#1120A3",
            backgroundColor: "#EDC458",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            marginRight: "10px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            transition: "all 0.3s ease",
            fontWeight: "bold",
          }}
          onMouseEnter={(e) => e.target.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.4)"}
          onMouseLeave={(e) => e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)"}
        >
          แจ้งเรื่องร้องทุกข์
        </button>
        <button
          style={{
            padding: "40px 40px",
            fontSize: "1rem",
            color: "#1120A3",
            backgroundColor: "#E8E9F6",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            transition: "all 0.3s ease",
            fontWeight: "bold",
          }}
          onMouseEnter={(e) => e.target.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.4)"}
          onMouseLeave={(e) => e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)"}
        >
          ติดตามผล
        </button>
      </div>
    </div>
  );
};

export default Homepage1;
