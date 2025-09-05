import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
} from "@mui/material";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import AddIcon from "@mui/icons-material/Add";
import ButtonService from "@services/ButtonService/ButtonService";
import AddPositionsModal from "./modal/AddPositionsModal";
import TablePositions from "@services/TablePositions/TablePositions";
import { GetAllPositions } from "@pages/api/positions/positions";

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
    label: "กำหนดตำแหน่ง",
  },
];

const Positions = () => {
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
      const skip = currentPage * currentRowsPerPage;
      const limit = currentRowsPerPage;
      const search = searchFilters.name && searchFilters.name.trim() ? searchFilters.name.trim() : undefined;
      const level = searchFilters.level && searchFilters.level.trim() ? searchFilters.level.trim() : undefined;
      const is_active = searchFilters.status !== '' ? searchFilters.status : undefined;


      const response = await GetAllPositions(skip, limit, search, level, is_active);
      let rows = [];
      let total = 0;

      if (response) {
        const rd = response.res_data;
        if (Array.isArray(rd)) {
          rows = rd;
          total = Number(response.total || rd.total || rd.totalCount || rd.count);
        } else if (rd && typeof rd === 'object') {
          if (Array.isArray(rd.data)) {
            rows = rd.data;
            total = Number(rd.total || rd.totalCount || rd.count || response.total);
          }
        }
      }

      if (!Number.isFinite(total)) {
        if (rows.length === limit) {
            total = skip + rows.length + 1;
        } else {
            total = skip + rows.length;
        }
      }

      setData(rows);
      setTotalCount(total);
    } catch (error) {
      console.error('Error fetching positions:', error);
      setError(error);
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchFilters) => {
    console.log('Search filters received:', searchFilters);
    setFilters(searchFilters);
    setPage(0);
    fetchData(searchFilters, 0, rowsPerPage);
  };

  const handleDataRefresh = () => {
    fetchData(filters, page, rowsPerPage);
  };

  useEffect(() => {
    fetchData(filters, page, rowsPerPage);
  }, [page, rowsPerPage]);

  useEffect(() => {
    fetchData();
  }, []);

  const formattedData = useMemo(() => {
    return data.map(item => ({
      id: item.id,
      name: item.name || "",
      level: item.level || "",
      description: item.description || "",
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
            label="เพิ่มตำแหน่ง"
            color="ยืนยัน"
            variant="contained"
            onClick={handleOpenModal}
            iconRight={<AddIcon />}
            sx={{ width: '30%' }}
          />
        </Box>
      </Box>

      <AddPositionsModal
        open={openModal}
        onClose={handleCloseModal}
        onSuccess={() => {
          handleCloseModal();
          handleDataRefresh();
        }}
      />

      <TablePositions
        data={formattedData}
        title="รายการตำแหน่งทั้งหมด"
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
          { value: 'บริหารระดับต้น', label: 'บริหารระดับต้น' },
          { value: 'บริหารระดับสูง', label: 'บริหารระดับสูง' },
          { value: 'อำนวยการระดับสูง', label: 'อำนวยการระดับสูง' },
        ]}
      />
    </>
  );
};

export default Positions;