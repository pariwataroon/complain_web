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
      text: 'สวัสดีครับ! ผมคือ COMP AI พร้อมตอบคำถามของคุณ',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [faqData, setFaqData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const chatContentRef = useRef(null);
  const inputRef = useRef(null);

  // Load FAQ data on component mount
  useEffect(() => {
    loadFAQData();
  }, []);

  const loadFAQData = async () => {
    try {
      setIsLoadingData(true);
      const response = await getChatBot();
      if (response.faqs) {
        setFaqData(response.faqs);
      }
    } catch (error) {
      console.error("Error loading FAQ data:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Text preprocessing function
  const preprocessText = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\u0E00-\u0E7Fa-z0-9\s]/g, '') // Keep Thai, English, numbers, and spaces
      .trim();
  };

  // Calculate text similarity using simple keyword matching and TensorFlow.js
  const calculateSimilarity = async (userInput, faqTitle, faqKeywords = []) => {
    const processedInput = preprocessText(userInput);
    const processedTitle = preprocessText(faqTitle);

    // Simple keyword matching score
    let keywordScore = 0;
    const inputWords = processedInput.split(' ');
    const titleWords = processedTitle.split(' ');

    // Check title word matches
    titleWords.forEach(word => {
      if (inputWords.includes(word) && word.length > 1) {
        keywordScore += 2;
      }
    });

    // Check keyword matches (higher weight)
    faqKeywords.forEach(keyword => {
      const processedKeyword = preprocessText(keyword);
      if (processedInput.includes(processedKeyword)) {
        keywordScore += 3;
      }
    });

    // Use TensorFlow.js for enhanced text similarity (simple approach)
    try {
      // Create simple text vectors based on character frequency
      const createTextVector = (text) => {
        const vector = new Array(128).fill(0); // ASCII range
        for (let char of text) {
          const code = char.charCodeAt(0);
          if (code < 128) {
            vector[code]++;
          }
        }
        return vector;
      };

      const inputVector = createTextVector(processedInput);
      const titleVector = createTextVector(processedTitle);

      // Calculate cosine similarity using TensorFlow.js
      const inputTensor = tf.tensor1d(inputVector);
      const titleTensor = tf.tensor1d(titleVector);

      const dotProduct = tf.sum(tf.mul(inputTensor, titleTensor));
      const inputNorm = tf.norm(inputTensor);
      const titleNorm = tf.norm(titleTensor);

      const cosineSimilarity = tf.div(dotProduct, tf.mul(inputNorm, titleNorm));
      const similarityScore = await cosineSimilarity.data();

      // Clean up tensors
      inputTensor.dispose();
      titleTensor.dispose();
      dotProduct.dispose();
      inputNorm.dispose();
      titleNorm.dispose();
      cosineSimilarity.dispose();

      // Combine keyword score and cosine similarity
      const totalScore = keywordScore + (similarityScore[0] * 10);
      return totalScore;

    } catch (error) {
      console.error("TensorFlow similarity calculation error:", error);
      return keywordScore; // Fallback to keyword score only
    }
  };

  // Find best matching FAQ
  const findBestMatch = async (userInput) => {
    if (faqData.length === 0) return null;

    let bestMatch = null;
    let highestScore = 0;

    for (const faq of faqData) {
      const score = await calculateSimilarity(userInput, faq.title, faq.keyword);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = faq;
      }
    }

    // Return match only if score is above threshold
    return highestScore > 1.5 ? bestMatch : null;
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
      // Find matching FAQ
      const matchedFAQ = await findBestMatch(userMessage.text);

      let botResponse;
      if (matchedFAQ) {
        botResponse = {
          type: 'bot',
          text: matchedFAQ.detail || matchedFAQ.title,
          faq: matchedFAQ,
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
              AI สำนักงานปลัดกระทรวงการคลัง
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
                    {message.faq && message.faq.keyword && (
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
            <div className={styles.inputContainer}>
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