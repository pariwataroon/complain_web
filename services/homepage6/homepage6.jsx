import React, { useState } from "react";
import "./Homepage6.scss"; // Import ไฟล์ SCSS

const Homepage6 = () => {
  // ข้อมูลตัวอย่างของแต่ละคำถาม (ฝั่งซ้าย)
  const questionsLeft = [
    {
      question: "ขอความอนุเคราะห์อธิบายเกี่ยวกับการศึกษาต่อ",
      answer: "รายละเอียดคำตอบหรือข้อมูลเพิ่มเติมเกี่ยวกับการศึกษาต่อ...",
    },
    {
      question: "วิธีและขั้นตอนการขอรับบริการสำนักงานกรม...",
      answer:
        "รายละเอียดคำตอบหรือข้อมูลเพิ่มเติมเกี่ยวกับขั้นตอนการขอรับบริการ...",
    },
    {
      question: "ขอความอนุเคราะห์อธิบายเกี่ยวกับการปรับโครงสร้าง...",
      answer: "รายละเอียดคำตอบหรือข้อมูลเพิ่มเติมเกี่ยวกับการปรับโครงสร้าง...",
    },
    {
      question: "ขอความอนุเคราะห์อธิบายเกี่ยวกับปัญหาข้อพิพาท...",
      answer: "รายละเอียดคำตอบหรือข้อมูลเพิ่มเติมเกี่ยวกับปัญหาข้อพิพาท...",
    },
  ];

  // ข้อมูลตัวอย่างของแต่ละคำถาม (ฝั่งขวา)
  const questionsRight = [
    {
      question: "แจ้งขอเอกสารการเคลื่อนย้าย...",
      answer:
        "รายละเอียดคำตอบหรือข้อมูลเพิ่มเติมเกี่ยวกับเอกสารการเคลื่อนย้าย...",
    },
    {
      question: "ขอความอนุเคราะห์แจ้งระยะเวลาแน่นอน...",
      answer:
        "รายละเอียดคำตอบหรือข้อมูลเพิ่มเติมเกี่ยวกับระยะเวลาการดำเนินการ...",
    },
    {
      question: "ขอความอนุเคราะห์ช่วยแก้ไขปัญหาที่ดิน...",
      answer:
        "รายละเอียดคำตอบหรือข้อมูลเพิ่มเติมเกี่ยวกับการแก้ไขปัญหาที่ดิน...",
    },
    {
      question: "โครงการกฐินฯ ร่วมช่วย...",
      answer: "รายละเอียดคำตอบหรือข้อมูลเพิ่มเติมเกี่ยวกับโครงการกฐินฯ...",
    },
  ];

  // State สำหรับเก็บ index ของคำถามที่ถูกกด (ฝั่งซ้าย/ขวา)
  const [activeIndexLeft, setActiveIndexLeft] = useState(null);
  const [activeIndexRight, setActiveIndexRight] = useState(null);

  // ฟังก์ชันสลับเปิด-ปิด (Accordion) ฝั่งซ้าย
  const toggleLeft = (index) => {
    setActiveIndexLeft(index === activeIndexLeft ? null : index);
  };

  // ฟังก์ชันสลับเปิด-ปิด (Accordion) ฝั่งขวา
  const toggleRight = (index) => {
    setActiveIndexRight(index === activeIndexRight ? null : index);
  };

  // ฟังก์ชัน render ไอคอนสำหรับแต่ละคำถาม
  const renderIcon = (isActive) => {
    return (
      <div
        className="icon-wrapper"
        style={{
          backgroundColor: isActive ? "#EDC458" : "#F0F3FF",
        }}
      >
        <span className="icon-text">{isActive ? "-" : "+"}</span>
      </div>
    );
  };

  return (
    <div className="homepage6-container">
      {/* ส่วนหัว Q&A */}
      <div className="header">
        {/* ใช้รูปภาพจาก public/images แทนการใช้ div */}
        <img src="/images/qna.png" alt="Q&A Icon" className="header-img" />
        <h2 className="header-title">คำถามที่พบบ่อย</h2>
      </div>

      {/* ส่วนคอลัมน์คำถาม 2 ฝั่ง */}
      <div className="questions-container">
        {/* คอลัมน์ซ้าย */}
        <div className="questions-column">
          {questionsLeft.map((item, index) => {
            const isActive = activeIndexLeft === index;
            return (
              <div className="question-card" key={index}>
                {/* หัวข้อคำถาม */}
                <div
                  className="question-header"
                  onClick={() => toggleLeft(index)}
                >
                  <span className="question-text">{item.question}</span>
                  {renderIcon(isActive)}
                </div>
                {/* ส่วนคำตอบ พร้อม animation */}
                <div className={`accordion-answer ${isActive ? "active" : ""}`}>
                  <p className="answer-text">{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* คอลัมน์ขวา */}
        <div className="questions-column">
          {questionsRight.map((item, index) => {
            const isActive = activeIndexRight === index;
            return (
              <div className="question-card" key={index}>
                {/* หัวข้อคำถาม */}
                <div
                  className="question-header"
                  onClick={() => toggleRight(index)}
                >
                  <span className="question-text">{item.question}</span>
                  {renderIcon(isActive)}
                </div>
                {/* ส่วนคำตอบ พร้อม animation */}
                <div className={`accordion-answer ${isActive ? "active" : ""}`}>
                  <p className="answer-text">{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Homepage6;
