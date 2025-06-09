import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DateThaiPickerService from '@services/DateThaiPickerService/DateThaiPickerService';

    const newsData = [
    {
        title: 'NO GIFT POLICY 2568 การมอบนโยบายงดรับของขวัญและของกำนัลทุกชนิด จากการปฏิบัติหน้าที่ ประจำปีงบประมาณ พ.ศ. 2568 และการส่งเสริมคุณธรรม และจริยธรรมในการปฏิบัติงาน',
        content: 'รายละเอียดข่าวเก่า',
        url: 'https://example.com',
        pinTop: true,
        publish: true,
        expireDate: '2025-06-30',
        images: ['/news/news1.png'],
    },
    {
        title: 'พิธีมอบสัญญาเช่าที่ราชพัสดุ ประจำปีงบประมาณ พ.ศ. 2568 ภายใต้โครงการธนารักษ์เอื้อราษฎร์ “สัญญาเช่าที่ดิน พลิกชีวิตประชาชน”',
        content: 'รายละเอียดข่าว 2',
        url: 'https://example2.com',
        pinTop: false,
        publish: true,
        expireDate: '2025-06-30',
        images: ['/news/news2.png'],
    },
    {
        title: 'รองปลัดกระทรวงการคลัง ด้านบริหาร มอบสิ่งของ ชุดครัว และชุดเครื่องนอน เพื่อบรรเทาความเดือดร้อนของประชาชน อ.เมืองเชียงราย จ.เชียงราย',
        content: 'รายละเอียดข่าว 3',
        url: '',
        pinTop: false,
        publish: true,
        expireDate: '2025-06-30',
        images: ['/news/news3.png'],
    },
    {
        title: 'ตราสัญลักษณ์การจัดงานเฉลิมพระเกียรติพระบาทสมเด็จพระเจ้าอยู่หัว เนื่องในโอกาสพระราชพิธีสมมงคลพระชนมายุเท่าพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราช',
        content: 'รายละเอียดข่าว 4',
        url: '',
        pinTop: false,
        publish: true,
        expireDate: '2025-06-30',
        images: ['/news/news4.png'],
    },
    {
        title: 'พิธีมอบสัญญาเช่าที่ราชพัสดุ ประจำปีงบประมาณ พ.ศ. 2568 ภายใต้โครงการธนารักษ์เอื้อราษฎร์“สัญญาเช่าที่ดิน พลิกชีวิตประชาชน”',
        content: 'รายละเอียดข่าว 5',
        url: '',
        pinTop: false,
        publish: true,
        expireDate: '2025-06-30',
        images: ['/news/news5.png'],
    },
    ];

const RichTextEditor = ({ value, onChange }) => {
  return (
    <TextField
      multiline
      rows={6}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
    />
  );
};

