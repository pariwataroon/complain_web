import React, { useState, useEffect } from "react";
import styles from "./Homepage1.module.scss";

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
      ></div>

      <div
        className={styles.mobileImage}
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
        <h1 className={styles.headerText}>
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
          <span
            style={{
              fontSize: "3rem",
              marginLeft: "10px",
              fontWeight: "normal",
            }}
          >
            รับเรื่องด้วยใจ โปร่งใส ทันสมัย และเป็นธรรม
          </span>
        </h1>
      </div>

      {/* ปุ่ม */}
      <div
        style={{
          top: "40%",
          left: "70%",
          position: "absolute",
          zIndex: 1,
          display: "flex",
          gap: "20px",
          justifyContent: "center",
          transform: "translateX(-50%)",
          marginTop: "10px"
        }}
      >
        <button className={styles.button}>แจ้งเรื่องร้องทุกข์</button>
        <button className={styles.buttonwhit}>ติดตามผล</button>
      </div>
    </div>
  );
};

export default Homepage1;
