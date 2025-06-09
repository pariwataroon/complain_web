import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  IconButton,
  Stack,
  Avatar,
  TextField,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CallIcon from '@mui/icons-material/Call';
import VideocamIcon from '@mui/icons-material/Videocam';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import MicIcon from '@mui/icons-material/Mic';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';
import { useState, useEffect } from 'react';

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

  useEffect(() => {
    if (id && mockChatData[id]) {
      setMessages(mockChatData[id]);
    }
  }, [id]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const now = new Date();
    const time =
      now.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      }) + ' น.';
    const newMsg = {
      type: 'user',
      text: inputText,
      time,
      username: 'นายสุรวีย์ วงศ์สวัสดิ์',
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  return (
    <Box sx={{ background: '#E8F1FB', minHeight: '100vh' }}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        px={4}
        py={2}
        sx={{ background: '#fff' }}
      >
        <Stack direction="row" alignItems="center" spacing={10}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton
              onClick={() =>
                router.push('/admin/homepage/complainant-questions')
              }
              sx={{ p: 0 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography fontSize={16} color="#1120A3" fontWeight="bold">
              กลับหน้าหลัก
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar
              src="/logo_blue.png"
              alt="logo"
              sx={{ width: 32, height: 32 }}
            />
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
  <Box
    key={idx}
    sx={{
      display: 'flex',
      flexDirection: msg.type === 'bot' ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      mb: 3,
    }}
  >
    <Avatar
      src={
        msg.type === 'bot'
          ? '/logo_blue.png'
          : '/images/Ellipse 2.png'
      }
      sx={{ width: 36, height: 36, mx: 1 }}
    />
    <Box>
      <Typography
        variant="caption"
        sx={{
          color: '#888',
          textAlign: msg.type === 'bot' ? 'right' : 'left',
          display: 'block',
          mb: 0.5,
        }}
      >
        {msg.type === 'user'
          ? `${msg.time} ${msg.username}`
          : `${msg.username} ${msg.time}`}
      </Typography>

      {/* Bubble Message */}
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
          whiteSpace: 'pre-line',
        }}
      >
        {msg.text}
      </Box>
    </Box>
  </Box>
        ))}
      </Box>

      {/* Input */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          width: '100%',
          background: '#fff',
          borderTop: '1px solid #E5E7EB',
        }}
      >
        <Box
          sx={{
            maxWidth: 1000,
            mx: 'auto',
            px: 4,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Input Bar */}
          <Stack direction="row" alignItems="center" spacing={1.5} flex={1}>
            <InsertEmoticonIcon sx={{ color: '#9E9E9E' }} />
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
            />
          </Stack>

          <Stack direction="row" alignItems="center" spacing={2}>
            <MicIcon sx={{ color: '#9E9E9E' }} />
            <AttachFileIcon
              sx={{ color: '#9E9E9E', transform: 'rotate(45deg)' }}
            />
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
                cursor: 'pointer',
              }}
              onClick={handleSend}
            >
              <Typography fontSize={14}>ส่ง</Typography>
              <SendIcon sx={{ fontSize: 18 }} />
            </Box>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default ComplainantquestionsChatbot;
