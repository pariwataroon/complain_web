import { useRouter } from "next/router";
import { useState, useCallback } from "react";
import { Card, CardContent, Typography, Box, Grid, Alert, Snackbar } from "@mui/material";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import SelectFieldPAAOPM from "@services/SelectFieldPAAOPM/SelectFieldPAAOPM";
import ButtonService from "@services/ButtonService/ButtonService";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
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
  const [createdDate, setCreatedDate] = useState(new Date()); // ตั้งค่าเริ่มต้นเป็นวันที่ปัจจุบัน
  const [updatedDate, setUpdatedDate] = useState(new Date()); // ตั้งค่าเริ่มต้นเป็นวันที่ปัจจุบัน

  // UI states
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  // Form validation
  const isFormValid = selectedProvince && selectedDistrict && selectedSubDistrict &&
    selectedChannel && selectedStatus && createdDate && updatedDate;

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

  const handleCreatedDateChange = useCallback((date) => {
    setCreatedDate(date);
    console.log("Selected Created Date:", date);
  }, []);

  const handleUpdatedDateChange = useCallback((date) => {
    setUpdatedDate(date);
    console.log("Selected Updated Date:", date);
  }, []);

  const handleReset = useCallback(() => {
    setSelectedProvince("");
    setSelectedDistrict("");
    setSelectedSubDistrict("");
    setSelectedChannel("");
    setSelectedStatus("");
    setCreatedDate(new Date());
    setUpdatedDate(new Date());
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

      // Format dates to ISO string
      const formatDate = (date) => {
        if (!date) return null;
        return new Date(date).toISOString();
      };

      // Prepare submit data
      const submitData = {
        province_id: selectedProvince,
        district_id: selectedDistrict,
        subdistrict_id: selectedSubDistrict,
        channel_id: selectedChannel,
        status_id: selectedStatus,
        created_date: formatDate(createdDate),
        updated_date: formatDate(updatedDate),
        case_id: queryParams.id || "", // ถ้ามี case_id จาก query params
        user_id: "vampirebeam", // ข้อมูลจาก current user
        submitted_at: new Date().toISOString(),
        // เพิ่มข้อมูลอื่นๆ ตามต้องการ
        metadata: {
          browser_info: navigator.userAgent,
          timestamp_utc: "2025-06-11 03:32:55",
          form_version: "1.0"
        }
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
  }, [isFormValid, selectedProvince, selectedDistrict, selectedSubDistrict, selectedChannel, selectedStatus, createdDate, updatedDate, queryParams.id, router]);

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Format date for display
  const formatDisplayDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
              {/* Location Fields */}
              <Grid item xs={12}>
                <Typography variant="h6" className={styles.sectionTitle}>
                  ข้อมูลที่ตั้ง 
                </Typography>
              </Grid>

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

              {/* Process Fields */}
              <Grid item xs={12}>
                <Typography variant="h6" className={styles.sectionTitle}>
                  ข้อมูลการดำเนินการ
                </Typography>
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

              <Grid item xs={12} md={6}>
                <SelectFieldPAAOPM
                  label="สถานะการดำเนินการ"
                  name="status"
                  placeholder="เลือกสถานะการดำเนินการ"
                  value={selectedStatus}
                  onChange={handleStatusChange}
                  required={true}
                />
              </Grid>

              {/* Date Fields */}
              <Grid item xs={12}>
                <Typography variant="h6" className={styles.sectionTitle}>
                  ข้อมูลวันที่
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <DateThaiPickerService
                  label="วันที่สร้าง"
                  name="created_date"
                  value={createdDate}
                  onChange={handleCreatedDateChange}
                  time={true}
                  required={true}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DateThaiPickerService
                  label="วันที่แก้ไข"
                  name="updated_date"
                  value={updatedDate}
                  onChange={handleUpdatedDateChange}
                  time={true}
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
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="textSecondary">จังหวัด:</Typography>
                  <Typography variant="body1" className={styles.summaryValue}>{selectedProvince}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="textSecondary">อำเภอ:</Typography>
                  <Typography variant="body1" className={styles.summaryValue}>{selectedDistrict}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="textSecondary">ตำบล:</Typography>
                  <Typography variant="body1" className={styles.summaryValue}>{selectedSubDistrict}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="textSecondary">ช่องทาง:</Typography>
                  <Typography variant="body1" className={styles.summaryValue}>{selectedChannel}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="textSecondary">สถานะ:</Typography>
                  <Typography variant="body1" className={styles.summaryValue}>{selectedStatus}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="textSecondary">วันที่สร้าง:</Typography>
                  <Typography variant="body1" className={styles.summaryValue}>{formatDisplayDate(createdDate)}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">วันที่แก้ไข:</Typography>
                  <Typography variant="body1" className={styles.summaryValue}>{formatDisplayDate(updatedDate)}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Action Buttons */}
          <Box className={styles.actionButtons}>
            <ButtonService
              label="ล้าง"
              color="ล้าง"
              onClick={handleReset}
              disabled={loading}
            />
            <ButtonService
              label={loading ? "กำลังบันทึก..." : "บันทึก"}
              color="ยืนยัน"
              variant="contained"
              onClick={handleSubmit}
              disabled={!isFormValid || loading}
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