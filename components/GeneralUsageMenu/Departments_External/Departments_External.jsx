import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
} from "@mui/material";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import AddIcon from "@mui/icons-material/Add";
import ButtonService from "@services/ButtonService/ButtonService";
import AddDepartments_ExternalModal from "./modal/AddDepartments_ExternalModal";
import TableDepartments_External from "@services/TableDepartments_External/TableDepartments_External";
import { GetAllOutsideDepartments } from "@pages/api/outsideDepartments/outsideDepartments";

const breadcrumbItems = [
  {
    label: "เมนูการใช้งานทั่วไป",
    icon: (
      <img
        src="/icons/settingico.png"
        alt="Settings Icon"
        style={{ width: "24px", height: "24px", marginBottom: "-8px" }}
      />
    ),
  },
  {
    label: "กำหนดกลุ่มหน่วยงานภายนอก",
  },
];

const Departments_External = () => {
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({});

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const fetchData = async (searchFilters = {}, currentPage = page, currentRowsPerPage = rowsPerPage) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = {
        skip: currentPage * currentRowsPerPage,
        limit: currentRowsPerPage,
        ...searchFilters
      };

      // แปลง status เป็น boolean ถ้ามี
      if (searchFilters.status && searchFilters.status !== '') {
        queryParams.is_active = searchFilters.status === 'true';
        delete queryParams.status;
      }

      const response = await GetAllOutsideDepartments(queryParams);

      // Debug: ดู response structure
      console.log('Full API Response:', JSON.stringify(response, null, 2));
      
      if (response && response.res_data) {
        // ตรวจสอบว่า API ส่ง pagination info มาหรือไม่
        if (Array.isArray(response.res_data)) {
          setData(response.res_data);
          // แก้ไขการตั้งค่า totalCount - ใช้ total จาก response หรือ count ถ้ามี
          let actualTotal = response.total || response.count || response.total_count;
          
          // ถ้า API ไม่ส่ง total และมีข้อมูลเท่ากับ limit แสดงว่าอาจมีข้อมูลเพิ่ม
          if (!actualTotal && response.res_data.length === currentRowsPerPage) {
            // Estimate total หรือใช้จำนวนที่มากกว่า limit เพื่อให้ pagination ทำงาน
            actualTotal = (currentPage + 2) * currentRowsPerPage; // สมมติว่ามีอย่างน้อย 1 หน้าถัดไป
          } else if (!actualTotal) {
            actualTotal = response.res_data.length;
          }
          
          console.log('Setting totalCount to:', actualTotal, 'from response fields:', {
            'response.total': response.total,
            'response.count': response.count, 
            'response.total_count': response.total_count,
            'data.length': response.res_data.length,
            'calculated': actualTotal
          });
          setTotalCount(actualTotal);
        } else if (response.res_data.data) {
          setData(response.res_data.data);
          let actualTotal = response.res_data.total || response.res_data.count || response.total || response.count;
          
          // ถ้า API ไม่ส่ง total และมีข้อมูลเท่ากับ limit แสดงว่าอาจมีข้อมูลเพิ่ม
          if (!actualTotal && response.res_data.data.length === currentRowsPerPage) {
            actualTotal = (currentPage + 2) * currentRowsPerPage;
          } else if (!actualTotal) {
            actualTotal = response.res_data.data.length;
          }
          
          console.log('Setting totalCount to:', actualTotal, 'from nested response fields:', {
            'response.res_data.total': response.res_data.total,
            'response.res_data.count': response.res_data.count,
            'response.total': response.total,
            'response.count': response.count,
            'data.length': response.res_data.data.length,
            'calculated': actualTotal
          });
          setTotalCount(actualTotal);
        } else {
          setData([]);
          setTotalCount(0);
        }
      } else {
        setData([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError(error);
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchFilters) => {
    setFilters(searchFilters);
    setPage(0);
    fetchData(searchFilters, 0, rowsPerPage);
  };

  const handleDataRefresh = () => {
    fetchData(filters, page, rowsPerPage);
  };

  // เรียก fetchData เมื่อ page หรือ rowsPerPage เปลี่ยน
  useEffect(() => {
    fetchData(filters, page, rowsPerPage);
  }, [page, rowsPerPage]);

  // เรียก fetchData ครั้งแรกเมื่อ component mount
  useEffect(() => {
    fetchData();
  }, []);

  const formattedData = useMemo(() => {
    return data.map(item => ({
      id: item.id,
      name: item.name || "",
      level: item.order_index ? `ลำดับ ${item.order_index}` : "",
      description: item.description || "ไม่มีข้อมูล",
      is_active: item.is_active,
      created_at: item.created_at,
    }));
  }, [data]);

  return (
    <>
      <Box
        sx={{
          backgroundColor: "#f8f9fa",
          py: { xs: 2, sm: 1.5 },
          px: { xs: 2, sm: 3 },
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            fontSize: { xs: 16, sm: 18 },
            height: { xs: 40, sm: 50 },
          }}
        >
          <BreadcrumbsService items={breadcrumbItems} />
          <ButtonService
            label="เพิ่มกลุ่มหน่วยงานภายนอก"
            color="ยืนยัน"
            variant="contained"
            onClick={handleOpenModal}
            iconRight={<AddIcon />}
            sx={{ width: '30%' }}
          />
        </Box>
      </Box>

      <AddDepartments_ExternalModal
        open={openModal}
        onClose={handleCloseModal}
        onSuccess={() => {
          handleCloseModal();
          handleDataRefresh();
        }}
      />

      <TableDepartments_External
        data={formattedData}
        title="รายการกลุ่มหน่วยงานภายนอก"
        loading={loading}
        error={error}
        page={page}
        onPageChange={handlePageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        total={totalCount}
        onSearch={handleSearch}
        onDataRefresh={handleDataRefresh}
        levelOptions={[
          { value: 'ลำดับ 1', label: 'ลำดับ 1' },
          { value: 'ลำดับ 2', label: 'ลำดับ 2' },
          { value: 'ลำดับ 3', label: 'ลำดับ 3' },
          { value: 'ลำดับ 4', label: 'ลำดับ 4' },
          { value: 'ลำดับ 5', label: 'ลำดับ 5' },
        ]}
      />
    </>
  );
};

export default Departments_External;