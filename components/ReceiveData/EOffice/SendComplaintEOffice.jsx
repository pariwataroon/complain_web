/**
 * SendComplaintEOffice — ฟอร์มส่งผลการพิจารณาไปยัง EOffice
 *
 * ทำงานเหมือน Opm1111/SendComplaintOPm.jsx แต่ส่งข้อมูลผ่าน REST API (JSON)
 * ฟอร์มนี้ใช้สำหรับส่งผลการดำเนินการจากระบบ MOF กลับไปยัง EOffice
 */
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
} from "@mui/material";
import { Send as SendIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import ButtonSent from "@services/ButtonSent/ButtonSent";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import { alertSuccess } from "@utils/Alerts";
import {
  AddEOfficeOperating,
  GetEOfficeCaseStatus,
  GetEOfficeChannels,
  GetEOfficeProvinces,
  GetEOfficeDistricts,
  GetEOfficeSubDistricts,
} from "@pages/api/eoffice/eoffice";

const DEFAULT_STATUSES = [
  { value: "", label: "เลือกสถานะ" },
  { value: "รับเรื่อง", label: "รับเรื่อง" },
  { value: "อยู่ระหว่างดำเนินการ", label: "อยู่ระหว่างดำเนินการ" },
  { value: "ยุติเรื่อง", label: "ยุติเรื่อง" },
];

const DEFAULT_CHANNELS = [{ value: "6", label: "เว็บไซต์ Mof_EOffice" }];

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    fontFamily: "Sarabun, sans-serif",
    fontSize: "14px",
    borderRadius: "12px",
    backgroundColor: "#fafbff",
    transition: "all 0.2s ease",
    "& fieldset": { borderColor: "#e0e4ef" },
    "&:hover fieldset": { borderColor: "#93b4ff" },
    "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: 2 },
  },
  "& .MuiInputLabel-root": { fontFamily: "Sarabun, sans-serif" },
};

const sectionTitleSx = {
  fontWeight: 700,
  fontSize: "14px",
  color: "#1e3a8a",
  mb: 2,
  display: "flex",
  alignItems: "center",
  gap: 1,
};

