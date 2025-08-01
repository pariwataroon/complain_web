import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CardMedia,
  Grid,
  Stack,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from 'next/router';
import { getAllNews, deleteNews, updateNews } from '@pages/api/news/news';
import BreadcrumbsService from '@services/BreadCrumbs/breadcrumbs';
import { closeAlert, alertError, alertSuccess, showConfirm2 } from '@utils/Alerts';
import Image from 'next/image';

// ฟังก์ชันสำหรับการแปลงวันที่
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
};

const calculateRemainingDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const currentDate = new Date();
  
  // คำนวณจำนวนวันที่เหลือจากวันที่ปัจจุบัน
  const diffTime = end - currentDate;
  if (diffTime < 0) return 0;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// ฟังก์ชันแปลงวันที่เป็น พุทธศักราช
const formatThaiDate = (dateStr) => {
  const date = new Date(dateStr);
  const buddhistYear = date.getFullYear() + 543;
  const month = date.toLocaleString('default', { month: 'short' });
  return `${date.getDate()} ${month} ${buddhistYear}`;
};

// ฟังก์ชันเพื่อดึงสถานะข่าว
const getStatusMessage = (item) => {
  const currentDate = new Date();
  const endDate = new Date(item.display_end_date);

  // ถ้าไม่มีวันสิ้นสุด (display_end_date ไม่มีหรือค่าว่าง)
  if (!item.display_end_date) {
    return "สถานะ: ไม่จำกัดเวลา";
  }

  const remainingDays = calculateRemainingDays(item.display_start_date, item.display_end_date);

  // ถ้าหมดเวลาแล้ว (remainingDays <= 0)
  if (remainingDays <= 0) {
    return "สถานะ: สิ้นสุดเวลาการแสดงผล";
  }

  // ถ้ายังเหลือเวลาจะแสดงวันที่สิ้นสุด
  return `สถานะ: หายไปในวันที่ ${formatThaiDate(item.display_end_date)} (${remainingDays} วัน)`;
};

// ฟังก์ชันอัปเดตสถานะของข่าว
const updateNewsStatus = async (id, is_published) => {
  try {
    await updateNews(id, { is_published }); // ส่งคำขอ API เพื่ออัปเดตสถานะ
  } catch (error) {
    console.error('Error updating news status:', error);
  }
};

