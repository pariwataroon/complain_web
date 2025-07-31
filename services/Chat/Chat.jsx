import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { Phone, ChatBubbleOutline, ArrowUpward, Send } from "@mui/icons-material";
import * as tf from '@tensorflow/tfjs';
import styles from "./Chat.module.scss";
import { getChatBot } from "@pages/api/chatbot/chatbot";

const Chat = () => {
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: 'สวัสดีครับ! ผมคือ COMP ChatBot พร้อมตอบคำถามของคุณ',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [faqData, setFaqData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const chatContentRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadFAQData();
  }, []);

  const loadFAQData = async () => {
    try {
      setIsLoadingData(true);
      const faqs = await getChatBot(); // รับ array โดยตรง
      setFaqData(faqs); // faqs จะเป็น array เสมอ
    } catch (error) {
      console.error("Error loading FAQ data:", error);
      setFaqData([]); // fallback เป็น empty array
    } finally {
      setIsLoadingData(false);
    }
  };

  // Text preprocessing function
  const preprocessText = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\u0E00-\u0E7Fa-z0-9\s]/g, '')
      .trim();
  };

  // ตรวจสอบการ match กับ title และ keywords
  const checkMatch = (userInput, faqTitle, faqKeywords = []) => {
    const processedInput = preprocessText(userInput);
    const processedTitle = preprocessText(faqTitle);
    const keywords = Array.isArray(faqKeywords) ? faqKeywords : [];

    // เช็ค exact match กับ title
    if (processedInput === processedTitle) {
      return { isMatch: true, type: 'exact_title', score: 100 };
    }

    // เช็คว่า title มีอยู่ใน user input หรือไม่
    if (processedInput.includes(processedTitle)) {
      return { isMatch: true, type: 'title_contained', score: 90 };
    }

    // เช็คว่า user input มีอยู่ใน title หรือไม่
    if (processedTitle.includes(processedInput)) {
      return { isMatch: true, type: 'input_in_title', score: 85 };
    }

    // เช็ค exact match กับ keywords
    for (const keyword of keywords) {
      const processedKeyword = preprocessText(keyword);

      // exact match กับ keyword
      if (processedInput === processedKeyword) {
        return { isMatch: true, type: 'exact_keyword', score: 95 };
      }

      // keyword มีอยู่ใน user input
      if (processedInput.includes(processedKeyword)) {
        return { isMatch: true, type: 'keyword_contained', score: 80 };
      }

      // user input มีอยู่ใน keyword
      if (processedKeyword.includes(processedInput)) {
        return { isMatch: true, type: 'input_in_keyword', score: 75 };
      }
    }

    // เช็คคำที่คล้ายกัน (word similarity)
    const inputWords = processedInput.split(' ').filter(word => word.length > 1);
    const titleWords = processedTitle.split(' ').filter(word => word.length > 1);

    let wordMatchCount = 0;
    inputWords.forEach(inputWord => {
      titleWords.forEach(titleWord => {
        if (inputWord === titleWord) {
          wordMatchCount++;
        }
      });
    });

    // เช็คคำใน keywords
    keywords.forEach(keyword => {
      const keywordWords = preprocessText(keyword).split(' ').filter(word => word.length > 1);
      inputWords.forEach(inputWord => {
        keywordWords.forEach(keywordWord => {
          if (inputWord === keywordWord) {
            wordMatchCount++;
          }
        });
      });
    });

    // ถ้ามีคำที่ match อย่างน้อย 1 คำ
    if (wordMatchCount > 0) {
      const score = Math.min(70, wordMatchCount * 20);
      return { isMatch: true, type: 'word_similarity', score };
    }

    return { isMatch: false, type: 'no_match', score: 0 };
  };

  const findBestMatch = (userInput) => {
    if (faqData.length === 0) return null;

    let bestMatch = null;
    let highestScore = 0;
    let matchType = '';

    for (const faq of faqData) {
      const matchResult = checkMatch(userInput, faq.title, faq.keyword);

      if (matchResult.isMatch && matchResult.score > highestScore) {
        highestScore = matchResult.score;
        bestMatch = faq;
        matchType = matchResult.type;
      }
    }

    if (bestMatch) {
      return {
        text: bestMatch.detail || bestMatch.title,
      };
    }

    return null;
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage = {
      type: 'user',
      text: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const matchResult = findBestMatch(userMessage.text);

      let botResponse;
      if (matchResult) {
        botResponse = {
          type: 'bot',
          text: matchResult.text,
          faq: matchResult.faq,
          timestamp: new Date()
        };
      } else {
        botResponse = {
          type: 'bot',
          text: 'ขออภัยครับ ฉันไม่สามารถหาคำตอบที่ตรงกับคำถามของคุณได้ กรุณาลองถามคำถามอื่น หรือติดต่อเจ้าหน้าที่โดยตรงที่ 1689',
          timestamp: new Date()
        };
      }

      // Simulate typing delay
      setTimeout(() => {
        setMessages(prev => [...prev, botResponse]);
        setIsTyping(false);
      }, 1500);

    } catch (error) {
      console.error("Error processing message:", error);
      setMessages(prev => [...prev, {
        type: 'bot',
        text: 'เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง',
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsChatOpen((prev) => !prev);
  };

  const toggleQuickMenu = () => {
    setShowQuickMenu((prev) => !prev);
  };

  const handleQuickMenuSelect = (question) => {
    setInputMessage(question);
    setShowQuickMenu(false);
    // Focus ที่ input field
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // ดึง 6 คำถามล่าสุด (เรียงตาม created_at หรือ updated_at)
  const getRecentQuestions = () => {
    if (!Array.isArray(faqData) || faqData.length === 0) return [];

    // เรียงตาม updated_at หรือ created_at (ใหม่ไปเก่า) และเอา 6 รายการแรก
    return faqData
      .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
      .slice(0, 6)
      .map(faq => faq.title);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Scroll to bottom of chat when new message is added
  useEffect(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  }, [messages]);

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
      <div className={styles.phoneIcon} onClick={() => window.open('tel:1689')}>
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
          <div className={styles.chatHeader}>
            <div className={styles.chatTitle}>
              <img
                src="/logo_blue.png"
                alt="Logo"
                className={styles.chatLogo}
              />
              CB สำนักงานปลัดกระทรวงการคลัง
            </div>
            <button
              className={styles.closeButton}
              onClick={toggleChat}
            >
              ✕
            </button>
          </div>

          <div className={styles.chatContent} ref={chatContentRef}>
            {isLoadingData ? (
              <div className={styles.loadingMessage}>
                <div className={styles.loadingSpinner}></div>
                กำลังโหลดข้อมูล...
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`${styles.message} ${message.type === 'user' ? styles.userMessage : styles.botMessage
                    }`}
                >
                  <div className={styles.messageContent}>
                    {message.text.split('\n').map((line, lineIndex) => (
                      <div key={lineIndex}>
                        {line}
                        {lineIndex < message.text.split('\n').length - 1 && <br />}
                      </div>
                    ))}
                    {message.faq && message.faq.keyword && Array.isArray(message.faq.keyword) && (
                      <div className={styles.keywords}>
                        {message.faq.keyword.map((keyword, keyIndex) => (
                          <span key={keyIndex} className={styles.keyword}>
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={styles.timestamp}>
                    {message.timestamp.toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))
            )}

            {isTyping && (
              <div className={`${styles.message} ${styles.botMessage}`}>
                <div className={styles.typingIndicator}>
                  <div className={styles.typingDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  กำลังพิมพ์...
                </div>
              </div>
            )}
          </div>

          <div className={styles.chatInput}>
            {/* Quick Menu */}
            {showQuickMenu && (
              <div className={styles.quickMenu}>
                <div className={styles.quickMenuHeader}>
                  <span>คำถามยอดนิยม</span>
                  <button
                    className={styles.closeQuickMenu}
                    onClick={toggleQuickMenu}
                  >
                    ✕
                  </button>
                </div>
                <div className={styles.quickMenuItems}>
                  {getRecentQuestions().map((question, index) => (
                    <div
                      key={index}
                      className={styles.quickMenuItem}
                      onClick={() => handleQuickMenuSelect(question)}
                    >
                      <span className={styles.questionIcon}>❓</span>
                      <span className={styles.questionText}>{question}</span>
                    </div>
                  ))}
                  {getRecentQuestions().length === 0 && (
                    <div className={styles.noQuestions}>
                      ไม่มีคำถามที่แนะนำในขณะนี้
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={styles.inputContainer}>
              <button
                className={styles.menuButton}
                onClick={toggleQuickMenu}
                disabled={isTyping}
                title="เมนูคำถามยอดนิยม"
              >
                <span className={styles.menuText}>เมนู</span>
              </button>
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="พิมพ์คำถามของคุณ..."
                className={styles.messageInput}
                rows={1}
                disabled={isTyping}
              />
              <button
                onClick={handleSendMessage}
                className={styles.sendButton}
                disabled={!inputMessage.trim() || isTyping}
              >
                <Send style={{ fontSize: 20 }} />
              </button>
            </div>
            <div className={styles.chatFooter}>
              สอบถามเพิ่มเติม: <a href="tel:1689" className={styles.phoneLink}>1689</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;