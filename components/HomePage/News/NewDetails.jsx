import React, { useEffect, useState } from 'react';
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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useRouter } from 'next/router';
import dayjs from 'dayjs';
import DateThaiPickerService from '@services/DateThaiPickerService/DateThaiPickerService';
import BreadcrumbsService from '@services/BreadCrumbs/breadcrumbs';
import RichTextEditor from '@services/RichTextEditor/RichTextEditor';
import ImageUpload from '@services/ImageUpload/ImageUpload';

export default function NewDetails() {
  const router = useRouter();
  const { query, isReady } = router;
  const { id, method, title: qTitle, content: qContent, url: qUrl, pinTop: qPinTop, publish: qPublish, expireDate: qExpireDate, img: qImg } = query;

  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [pinTop, setPinTop] = useState(false);
  const [publish, setPublish] = useState(true);
  const [expireDate, setExpireDate] = useState(dayjs().add(21, 'day'));
  const [images, setImages] = useState([]);

  useEffect(() => {
    if (method === 'EditNew' && isReady) {
      setTitle(qTitle || '');
      setContent(qContent || '');
      setUrl(qUrl || '');
      setPinTop(qPinTop === 'true' || qPinTop === true);
      setPublish(qPublish === 'true' || qPublish === true);
      setExpireDate(qExpireDate || dayjs().add(21, 'day').format('YYYY-MM-DD'));
      setImages(qImg ? [qImg] : []);
    }
  }, [method, isReady]);

  const handleSubmit = () => {
    const formattedExpire = dayjs(expireDate).isValid() ? dayjs(expireDate).format('D MMM YYYY') : '-';
    const newData = {
      title,
      content,
      url,
      pinTop,
      publish,
      expireDate,
      img: images.length > 0 ? images[0] : '',
      date: dayjs().format('D MMM YYYY'),
      update: dayjs().format('D MMM YYYY'),
      status: `หายไปในวันที่ ${formattedExpire} (21 วัน)`,
      views: 0,
    };

    const stored = sessionStorage.getItem('newsList');
    const existing = stored ? JSON.parse(stored) : [];

    if (method === 'EditNew' && id !== undefined) {
      existing[parseInt(id)] = newData;
    } else {
      existing.push(newData);
    }

    sessionStorage.setItem('newsList', JSON.stringify(existing));
    router.push('/admin/homepage/news');
  };

  const breadcrumbItems = [
    {
      label: "กำหนดข่าวสาร",
      icon: (
        <img
          src="/icons/config.png"
          alt="icon"
          style={{ width: "24px", height: "24px", marginBottom: "-8px" }}
        />
      ),
      url: "/admin/homepage/news",
    },
    {
      label: method === "EditNew" ? "แก้ไขข่าวสาร" : "เพิ่มข่าวสาร",
    },
  ];

  return (
    <Box sx={{ background: '#f5f7fb', py: isSmDown ? 2 : 4, minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ maxWidth: { xs: '100%', md: '1400px' }, px: { xs: 1, sm: 2, md: 4 } }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: isSmDown ? 1 : 2 }}>
          <BreadcrumbsService items={breadcrumbItems}/>
        </Stack>
        <Box sx={{
          border: '2px solid #007AFF',
          borderRadius: 2,
          background: '#fff',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          mx: { xs: 0, md: 'auto' }
        }}>
          <Box sx={{ height: 30, background: 'linear-gradient(to right, #1223A5, #2499FF)' }} />
          <Box sx={{ p: { xs: 2, sm: 3, md: 5 } }}>
            <Stack spacing={isSmDown ? 2 : 3}>
              <Typography color="#1120A3" fontWeight="bold" fontSize={isSmDown ? 14 : 16}>หัวข้อข่าวสาร</Typography>
              <TextField
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{
                  border: '1px solid #007AFF',
                  borderRadius: 2,
                  '& fieldset': { border: 'none' },
                  fontSize: isSmDown ? 14 : 16
                }}
                InputProps={{
                  style: { fontSize: isSmDown ? 14 : 16 }
                }}
              />

              <Typography color="#1120A3" fontWeight="bold" fontSize={isSmDown ? 14 : 16}>เนื้อหาข่าวสาร</Typography>
              <Box>
                <RichTextEditor value={content} onChange={setContent} />
              </Box>

              <Typography color="#1120A3" fontWeight="bold" fontSize={isSmDown ? 14 : 16}>แนบลิงก์ URL</Typography>
              <TextField
                fullWidth
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                sx={{
                  border: '1px solid #007AFF',
                  borderRadius: 2,
                  '& fieldset': { border: 'none' },
                  fontSize: isSmDown ? 14 : 16
                }}
                InputProps={{
                  style: { fontSize: isSmDown ? 14 : 16 }
                }}
              />

              <Stack spacing={isSmDown ? 1 : 2}>
                <Box display="flex" justifyContent={isSmDown ? "flex-start" : "flex-end"}>
                  <Stack direction={isSmDown ? 'column' : 'row'} spacing={isSmDown ? 1 : 2}>
                    <FormControlLabel control={<Checkbox checked={pinTop} onChange={(e) => setPinTop(e.target.checked)} />} label="แสดงผลยอด" />
                    <FormControlLabel control={<Checkbox checked={publish} onChange={(e) => setPublish(e.target.checked)} />} label="กำหนดระยะเวลา" />
                  </Stack>
                </Box>
                <Grid container spacing={isSmDown ? 1 : 2} alignItems="flex-start">
                  <Grid item xs={12} md={8}>
                    <ImageUpload images={images} setImages={setImages} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ minWidth: 220, mt: isSmDown ? 2 : 0 }}>
                      <DateThaiPickerService name="expireDate" onChange={setExpireDate} />
                    </Box>
                  </Grid>
                </Grid>
              </Stack>

              <Box textAlign="center" mt={isSmDown ? 2 : 4}>
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  sx={{
                    background: '#1120A3',
                    borderRadius: 2,
                    fontWeight: 'bold',
                    width: isSmDown ? '100%' : 230,
                    height: isSmDown ? 44 : 56,
                    fontSize: isSmDown ? 14 : 16
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