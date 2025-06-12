import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Button, Container, Stack, Typography, TextField, Checkbox, FormControlLabel,
  Grid, useMediaQuery, useTheme, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import { useRouter } from 'next/router';
import dayjs from 'dayjs';
import DateThaiPickerService from '@services/DateThaiPickerService/DateThaiPickerService';
import BreadcrumbsServiceF from '@services/BreadCrumbs/breadcrumbsFunction';
import RichTextEditor from '@services/RichTextEditor/RichTextEditor';
import ImageUpload from '@services/ImageUpload/ImageUpload';
import { showConfirm2, } from "@utils/Alerts";
export default function NewsDetails() {
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
  const [isDirty, setIsDirty] = useState(false);
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

  useEffect(() => {
    if (method === 'EditNew' && isReady) {
      const isChanged =
        title !== (qTitle || '') ||
        content !== (qContent || '') ||
        url !== (qUrl || '') ||
        pinTop !== (qPinTop === 'true' || qPinTop === true) ||
        publish !== (qPublish === 'true' || qPublish === true) ||
        !dayjs(expireDate).isSame(qExpireDate ? dayjs(qExpireDate) : dayjs().add(21, 'day'), 'day') ||
        JSON.stringify(images) !== JSON.stringify(qImg ? [qImg] : []);
      setIsDirty(isChanged);
    }
  }, [title, content, url, pinTop, publish, expireDate, images]);

  useEffect(() => {
  if (method !== 'EditNew') return;

  const handleRouteChangeStart = (url) => {
    if (!isDirty) return;

    router.events.off('routeChangeStart', handleRouteChangeStart);

    showConfirm2(
      `<span style="color:#932626;">ยกเลิกการแสดงข่าวสาร</span>`,
      `<div><strong style="color:#932626;">การยกเลิกแสดงข่าวสารจะเป็นการย้ายรายการนี้ไปยังคลังเก็บข้อมูลในฐานข้อมูล<br />
       ซึ่งสามารถกู้คืนได้จากระบบหากจำเป็น และจะไม่แสดงผลในหน้านี้อีก<br /><br />
       ยืนยันการยกเลิกแสดงข่าวสารนี้หรือไม่?</strong>
        </div>`,
        "ยืนยัน",
        "ยกเลิก",
        800
    ).then((confirmed) => {
      if (confirmed) {
        setIsDirty(false);
        router.push(url);
      } else {
        router.events.on('routeChangeStart', handleRouteChangeStart);
      }
    });

    router.events.emit('routeChangeError');
    throw 'Route change aborted due to unsaved changes';
  };

  router.events.on('routeChangeStart', handleRouteChangeStart);
  return () => {
    router.events.off('routeChangeStart', handleRouteChangeStart);
  };
}, [isDirty, method, router.events]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);


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
    setIsDirty(false);
    router.push('/admin/homepage/news');
  };

  const handleBreadcrumbClick = async (url) => {
  if (!isDirty) {
    router.push(url);
    return;
  }

  const confirmed = await showConfirm2(
    `<span style="color:#932626;">ยกเลิกการแสดงข่าวสาร</span>`,
    `<div><strong style="color:#932626;">การยกเลิกแสดงข่าวสารจะเป็นการย้ายรายการนี้ไปยังคลังเก็บข้อมูลในฐานข้อมูล<br />
    ซึ่งสามารถกู้คืนได้จากระบบหากจำเป็น และจะไม่แสดงผลในหน้านี้อีก<br /><br />
    ยืนยันการยกเลิกแสดงข่าวสารนี้หรือไม่?</strong>
        </div>`,
        "ยืนยัน",
        "ยกเลิก",
        800
  );

  if (confirmed) {
    setIsDirty(false);
    router.push(url);
  }
};

const breadcrumbItems = [
  {
    label: (
      <span style={{ color: "#1120A3" }}>
        กำหนดข่าวสาร
      </span>
    ),
    icon: (
      <img
        src="/icons/config.png"
        alt="icon"
        style={{
          width: "24px",
          height: "24px",
          marginBottom: "-8px",
          borderRadius: "50%",
          border: "2px solid #1120A3",
          padding: "2px",
        }}
      />
    ),
    onClick: () => handleBreadcrumbClick("/admin/homepage/news"),
  },
  {
  label: (
    <span style={{ color: "#1120A3" }}>
      {method === "EditNew" ? "แก้ไขข่าวสาร" : "เพิ่มข่าวสาร"}
    </span>
  ),
}

];


  return (
    <Box sx={{ background: '#f5f7fb', py: isSmDown ? 2 : 4, minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ maxWidth: { xs: '100%', md: '1400px' }, px: { xs: 1, sm: 2, md: 4 } }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: isSmDown ? 1 : 2 }}>
          <BreadcrumbsServiceF items={breadcrumbItems}/>
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