const SendComplaintEOffice = () => {
  const router = useRouter();
  const { case_id: prefillCaseId } = router.query;

  const [formData, setFormData] = useState({
    case_id: "",
    status: "",
    channel: "6",
    detail: "",
    reporter_first_name: "",
    reporter_last_name: "",
    reporter_phone: "",
    province: "",
    district: "",
    sub_district: "",
    date_created: null,
    date_updated: null,
  });

  const [statusOptions, setStatusOptions] = useState(DEFAULT_STATUSES);
  const [channelOptions, setChannelOptions] = useState(DEFAULT_CHANNELS);
  const [provinceOptions, setProvinceOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [subDistrictOptions, setSubDistrictOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  useEffect(() => {
    const loadOptions = async () => {
      try {
        // TODO: เมื่อ API พร้อม
        // const statuses = await GetEOfficeCaseStatus();
        // if (statuses?.length) setStatusOptions(statuses.map(s => ({ value: s.id, label: s.name })));
        // const channels = await GetEOfficeChannels();
        // if (channels?.length) setChannelOptions(channels.map(c => ({ value: c.id, label: c.name })));
        // const provinces = await GetEOfficeProvinces();
        // if (provinces?.length) setProvinceOptions(provinces.map(p => ({ value: p.id, label: p.name })));
      } catch (error) {
        console.error("Error loading EOffice options:", error);
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    if (prefillCaseId) setFormData((prev) => ({ ...prev, case_id: prefillCaseId }));
  }, [prefillCaseId]);

  const handleProvinceChange = async (e) => {
    const provinceId = e.target.value;
    setFormData((prev) => ({ ...prev, province: provinceId, district: "", sub_district: "" }));
    setDistrictOptions([]);
    setSubDistrictOptions([]);
    if (provinceId) {
      // TODO: เมื่อ API พร้อม
      // const districts = await GetEOfficeDistricts(provinceId);
      // setDistrictOptions(districts.map(d => ({ value: d.id, label: d.name })));
    }
  };

  const handleDistrictChange = async (e) => {
    const districtId = e.target.value;
    setFormData((prev) => ({ ...prev, district: districtId, sub_district: "" }));
    setSubDistrictOptions([]);
    if (districtId) {
      // TODO: เมื่อ API พร้อม
      // const subDistricts = await GetEOfficeSubDistricts(districtId);
      // setSubDistrictOptions(subDistricts.map(s => ({ value: s.id, label: s.name })));
    }
  };

  const isFormValid = useMemo(() => {
    return (
      formData.case_id.trim() !== "" &&
      formData.status.trim() !== "" &&
      formData.reporter_first_name.trim() !== "" &&
      formData.reporter_last_name.trim() !== "" &&
      formData.detail.trim() !== ""
    );
  }, [formData]);

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setLoading(true);
    try {
      const response = await AddEOfficeOperating({
        case_id: formData.case_id,
        status: formData.status,
        channel: formData.channel,
        detail: formData.detail,
        reporter_name: `${formData.reporter_first_name} ${formData.reporter_last_name}`,
        reporter_phone: formData.reporter_phone,
        province: formData.province,
        district: formData.district,
        sub_district: formData.sub_district,
        date_created: formData.date_created || null,
        date_updated: formData.date_updated || null,
      });
      if (response.res_code === "0000") {
        alertSuccess("ส่งผลสำเร็จ", "บันทึกข้อมูลการส่งผลพิจารณาเรียบร้อยแล้ว");
        router.push("/admin/edit/eoffice");
      }
    } catch (error) {
      console.error("Error submitting to EOffice:", error);
      setSnackbar({ open: true, message: "เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      case_id: "", status: "", channel: "6", detail: "",
      reporter_first_name: "", reporter_last_name: "", reporter_phone: "",
      province: "", district: "", sub_district: "",
      date_created: null, date_updated: null,
    });
  };

  const handleFieldChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div>
      <BreadcrumbsService
        items={[
          { label: "จัดการข้อมูลในระบบ", url: "/admin/dashboard" },
          { label: "เรื่องราวร้องทุกข์ช่องทางเว็บไซต์ Mof_EOffice", url: "/admin/edit/eoffice" },
          { label: "ส่งผลการพิจารณา" },
        ]}
      />

      <Card sx={{
        borderRadius: "16px",
        boxShadow: "0 8px 32px rgba(13, 27, 94, 0.07)",
        border: "1px solid #e8ecf4",
        background: "linear-gradient(to bottom, #ffffff, #fafbff)",
        mt: 1,
      }}>
        <CardContent sx={{ p: { xs: 2, md: 3.5 } }}>
          {/* ── Header ── */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: "14px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
            }}>
              <SendIcon sx={{ color: "white", fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#1120a3", fontSize: "18px" }}>
                ส่งผลการพิจารณาไปยัง Mof_EOffice
              </Typography>
              <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                กรอกข้อมูลผลการพิจารณาเพื่อส่งกลับไปยังระบบ EOffice
              </Typography>
            </Box>
          </Box>

          {/* ── Section 1: ข้อมูลเรื่อง ── */}
          <Typography sx={sectionTitleSx}>📋 ข้อมูลเรื่อง</Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" sx={{ color: "#6b7280", mb: 0.5, display: "block", fontWeight: 600 }}>
                เลขที่รับเรื่อง *
              </Typography>
              <TextField fullWidth size="small" placeholder="เช่น EO-2569-00001" value={formData.case_id} onChange={handleFieldChange("case_id")} sx={textFieldSx} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" sx={{ color: "#6b7280", mb: 0.5, display: "block", fontWeight: 600 }}>
                ช่องทาง
              </Typography>
              <TextField fullWidth select size="small" value={formData.channel} onChange={handleFieldChange("channel")} sx={textFieldSx}>
                {channelOptions.map((opt) => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" sx={{ color: "#6b7280", mb: 0.5, display: "block", fontWeight: 600 }}>
                สถานะ *
              </Typography>
              <TextField fullWidth select size="small" value={formData.status} onChange={handleFieldChange("status")} sx={textFieldSx}>
                {statusOptions.map((opt) => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3, borderColor: "#e8ecf4" }} />

          {/* ── Section 2: ข้อมูลผู้รายงาน ── */}
          <Typography sx={sectionTitleSx}>👤 ข้อมูลผู้รายงาน</Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" sx={{ color: "#6b7280", mb: 0.5, display: "block", fontWeight: 600 }}>
                ชื่อผู้รายงาน *
              </Typography>
              <TextField fullWidth size="small" placeholder="ชื่อ" value={formData.reporter_first_name} onChange={handleFieldChange("reporter_first_name")} sx={textFieldSx} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" sx={{ color: "#6b7280", mb: 0.5, display: "block", fontWeight: 600 }}>
                นามสกุลผู้รายงาน *
              </Typography>
              <TextField fullWidth size="small" placeholder="นามสกุล" value={formData.reporter_last_name} onChange={handleFieldChange("reporter_last_name")} sx={textFieldSx} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" sx={{ color: "#6b7280", mb: 0.5, display: "block", fontWeight: 600 }}>
                เบอร์โทรผู้รายงาน
              </Typography>
              <TextField fullWidth size="small" placeholder="081-234-5678" value={formData.reporter_phone} onChange={handleFieldChange("reporter_phone")} sx={textFieldSx} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3, borderColor: "#e8ecf4" }} />

          {/* ── Section 3: รายละเอียดผลการพิจารณา ── */}
          <Typography sx={sectionTitleSx}>📝 รายละเอียดผลการพิจารณา</Typography>
          <TextField
            fullWidth
            multiline
            rows={5}
            placeholder="ระบุรายละเอียดผลการพิจารณา..."
            value={formData.detail}
            onChange={handleFieldChange("detail")}
            sx={{
              ...textFieldSx,
              "& .MuiOutlinedInput-root": {
                ...textFieldSx["& .MuiOutlinedInput-root"],
                borderRadius: "14px",
              },
            }}
          />

          <Divider sx={{ my: 3, borderColor: "#e8ecf4" }} />

          {/* ── Section 4: ที่อยู่ ── */}
          <Typography sx={sectionTitleSx}>📍 ที่อยู่</Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" sx={{ color: "#6b7280", mb: 0.5, display: "block", fontWeight: 600 }}>จังหวัด</Typography>
              <TextField fullWidth select size="small" value={formData.province} onChange={handleProvinceChange} sx={textFieldSx}>
                <MenuItem value=""><em>เลือกจังหวัด</em></MenuItem>
                {provinceOptions.map((opt) => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" sx={{ color: "#6b7280", mb: 0.5, display: "block", fontWeight: 600 }}>อำเภอ/เขต</Typography>
              <TextField fullWidth select size="small" value={formData.district} onChange={handleDistrictChange} disabled={!formData.province || districtOptions.length === 0} sx={textFieldSx}>
                <MenuItem value=""><em>เลือกอำเภอ</em></MenuItem>
                {districtOptions.map((opt) => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" sx={{ color: "#6b7280", mb: 0.5, display: "block", fontWeight: 600 }}>ตำบล/แขวง</Typography>
              <TextField fullWidth select size="small" value={formData.sub_district} onChange={handleFieldChange("sub_district")} disabled={!formData.district || subDistrictOptions.length === 0} sx={textFieldSx}>
                <MenuItem value=""><em>เลือกตำบล</em></MenuItem>
                {subDistrictOptions.map((opt) => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3, borderColor: "#e8ecf4" }} />

          {/* ── Section 5: วันที่ ── */}
          <Typography sx={sectionTitleSx}>📅 วันที่</Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: "#6b7280", mb: 0.5, display: "block", fontWeight: 600 }}>วันที่สร้างเรื่อง</Typography>
              <DateThaiPickerService value={formData.date_created} onChange={(val) => setFormData((prev) => ({ ...prev, date_created: val }))} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: "#6b7280", mb: 0.5, display: "block", fontWeight: 600 }}>วันที่อัปเดทล่าสุด</Typography>
              <DateThaiPickerService value={formData.date_updated} onChange={(val) => setFormData((prev) => ({ ...prev, date_updated: val }))} size="small" />
            </Grid>
          </Grid>

          {/* ── Buttons ── */}
          <Divider sx={{ mt: 3.5, mb: 2.5, borderColor: "#e8ecf4" }} />
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <ButtonSent label="ล้าง" onClick={handleReset} disabled={loading} />
            <ButtonSent
              label="บันทึก"
              onClick={handleSubmit}
              disabled={!isFormValid || loading}
              icon={loading ? <CircularProgress size={16} sx={{ color: "white" }} /> : <SendIcon sx={{ fontSize: 18, mr: 0.5 }} />}
            />
          </Box>
        </CardContent>
      </Card>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </div>
  );
};

export default SendComplaintEOffice;
