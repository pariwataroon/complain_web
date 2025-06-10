import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TextfieldService from '@services/TextfieldService/TextfieldService';
import DateThaiPickerService from '@services/DateThaiPickerService/DateThaiPickerService';
import { useRouter } from 'next/router';
import BreadcrumbsService from '@services/BreadCrumbs/breadcrumbs';

const mockData = [
  {
    name: 'นางสาวเวรุมณี สิขังสมาธิยามิ',
    date: '11 มกราคม 2568 (11.30 น.)',
  },
  {
    name: 'นางสาวกานต์ธีรา วรานันต์',
    date: '8 มกราคม 2568 (18.00 น.)',
  },
  {
    name: 'นายวุฒิพงศ์ จิตตั้งสกุล',
    date: '12 ธันวาคม 2567 (13.24 น.)',
  },
  {
    name: 'นางสาวฐณิตา ศรีประทายู์',
    date: '1 ธันวาคม 2567 (17.24 น.)',
  },
];

const ComplainantQuestionsComponent = () => {
  const [accountName, setAccountName] = useState('');
  const [questionDate, setQuestionDate] = useState(null); 
  const [filteredData, setFilteredData] = useState(mockData);
  const router = useRouter();

  const handleSearch = () => {
    const keyword = accountName.trim().toLowerCase();
    const selectedDate = questionDate;

    const filtered = mockData.filter((item) => {
      const matchName = keyword === '' || item.name.toLowerCase().includes(keyword);
      const matchDate =
        !selectedDate ||
        item.date.includes(`${selectedDate.day}`) &&
        item.date.includes(`${selectedDate.year + 543}`); 

      return matchName && matchDate;
    });

    setFilteredData(filtered);
  };

  const breadcrumbItems = [
  {
    label: 'รายงานคำถามจากผู้ร้อง',
    icon: (
      <img
        src="/icons/Notes.png"
        alt="icon"
        style={{ width: "24px", height: "24px", marginBottom: "-8px" }}
      />
    ),
    url: "/admin"
  }
];

  return (
    <Box sx={{ background: '#F6F9FF', minHeight: '100vh', py: 3 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <BreadcrumbsService items={breadcrumbItems} />
        </Box>
        <Box
          sx={{
            background: 'linear-gradient(90deg, #1120A3 0%, #2A62F4 100%)',
            height: 32,
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            width: '100%',
            mt: 4
          }}/>
        <Typography fontSize={20} fontWeight="bold" color="#1120A3" mb={2} mt={4}>
          รายงานคำถามจากผู้ร้อง
        </Typography>
       <Stack direction="row" spacing={2} alignItems="flex-end" mb={3}>
        <Stack spacing={0.5} sx={{ width: 200 }}>
          <Typography fontSize={16} fontWeight="bold" color="#1120A3">
            ชื่อบัญชี
          </Typography>
          <TextfieldService
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder=""
          />
        </Stack>
        <Stack spacing={0.5} sx={{ width: 200 }}>
          <Typography fontSize={16} fontWeight="bold" color="#1120A3">
            วันที่ถาม
          </Typography>
          <DateThaiPickerService
            value={questionDate}
            onChange={(val) => setQuestionDate(val)}
            placeholder=""/>
        </Stack>
        <Box sx={{ pb: '4px' }}>
          <Button
            onClick={handleSearch}
            variant="contained"
            sx={{
              width: 40,
              height: 40,
              minWidth: 40,
              borderRadius: '10px',
              backgroundColor: '#1120A3',
              '&:hover': { backgroundColor: '#0c1980' },
              px: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SearchIcon sx={{ fontSize: 20 }} />
          </Button>
        </Box>
      </Stack>

        <Stack direction="row" justifyContent="flex-end" spacing={1.5} mb={2}>
          <Button
            variant="outlined"
            sx={{
              borderRadius: '12px',
              color: '#1D40F8',
              borderColor: '#1D40F8',
              bgcolor: '#E8E9F6',
              px: 2,
              textTransform: 'none',
            }}>
            Export PDF
          </Button>
          <Button
            variant="outlined"
            sx={{
              borderRadius: '12px',
              color: '#1D40F8',
              borderColor: '#1D40F8',
              bgcolor: '#E8E9F6',
              px: 2,
              textTransform: 'none',
            }}>
            Export Excel
          </Button>
        </Stack>

        <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#EDEEF3' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>ลำดับ</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>ชื่อบัญชี</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>วันที่ถาม</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((row, index) => (
                <TableRow key={index} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/admin/homepage/complainant-questions/${index}`)}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default ComplainantQuestionsComponent;
