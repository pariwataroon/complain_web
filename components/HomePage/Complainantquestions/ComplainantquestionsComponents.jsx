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

const mockData = [
  {
    name: 'นางสาวจารุณี สังขสมอักษรานี',
    date: '11 มกราคม 2568 (11.30 น.)',
  },
  {
    name: 'นางสาวทานตะวัน วานิชพันธ์',
    date: '8 มกราคม 2568 (18.00 น.)',
  },
  {
    name: 'นายอัมพัชร์ จิตต์สกุล',
    date: '12 ธันวาคม 2567 (13.24 น.)',
  },
  {
    name: 'นางสาวฐณิตา ศรีประทายู์',
    date: '1 ธันวาคม 2567 (17.24 น.)',
  },
];

const ComplainantQuestionsComponent = () => {
  const [accountName, setAccountName] = useState('');
  const [questionDate, setQuestionDate] = useState('');

  return (
    <Box sx={{ background: '#F6F9FF', minHeight: '100vh', py: 3 }}>
      {/* Header Blue Gradient */}
      <Box
        sx={{
          background: 'linear-gradient(90deg, #1120A3 0%, #2A62F4 100%)',
          height: 32,
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          width: '100%',
        }}
      />

      <Box
        sx={{
          background: '#FFFFFF',
          borderRadius: '0 0 12px 12px',
          maxWidth: '1200px',
          mx: 'auto',
          px: 4,
          py: 3,
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        }}
      >
        <Typography fontSize={20} fontWeight="bold" color="#1120A3" mb={2}>
          รายงานคำถามจากผู้ร้อง
        </Typography>

        <Stack direction="row" spacing={1.5} alignItems="center" mb={3}>
          <Box sx={{ width: 200 }}>
            <TextfieldService
              placeholder="ชื่อบัญชี"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          </Box>
          <Box sx={{ width: 200 }}>
            <TextfieldService
              type="date"
              value={questionDate}
              onChange={(e) => setQuestionDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <Button
            variant="contained"
            sx={{
              minWidth: 40,
              height: 40,
              borderRadius: '12px',
              backgroundColor: '#1120A3',
              '&:hover': { backgroundColor: '#0c1980' },
              px: 0,
            }}
          >
            <SearchIcon />
          </Button>
        </Stack>

        {/* Export Buttons */}
        <Stack direction="row" justifyContent="flex-end" spacing={1.5} mb={2}>
          <Button
            variant="outlined"
            sx={{
              borderRadius: '12px',
              color: '#1D40F8',
              borderColor: '#1D40F8',
              px: 2,
              textTransform: 'none',
            }}
          >
            Export PDF
          </Button>
          <Button
            variant="outlined"
            sx={{
              borderRadius: '12px',
              color: '#1D40F8',
              borderColor: '#1D40F8',
              px: 2,
              textTransform: 'none',
            }}
          >
            Export Excel
          </Button>
        </Stack>

        {/* Table */}
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
              {mockData.map((row, index) => (
                <TableRow key={index}>
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
