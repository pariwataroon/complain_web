import React, { useState } from "react";
import styles from "./Homepage6.module.scss"; // นำเข้า SCSS ที่เป็น CSS Module

const Homepage6 = () => {
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

  const [activeIndexLeft, setActiveIndexLeft] = useState(null);
  const [activeIndexRight, setActiveIndexRight] = useState(null);

  const toggleLeft = (index) => {
    setActiveIndexLeft(index === activeIndexLeft ? null : index);
  };

  const toggleRight = (index) => {
    setActiveIndexRight(index === activeIndexRight ? null : index);
  };

  const renderIcon = (isActive) => {
    return (
      <div
        className={styles.iconWrapper}
        style={{
          backgroundColor: isActive ? "#EDC458" : "#F0F3FF",
        }}
      >
        <span className={styles.iconText}>{isActive ? "-" : "+"}</span>
      </div>
    );
  };

  return (
    <div className={styles.homepage6Container}>
      <div className={styles.header}>
        <img src="/images/qna.png" alt="Q&A Icon" className={styles.headerImg} />
        <h2 className={styles.headerTitle}>คำถามที่พบบ่อย</h2>
      </div>

      <div className={styles.questionsContainer}>
        <div className={styles.questionsColumn}>
          {questionsLeft.map((item, index) => {
            const isActive = activeIndexLeft === index;
            return (
              <div className={styles.questionCard} key={index}>
                <div
                  className={styles.questionHeader}
                  onClick={() => toggleLeft(index)}
                >
                  <span className={styles.questionText}>{item.question}</span>
                  {renderIcon(isActive)}
                </div>
                <div
                  className={`${styles.accordionAnswer} ${isActive ? styles.active : ""
                    }`}
                >
                  <p className={styles.answerText}>{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.questionsColumn}>
          {questionsRight.map((item, index) => {
            const isActive = activeIndexRight === index;
            return (
              <div className={styles.questionCard} key={index}>
                <div
                  className={styles.questionHeader}
                  onClick={() => toggleRight(index)}
                >
                  <span className={styles.questionText}>{item.question}</span>
                  {renderIcon(isActive)}
                </div>
                <div
                  className={`${styles.accordionAnswer} ${isActive ? styles.active : ""
                    }`}
                >
                  <p className={styles.answerText}>{item.answer}</p>
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
