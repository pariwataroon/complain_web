import { useRouter } from "next/router";
import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Alert,
  Snackbar,
  FormControl,
  TextField,
} from "@mui/material";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import SelectFieldPAAOPM from "@services/SelectFieldPAAOPM/SelectFieldPAAOPM";
import ButtonService from "@services/ButtonService/ButtonService";
import GetEnhancedComplaintsService from "@services/GetEnhancedComplaintsService/GetEnhancedComplaintsService";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import {
  showConfirm,
  showLoading,
  closeAlert,
  alertSuccess,
  alertError,
} from "@utils/Alerts";
import { AddCase } from "@pages/api/opm/opm";
import styles from "./SendComplaintOPm.module.scss";

const SendComplaintOPM = () => {
  const router = useRouter();
  const queryParams = router.query;

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSubDistrict, setSelectedSubDistrict] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("6");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedType, setselectedType] = useState("");
  const [createdDate, setCreatedDate] = useState(new Date().toISOString());
  const [updatedDate, setUpdatedDate] = useState(new Date().toISOString());
  const [reporterFirstName, setReporterFirstName] = useState("");
  const [reporterLastName, setReporterLastName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [caseCode, setCaseCode] = useState("");
  const [complaintDetail, setComplaintDetail] = useState("");
  const [selectedComplaintData, setSelectedComplaintData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const validatePhoneNumber = (phone) => {
    if (!phone) return false;
    const mobileRegex = /^(08|09)\d{8}$/;
    const landlineRegex = /^(02|03|04|05|06|07)\d{7,8}$/;

    return mobileRegex.test(phone) || landlineRegex.test(phone);
  };

  const isPhoneValid = validatePhoneNumber(reporterPhone);


  const isFormValid = useMemo(() => {
    const validations = {
      selectedProvince: !!selectedProvince,
      selectedDistrict: !!selectedDistrict,
      selectedSubDistrict: !!selectedSubDistrict,
      selectedChannel: true,
      selectedStatus: !!selectedStatus,
      selectedType: !!selectedType,
      createdDate: !!createdDate,
      updatedDate: !!updatedDate,
      reporterFirstName: !!reporterFirstName?.trim(),
      reporterLastName: !!reporterLastName?.trim(),
      reporterPhone: !!reporterPhone?.trim(),
      caseCode: !!caseCode?.trim(),
      complaintDetail: !!complaintDetail?.trim(),
      isPhoneValid: isPhoneValid
    };

    const allValid = Object.values(validations).every(valid => valid === true);

    return allValid;
  }, [
    selectedProvince,
    selectedDistrict,
    selectedSubDistrict,
    selectedChannel,
    selectedStatus,
    selectedType,
    createdDate,
    updatedDate,
    reporterFirstName,
    reporterLastName,
    reporterPhone,
    caseCode,
    complaintDetail,
    isPhoneValid
  ]);

  const handleComplaintSelection = useCallback((complaint) => {
    setSelectedComplaintData(complaint);

    if (complaint) {
      if (complaint.complaint_number && complaint.complaint_number !== '-') {
        setCaseCode(complaint.complaint_number);
      }

      if (complaint.complainant_phone && complaint.complainant_phone !== '-') {
        setReporterPhone(complaint.complainant_phone);
      }

      if (complaint.complainant_name && complaint.complainant_name !== '-') {
        const fullName = complaint.complainant_name.trim();
        const nameParts = fullName.split(' ');

        if (nameParts.length >= 2) {
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(' ');
          setReporterFirstName(firstName);
          setReporterLastName(lastName);
        } else {
          setReporterFirstName(fullName);
          setReporterLastName('');
        }
      }

      if (complaint.complainant_description && complaint.complainant_description !== '-') {
        setComplaintDetail(complaint.complainant_description);
      }

      // if (complaint.complaint_type_id) {
      //   setselectedType(complaint.complaint_type_id);
      // }

      // ถ้ามี status ที่ตรงกับระบบให้ set
      // if (complaint.status) {
      //   const statusMapping = {
      //     'รับเรื่อง': '1',
      //     'ติดตามผล': '2',
      //     'อยู่ระหว่างพิจารณา': '3',
      //     'กำลังดำเนินการ': '4',
      //     'มอบหมายเจ้าหน้าที่': '5',
      //     'เสร็จสิ้น': '6'
      //   };

      //   if (statusMapping[complaint.status]) {
      //     setSelectedStatus(statusMapping[complaint.status]);
      //   }
      // }

      // ถ้ามี created_date ให้ set วันที่สร้าง
      if (complaint.created_at) {
        setCreatedDate(complaint.created_at);
      }
    }
  }, []);

  // Event handlers
  const handleProvinceChange = useCallback((event) => {
    const newValue = event.target.value;
    setSelectedProvince(newValue);
    setSelectedDistrict("");
    setSelectedSubDistrict("");
  }, []);

  const handleDistrictChange = useCallback((event) => {
    const newValue = event.target.value;
    setSelectedDistrict(newValue);
    setSelectedSubDistrict("");
  }, []);

  const handleSubDistrictChange = useCallback((event) => {
    const newValue = event.target.value;
    setSelectedSubDistrict(newValue);
  }, []);

  const handleChannelChange = useCallback((event) => {
    const newValue = event.target.value;
    setSelectedChannel(newValue);
  }, []);

  const handleStatusChange = useCallback((event) => {
    const newValue = event.target.value;
    setSelectedStatus(newValue);
  }, []);

  const handleTypeChange = useCallback((event) => {
    const newValue = event.target.value;
    setselectedType(newValue);
  }, []);

  const handleCreatedDateChange = useCallback((date) => {
    setCreatedDate(date);
  }, []);

  const handleUpdatedDateChange = useCallback((date) => {
    setUpdatedDate(date);
  }, []);

  const handleReporterFirstNameChange = useCallback((event) => {
    const value = event.target.value;
    const nameValue = value.replace(/[^a-zA-Zก-๙\s]/g, "");
    setReporterFirstName(nameValue);
  }, []);

  const handleReporterLastNameChange = useCallback((event) => {
    const value = event.target.value;
    const nameValue = value.replace(/[^a-zA-Zก-๙\s]/g, "");
    setReporterLastName(nameValue);
  }, []);

  const handleReporterPhoneChange = useCallback((e) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^0-9]/g, "");

    if (numericValue.length <= 10) {
      setReporterPhone(numericValue);
    }
  }, []);

  const handleCaseCodeChange = useCallback((event) => {
    setCaseCode(event.target.value);
  }, []);

  const handleComplaintDetailChange = useCallback((event) => {
    setComplaintDetail(event.target.value);
  }, []);

  const handleReset = useCallback(async () => {
    const confirmed = await showConfirm(
      "ยืนยันการล้างข้อมูล",
      "คุณต้องการล้างข้อมูลทั้งหมดหรือไม่?",
      "ใช่, ล้างข้อมูล",
      "ยกเลิก"
    );

    if (confirmed) {
      setSelectedProvince("");
      setSelectedDistrict("");
      setSelectedSubDistrict("");
      setSelectedChannel("");
      setSelectedStatus("");
      setselectedType("");
      setCreatedDate(new Date().toISOString());
      setUpdatedDate(new Date().toISOString());
      setReporterFirstName("");
      setReporterLastName("");
      setReporterPhone("");
      setCaseCode("");
      setComplaintDetail("");

      await alertSuccess("สำเร็จ", "ล้างข้อมูลเรียบร้อยแล้ว");
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    // ตรวจสอบข้อมูลครบถ้วน
    if (!isFormValid) {
      if (!reporterPhone) {
        await alertError(
          "ข้อมูลไม่ครบถ้วน",
          "กรุณากรอกเบอร์โทรศัพท์ผู้แจ้งเหตุ"
        );
        return;
      }
      if (!isPhoneValid) {
        await alertError(
          "เบอร์โทรไม่ถูกต้อง",
          "กรุณากรอกเบอร์โทรศัพท์ในรูปแบบที่ถูกต้อง เช่น 0812345678 หรือ 0212345678"
        );
        return;
      }
      await alertError("ข้อมูลไม่ครบถ้วน", "กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง");
      return;
    }

    // ตรวจสอบเบอร์โทรเพิ่มเติม
    if (reporterPhone.length < 9) {
      await alertError(
        "เบอร์โทรไม่ถูกต้อง",
        "เบอร์โทรศัพท์ต้องมีอย่างน้อย 9 หลัก"
      );
      return;
    }

    // Show confirmation dialog
    const confirmed = await showConfirm(
      "ยืนยันการส่งข้อมูล",
      "คุณต้องการส่งเรื่องร้องทุกข์ไปยัง สปน. หรือไม่?",
      "ใช่, ส่งข้อมูล",
      "ยกเลิก"
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      showLoading("กำลังส่งข้อมูลไปยัง สปน...");

      const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        const seconds = String(d.getSeconds()).padStart(2, "0");

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };

      const formatCurrentTimestamp = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };

      const submitData = {
        province_id: selectedProvince,
        district_id: selectedDistrict,
        subdistrict_id: selectedSubDistrict,
        channel_id: selectedChannel,
        status_id: selectedStatus,
        type_id: selectedType,
        created_date: formatDate(createdDate),
        updated_date: formatDate(updatedDate),
        case_id: queryParams.id || "",
        submitted_at: formatCurrentTimestamp(),
        reporter_first_name: reporterFirstName,
        reporter_last_name: reporterLastName,
        reporter_phone: reporterPhone,
        case_code: caseCode,
        complaint_detail: complaintDetail,
      };

      console.log("Submitting data:", submitData);

      const result = await AddCase(submitData);

      closeAlert();

      const extractAddCaseResult = (xmlString) => {
        try {
          const regexMatch = xmlString.match(
            /<AddCaseResult[^>]*>(.*?)<\/AddCaseResult>/s
          );
          if (regexMatch && regexMatch[1]) {
            let content = regexMatch[1].trim();
            content = content.replace(/^"(.*)"$/, "$1");
            return content;
          }

          if (typeof DOMParser !== "undefined") {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "text/xml");
            const addCaseResult =
              xmlDoc.getElementsByTagName("AddCaseResult")[0];
            if (addCaseResult) {
              let content =
                addCaseResult.textContent || addCaseResult.innerText;
              content = content.trim();
              content = content.replace(/^"(.*)"$/, "$1");
              return content;
            }
          }

          return null;
        } catch (error) {
          console.error("Error extracting AddCaseResult:", error);
          return null;
        }
      };

      let isSuccess = false;
      let responseData = null;
      let addCaseResult = null;

      if (result) {
        if (typeof result === "string" && result.includes("<AddCaseResult>")) {
          addCaseResult = extractAddCaseResult(result);
          isSuccess = !!addCaseResult;
          responseData = result;
        } else if (
          result.data &&
          typeof result.data === "string" &&
          result.data.includes("<AddCaseResult>")
        ) {
          addCaseResult = extractAddCaseResult(result.data);
          isSuccess = !!addCaseResult;
          responseData = result.data;
        } else if (result.success === true) {
          isSuccess = true;
          responseData = result.data || result.message || result;
          if (
            typeof responseData === "string" &&
            responseData.includes("<AddCaseResult>")
          ) {
            addCaseResult = extractAddCaseResult(responseData);
          }
        } else if (
          result.status === "success" ||
          result.status === 200 ||
          result.statusCode === 200
        ) {
          isSuccess = true;
          responseData = result.data || result.message || result;
          if (
            typeof responseData === "string" &&
            responseData.includes("<AddCaseResult>")
          ) {
            addCaseResult = extractAddCaseResult(responseData);
          }
        } else if (result.AddCaseResult) {
          addCaseResult = result.AddCaseResult;
          isSuccess = true;
          responseData = result;
        } else if (
          typeof result === "object" &&
          JSON.stringify(result).includes("AddCaseResult")
        ) {
          isSuccess = true;
          responseData = result;
          const resultString = JSON.stringify(result);
          if (resultString.includes("<AddCaseResult>")) {
            addCaseResult = extractAddCaseResult(resultString);
          }
        }
      }

      if (isSuccess || addCaseResult) {
        let referenceId = "";
        let caseNumber = "";
        let successTitle = "ส่งข้อมูลสำเร็จ!";
        let successMessage = "บันทึกข้อมูลเรียบร้อยแล้ว";

        if (addCaseResult) {
          try {
            let cleanData = addCaseResult.replace(/^Result:/, "");

            const parts = cleanData.split("|");
            if (parts.length === 2) {
              referenceId = parts[0].trim();
              caseNumber = parts[1].trim();

              successMessage = `
                <div style="text-align: left; line-height: 1.8;">
                  <p style="margin-bottom: 15px; font-size: 16px;">ส่งเรื่องร้องทุกข์ไปยัง สปน. เรียบร้อยแล้ว</p>
                  
                  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                    <p style="margin: 0 0 10px 0; font-weight: 600; color: #495057;">
                      📝 <strong>รหัสอ้างอิง:</strong>
                    </p>
                    <p style="margin: 0 0 15px 20px; font-family: monospace; font-size: 14px; color: #007bff; background: white; padding: 8px; border-radius: 4px; border: 1px solid #dee2e6;">
                      ${referenceId}
                    </p>
                    
                    <p style="margin: 0 0 10px 0; font-weight: 600; color: #495057;">
                      🎫 <strong>เลขเคส OPM:</strong>
                    </p>
                    <p style="margin: 0 0 0 20px; font-family: monospace; font-size: 14px; color: #28a745; background: white; padding: 8px; border-radius: 4px; border: 1px solid #dee2e6;">
                      ${caseNumber}
                    </p>
                  </div>
                  
                  <p style="margin-top: 15px; font-size: 14px; color: #6c757d;">
                    💡 กรุณาเก็บรหัสอ้างอิงและเลขเคสไว้สำหรับติดตามผล
                  </p>
                  
                  <div style="margin-top: 15px; padding: 10px; background: #e3f2fd; border-radius: 4px; border-left: 4px solid #2196f3;">
                    <p style="margin: 0; font-size: 12px; color: #1565c0;">
                      ⏰ ส่งข้อมูลเมื่อ: ${new Date().toLocaleString("th-TH", {
                        timeZone: "Asia/Bangkok",
                      })} 
                    </p>
                  </div>
                </div>
              `;
            } else {
              successMessage = `
                <div style="text-align: left; line-height: 1.8;">
                  <p style="margin-bottom: 15px; font-size: 16px;">ส่งเรื่องร้องทุกข์ไปยัง สปน. เรียบร้อยแล้ว</p>
                  
                  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                    <p style="margin: 0 0 10px 0; font-weight: 600; color: #495057;">
                      📄 <strong>ข้อมูลตอบกลับ:</strong>
                    </p>
                    <p style="margin: 0 0 0 20px; font-family: monospace; font-size: 12px; color: #495057; background: white; padding: 8px; border-radius: 4px; border: 1px solid #dee2e6; word-break: break-all;">
                      ${addCaseResult}
                    </p>
                  </div>
                  
                  <div style="margin-top: 15px; padding: 10px; background: #e3f2fd; border-radius: 4px; border-left: 4px solid #2196f3;">
                    <p style="margin: 0; font-size: 12px; color: #1565c0;">
                      ⏰ ส่งข้อมูลเมื่อ: ${new Date().toLocaleString("th-TH", {
                        timeZone: "Asia/Bangkok",
                      })} 
                    </p>
                  </div>
                </div>
              `;
            }
          } catch (parseError) {
            console.warn("Could not parse AddCaseResult:", parseError);
          }
        }

        await alertSuccess(successTitle, successMessage, true);

        const shouldRedirect = await showConfirm(
          "เสร็จสิ้น",
          "ต้องการกลับไปหน้ารายการเรื่องร้องทุกข์หรือไม่?",
          "กลับไปหน้ารายการ",
          "อยู่หน้านี้ต่อ"
        );

        if (shouldRedirect) {
          router.push("/admin/edit/opm1111");
        }
      } else {
        throw new Error("ได้รับข้อมูลตอบกลับที่ไม่คาดคิดจากเซิร์ฟเวอร์");
      }
    } catch (error) {
      closeAlert();
      console.error("Submit error:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      await alertError(
        "เกิดข้อผิดพลาด",
        `ไม่สามารถส่งข้อมูลได้: ${error.message || "กรุณาลองใหม่อีกครั้ง"}`
      );
    } finally {
      setLoading(false);
    }
  }, [
    isFormValid,
    selectedProvince,
    selectedDistrict,
    selectedSubDistrict,
    selectedChannel,
    selectedStatus,
    selectedType,
    createdDate,
    updatedDate,
    reporterFirstName,
    reporterLastName,
    reporterPhone,
    caseCode,
    complaintDetail,
    queryParams.id,
    router,
    isPhoneValid,
  ]);

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Format date for display
  const formatDisplayDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Box className={styles.container}>
      <BreadcrumbsService
        items={[
          {
            label: "จัดการข้อมูลในระบบ",
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
              {/* Process Fields */}
              <Grid item xs={12}>
                <Typography variant="h6" className={styles.sectionTitle}>
                  ข้อมูลการดำเนินการ
                  <GetEnhancedComplaintsService onComplaintSelect={handleComplaintSelection} />
                  {selectedComplaintData && (
                    <Box sx={{ mt: 1, p: 2, bgcolor: '#e3f2fd', borderRadius: 1, border: '1px solid #2196f3' }}>
                      <Typography variant="body2" color="primary" fontWeight="bold">
                        ข้อมูลที่เลือก: {selectedComplaintData.complaint_number}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedComplaintData.subject} | {selectedComplaintData.status}
                      </Typography>
                    </Box>
                  )}
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
                  disabled={false}
                  readOnly={false} 
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

              <Grid item xs={12} md={6}>
                <SelectFieldPAAOPM
                  label="ประเภทเรื่องร้องทุกข์"
                  name="type"
                  placeholder="เลือกประเภทเรื่องร้องทุกข์"
                  value={selectedType}
                  onChange={handleTypeChange}
                  required={true}
                />
              </Grid>

              {/* Reporter Information Section */}
              <Grid item xs={12}>
                <Typography variant="h6" className={styles.sectionTitle}>
                  ข้อมูลผู้แจ้งเหตุ
                </Typography>
                
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl className={styles.formControl} sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    className={styles.fieldLabel}
                    sx={{
                      color: "#334155",
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    ชื่อผู้แจ้งเหตุ
                    <span className={styles.requiredAsterisk}>*</span>
                  </Typography>
                  <TextField
                    name="reporterFirstName"
                    value={reporterFirstName}
                    onChange={handleReporterFirstNameChange}
                    placeholder="กรอกชื่อผู้แจ้งเหตุ"
                    variant="outlined"
                    size="small"
                    required
                    fullWidth
                    className={styles.textField}
                    helperText="ใส่ได้เฉพาะตัวอักษรไทย-อังกฤษเท่านั้น"
                    
                  />
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl className={styles.formControl} sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    className={styles.fieldLabel}
                    sx={{
                      color: "#334155",
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    นามสกุลผู้แจ้งเหตุ
                    <span className={styles.requiredAsterisk}>*</span>
                  </Typography>
                  <TextField
                    name="reporterLastName"
                    value={reporterLastName}
                    onChange={handleReporterLastNameChange}
                    placeholder="กรอกนามสกุลผู้แจ้งเหตุ"
                    variant="outlined"
                    size="small"
                    required
                    fullWidth
                    className={styles.textField}
                    helperText="ใส่ได้เฉพาะตัวอักษรไทย-อังกฤษเท่านั้น"
                  />
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl className={styles.formControl} sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    className={styles.fieldLabel}
                    sx={{
                      color: "#334155",
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    เบอร์โทรศัพท์ผู้แจ้งเหตุ
                    <span className={styles.requiredAsterisk}>*</span>
                  </Typography>
                  <TextField
                    name="reporterPhone"
                    value={reporterPhone}
                    onChange={handleReporterPhoneChange}
                    placeholder="กรอกเบอร์โทรศัพท์ผู้แจ้งเหตุ เช่น 0812345678"
                    variant="outlined"
                    size="small"
                    required
                    type="tel"
                    fullWidth
                    className={styles.textField}
                    helperText={
                      reporterPhone && !isPhoneValid
                        ? "รูปแบบเบอร์โทรไม่ถูกต้อง เช่น 0812345678 หรือ 0212345678"
                        : "ใส่ได้เฉพาะตัวเลข 0-9 (9-10 หลัก)"
                    }
                    error={reporterPhone && !isPhoneValid}
                    inputProps={{
                      inputMode: "numeric",
                      pattern: "[0-9]*",
                      maxLength: 10,
                    }}
                  />
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl className={styles.formControl} sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    className={styles.fieldLabel}
                    sx={{
                      color: "#334155",
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    รหัสเคส
                    <span className={styles.requiredAsterisk}>*</span>
                  </Typography>
                  <TextField
                    name="caseCode"
                    value={caseCode}
                    onChange={handleCaseCodeChange}
                    placeholder="กรอกรหัสเรื่อง"
                    variant="outlined"
                    size="small"
                    required
                    fullWidth
                    className={styles.textField}
                  />
                </FormControl>
              </Grid>

              {/* Complaint Detail Section */}
              <Grid item xs={12}>
                <Typography variant="h6" className={styles.sectionTitle}>
                  รายละเอียดเรื่องร้องทุกข์
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormControl className={styles.formControl} sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    className={styles.fieldLabel}
                    sx={{
                      color: "#334155",
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    รายละเอียดเรื่องร้องทุกข์
                    <span className={styles.requiredAsterisk}>*</span>
                  </Typography>
                  <TextField
                    name="complaintDetail"
                    value={complaintDetail}
                    onChange={handleComplaintDetailChange}
                    placeholder="กรอกรายละเอียดเรื่องร้องทุกข์อย่างละเอียด เช่น สถานที่เกิดเหตุ วันเวลาที่เกิดเหตุ ผู้เกี่ยวข้อง และรายละเอียดอื่นๆ ที่เกี่ยวข้อง"
                    variant="outlined"
                    multiline
                    rows={6}
                    required
                    fullWidth
                    className={styles.textareaField}
                  />
                </FormControl>
              </Grid>

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
                  maxDate={new Date().toISOString()}
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
                  maxDate={new Date().toISOString()}
                />
              </Grid>
            </Grid>
          </Box>

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
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SendComplaintOPM;