const DefineNewsComponents = () => {
  const router = useRouter();
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลข่าวทั้งหมดจาก API
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await getAllNews(0, 100, '', null);
        if (response && response.length > 0) {
          const updatedNewsList = response.map(async (item) => {
            const remainingDays = calculateRemainingDays(item.display_start_date, item.display_end_date);
            // ถ้าหมดเวลาหรือวันที่สิ้นสุดแล้ว, ตั้งค่า is_published = false และอัปเดตใน API
            if (remainingDays <= 0 && item.is_published !== false) {
              await updateNewsStatus(item.id, false);  // อัปเดตใน API
              item.is_published = false;
            }
            return item;
          });
          // รอจนกว่าการอัปเดตทั้งหมดจะเสร็จ
          const updatedNews = await Promise.all(updatedNewsList);
          setNewsList(updatedNews);
        } else {
          console.warn('No news found or invalid response');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching news:', error);
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const breadcrumbItems = [
    {
      label: (
        <span style={{ color: '#1120A3' }}>
          กำหนดข่าวสาร
        </span>
      ),
      icon: (
        <img
          src="/icons/config.png"
          alt="icon"
          style={{
            width: '24px',
            height: '24px',
            marginBottom: '-8px',
            borderRadius: '50%',
            border: '2px solid #1120A3',
            padding: '2px',
          }}
        />
      ), url: "/admin"
    }
  ];

  const handleAddNews = () => {
    router.push({ pathname: '/admin/homepage/news', query: { method: 'CreateNew' } });
  };

  const handleEditNews = (index) => {
    const item = newsList[index];
    router.push({
      pathname: '/admin/homepage/news',
      query: {
        method: 'EditNew',
        id: item.id,
      },
    });
  };

  const openDeleteDialog = async (selectedIndex) => {
    const confirm = await showConfirm2(
      `<span style="color:#932626;">ลบข่าวสาร</span>`,
      `<div><strong style="color:#932626;">การลบข่าวสารจะเป็นการย้ายรายการนี้ไปยังคลังเก็บข้อมูลในฐานข้อมูล<br />
      ซึ่งสามารถกู้คืนได้จากระบบหากจำเป็น และจะไม่แสดงผลในหน้านี้อีก<br /><br />
      ยืนยันการลบข่าวสารนี้หรือไม่?</strong>
        </div>`,
      'ยืนยัน',
      'ยกเลิก',
      800
    );

    if (confirm) {
      try {
        const item = newsList[selectedIndex];
        await deleteNews(item.id);  // ลบข่าวจาก API
        const updatedNewsList = newsList.filter((_, index) => index !== selectedIndex);
        setNewsList(updatedNewsList);

        closeAlert();
        alertSuccess('ลบข่าวสารสำเร็จ');
      } catch (error) {
        closeAlert();
        alertError('ไม่สามารถลบข่าวสารได้', error.message);
      }
    }
  };

  // แสดงข้อความ "Loading..." ขณะรอข้อมูลจาก API
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Box sx={{ background: '#EAF3FF', minHeight: '100vh', py: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{
        fontWeight: 'bold', fontSize: 18, color: '#1120A3', mb: 2, maxWidth: '1600px', mx: 'auto', px: 2
      }}>
        <BreadcrumbsService items={breadcrumbItems} />
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
            <Grid item xs={12} key={item.id}>
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
                  image={item.cover_image_url || "/images/default-image.jpg"}  // ถ้าไม่มีรูปภาพจะใช้ default
                  alt="news"
                  sx={{
                    width: { xs: '100%', sm: 100 },
                    maxWidth: { xs: '100%', sm: 100 },
                    height: { xs: 180, sm: 100 },
                    borderRadius: 2,
                    objectFit: 'cover',
                    mb: { xs: 1, sm: 0 }
                  }} />

                <Box sx={{
                  flex: 1,
                  ml: { sm: 2, xs: 0 },
                  width: '100%',
                  position: 'relative',
                  minHeight: 100,
                  pr: { xs: 0, sm: 6 }
                }}>
                  <Box display="flex" alignItems="flex-start" flexDirection="column" flexWrap="wrap" sx={{ mb: 1, width: '100%' }}>
                    <Typography sx={{
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
                      👁 {item.view_count} view
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
                          วันที่นำเข้าข้อมูล {formatThaiDate(item.created_at)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <img src="/icons/re.png" alt="" style={{ width: 16, height: 16 }} />
                        <Typography variant="body2" sx={{ color: '#89939E', fontSize: 12 }}>
                          วันที่ปรับปรุงข้อมูล {formatThaiDate(item.updated_at)}
                        </Typography>
                      </Stack>
                    </Stack>
                    <Typography variant="body2" sx={{
                      color: '#89939E', mt: { xs: 1, sm: 0 }, fontSize: 12,
                      whiteSpace: { xs: 'normal', sm: 'nowrap' }, overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {getStatusMessage(item)}
                    </Typography>

                  </Box>
                </Box>

                <Stack direction="row" spacing={0.5} alignItems="center" ml={{ sm: 2, xs: 0 }} mt={{ xs: 1.5, sm: 0 }} sx={{
                  alignSelf: { xs: 'center', sm: 'flex-start' },
                  width: { xs: '100%', sm: 'auto' },
                  justifyContent: { xs: 'center', sm: 'flex-start' }
                }}>
                  <Tooltip title="แก้ไข">
                    <img src="/icons/PencilWhite.png" alt="" style={{ cursor: 'pointer', width: 28, height: 28 }} onClick={() => handleEditNews(index)} />
                  </Tooltip>

                  <Tooltip title="ลบ">
                    <button
                      onClick={() => openDeleteDialog(index)}
                      style={{
                        backgroundColor: "transparent",
                        border: "none",
                        borderRadius: "8px",
                        width: "40px",
                        height: "40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        '&:hover': { backgroundColor: '#FDE68A' },
                      }}
                    >
                      <Image src="/icons/DeleteYellow.png" alt="Delete Icon" width={30} height={30} style={{ width: 'auto', height: 'auto' }} />

                    </button>
                  </Tooltip>
                </Stack>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default DefineNewsComponents;
