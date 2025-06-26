import React, { useState } from "react";
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

const initialData = [
  {
    title: "ขอความช่วยเหลือเกี่ยวกับการคืนภาษีล่าช้า",
    detail: "สอบถามข้อมูลเกี่ยวกับเรียนระดับการศึกษาระดับอาชีวศึกษา โทร 1161",
    keyword: ["ภาษี", "คืนภาษี", "ล่าช้า"],
    date: "17 ม.ค. 2568",
  },
  {
    title:
      "ร้องเรียนพฤติกรรม/การดำเนินงานของเจ้าหน้าที่หน่วยงานในสังกัดกระทรวงการคลัง",
    detail: "",
    keyword: ["ร้องเรียน", "เจ้าหน้าที่", "กระทรวงการคลัง"],
    date: "17 ม.ค. 2568",
  },
  {
    title: "ขอความช่วยเหลือเกี่ยวกับการปรับโครงสร้างหนี้",
    detail: "",
    keyword: ["หนี้", "โครงสร้างหนี้", "ปรับโครงสร้าง"],
    date: "17 ม.ค. 2568",
  },
  {
    title: "ขอความช่วยเหลือเกี่ยวกับปัญหาหนี้สิน สำหรับบุคลากรภาครัฐ",
    detail: "",
    keyword: ["หนี้สิน", "บุคลากรภาครัฐ", "ข้าราชการ"],
    date: "17 ม.ค. 2568",
  },
  {
    title: "แจ้งเบาะแสการหลีกเลี่ยงภาษี",
    detail: "",
    keyword: ["เบาะแส", "หลีกเลี่ยงภาษี", "แจ้ง"],
    date: "17 ม.ค. 2568",
  },
  {
    title: "ขอความช่วยเหลือเกี่ยวกับแหล่งเงินทุนสำหรับการประกอบอาชีพ",
    detail: "",
    keyword: ["เงินทุน", "ประกอบอาชีพ", "แหล่งเงินทุน"],
    date: "17 ม.ค. 2568",
  },
  {
    title: "ขอความช่วยเหลือเกี่ยวกับปัญหาหนี้สิน",
    detail: "",
    keyword: ["หนี้สิน", "ปัญหาหนี้"],
    date: "17 ม.ค. 2568",
  },
  {
    title: "โครงการคุณสู้ เราช่วย",
    detail: "",
    keyword: ["โครงการ", "คุณสู้เราช่วย"],
    date: "17 ม.ค. 2568",
  },
  {
    title: "แนวทางจัดการหนี้สาธารณะอย่างไรให้เกิดความยั่งยืน",
    detail: "",
    keyword: ["หนี้สาธารณะ", "ความยั่งยืน", "จัดการหนี้"],
    date: "17 ม.ค. 2568",
  },
  {
    title: "กระทรวงการคลังมีแนวทางกระตุ้นเศรษฐกิจปีนี้อย่างไร",
    detail: "",
    keyword: ["กระตุ้นเศรษฐกิจ", "เศรษฐกิจ", "นโยบาย"],
    date: "17 ม.ค. 2568",
  },
  {
    title: "มีแนวทางสนับสนุนการลงทุนจากต่างประเทศเพิ่มเติมหรือไม่",
    detail: "",
    keyword: ["ลงทุน", "ต่างประเทศ", "FDI"],
    date: "17 ม.ค. 2568",
  },
];

const ChatbotComponents = () => {
  const router = useRouter();
  const [newsData, setNewsData] = useState(initialData);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [form, setForm] = useState({ title: "", detail: "", keyword: [] });

  const handleToggle = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleDeleteClick = async (index) => {
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
        const newData = [...newsData];
        newData.splice(index, 1);
        setNewsData(newData);

        closeAlert();
        alertSuccess("ลบคำถามสำเร็จ");
      } catch (err) {
        closeAlert();
        alertError("เกิดข้อผิดพลาด", "ไม่สามารถลบคำถามได้");
      }
    }
  };

  const handleAdd = () => {
    const newItem = {
      ...form,
      date: new Date().toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    };
    setNewsData([newItem, ...newsData]);
    setOpenAddDialog(false);
    setForm({ title: "", detail: "" });
  };

  const handleEdit = () => {
    const updated = [...newsData];
    updated[editIndex] = { ...updated[editIndex], ...form };
    setNewsData(updated);
    setOpenEditDialog(false);
    setForm({ title: "", detail: "" });
    setEditIndex(null);
  };

  const openEdit = (index) => {
    setEditIndex(index);
    setForm({
      title: newsData[index].title,
      detail: newsData[index].detail,
      keyword: newsData[index].keyword || [],
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
            คำถามในระบบทั้งหมด
          </Typography>
          <Button
            onClick={() => {
              setForm({ title: "", detail: "" });
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
          {newsData.map((item, index) => (
            <Grid item xs={12} key={index}>
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
                          src="/icons/binWhite.png"
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
      </Box>
      {/* Dialog: เพิ่มคำถาม */}
      <Dialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
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
          <Typography sx={{ color: "#1120A3" }}>คำถาม</Typography>
          <TextField
            fullWidth
            margin="normal"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
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
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 4 }}>
          <Button
            onClick={() => setOpenAddDialog(false)}
            variant="outlined"
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
            ยืนยัน
            <img
              src="/icons/Tick.png"
              alt=""
              style={{ width: 22, height: 22, marginLeft: 10 }}
            />
          </Button>
        </DialogActions>
      </Dialog>

      {/*Dialog: แก้ไขคำถาม */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
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
          <Typography sx={{ color: "#1120A3" }}>คำถาม</Typography>
          <TextField
            fullWidth
            margin="normal"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
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
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 4 }}>
          <Button
            onClick={() => setOpenEditDialog(false)}
            variant="outlined"
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
            ยืนยัน
            <img
              src="/icons/Tick.png"
              alt=""
              style={{ width: 22, height: 22, marginLeft: 10 }}
            />
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatbotComponents;
