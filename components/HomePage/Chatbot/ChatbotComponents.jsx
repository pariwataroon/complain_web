import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Stack,
  Tooltip,
  Collapse,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ReorderIcon from "@mui/icons-material/Reorder";
import CloseIcon from "@mui/icons-material/Close";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs.jsx";
import { useRouter } from "next/router";
import {
  closeAlert,
  alertError,
  alertSuccess,
  showConfirm2,
} from "@utils/Alerts";
import Image from "next/image";
import InputTags from "@services/InputTags/InputTags";
import { getChatBot, addChatBot, updateChatBot, deleteChatBot } from "@pages/api/chatbot/chatbot";

const ChatbotComponents = () => {
  const router = useRouter();
  const [faqsData, setFaqsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [form, setForm] = useState({ title: "", detail: "", keyword: [] });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      setLoading(true);
      const response = await getChatBot();

      console.log('API Response:', response);

      if (Array.isArray(response)) {
        const formattedFaqs = response.map(faq => ({
          ...faq,
          date: new Date(faq.created_at).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        }));
        setFaqsData(formattedFaqs);
      } else if (response && response.res_data && Array.isArray(response.res_data)) {
        const formattedFaqs = response.res_data.map(faq => ({
          ...faq,
          date: new Date(faq.created_at).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        }));
        setFaqsData(formattedFaqs);
      } else {
        console.warn("Unexpected API response format:", response);
        setFaqsData([]);
      }
    } catch (error) {
      console.error("Error loading FAQs:", error);
      alertError("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลคำถามได้");
      setFaqsData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleDeleteClick = async (index) => {
    const faq = faqsData[index];
    const confirm = await showConfirm2(
      `<span style="color:#932626;">ลบคำถาม</span>`,
      `<div><strong style="color:#932626;">การลบคำถามจะเป็นการย้ายรายการนี้ไปยังคลังเก็บข้อมูลในฐานข้อมูล<br />
    ซึ่งสามารถกู้คืนได้จากระบบหากจำเป็น และจะไม่แสดงผลในหน้านี้อีก<br /><br />
    ยืนยันการลบคำถามนี้หรือไม่?</strong>
        </div>`,
      "ยืนยัน",
      "ยกเลิก",
      800
    );

    if (confirm) {
      try {
        setSubmitting(true);
        // Call delete API if you have deleteChatBot function
        if (typeof deleteChatBot === 'function') {
          await deleteChatBot(faq.id);
        }

        // Remove from local state
        const newData = [...faqsData];
        newData.splice(index, 1);
        setFaqsData(newData);

        closeAlert();
        alertSuccess("ลบคำถามสำเร็จ");
      } catch (err) {
        console.error("Error deleting FAQ:", err);
        closeAlert();
        alertError("เกิดข้อผิดพลาด", "ไม่สามารถลบคำถามได้");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleAdd = async () => {
    if (!form.title.trim()) {
      alertError("กรุณากรอกข้อมูล", "กรุณากรอกคำถาม");
      return;
    }

    try {
      setSubmitting(true);

      const newFAQ = {
        title: form.title.trim(),
        detail: form.detail.trim(),
        keyword: form.keyword || []
      };

      const response = await addChatBot(newFAQ);

      if (response.success || response) {
        // Reload FAQs to get updated data with IDs
        await loadFAQs();

        setOpenAddDialog(false);
        setForm({ title: "", detail: "", keyword: [] });
        alertSuccess("เพิ่มคำถามสำเร็จ");
      } else {
        throw new Error(response.message || "Failed to add FAQ");
      }
    } catch (error) {
      console.error("Error adding FAQ:", error);
      alertError("เกิดข้อผิดพลาด", "ไม่สามารถเพิ่มคำถามได้");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!form.title.trim()) {
      alertError("กรุณากรอกข้อมูล", "กรุณากรอกคำถาม");
      return;
    }

    try {
      setSubmitting(true);

      const faq = faqsData[editIndex];
      const updatedFAQ = {
        id: faq.id,
        title: form.title.trim(),
        detail: form.detail.trim(),
        keyword: form.keyword || []
      };

      const response = await updateChatBot(updatedFAQ);

      if (response.success || response) {
        // Update local state
        const updated = [...faqsData];
        updated[editIndex] = { ...updated[editIndex], ...updatedFAQ };
        setFaqsData(updated);

        setOpenEditDialog(false);
        setForm({ title: "", detail: "", keyword: [] });
        setEditIndex(null);
        alertSuccess("อัปเดตคำถามสำเร็จ");
      } else {
        throw new Error(response.message || "Failed to update FAQ");
      }
    } catch (error) {
      console.error("Error updating FAQ:", error);
      alertError("เกิดข้อผิดพลาด", "ไม่สามารถอัปเดตคำถามได้");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (index) => {
    setEditIndex(index);
    setForm({
      title: faqsData[index].title,
      detail: faqsData[index].detail,
      keyword: faqsData[index].keyword || [],
    });
    setOpenEditDialog(true);
  };

  const breadcrumbItems = [
    {
      label: <span style={{ color: "#1120A3" }}>กำหนดคำถาม Chat Bot</span>,
      icon: (
        <img
          src="/icons/config.png"
          alt="Settings Icon"
          style={{
            width: "20px",
            height: "20px",
            marginBottom: "-8px",
            borderRadius: "50%",
            border: "2px solid #1120A3",
            padding: "2px",
          }}
        />
      ),
      url: "/admin",
    },
  ];

  if (loading) {
    return (
      <Box sx={{ background: "#F5F7FB", minHeight: "100vh", py: 3 }}>
        <BreadcrumbsService items={breadcrumbItems} />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ background: "#F5F7FB", minHeight: "100vh", py: 3 }}>
      <BreadcrumbsService items={breadcrumbItems} />
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={{
          fontWeight: "bold",
          fontSize: 18,
          color: "#1120A3",
          mb: 2,
          maxWidth: "1500px",
          mx: "auto",
          px: 2,
        }}
      ></Stack>

      <Box sx={{ maxWidth: "1200px", mx: "auto", px: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2, fontWeight: "bold", fontSize: 18, color: "#1120A3" }}
        >
          <Typography
            component="span"
            sx={{ fontWeight: "bold", fontSize: 18 }}
          >
            คำถามในระบบทั้งหมด ({faqsData.length} รายการ)
          </Typography>
          <Button
            onClick={() => {
              setForm({ title: "", detail: "", keyword: [] });
              setOpenAddDialog(true);
            }}
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: "bold",
              background: "#1120A3",
              "&:hover": { background: "#0d1680" },
            }}
          >
            เพิ่มคำถาม
          </Button>
        </Stack>

        <Grid container spacing={2}>
          {faqsData.map((item, index) => (
            <Grid item xs={12} key={item.id || index}>
              <Box
                sx={{
                  background: "#fff",
                  borderRadius: 3,
                  px: { xs: 2, sm: 3 },
                  py: { xs: 2, sm: 2.5 },
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.07)",
                  minHeight: 60,
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems={{ sm: "center" }}
                  justifyContent="space-between"
                  sx={{ width: "100%" }}
                >
                  {/* Content */}
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="flex-start"
                    sx={{ flex: 1 }}
                  >
                    <ReorderIcon sx={{ color: "#9CA3AF", mt: 0.5 }} />
                    <Box>
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                        flexWrap="wrap"
                      >
                        <Typography
                          sx={{
                            fontWeight: "bold",
                            fontSize: 16,
                            color: expandedIndex === index ? "#1120A3" : "#000",
                            transition: "color 0.2s",
                          }}
                        >
                          {item.title}
                        </Typography>
                        <Box
                          display="flex"
                          alignItems="center"
                          gap={0.5}
                          flexWrap="wrap"
                        >
                          <img
                            src="/icons/Edit.png"
                            alt=""
                            style={{ width: 16, height: 16 }}
                          />
                          <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>
                            วันที่นำเข้าข้อมูล {item.date}
                          </Typography>
                        </Box>
                      </Box>
                      <Collapse in={expandedIndex === index}>
                        <Typography sx={{ fontSize: 13, mt: 0.5 }}>
                          {item.detail}
                        </Typography>
                        {item.keyword && item.keyword.length > 0 && (
                          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            <Typography sx={{ fontSize: 12, color: "#9CA3AF", mr: 1 }}>
                              คีย์เวิร์ด:
                            </Typography>
                            {item.keyword.map((keyword, keyIndex) => (
                              <Typography
                                key={keyIndex}
                                sx={{
                                  fontSize: 11,
                                  backgroundColor: '#E3F2FD',
                                  color: '#1976D2',
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1
                                }}
                              >
                                {keyword}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Collapse>
                    </Box>
                  </Stack>

                  {/* Buttons */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.5}
                    mt={{ xs: 2, sm: 0 }}
                    ml={{ sm: 2 }}
                    justifyContent={{ xs: "flex-start", sm: "flex-end" }}
                  >
                    {/* Expand Button */}
                    <IconButton
                      onClick={() => handleToggle(index)}
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor:
                          expandedIndex === index ? "#ffffff" : "#EDC458",
                        border: "1px solid #EDC458",
                        borderRadius: "8px",
                        padding: 0,
                        "&:hover": {
                          backgroundColor:
                            expandedIndex === index ? "#ffffff" : "#FDE68A",
                        },
                      }}
                    >
                      {expandedIndex === index ? (
                        <ExpandLessIcon
                          sx={{ color: "#FACC15", fontSize: 20 }}
                        />
                      ) : (
                        <ExpandMoreIcon
                          sx={{ color: "#ffffff", fontSize: 20 }}
                        />
                      )}
                    </IconButton>

                    {/* Edit Button */}
                    <Tooltip title="แก้ไข">
                      <IconButton
                        onClick={() => openEdit(index)}
                        disabled={submitting}
                        style={{
                          backgroundColor: "transparent",
                          border: "none",
                          borderRadius: "8px",
                          padding: "4px",
                          width: "40px",
                          height: "40px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          marginLeft: "8px",
                          "&:hover": {
                            backgroundColor: "#FDE68A",
                          },
                        }}
                      >
                        <Image
                          src="/icons/PencilWhite.png"
                          alt=""
                          width={36}
                          height={36}
                        />
                      </IconButton>
                    </Tooltip>

                    {/* Delete Button */}
                    <Tooltip title="ลบ">
                      <IconButton
                        onClick={() => handleDeleteClick(index)}
                        disabled={submitting}
                        style={{
                          backgroundColor: "transparent",
                          border: "none",
                          borderRadius: "8px",
                          padding: "4px",
                          width: "40px",
                          height: "40px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          "&:hover": {
                            backgroundColor: "#FDE68A",
                          },
                        }}
                      >
                        <Image
                          src="/icons/BinWhite.png"
                          alt=""
                          width={36}
                          height={36}
                        />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Box>
            </Grid>
          ))}
        </Grid>

        {faqsData.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ color: '#9CA3AF', fontSize: 18 }}>
              ยังไม่มีคำถามในระบบ
            </Typography>
            <Button
              onClick={() => {
                setForm({ title: "", detail: "", keyword: [] });
                setOpenAddDialog(true);
              }}
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                mt: 2,
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: "bold",
                background: "#1120A3",
                "&:hover": { background: "#0d1680" },
              }}
            >
              เพิ่มคำถามแรก
            </Button>
          </Box>
        )}
      </Box>

      {/* Dialog: เพิ่มคำถาม */}
      <Dialog
        open={openAddDialog}
        onClose={() => !submitting && setOpenAddDialog(false)}
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: {
            width: "800px",
            maxWidth: "90vw",
            borderRadius: 3,
            position: "relative",
          },
        }}
      >
        <IconButton
          onClick={() => setOpenAddDialog(false)}
          disabled={submitting}
          sx={{ position: "absolute", top: 12, right: 12 }}
        >
          <CloseIcon />
        </IconButton>
        <DialogTitle
          sx={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: 18,
            color: "#1120A3",
          }}
        >
          เพิ่มคำถามในระบบ
        </DialogTitle>
        <DialogContent sx={{ px: 6, pt: 1 }}>
          <Typography sx={{ color: "#1120A3" }}>คำถาม *</Typography>
          <TextField
            fullWidth
            margin="normal"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            disabled={submitting}
            inputProps={{ style: { fontSize: 16 } }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "& fieldset": {
                  borderColor: "#93C5FD",
                },
              },
              "& label": {
                fontWeight: "bold",
                color: "#2563EB",
              },
            }}
          />
          <Typography sx={{ color: "#1120A3" }}>คำตอบ</Typography>
          <TextField
            fullWidth
            margin="normal"
            multiline
            rows={4}
            value={form.detail}
            onChange={(e) => setForm({ ...form, detail: e.target.value })}
            disabled={submitting}
            inputProps={{ style: { fontSize: 16 } }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "& fieldset": {
                  borderColor: "#93C5FD",
                },
              },
              "& label": {
                fontWeight: "bold",
                color: "#2563EB",
              },
            }}
          />
          <InputTags
            label="คีย์เวิร์ด"
            value={form.keyword || []}
            onChange={(e) => setForm({ ...form, keyword: e.target.value })}
            name="keyword"
            disabled={submitting}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 4 }}>
          <Button
            onClick={() => setOpenAddDialog(false)}
            variant="outlined"
            disabled={submitting}
            sx={{
              borderColor: "#BFDBFE",
              color: "#2563EB",
              fontSize: 16,
              fontWeight: "bold",
              px: 4,
              py: 1,
              borderRadius: "10px",
              "&:hover": { backgroundColor: "#EFF6FF", borderColor: "#93C5FD" },
            }}
          >
            <CloseIcon />
            ยกเลิก
          </Button>
          <Button
            onClick={handleAdd}
            variant="contained"
            disabled={submitting}
            sx={{
              backgroundColor: "#2563EB",
              color: "#fff",
              fontSize: 16,
              fontWeight: "bold",
              px: 4,
              py: 1,
              borderRadius: "10px",
              "&:hover": { backgroundColor: "#1D4ED8" },
            }}
          >
            {submitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <>
                ยืนยัน
                <img
                  src="/icons/Tick.png"
                  alt=""
                  style={{ width: 22, height: 22, marginLeft: 10 }}
                />
              </>
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/*Dialog: แก้ไขคำถาม */}
      <Dialog
        open={openEditDialog}
        onClose={() => !submitting && setOpenEditDialog(false)}
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: {
            width: "800px",
            maxWidth: "90vw",
            borderRadius: 3,
            position: "relative",
          },
        }}
      >
        <IconButton
          onClick={() => setOpenEditDialog(false)}
          disabled={submitting}
          sx={{ position: "absolute", top: 12, right: 12 }}
        >
          <CloseIcon />
        </IconButton>
        <DialogTitle
          sx={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: 18,
            color: "#1D4ED8",
          }}
        >
          แก้ไขคำถามในระบบ
        </DialogTitle>
        <DialogContent sx={{ px: 6, pt: 1 }}>
          <Typography sx={{ color: "#1120A3" }}>คำถาม *</Typography>
          <TextField
            fullWidth
            margin="normal"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            disabled={submitting}
            inputProps={{ style: { fontSize: 16 } }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "& fieldset": {
                  borderColor: "#93C5FD",
                },
              },
              "& label": {
                fontWeight: "bold",
                color: "#2563EB",
              },
            }}
          />
          <Typography sx={{ color: "#1120A3" }}>คำตอบ</Typography>
          <TextField
            fullWidth
            margin="normal"
            multiline
            rows={4}
            value={form.detail}
            onChange={(e) => setForm({ ...form, detail: e.target.value })}
            disabled={submitting}
            inputProps={{ style: { fontSize: 16 } }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "& fieldset": {
                  borderColor: "#93C5FD",
                },
              },
              "& label": {
                fontWeight: "bold",
                color: "#2563EB",
              },
            }}
          />
          <InputTags
            label="คีย์เวิร์ด"
            value={form.keyword || []}
            onChange={(e) => setForm({ ...form, keyword: e.target.value })}
            name="keyword"
            disabled={submitting}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 4 }}>
          <Button
            onClick={() => setOpenEditDialog(false)}
            variant="outlined"
            disabled={submitting}
            sx={{
              borderColor: "#50ADFF",
              color: "#50ADFF",
              fontSize: 16,
              fontWeight: "bold",
              px: 4,
              py: 1,
              borderRadius: "10px",
              "&:hover": { backgroundColor: "#EFF6FF", borderColor: "#93C5FD" },
            }}
          >
            <CloseIcon />
            ยกเลิก
          </Button>
          <Button
            onClick={handleEdit}
            variant="contained"
            disabled={submitting}
            sx={{
              backgroundColor: "#50ADFF",
              color: "#fff",
              fontSize: 16,
              fontWeight: "bold",
              px: 4,
              py: 1,
              borderRadius: "10px",
              "&:hover": { backgroundColor: "#1D4ED8" },
            }}
          >
            {submitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <>
                ยืนยัน
                <img
                  src="/icons/Tick.png"
                  alt=""
                  style={{ width: 22, height: 22, marginLeft: 10 }}
                />
              </>
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatbotComponents;