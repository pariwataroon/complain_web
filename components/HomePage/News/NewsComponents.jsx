import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CardMedia,
  Grid,
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from 'next/router';
import BreadcrumbsService from '@services/BreadCrumbs/breadcrumbs';

const DefineNewsComponents = () => {
  const router = useRouter();
  const [newsList, setNewsList] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('newsList');
    if (saved) {
      setNewsList(JSON.parse(saved));
    } else {
      const initial = [
        {
    title: 'NO GIFT POLICY 2568 การมอบนโยบายงดรับของขวัญและของกำนัลทุกชนิด จากการปฏิบัติหน้าที่ ประจำปีงบประมาณ พ.ศ. 2568 และการส่งเสริมคุณธรรม และจริยธรรมในการปฏิบัติงาน',
    date: '17 ม.ค. 2568',
    update: '18 ม.ค. 2568',
    status: 'หายไปในวันที่ 14 ก.พ. 2568 (21 วัน)',
    img: '/news/news1.png',
    views: 1235,
  },
  {
    title: 'พิธีมอบสัญญาเช่าที่ราชพัสดุ ประจำปีงบประมาณ พ.ศ. 2568 ภายใต้โครงการธนารักษ์เอื้อราษฎร์ “สัญญาเช่าที่ดิน พลิกชีวิตประชาชน”',
    date: '17 ม.ค. 2568',
    update: '18 ม.ค. 2568',
    status: 'หายไปในวันที่ 14 ก.พ. 2568 (21 วัน)',
    img: '/news/news2.png',
    views: 1235,
  },
  {
    title: 'รองปลัดกระทรวงการคลัง ด้านบริหาร มอบสิ่งของ ชุดครัว และชุดเครื่องนอน เพื่อบรรเทาความเดือดร้อนของประชาชน อ.เมืองเชียงราย จ.เชียงราย',
    date: '17 ม.ค. 2568',
    update: '18 ม.ค. 2568',
    status: 'หายไปในวันที่ 14 ก.พ. 2568 (21 วัน)',
    img: '/news/news3.png',
    views: 1235,
  },
  {
    title: 'ตราสัญลักษณ์การจัดงานเฉลิมพระเกียรติพระบาทสมเด็จพระเจ้าอยู่หัว เนื่องในโอกาสพระราชพิธีสมมงคลพระชนมายุเท่าพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราช',
    date: '17 ม.ค. 2568',
    update: '18 ม.ค. 2568',
    status: 'หายไปในวันที่ 14 ก.พ. 2568 (21 วัน)',
    img: '/news/news4.png',
    views: 1235,
  },
  {
    title: 'พิธีมอบสัญญาเช่าที่ราชพัสดุ ประจำปีงบประมาณ พ.ศ. 2568 ภายใต้โครงการธนารักษ์เอื้อราษฎร์“สัญญาเช่าที่ดิน พลิกชีวิตประชาชน”',
    date: '17 ม.ค. 2568',
    update: '18 ม.ค. 2568',
    status: 'หายไปในวันที่ 14 ก.พ. 2568 (21 วัน)',
    img: '/news/news5.png',
    views: 1235,
  },
      ];
      sessionStorage.setItem('newsList', JSON.stringify(initial));
      setNewsList(initial);
    }
  }, []);

  const breadcrumbItems = [
    {
      label: "กำหนดข่าวสาร",
      icon: (
        <img
          src="/icons/config.png"
          alt="icon"
          style={{ width: "24px", height: "24px", marginBottom: "-8px" }}
        />
      ),url: "/admin"
    }
  ];

  const handleAddNews = () => {
    router.push({ pathname: "/admin/homepage/news", query: { method: "CreateNew" } });
  };

  const handleEditNews = (index) => {
    const item = newsList[index];
    router.push({
      pathname: "/admin/homepage/news",
      query: {
        method: "EditNew",
        id: index,
        title: item.title,
        content: item.content || '',
        url: item.url || '',
        pinTop: item.pinTop ?? false,
        publish: item.publish ?? true,
        expireDate: item.expireDate || '',
        img: item.img || '',
      },
    });
  };

  const openDeleteDialog = (index) => {
    setSelectedIndex(index);
    setOpenDialog(true);
  };

  const confirmDelete = () => {
    const updated = [...newsList];
    updated.splice(selectedIndex, 1);
    setNewsList(updated);
    sessionStorage.setItem('newsList', JSON.stringify(updated));
    setOpenDialog(false);
  };

  return (
    <Box sx={{ background: '#EAF3FF', minHeight: '100vh', py: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{
        fontWeight: 'bold', fontSize: 18, color: '#1120A3', mb: 2, maxWidth: '1600px', mx: 'auto', px: 2
      }}>
        <BreadcrumbsService items={breadcrumbItems}/>
      </Stack>

      <Box sx={{ maxWidth: '1400px', mx: 'auto', px: { xs: 1, sm: 2, md: 4 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
          <Typography sx={{ fontWeight: 'bold', fontSize: 18, color: '#1120A3' }}>
            ข่าวสารในระบบทั้งหมด
          </Typography>
          <Button
            onClick={handleAddNews}
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 'bold',
              background: '#1120A3',
              '&:hover': { background: '#0d1680' },
              width: { xs: '100%', sm: 'auto' }
            }}>
            เพิ่มข่าวสาร
          </Button>
        </Box>

        <Grid container spacing={2}>
          {newsList.map((item, index) => (
            <Grid item xs={12} key={index}>
              <Box sx={{
                background: '#fff',
                borderRadius: 2,
                p: 1.5,
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'flex-start' },
                wordBreak: 'break-word'
              }}>
                <CardMedia
                  component="img"
                  image={item.img}
                  alt="news"
                  sx={{
                    width: { xs: '100%', sm: 100 },
                    maxWidth: { xs: '100%', sm: 100 },
                    height: { xs: 180, sm: 100 },
                    borderRadius: 2,
                    objectFit: 'cover',
                    mb: { xs: 1, sm: 0 }
                  }}/>

                <Box sx={{
                  flex: 1,
                  ml: { sm: 2, xs: 0 },
                  width: '100%',
                  position: 'relative',
                  minHeight: 100,
                  pr: { xs: 0, sm: 6 }
                }}>
                  <Box
                    display="flex"
                    alignItems="flex-start"
                    flexDirection="column"
                    flexWrap="wrap"
                    sx={{ mb: 1, width: '100%' }}>
                    <Typography
                      sx={{
                        color: '#878FD0',
                        fontWeight: 'bold',
                        fontSize: 14,
                        lineHeight: 1.4,
                        cursor: 'pointer',
                        mr: 1,
                        wordBreak: 'break-word',
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: { xs: 2, sm: 1 },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%'
                      }}>
                      {item.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#89939E', fontSize: 12 }}>
                      👁 {item.views.toLocaleString()} view
                    </Typography>
                  </Box>

                  <Box sx={{
                    position: { xs: 'static', sm: 'absolute' },
                    bottom: { sm: 0 },
                    left: 0,
                    width: '100%',
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    flexWrap: 'wrap',
                    pr: 1,
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ mb: { xs: 0.5, sm: 0 } }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <img src="/icons/Edit.png" alt="" style={{ width: 16, height: 16 }} />
                        <Typography variant="body2" sx={{ color: '#89939E', fontSize: 12 }}>
                          วันที่นำเข้าข้อมูล {item.date}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <img src="/icons/re.png" alt="" style={{ width: 16, height: 16 }} />
                        <Typography variant="body2" sx={{ color: '#89939E', fontSize: 12 }}>
                          วันที่ปรับปรุงข้อมูล {item.update}
                        </Typography>
                      </Stack>
                    </Stack>
                    <Typography variant="body2" sx={{
                      color: '#89939E',
                      mt: { xs: 1, sm: 0 },
                      fontSize: 12,
                      whiteSpace: { xs: 'normal', sm: 'nowrap' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      สถานะ: {item.status}
                    </Typography>
                  </Box>
                </Box>

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  ml={{ sm: 2, xs: 0 }}
                  mt={{ xs: 1.5, sm: 0 }}
                  sx={{
                    alignSelf: { xs: 'center', sm: 'flex-start' },
                    width: { xs: '100%', sm: 'auto' },
                    justifyContent: { xs: 'center', sm: 'flex-start' }
                  }}>
                  <Tooltip title="แก้ไข">
                    <img
                      src="/icons/PencilYellow.png"
                      alt=""
                      style={{ cursor: 'pointer', width: 28, height: 28 }}
                      onClick={() => handleEditNews(index)}
                    />
                  </Tooltip>
                  <Tooltip title="ลบ">
                    <img
                      src="/icons/DeleteYellow.png"
                      alt=""
                      style={{ cursor: 'pointer', width: 28, height: 28 }}
                      onClick={() => openDeleteDialog(index)}
                    />
                  </Tooltip>
                </Stack>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Popup Confirm Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold', color: '#991B1B', textAlign: 'center' }}>
          ยกเลิกการแสดงข่าวสาร
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1, textAlign: 'center', color: '#991B1B', fontWeight: 'bold', fontSize: 14 }}>
            การยกเลิกแสดงข่าวสารจะเป็นการย้ายรายการนี้ไปยังคลังเก็บข้อมูลในฐานข้อมูล ซึ่งสามารถกู้คืนได้จากระบบหากจำเป็น และจะไม่แสดงผลในหน้านี้อีก
          </Typography>
          <Typography sx={{ textAlign: 'center', color: '#991B1B', fontWeight: 'bold', fontSize: 14 }}>
            ยืนยันการยกเลิกแสดงข่าวสารนี้หรือไม่?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button
            onClick={() => setOpenDialog(false)}
            variant="outlined"
            size="large"
            sx={{
              borderColor: '#DC2626',
              color: '#DC2626',
              fontSize: 18,
              fontWeight: 'bold',
              borderRadius: '10px',
              minWidth: 120,
              height: 50,
              px: 4,
              py: 2,
              '&:hover': { backgroundColor: '#FEE2E2', borderColor: '#DC2626' },
            }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <img src="/icons/Cross.png" alt="" style={{ width: 22, height: 22, marginRight: 10 }} />
              ยกเลิก
            </span>
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            size="large"
            sx={{
              backgroundColor: '#DC2626',
              color: '#fff',
              fontSize: 18,
              fontWeight: 'bold',
              borderRadius: '10px',
              minWidth: 120,
              height: 50,
              px: 4,
              py: 2,
              '&:hover': { backgroundColor: '#B91C1C' },
            }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              ยืนยัน
              <img src="/icons/Tick.png" alt="" style={{ width: 22, height: 22, marginLeft: 10 }} />
            </span>
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DefineNewsComponents;