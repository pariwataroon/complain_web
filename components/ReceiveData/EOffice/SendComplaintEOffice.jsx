/**
 * SendComplaintEOffice — ฟอร์มส่งผลการพิจารณาไปยังระบบสารบรรณอิเล็กทรอนิกส์
 *
 * ทำงานเหมือน Opm1111/SendComplaintOPm.jsx แต่ส่งข้อมูลผ่าน REST API (JSON)
 * ฟอร์มนี้ใช้สำหรับส่งผลการดำเนินการจากระบบ MOF กลับไปยัง EOffice
 */
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
} from "@mui/material";
import { Send as SendIcon } from "@mui/icons-material";
import ButtonSent from "@services/ButtonSent/ButtonSent";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import GetEnhancedComplaintsService from "@services/GetEnhancedComplaintsService/GetEnhancedComplaintsService";
import SelectFieldPAAOPM from "@services/SelectFieldPAAOPM/SelectFieldPAAOPM";
import { alertSuccess, alertError } from "@utils/Alerts";
import {
  AddEOfficeOperating,
  loginEOffice,
} from "@pages/api/eoffice/eoffice";

const DEFAULT_STATUSES = [
  { value: "", label: "เลือกสถานะ" },
  { value: "รับเรื่อง", label: "รับเรื่อง" },
  { value: "อยู่ระหว่างดำเนินการ", label: "อยู่ระหว่างดำเนินการ" },
  { value: "ยุติเรื่อง", label: "ยุติเรื่อง" },
];

