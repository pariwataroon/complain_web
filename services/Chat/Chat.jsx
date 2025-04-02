import { useState } from "react";
import { Phone, ChatBubbleOutline } from "@mui/icons-material";
import styles from "./Chat.module.scss";

const Chat = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen((prevState) => !prevState);
  };

  return (
    <div>
      {" "}
      {/* Phone Icon */}
      <div className={styles.phoneIcon} onClick={() => alert("Dialing...")}>
        <Phone style={{ fontSize: 30, color: "white" }} />
      </div>
      {/* Chat Icon */}
      <div className={styles.chatIcon} onClick={toggleChat}>
        <ChatBubbleOutline style={{ fontSize: 30, color: "white" }} />
      </div>
      {/* Chat Box */}
      {isChatOpen && (
        <div className={styles.chatBox}>
          <div className={styles.chatContent}>
            <p>เรายินดีให้บริการ</p>
            <p>
              ถ้าหากมีเรื่องที่ต้องการถาม สามารถคุยกับโปรแกรม Chat Bot
              ของเราเพิ่มเต็มได้
            </p>
          </div>
          <textarea placeholder="พิมพ์ข้อความของคุณที่นี่..." />
          <button className={styles.sendButton}>คุยกับเรา</button>
        </div>
      )}
    </div>
  );
};

export default Chat;