const ImageUpload = ({ images, setImages }) => {
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => URL.createObjectURL(file));
    setImages([...images, ...newImages]);
  };

  const removeImage = (index) => {
    const updated = [...images];
    updated.splice(index, 1);
    setImages(updated);
  };

  return (
    <Box>
      <Button
        component="label"
        variant="outlined"
        endIcon={<AddIcon sx={{ fontSize: 20 }} />}
        size="small"
        sx={{
          color: '#1120A3',
          backgroundColor: '#E8E9F6',
          border: '1px solid #1120A3',
          borderRadius: '12px',
          fontWeight: 'bold',
          px: 2.5,
          py: 1,
          textTransform: 'none',
          '&:hover': {
            backgroundColor: '#E4E9F2',
            borderColor: '#1120A3',
          },
        }}
      >
        เพิ่มรูปภาพ
        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleImageChange}
        />
      </Button>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        {images.map((img, index) => (
          <Grid item xs="auto" key={index}>
            <Box
              sx={{
                width: 120,
                height: 120,
                position: 'relative',
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid #ccc',
              }}
            >
              <img
                src={img}
                alt={`uploaded-${index}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              <IconButton
                size="small"
                onClick={() => removeImage(index)}
                sx={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  background: '#fff',
                  borderRadius: '50%',
                  boxShadow: 1,
                  zIndex: 2,
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default function NewDetails({ mode = 'create' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [pinTop, setPinTop] = useState(false);
  const [publish, setPublish] = useState(true);
  const [expireDate, setExpireDate] = useState(dayjs().add(21, 'day').format('YYYY-MM-DD'));
  const [images, setImages] = useState([]);

  useEffect(() => {
    if (mode === 'edit') {
      const index = parseInt(id);
      if (!isNaN(index) && newsData[index]) {
        const item = newsData[index];
        setTitle(item.title || '');
        setContent(item.content || '');
        setUrl(item.url || '');
        setPinTop(item.pinTop || false);
        setPublish(item.publish ?? true);
        setExpireDate(item.expireDate || dayjs().add(21, 'day').format('YYYY-MM-DD'));
        setImages(item.images || []);
      }
    }
  }, [id, mode]);

  const handleSubmit = () => {
    const payload = { title, content, url, pinTop, publish, expireDate, images };
    console.log(mode === 'edit' ? 'Updating...' : 'Creating...', payload);
    router.push('/admin/homepage/news');
  };

  return (
    <Box sx={{ background: '#f5f7fb', py: 4, minHeight: '100vh' }}>
      <Container maxWidth="md">
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2, }}>
          <Box component="img" src="/icons/config.png" alt="" sx={{ width: 24, height: 24 }} />
          <Typography component="div" sx={{ fontWeight: 'bold', fontSize: 18, display: 'flex', alignItems: 'center' }}>
            กำหนดข่าวสาร&nbsp;
            <Box component="img" src="/icons/Right_Arrow.png" alt=">" sx={{ width: 16, height: 16, mx: 0.5 }} />
            &nbsp;{mode === 'edit' ? 'แก้ไขข่าวสาร' : 'เพิ่มข่าวสาร'}
          </Typography>
        </Stack>

        <Box sx={{ border: '2px solid #007AFF', borderRadius: '8px', background: '#fff', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Box sx={{ height: '30px', background: 'linear-gradient(to right, #1223A5, #2499FF)' }} />

          <Box sx={{ p: 5 }}>
            <Stack spacing={3}>
              <Typography sx={{ color: '#1120A3', fontWeight: 'bold' }}>หัวข้อข่าวสาร</Typography>
              <TextField
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{ border: '1px solid #007AFF', borderRadius: '8px', '& fieldset': { border: 'none' } }}/>
              <Typography sx={{ color: '#1120A3', fontWeight: 'bold' }}>เนื้อหาข่าวสาร</Typography>
              <Box sx={{ border: '1px solid #007AFF', borderRadius: '8px', '& fieldset': { border: 'none' } }}>
                <RichTextEditor value={content} onChange={setContent} />
              </Box>
              <Typography sx={{ color: '#1120A3', fontWeight: 'bold' }}>แนบลิงก์ URL</Typography>
              <TextField
                fullWidth
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                sx={{ border: '1px solid #007AFF', borderRadius: '8px', '& fieldset': { border: 'none' } }}/>

              <Stack spacing={2}>
                <Box display="flex" justifyContent="flex-end">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <FormControlLabel
                      control={<Checkbox checked={pinTop} onChange={(e) => setPinTop(e.target.checked)} />}
                      label="แสดงผลยอด"/>
                    <FormControlLabel
                      control={<Checkbox checked={publish} onChange={(e) => setPublish(e.target.checked)} />}
                      label="กำหนดระยะเวลา"
                    />
                  </Stack>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,}} >
                  <ImageUpload images={images} setImages={setImages} />
                  <Box sx={{ minWidth: 220 }}>
                    <DateThaiPickerService
                      onChange={(dateObj) => setExpireDate(dateObj)}
                      name="expireDate"
                    />
                  </Box>
                </Box>
              </Stack>

              <Box textAlign="center" mt={4}>
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  sx={{
                    background: '#1120A3',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    width: '230px',
                    height: '56px',
                  }}>
                  โพสต์
                </Button>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}