import { useState, useRef, useEffect } from "react";
import { Phone, ChatBubbleOutline, ArrowUpward } from "@mui/icons-material";
import styles from "./Chat.module.scss";

const Chat = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const toggleChat = () => {
    setIsChatOpen((prev) => !prev);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  return (
    <div>
      <div className={styles.phoneIcon} onClick={() => alert("Dialing...")}>
        <Phone style={{ fontSize: 30, color: "white" }} />
      </div>
      {showScrollTop && (
        <div className={styles.scrollTopButton} onClick={scrollToTop}>
          <ArrowUpward style={{ fontSize: 30, color: "white" }} />
        </div>
      )}
      <div className={styles.chatIcon} onClick={toggleChat}>
        <ChatBubbleOutline style={{ fontSize: 30, color: "white" }} />
      </div>

      {isChatOpen && (
        <div className={styles.chatBox}>
          
          <div className={styles.chatContent} ref={chatContentRef}>
            <p>เรายินดีให้บริการ</p>
            {Array.from({ length: 4 }).map((_, i) => (
              <p key={i}>ข้อความเพิ่มเติม {i + 1}</p>
            ))}
          </div>
          <textarea placeholder="พิมพ์ข้อความของคุณที่นี่..." />
          <button className={styles.sendButton}>คุยกับเรา</button>
        </div>
      )}
    </div>
  );
};

export default Chat;
