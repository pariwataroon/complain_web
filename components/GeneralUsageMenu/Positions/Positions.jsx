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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({});
  const [apiFilters, setApiFilters] = useState({});

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);
  const handlePageChange = (newPage) => setPage(newPage);
  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await GetAllPositions({
        page: page + 1,
        limit: rowsPerPage,
        ...apiFilters,
      });
      setData(response.res_data || []);
    } catch (error) {
      setError(error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };
  console.log('fetchData params:', { page: page + 1, limit: rowsPerPage, ...apiFilters });

  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage, apiFilters]);


  const refreshData = () => {
    fetchData();
  };

  useEffect(() => {
  }, [data, loading, error]);

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

  const handleSearch = (searchFilters) => {
    console.log('handleSearch', searchFilters);
    setFilters(searchFilters);
    let filtersToSend = { ...searchFilters };
    if (filtersToSend.status !== "") {
      filtersToSend.is_active = filtersToSend.status === "true";
    } else {
      delete filtersToSend.is_active;
    }
    delete filtersToSend.status;
    setApiFilters(filtersToSend);
    setPage(0);
  };

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
          fetchData(filters, page, rowsPerPage);
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
        total={data.length}
        onSearch={handleSearch}
        onDataRefresh={refreshData}
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