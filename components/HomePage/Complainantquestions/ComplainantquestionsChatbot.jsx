import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  IconButton,
  Stack,
  Avatar,
  TextField,
  Input,
} from '@mui/material';
import CallIcon from '@mui/icons-material/Call';
import VideocamIcon from '@mui/icons-material/Videocam';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import MicIcon from '@mui/icons-material/Mic';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';
import { useState, useEffect, useRef } from 'react';
import { emojiService } from '@services/Emoji/Emoji';

const mockChatData = {
  0: [
    { type: 'user', text: 'ขอความช่วยเหลือเกี่ยวกับการคืนภาษีล่าช้า', time: '10:30 น.', username: 'นายสุรวีย์ วงศ์สวัสดิ์' },
    { type: 'bot', text: 'สอบถามข้อมูลเพิ่มเติมกับกรมสรรพากร โทร 1161', time: '10:30 น.', username: 'Chat bot สำนักงานปลัดกระทรวงการคลัง' },
    { type: 'user', text: 'มีช่องทางติดต่อกรมสรรพากรอื่น ๆ หรือไม่?', time: '10:30 น.', username: 'นายสุรวีย์ วงศ์สวัสดิ์' },
    {
      type: 'bot',
      text: `ที่อยู่: 90 ซอยอารีย์, กรุงเทพฯ, ประเทศไทย, 10400
            เว็บไซต์: http://www.rd.go.th/
            เพจFB: https://www.facebook.com/TheRevenueDepartment/about
            เบอร์โทรศัพท์: 02-272-8000
            สายด่วน: 1161`,
      time: '10:30 น.',
      username: 'Chat bot สำนักงานปลัดกระทรวงการคลัง',
    },
    {
      type: 'user',
      text: 'กระทรวงการคลังมีแนวทางกระตุ้นเศรษฐกิจปีนี้อย่างไร',
      time: '11:30 น.',
      username: 'นายสุรวีย์ วงศ์สวัสดิ์',
    },
    {
      type: 'bot',
      text: 'ขออภัยในความไม่สะดวก ระบบไม่สามารถตอบคำถามนี้ได้ในขณะนี้ กรุณาติดต่อเจ้าหน้าที่เพื่อขอความช่วยเหลือที่สายด่วน 1689',
      time: '11:30 น.',
      username: 'Chat bot สำนักงานปลัดกระทรวงการคลัง',
    },
  ],
};

