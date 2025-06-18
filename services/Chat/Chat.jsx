import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router"; // ✅ เพิ่มตรงนี้
import { Phone, ChatBubbleOutline, ArrowUpward } from "@mui/icons-material";
import styles from "./Chat.module.scss";

const Chat = () => {
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const chatContentRef = useRef(null);

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
  <p className={styles.chatTitle}>เรายินดีให้บริการ</p>
  <p className={styles.chatDescription}>
    ถ้าหากมีเรื่องที่ต้องการถาม <br />
    สามารถคุยกับโปรแกรม Chat Bot <br />
    ของเราเพิ่มเติมได้
  </p>
</div>

    <button
  className={styles.sendButton}
  // onClick={() => router.push("/chatbotUser")}
>
  คุยกับเรา
</button>

  </div>
)}

    </div>
  );
};

export default Chat;
