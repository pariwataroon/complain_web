import React, { useState } from "react";
import styles from "./Homepage6.module.scss";

const Homepage6 = () => {
  const questionsLeft = [
    {
      question: "ขอความช่วยเหลือเกี่ยวกับการคืนภาษีล่าช้า",
      answer: "สอบถามข้อมูลเพิ่มเติมกับกรมสรรพากร โทร 1161",
    },
    {
      question: "ร้องเรียนพฤติกรรม/การดำเนินงานของเจ้าหน้าที่หน่วยงานในสังกัดกระทรวงการคลัง",
      answer:
        "เว็บไซต์ <a href='https://acoc.mof.go.th/th/home' target='_blank' rel='noopener noreferrer'>https://acoc.mof.go.th/th/home</a> หรือสอบถามข้อมูลเพิ่มเติม สายด่วน 1689 กด 2",
    },
    {
      question: "ขอความช่วยเหลือเกี่ยวกับการปรับโครงสร้างหนี้",
      answer: "ติดต่อสถาบันการเงินโดยตรง/ติดตามข่าวสารของรัฐบาล",
    },
    {
      question: "ขอความช่วยเหลือเกี่ยวกับปัญหาหนี้สิน สำหรับบุคลากรภาครัฐ",
      answer: `สหกรณ์ออมทรัพย์มีโครงการรวมหนี้ เพื่อแก้ไขหนี้บุคลากรภาครัฐ โดยธนาคารออมสินสนับสนุนสินเชื่อดอกเบี้ยต่ำให้แก่สหกรณ์ออมทรัพย์เพื่อนำไปใช้ในการรวมหนี้ของสมาชิกที่มีกับธนาคารออมสิน เจ้าหนี้นอกระบบ และสถาบันการเงินอื่นไว้ที่สหกรณ์ ซึ่งลูกหนี้สามารถติดต่อเพื่อขอรวมหนี้ผ่านสหกรณ์ออมทรัพย์ที่เป็นสมาชิกได้ นอกจากนี้ ธนาคารกรุงไทยฯ มีโครงการสินเชื่อรวมหนี้ข้าราชการยั่งยืน เพื่อช่วยเหลือลูกหนี้กลุ่มข้าราชการที่มีสินเชื่อส่วนบุคคล บัตรเครดิต และสินเชื่อที่อยู่อาศัยจากสถาบันการเงินต่างๆ และสหกรณ์มารวมไว้ที่ธนาคารกรุงไทยฯ โดยมีการลดภาระดอกเบี้ยและการผ่อนชำระให้แก่ลูกหนี้ ซึ่งลูกหนี้สามารถติดต่อขอคว่าวยเหลือได้ที่ธนาคารกรุงไทยฯ`,
    },
  ];

  const questionsRight = [
    {
      question: "แจ้งเบาะแสการหลีกเลี่ยงภาษี",
      answer:
        "สอบถามข้อมูลเพิ่มเติมกับกรมสรรพากร โทร 1161",
    },
    {
      question: "ขอความช่วยเหลือเกี่ยวกับแหล่งเงินทุนสำหรับการประกอบอาชีพ",
      answer:
        "ติดต่อสถาบันการเงินโดยตรง/ติดตามข่าวสารของรัฐบาล",
    },
    {
      question: "ขอความช่วยเหลือเกี่ยวกับปัญหาหนี้สิน",
      answer:
        "ติดต่อสถาบันการเงินโดยตรง/ติดตามข่าวสารของรัฐบาล/ธปท. ได้มีโครงการคลินิกแก้หนี้ เพื่อช่วยเหลือแก้ไขปัญหาหนี้ให้แก่ลูกหนี้สินเชื่อบัตรเครดิต บัตรกดเงินสด และสินเชื่อส่วนบุคคลที่ไม่มีหลักประกันที่มีหนี้ค้างชำระอยู่กับเจ้าหนี้ที่เข้าร่วมโครงการโดยบริษัทบริหารสินทรัพย์สุขุมวิท จำกัด จะเป็นคนกลางที่ช่วยเจรจาและ ประสานงานระหว่างลูกหนี้และเจ้าหนี้ทุกราย ซึ่งลูกหนี้สามารถติดต่อเข้าร่วมโครงการได้ที่เว็บไซต์ <a href='https://www.debtclinicbysam.com' target='_blank' rel='noopener noreferrer'>www.debtclinicbysam.com</a> หรือทางหมายเลขโทรศัพท์ 1443",
    },
    {
      question: "โครงการคุณสู้ เราช่วย",
      answer: "เพื่อให้ความช่วยเหลือลูกหนี้บ้าน ลูกหนี้รถยนต์หรือรถจักรยานยนต์ ลูกหนี้สินเชื่อวิสาหกิจขนาดกลางและขนาดย่อม (Small and Medium Enterprises) ลูกหนี้สินเชื่อส่วนบุคคล และลูกหนี้นาโนไฟไฟแนนซ์ ของธนาคารพาณิชย์ สถาบันการเงินเฉพาะกิจ และผู้ให้บริการทางการเงินที่ไม่ใช่สถาบันการเงิน (Non - Banks) โดยลดภาระการผ่อนชำระ นำเงินงวดที่ผ่อนชำระ นำเงินงวดที่ผ่อนชำระไปตัดเงินต้นทั้งหมดและยกเว้นดอกเบี้ย เพื่อลดภาระให้กับลูกหนี้ และช่วยให้ลูกหนี้ปิดจบหนี้ได้เร็วขึ้นซึ่งลูกหนี้สามารถติดต่อเจ้าหนี้เพื่อเข้าร่วมโครงการหรือติดต่อที่เว็บไซต์  <a href='https://www.bot.or.th/khunsoo' target='_blank' rel='noopener noreferrer'>www.bot.or.th/khunsoo</a> ภายในวันที่ 30 เมษายน 2568",
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
          backgroundColor: isActive ? "#EDC458" : "#ffffff", // เปลี่ยนสีพื้นหลัง
        }}
      >
        <span
          className={styles.iconText}
          style={{
            color: isActive ? "#ffffff" : "#6F6C90", // เปลี่ยนสีของข้อความ
          }}
        >
          {isActive ? "-" : "+"}
        </span>
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
                  className={`${styles.accordionAnswer} ${isActive ? styles.active : ""}`}
                >
                  <p className={styles.answerText} dangerouslySetInnerHTML={{ __html: item.answer }}></p>
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
                  className={`${styles.accordionAnswer} ${isActive ? styles.active : ""}`}
                >
                  <p className={styles.answerText} dangerouslySetInnerHTML={{ __html: item.answer }}></p>
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
