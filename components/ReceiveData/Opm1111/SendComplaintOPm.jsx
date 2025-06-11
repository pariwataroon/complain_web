import { useRouter } from "next/router";
import { useState, useCallback } from "react";
import { Card, CardContent, Typography, Box, Grid, Alert, Snackbar } from "@mui/material";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import SelectFieldPAAOPM from "@services/SelectFieldPAAOPM/SelectFieldPAAOPM";
import ButtonService from "@services/ButtonService/ButtonService";
import { AddCase } from "@pages/api/opm/opm";
import styles from "./SendComplaintOPM.module.scss";

const SendComplaintOPM = () => {
  const router = useRouter();
  const queryParams = router.query;

  // Form states
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSubDistrict, setSelectedSubDistrict] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // UI states
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  // Form validation
  const isFormValid = selectedProvince && selectedDistrict && selectedSubDistrict && selectedChannel && selectedStatus;

  const handleProvinceChange = useCallback((event) => {
    const newValue = event.target.value;
    setSelectedProvince(newValue);
    setSelectedDistrict("");
    setSelectedSubDistrict("");
    console.log("Selected Province ID:", newValue);
  }, []);

  const handleDistrictChange = useCallback((event) => {
    const newValue = event.target.value;
    setSelectedDistrict(newValue);
    setSelectedSubDistrict("");
    console.log("Selected District ID:", newValue);
  }, []);

  const handleSubDistrictChange = useCallback((event) => {
    const newValue = event.target.value;
    setSelectedSubDistrict(newValue);
    console.log("Selected SubDistrict ID:", newValue);
  }, []);

  const handleChannelChange = useCallback((event) => {
    const newValue = event.target.value;
    setSelectedChannel(newValue);
    console.log("Selected Channel ID:", newValue);
  }, []);

  const handleStatusChange = useCallback((event) => {
    const newValue = event.target.value;
    setSelectedStatus(newValue);
    console.log("Selected Status ID:", newValue);
  }, []);

  const handleReset = useCallback(() => {
    setSelectedProvince("");
    setSelectedDistrict("");
    setSelectedSubDistrict("");
    setSelectedChannel("");
    setSelectedStatus("");
    console.log("Form reset completed");
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isFormValid) {
      setSnackbar({
        open: true,
        message: "กรุณากรอกข้อมูลให้ครบถ้วน",
        severity: "error"
      });
      return;
    }

    try {
      setLoading(true);

      // Prepare submit data
      const submitData = {
        province_id: selectedProvince,
        district_id: selectedDistrict,
        subdistrict_id: selectedSubDistrict,
        channel_id: selectedChannel,
        status_id: selectedStatus,
        case_id: queryParams.id || "", // ถ้ามี case_id จาก query params
        user_id: "vampirebeam", // หรือดึงจาก session/context
        submitted_at: new Date().toISOString(),
        // เพิ่มข้อมูลอื่นๆ ตามต้องการ
      };

      console.log("Submitting data:", submitData);

      const result = await AddCase(submitData);

      if (result && result.success) {
        setSnackbar({
          open: true,
          message: "บันทึกข้อมูลสำเร็จ",
          severity: "success"
        });

        // รอ 2 วินาทีแล้ว redirect กลับไปหน้าเดิม
        setTimeout(() => {
          router.push("/admin/edit/opm1111");
        }, 2000);

      } else {
        throw new Error(result?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }

    } catch (error) {
      console.error("Submit error:", error);
      setSnackbar({
        open: true,
        message: error.message || "เกิดข้อผิดพลาดในการส่งข้อมูล",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  }, [isFormValid, selectedProvince, selectedDistrict, selectedSubDistrict, selectedChannel, selectedStatus, queryParams.id, router]);

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box className={styles.container}>
      <BreadcrumbsService
        items={[
          {
            label: "รับเข้าข้อมูล",
            icon: (
              <img
                src="/icons/Pencil.png"
                alt="pencil"
                style={{ width: 24, height: 24, marginBottom: -8 }}
              />
            ),
          },
          {
            label: "เรื่องราวร้องทุกข์ช่องทางเว็บไซต์ OPM1111",
            url: "/admin/edit/opm1111",
          },
          {
            label: "ส่งเรื่องร้องทุกข์ไปช่องทาง สปน.",
          },
        ]}
      />

      <Card className={styles.formCard} elevation={2}>
        <CardContent className={styles.cardContent}>
          {/* Header */}
          <Box className={styles.header}>
            <Typography variant="h5" className={styles.title}>
              ส่งเรื่องร้องทุกข์ไปช่องทาง สปน.
            </Typography>
            <Typography variant="body2" className={styles.subtitle}>
              กรุณาเลือกข้อมูลที่ต้องการส่งไปยังหน่วยงาน
            </Typography>
          </Box>

          {/* Form Fields */}
          <Box className={styles.formFields}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <SelectFieldPAAOPM
                  label="จังหวัด"
                  name="province"
                  placeholder="เลือกจังหวัด"
                  value={selectedProvince}
                  onChange={handleProvinceChange}
                  required={true}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <SelectFieldPAAOPM
                  label="อำเภอ"
                  name="district"
                  placeholder="เลือกอำเภอ"
                  value={selectedDistrict}
                  onChange={handleDistrictChange}
                  disabled={!selectedProvince}
                  selectedProvince={selectedProvince}
                  required={true}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <SelectFieldPAAOPM
                  label="ตำบล"
                  name="subdistrict"
                  placeholder="เลือกตำบล"
                  value={selectedSubDistrict}
                  onChange={handleSubDistrictChange}
                  disabled={!selectedDistrict}
                  selectedProvince={selectedProvince}
                  selectedDistrict={selectedDistrict}
                  required={true}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <SelectFieldPAAOPM
                  label="ช่องทางดำเนินการ"
                  name="channel"
                  placeholder="เลือกช่องทางดำเนินการ"
                  value={selectedChannel}
                  onChange={handleChannelChange}
                  required={true}
                />
              </Grid>

              <Grid item xs={12}>
                <SelectFieldPAAOPM
                  label="สถานะการดำเนินการ"
                  name="status"
                  placeholder="เลือกสถานะการดำเนินการ"
                  value={selectedStatus}
                  onChange={handleStatusChange}
                  required={true}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Summary Box */}
          {isFormValid && (
            <Box className={styles.summaryBox}>
              <Typography variant="h6" className={styles.summaryTitle}>
                สรุปข้อมูลที่เลือก
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">จังหวัด:</Typography>
                  <Typography variant="body1">{selectedProvince}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">อำเภอ:</Typography>
                  <Typography variant="body1">{selectedDistrict}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">ตำบล:</Typography>
                  <Typography variant="body1">{selectedSubDistrict}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">สถานะ:</Typography>
                  <Typography variant="body1">{selectedStatus}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Action Buttons */}
          <Box className={styles.actionButtons}>
            <ButtonService
              label="ล้าง"
              color="ล้าง"
              variant="outlined"
              onClick={handleReset}
              disabled={loading}
              className={styles.resetButton}
            />
            <ButtonService
              label={loading ? "กำลังบันทึก..." : "บันทึก"}
              color="ยืนยัน"
              variant="contained"
              onClick={handleSubmit}
              disabled={!isFormValid || loading}
              className={styles.submitButton}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SendComplaintOPM;