const DEFAULT_CHANNELS = [{ value: "6", label: "ระบบสารบรรณอิเล็กทรอนิกส์" }];

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
  const [selectedComplaintData, setSelectedComplaintData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  // ── Address cascade: set ทีละ step (province → district → sub_district) ──
  const [pendingAddress, setPendingAddress] = useState({ district: "", sub_district: "" });
  const districtSetRef = useRef(false);
  const subDistrictSetRef = useRef(false);

  useEffect(() => {
    // รอ router query พร้อมก่อน (Next.js: router.query เป็น {} ตอน render แรก)
    if (!router.isReady) return;

    if (prefillCaseId) {
      // ถ้ามากจากหน้า detail (มี case_id ใน URL) → prefill ให้เลย
      setFormData((prev) => ({ ...prev, case_id: prefillCaseId }));
    }
    // ไม่มี prefillCaseId ก็ไม่เป็นไร — user จะค้นหาเรื่องจาก GetEnhancedComplaintsService เอง
  }, [router.isReady, prefillCaseId]);

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
      // 1) Login ก่อน เหมือน OPM flow
      await loginEOffice();

      // 2) ส่งผลพิจารณา → SetOrgSummaryResult
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

      // API จริงคืน { success: true/false } (ไม่ใช่ res_code)
      if (response.success) {
        alertSuccess("ส่งผลสำเร็จ", "บันทึกข้อมูลการส่งผลพิจารณาเรียบร้อยแล้ว");
        router.push("/admin/edit/eoffice");
      } else {
        throw new Error(response.message || "API ส่งผลไม่สำเร็จ");
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
    setSelectedComplaintData(null);
  };

  const handleFieldChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleComplaintSelection = useCallback((complaint) => {
    setSelectedComplaintData(complaint);

    if (complaint) {
      setFormData((prev) => {
        const next = { ...prev };

        // เลขที่รับเรื่อง (case_id):
        // - ถ้ามี prefillCaseId จาก URL (มาจาก EOffice detail page) → ใช้ค่าเดิม ไม่เขียนทับ
        // - ถ้าไม่มี → ใช้ reference_number5 (EOffice case_id) เป็นหลัก
        //   เพราะ complaint_number เป็นเลข MOF ส่งไป EOffice API จะ error 400
        if (!prefillCaseId) {
          const eofficeId = complaint.reference_number5 || complaint.additional_reference_number1;
          if (eofficeId && eofficeId !== '-' && eofficeId !== '0') {
            next.case_id = String(eofficeId);
          } else if (complaint.complaint_number && complaint.complaint_number !== '-') {
            // fallback: ถ้าไม่มี reference_number5 จริงๆ
            next.case_id = complaint.complaint_number;
          }
        }

        // ชื่อ-นามสกุลผู้รายงาน
        if (complaint.complainant_first_name || complaint.complainant_last_name) {
          const prefix = complaint.complainant_prefix || '';
          const firstName = complaint.complainant_first_name || '';
          const lastName = complaint.complainant_last_name || '';
          next.reporter_first_name = prefix ? `${prefix} ${firstName}`.trim() : firstName;
          next.reporter_last_name = lastName;
        } else if (complaint.complainant_name && complaint.complainant_name !== '-') {
          const fullName = complaint.complainant_name.trim();
          const nameParts = fullName.split(' ');
          if (nameParts.length >= 2) {
            next.reporter_first_name = nameParts.slice(0, -1).join(' ');
            next.reporter_last_name = nameParts[nameParts.length - 1];
          } else {
            next.reporter_first_name = fullName;
            next.reporter_last_name = '';
          }
        }

        // เบอร์โทร
        if (complaint.complainant_phone && complaint.complainant_phone !== '-') {
          next.reporter_phone = complaint.complainant_phone;
        }

        // รายละเอียดเรื่องร้องเรียน
        if (complaint.complainant_description && complaint.complainant_description !== '-') {
          next.detail = complaint.complainant_description;
        }

        // วันที่สร้าง
        if (complaint.created_at) {
          next.date_created = complaint.created_at;
        }

        // ข้อมูลที่อยู่ — set province ก่อน แล้ว cascade district → sub_district ทีละ step
        if (complaint.province_name && complaint.province_name !== '-') {
          next.province = complaint.province_id || '';
        }
        // district + sub_district จะ set ผ่าน useEffect cascade (ต้องรอ API โหลดก่อน)

        return next;
      });

      // เก็บ pending district/sub_district → useEffect จะ cascade set ให้หลัง API โหลดเสร็จ
      districtSetRef.current = false;
      subDistrictSetRef.current = false;
      const dId = complaint.district_id || '';
      const sdId = complaint.subdistrict_id || complaint.sub_district_id || '';
      setPendingAddress({ district: dId, sub_district: sdId });
    }
  }, [prefillCaseId]);

  // ── Cascade: set district หลัง districts API โหลดเสร็จ ──
  useEffect(() => {
    if (!pendingAddress.district || districtSetRef.current) return;
    if (formData.province) {
      const timer = setTimeout(() => {
        setFormData((prev) => ({ ...prev, district: pendingAddress.district }));
        districtSetRef.current = true;
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [formData.province, pendingAddress.district]);

  // ── Cascade: set sub_district หลัง sub_districts API โหลดเสร็จ ──
  useEffect(() => {
    if (!pendingAddress.sub_district || subDistrictSetRef.current) return;
    if (formData.district) {
      const timer = setTimeout(() => {
        setFormData((prev) => ({ ...prev, sub_district: pendingAddress.sub_district }));
        subDistrictSetRef.current = true;
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [formData.district, pendingAddress.sub_district]);

  return (
    <div>
      <BreadcrumbsService
        items={[
          { label: "จัดการข้อมูลในระบบ", url: "/admin/dashboard" },
          { label: "รับเรื่องราวร้องทุกข์จากระบบสารบรรณอิเล็กทรอนิกส์", url: "/admin/edit/eoffice" },
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
                ส่งผลการพิจารณาไปยังระบบสารบรรณอิเล็กทรอนิกส์
              </Typography>
              <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                กรอกข้อมูลผลการพิจารณาเพื่อส่งกลับไปยังระบบ EOffice
              </Typography>
            </Box>
          </Box>

          {/* ── Section 1: ข้อมูลเรื่อง ── */}
          <Typography sx={sectionTitleSx}>📋 ข้อมูลเรื่อง</Typography>

          {/* ปุ่มค้นหาเรื่องร้องเรียน — อยู่บนสุด เด่นชัด */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <GetEnhancedComplaintsService onComplaintSelect={handleComplaintSelection} />
            <Typography variant="body2" sx={{ color: "#6b7280", fontSize: "13px" }}>
              กดเพื่อค้นหาเรื่องราวร้องทุกข์จากฐานข้อมูล
            </Typography>
          </Box>

          {selectedComplaintData && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#e3f2fd', borderRadius: 1, border: '1px solid #2196f3' }}>
              <Typography variant="body2" color="primary" fontWeight="bold" sx={{ fontSize: '13px' }}>
                ✅ เลือก: {selectedComplaintData.complaint_number}
                {formData.case_id && formData.case_id !== selectedComplaintData.complaint_number && (
                  <Typography component="span" variant="caption" sx={{ ml: 1, color: '#6b7280' }}>
                    → ส่งกลับด้วย EOffice ID: {formData.case_id}
                  </Typography>
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
                {selectedComplaintData.subject} | {selectedComplaintData.complainant_name}
              </Typography>
            </Box>
          )}

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
              <SelectFieldPAAOPM
                label="จังหวัด"
                name="province"
                placeholder="เลือกจังหวัด"
                value={formData.province}
                onChange={(val) => setFormData((prev) => ({ ...prev, province: val, district: "", sub_district: "" }))}
                size="small"
                required={false}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <SelectFieldPAAOPM
                label="อำเภอ/เขต"
                name="district"
                placeholder="เลือกอำเภอ"
                value={formData.district}
                onChange={(val) => setFormData((prev) => ({ ...prev, district: val, sub_district: "" }))}
                disabled={!formData.province}
                selectedProvince={formData.province}
                size="small"
                required={false}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <SelectFieldPAAOPM
                label="ตำบล/แขวง"
                name="subdistrict"
                placeholder="เลือกตำบล"
                value={formData.sub_district}
                onChange={(val) => setFormData((prev) => ({ ...prev, sub_district: val }))}
                disabled={!formData.district}
                selectedProvince={formData.province}
                selectedDistrict={formData.district}
                size="small"
                required={false}
              />
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