const ComplainantquestionsChatbot = () => {
  const router = useRouter();
  const { id } = router.query;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const chunksRef = useRef([]);
  const [showEmoji, setShowEmoji] = useState(false);

  useEffect(() => {
    if (id && mockChatData[id]) {
      setMessages(mockChatData[id]);
    }
  }, [id]);

  const handleSend = () => {
    if (!inputText.trim() && !file && !audioURL) return;

    const now = new Date();
    const time = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', }) + ' น.';

    if (inputText.trim()) {
      const newBotMsg = {
        type: 'bot',
        text: inputText,
        time,
        username: 'Chat bot สำนักงานปลัดกระทรวงการคลัง',
      };
      setMessages((prev) => [...prev, newBotMsg]);
      setInputText('');

      setTimeout(() => {
        const userReply = {
          type: 'user',
          text: 'ขอบคุณครับ/ค่ะ สำหรับข้อมูล',
          time,
          username: 'นายสุรวีย์ วงศ์สวัสดิ์',
        };
        setMessages((prev) => [...prev, userReply]);
      }, 1000);
    }

    if (file) {
      const fileMsg = {
        type: 'bot',
        text: (
          <span>
            <b>ไฟล์แนบ:</b> <a href={URL.createObjectURL(file)} target="_blank" rel="noopener noreferrer">{file.name}</a>
          </span>
        ),
        time,
        username: 'Chat bot สำนักงานปลัดกระทรวงการคลัง',
        isFile: true
      };
      setMessages((prev) => [...prev, fileMsg]);
      setFile(null);

      setTimeout(() => {
        const userReply = {
          type: 'user',
          text: 'ได้รับไฟล์แล้ว ขอบคุณครับ/ค่ะ',
          time,
          username: 'นายสุรวีย์ วงศ์สวัสดิ์',
        };
        setMessages((prev) => [...prev, userReply]);
      }, 1000);
    }

    if (audioURL) {
      const audioMsg = {
        type: 'bot',
        text: (
          <span>
            <b>ไฟล์เสียง:</b> <audio controls src={audioURL}></audio>
          </span>
        ),
        time,
        username: 'Chat bot สำนักงานปลัดกระทรวงการคลัง',
        isAudio: true,
      };
      setMessages((prev) => [...prev, audioMsg]);
      setAudioURL(null);

      setTimeout(() => {
        const userReply = {
          type: 'user',
          text: 'ได้รับเสียงแล้ว ขอบคุณครับ/ค่ะ',
          time,
          username: 'นายสุรวีย์ วงศ์สวัสดิ์',
        };
        setMessages((prev) => [...prev, userReply]);
      }, 1000);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleMicClick = async () => {
    if (isRecording) {
      mediaRecorder && mediaRecorder.stop();
      setIsRecording(false);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new window.MediaRecorder(stream);

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      setAudioURL(url);
      chunksRef.current = [];
    };

    chunksRef.current = [];
    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  // เพิ่มฟังก์ชันสำหรับเลือกอิโมจิ
  const handleAddEmoji = (emoji) => setInputText((prev) => prev + emoji);

  return (
    <Box sx={{ background: '#E8F1FB', minHeight: '100vh' }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        px={4}
        py={2}
        sx={{ background: '#fff' }}>
        <Stack direction="row" alignItems="center" spacing={10}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton
              onClick={() =>
                router.push('/admin/homepage/complainant-questions')}
              sx={{ p: 0 }}>
              <img src="/icons/Arrow_Left_C.png" alt="" />
            </IconButton>
            <Typography fontSize={16} color="#1120A3" fontWeight="bold">
              กลับหน้าหลัก
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar src="/logo_blue.png" alt="logo" sx={{ width: 32, height: 32 }} />
            <Typography fontSize={16}>
              Chat bot สำนักงานปลัดกระทรวงการคลัง
            </Typography>
          </Stack>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={2.5} sx={{ pr: 4 }}>
          <CallIcon sx={{ color: '#9E9E9E' }} />
          <VideocamIcon sx={{ color: '#9E9E9E' }} />
          <MoreVertIcon sx={{ color: '#9E9E9E' }} />
        </Stack>
      </Stack>

      {/* Chat Area */}
      <Box sx={{ px: 4, pt: 4, pb: 8, maxWidth: 1000, mx: 'auto' }}>
        {messages.map((msg, idx) => (
          <Box key={idx} sx={{ display: 'flex', flexDirection: msg.type === 'bot' ? 'row-reverse' : 'row', alignItems: 'flex-start', mb: 3,}}>
            <Avatar src={ msg.type === 'bot' ? '/logo_blue.png' : '/images/Ellipse 2.png' } sx={{ width: 36, height: 36, mx: 1 }}/>
            <Box>
              <Typography variant="caption" sx={{  color: '#888',  textAlign: msg.type === 'bot' ? 'right' : 'left',  display: 'block',  mb: 0.5, }}>
                {msg.type === 'user' ? `${msg.time} ${msg.username}` : `${msg.username} ${msg.time}`}
              </Typography>
              <Box
                sx={{
                  background: msg.type === 'bot' ? '#ffffff' : '#3B82F6',
                  color: msg.type === 'bot' ? '#000' : '#fff',
                  px: 2,
                  py: 1.2,
                  borderRadius: 2,
                  boxShadow:
                    msg.type === 'user'
                      ? '0 1px 4px rgba(0,0,0,0.1)'
                      : 'none',
                  maxWidth: 450,
                  whiteSpace: 'pre-line'
                }}>
                {typeof msg.text === 'string' ? msg.text : msg.text}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Input */}
      <Box sx={{ position: 'fixed', bottom: 0, width: '100%', background: '#fff', borderTop: '1px solid #E5E7EB', zIndex: 2 }}>
        <Box sx={{ maxWidth: 1000, mx: 'auto', px: 4, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" alignItems="center" spacing={1.5} flex={1}>
            <Box sx={{ position: "relative" }}>
              <InsertEmoticonIcon
                sx={{ color: '#9E9E9E', cursor: 'pointer' }}
                onClick={() => setShowEmoji((prev) => !prev)}/>
              {showEmoji && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 32,
                    left: 0,
                    background: "#fff",
                    border: "1px solid #eee",
                    borderRadius: 2,
                    p: 1,
                    zIndex: 999,
                    boxShadow: 2,
                    width: 320,
                    maxHeight: 200,
                    overflowY: "auto",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "4px"
                  }}>
                  {emojiService.getEmojiList().map((emoji, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        fontSize: "1.5rem",
                        cursor: "pointer",
                        p: 0.5,
                        borderRadius: 1,
                        ":hover": { background: "#E8F1FB" }
                      }}
                      onClick={() => {
                        handleAddEmoji(emoji);
                        setShowEmoji(false);
                      }}>
                      {emoji}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
            <TextField
              fullWidth
              placeholder="พิมพ์ข้อความ..."
              variant="standard"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              InputProps={{
                disableUnderline: true,
                sx: { fontSize: 14 },
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}/>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              onClick={handleMicClick}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                background: isRecording ? '#FEF08A' : 'transparent',
                borderRadius: '50%',
                width: 40,
                height: 40,
                mr: 1}}>
              <MicIcon sx={{ color: isRecording ? '#F59E42' : '#9E9E9E' }} />
            </Box>
            <label htmlFor="file-upload">
              <AttachFileIcon
                sx={{ color: file ? '#00AEEF' : '#9E9E9E', transform: 'rotate(45deg)', cursor: 'pointer' }}/>
              <Input
                id="file-upload"
                type="file"
                sx={{ display: 'none' }}
                onChange={handleFileChange}/>
            </label>
            <Box
              sx={{
                backgroundColor: '#00AEEF',
                color: '#fff',
                px: 2,
                py: 0.5,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer' }}
              onClick={handleSend}>
              <Typography fontSize={14}>ส่ง</Typography>
              <SendIcon sx={{ fontSize: 18 }} />
            </Box>
          </Stack>
        </Box>
        
        {/* แสดงชื่อไฟล์ถ้ามีการเลือก */}
        {file && (
          <Box sx={{ px: 4, pb: 1, fontSize: 14, color: '#374151' }}>
            ไฟล์ที่เลือก: {file.name}
          </Box>
        )}
        {/* แสดงสถานะบันทึกเสียง */}
        {isRecording && (
          <Box sx={{ px: 4, pb: 1, fontSize: 14, color: '#F59E42' }}>
            กำลังบันทึกเสียง...
          </Box>
        )}
        {/* แสดงปุ่มเล่นเสียงถ้ามีไฟล์เสียง */}
        {audioURL && !isRecording && (
          <Box sx={{ px: 4, pb: 1 }}>
            <audio controls src={audioURL}></audio>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ComplainantquestionsChatbot;