import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Box, Paper, Typography, Grid } from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import ImageIcon from "@mui/icons-material/Image";
import Image from "next/image";
import Cookies from "js-cookie";
import ButtonService from "@services/ButtonService/ButtonService";
import { GetComplaintByID } from "@pages/api/complaint/complaint";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import {
  formatThaiDate,
  formatThaiDateTime,
  formatPhoneNumber_null,
  formatCitizenId_null,
} from "@utils/Formats";
import CheckIcon from "@mui/icons-material/Check";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { exportElementToPDF } from "@utils/exportPDF";
import {
  showLoading,
  closeAlert,
  alertError,
  alertSuccess,
  showConfirm,
} from "@utils/Alerts";
import useSearchComplaintsPreview from "@hooks/admin/websitecomplaints/useSearchComplaintsPreview";

const SearchComplaintsPreview = ({
  id: propId = null,
  data: propData = null,
  onBack = null,
}) => {
  const router = useRouter();
  const { id: queryId } = router.query;

  // ใช้ id จาก props ก่อน ถ้าไม่มีค่อยใช้จาก query
  const id = propId || queryId;

  const [formData, setFormData] = useState(null);
  console.log("formData", formData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  const pdfRef = useRef();

  const { handleUpdateAssignment, isSubmitting, preparedFormData } =
    useSearchComplaintsPreview();

  const breadcrumbItems = [
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
      label: "เรื่องราวร้องทุกข์ช่องทางเว็บไซต์",
      url: "/admin/edit/website-complaints",
    },
    {
      label: "แบบรับคำร้องเรียน / ร้องทุกข์กระทรวง",
      url: id
        ? `/admin/edit/website-complaints/${id}`
        : "/admin/edit/website-complaints/SearchComplaints",
    },
    { label: "ตัวอย่างเอกสาร" },
  ];

  useEffect(() => {
    const cookieInfo = Cookies.get("info");
    if (cookieInfo) {
      try {
        const parsedInfo = JSON.parse(cookieInfo);
        setUserInfo(parsedInfo);
      } catch (err) {
        console.error("Error parsing user info cookie:", err);
      }
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // ถ้ามี propData ให้ใช้ข้อมูลจาก props
      if (propData) {
        setFormData(propData);
        setLoading(false);
        return;
      }

      if (!id) {
        setError("ไม่พบ ID เรื่องร้องทุกข์");
        setLoading(false);
        return;
      }

      try {
        // ลองดึงข้อมูลจาก query parameter ก่อน (กรณีส่งมาจากหน้าแก้ไข)
        if (router.query.data) {
          const data = JSON.parse(router.query.data);
          setFormData(data);
          setLoading(false);
          return;
        }

        // ถ้าไม่มีข้อมูลใน query ให้เรียก API
        const response = await GetComplaintByID(id);

        if (response?.res_code === "0001" && response?.res_data) {
          setFormData(response.res_data);
        } else {
          throw new Error(response?.res_desc || "ไม่สามารถดึงข้อมูลได้");
        }
      } catch (error) {
        console.error("Error fetching complaint data:", error);
        setError(error.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router.query.data, propData]);

  // เพิ่มฟังก์ชันนี้ก่อน return statement
  const safeFormatThaiDateTime = (dateValue) => {
    if (!dateValue) return "-";

    try {
      let date;
      if (typeof dateValue === "string") {
        date = new Date(dateValue);
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        return "-";
      }

      if (isNaN(date.getTime())) {
        return "-";
      }

      // ใช้ formatThaiDateTime ที่ import มาแล้ว
      return formatThaiDateTime(date.toISOString());
    } catch (error) {
      console.error("Error formatting date:", error);
      return "-";
    }
  };

  const handleSubmit = async () => {
    if (!id) {
      alertError("ข้อผิดพลาด", "ไม่พบ ID เรื่องร้องทุกข์");
      return;
    }

    if (!formData) {
      alertError("ข้อผิดพลาด", "ไม่พบข้อมูลที่จะส่ง");
      return;
    }

    if (!userInfo) {
      alertError("ข้อผิดพลาด", "ไม่พบข้อมูลผู้ใช้");
      return;
    }

    setSubmitting(true);

    try {
      console.log("=== Preview Component: Calling handleUpdateAssignment ===");
      console.log("Complaint ID:", id);
      console.log("Form Data to be sent:", JSON.stringify(formData, null, 2));
      console.log("User Info:", userInfo);

      // เรียกใช้ handleUpdateAssignment จาก hook โดยตรง
      // hook จะทำการ prepare ข้อมูลเองภายใน
      await handleUpdateAssignment(id, formData, userInfo);

      alertSuccess(
        "บันทึกสำเร็จ",
        "ข้อมูลได้รับการบันทึกและดำเนินการเสร็จสิ้นแล้ว"
      );

      setTimeout(() => {
        // ไปหน้า website-complaints โดยตรง
        router.push("/admin/edit/website-complaints/");
      }, 1500);
    } catch (error) {
      console.error("Error submitting form:", error);
      alertError(
        "ข้อผิดพลาด",
        error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <>
        <BreadcrumbsService items={breadcrumbItems} />
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <Typography>กำลังโหลดข้อมูล...</Typography>
        </Box>
      </>
    );
  }

  if (error) {
    return (
      <>
        <BreadcrumbsService items={breadcrumbItems} />
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <Typography color="error" variant="h6" gutterBottom>
            เกิดข้อผิดพลาด
          </Typography>
          <Typography color="error" mb={2}>
            {error}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ID: {id}
          </Typography>
          {/* เพิ่มปุ่มกลับเมื่อเกิดข้อผิดพลาด */}
          <ButtonService
            label="กลับ"
            color="secondary"
            variant="outlined"
            onClick={handleBackClick}
            iconLeft={<ArrowBackIcon />}
            sx={{ mt: 2 }}
          />
        </Box>
      </>
    );
  }

  if (!formData) {
    return (
      <>
        <BreadcrumbsService items={breadcrumbItems} />
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <Typography color="error">ไม่พบข้อมูลที่ต้องการแสดง</Typography>
          {/* เพิ่มปุ่มกลับเมื่อไม่มีข้อมูล */}
          <ButtonService
            label="กลับ"
            color="secondary"
            variant="outlined"
            onClick={handleBackClick}
            iconLeft={<ArrowBackIcon />}
            sx={{ mt: 2 }}
          />
        </Box>
      </>
    );
  }

  const {
    step1 = {},
    step2 = {},
    step3 = {},
    step4 = {},
    updated_by,
    updated_at,
    created_at,
  } = formData;

  // ข้อมูลจาก step1 (ผู้ร้องทุกข์)
  const complainant = step1.general?.general || {};

  // ข้อมูลจาก step2 (ผู้ถูกร้องเรียน)
  const delegate = step2.general?.individual || {};
  console.log("delegate", delegate);
  // ข้อมูลจาก step3 (เรื่องร้องทุกข์)
  const complaint = step3.general || {};
  const files = complaint.attachment || [];

  // ข้อมูลจาก step4 (รายละเอียดเพิ่มเติม)
  const additionalDetails = step4.general || {};

  const InfoItem = ({ label, value }) => (
    <Grid item xs={12} sm={6}>
      <Typography fontSize={16}>
        <Box component="span" fontWeight="bold">
          {label}:
        </Box>{" "}
        {typeof value === "object" ? value?.label || "-" : value || "-"}
      </Typography>
    </Grid>
  );

  const getFileIcon = (ext) => {
    switch (ext.toLowerCase()) {
      case ".pdf":
        return <PictureAsPdfIcon sx={{ color: "#d32f2f", mr: 1 }} />;
      case ".doc":
      case ".docx":
        return <DescriptionIcon sx={{ color: "#1976d2", mr: 1 }} />;
      case ".jpg":
      case ".jpeg":
      case ".png":
        return <ImageIcon sx={{ color: "#388e3c", mr: 1 }} />;
      default:
        return <DescriptionIcon sx={{ color: "#757575", mr: 1 }} />;
    }
  };

  const getFileExt = (filename) => {
    return filename.slice(filename.lastIndexOf(".")).toLowerCase();
  };

  // แปลงขนาดไฟล์จาก bytes เป็น MB
  const formatFileSize = (bytes) => {
    return (bytes / (1024 * 1024)).toFixed(2);
  };

  // แปลงวันที่จาก ISO string เป็นรูปแบบไทย
  const formatDate = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = (date.getFullYear() + 543).toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  // Current user name for display
  const currentUserName = userInfo
    ? `${userInfo.first_name || ""} ${userInfo.last_name || ""}`.trim() ||
      "ผู้ใช้ไม่ระบุชื่อ"
    : "กำลังโหลด...";

  function splitThaiName(fullName) {
    if (!fullName) return { title: "-", firstName: "-", lastName: "-" };
    const parts = fullName.trim().split(" ");
    if (parts.length < 2) {
      return { title: "-", firstName: fullName, lastName: "-" };
    }
    const title = parts[0];
    const firstName = parts[1];
    const lastName = parts.length > 2 ? parts.slice(2).join(" ") : "-";
    return { title, firstName, lastName };
  }

  const complainantName = splitThaiName(complainant.name);
  const delegateName = splitThaiName(delegate?.name);

  return (
    <>
      <BreadcrumbsService items={breadcrumbItems} />
      <div ref={pdfRef}>
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              height: 40,
              background: "linear-gradient(to right, #EDC458, #FEFAEF)",
              borderTopRightRadius: 8,
              borderTopLeftRadius: 8,
            }}
          />
          <Paper sx={{ mt: -1, p: 4, borderRadius: 2 }}>
            {/* Title */}
            <Box display="flex" alignItems="center" mb={3}>
              <Image
                src="/logo_blue.png"
                alt="โลโก้"
                width={100}
                height={100}
                style={{ objectFit: "contain" }}
              />
              <Typography variant="h6" fontWeight="bold" ml={2}>
                แบบรับคำร้องเรียน / ร้องทุกข์กระทรวงการคลัง
              </Typography>
            </Box>

            {/* ข้อมูลหัวเรื่อง */}
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12}>
                <InfoItem
                  label="วันที่ร้องทุกข์"
                  value={formatThaiDate(created_at || updated_at)}
                />
                <InfoItem
                  label="ประเภทเรื่องร้องทุกข์"
                  value={complaint.complaintTypeName || "-"}
                />
                <InfoItem
                  label="ประเภทเรื่องย่อย"
                  value={complaint.complaintSubTypeName || "-"}
                />
                <InfoItem label="เรื่อง" value={complaint.subject || "-"} />
                <InfoItem
                  label="ช่องทางเรื่องร้องเรียน"
                  value={complaint.complaintChannelName || "-"}
                />
              </Grid>
            </Grid>

            <Box
              component="hr"
              sx={{
                border: "1px solid",
                height: "1px",
                backgroundColor: "#999",
                my: 3,
              }}
            />

            {/* ผู้ร้องทุกข์ */}
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              fontSize={20}
              gutterBottom
            >
              ข้อมูลผู้ร้องทุกข์
            </Typography>
            <Grid container spacing={2} mb={3}>
              <InfoItem
                label="หมายเลขประจำตัวประชาชน"
                value={formatCitizenId_null(complainant.idCard)}
              />
              <InfoItem label="คำนำหน้า" value={complainantName.title || "-"} />
              <InfoItem label="ชื่อ" value={complainantName.firstName || "-"} />
              <InfoItem
                label="นามสกุล"
                value={complainantName.lastName || "-"}
              />
              <InfoItem
                label="ที่อยู่ที่ติดต่อได้"
                value={complainant.address || "-"}
              />
              <InfoItem
                label="ตำบล/แขวง"
                value={complainant?.subdistricts?.label || "-"}
              />
              <InfoItem
                label="อำเภอ/เขต"
                value={complainant?.districts?.label || "-"}
              />
              <InfoItem label="จังหวัด" value={complainant.province || "-"} />
              <InfoItem
                label="รหัสไปรษณีย์"
                value={complainant.zipcode || "-"}
              />
              <InfoItem label="อีเมล" value={complainant.email || "-"} />
              <InfoItem
                label="หมายเลขโทรศัพท์"
                value={formatPhoneNumber_null(complainant.phone)}
              />
            </Grid>

            {delegate && Object.keys(delegate).length > 0 && (
              <>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  fontSize={18}
                  gutterBottom
                >
                  ผู้รับมอบอำนาจร้องเรียน
                </Typography>
                <Grid container spacing={2} mb={3}>
                  <InfoItem
                    label="หมายเลขประจำตัวประชาชน"
                    value={formatCitizenId_null(delegate.idCard)}
                  />
                  <InfoItem
                    label="คำนำหน้า"
                    value={delegateName.title || "-"}
                  />
                  <InfoItem
                    label="ชื่อ"
                    value={delegateName.firstName || "-"}
                  />
                  <InfoItem
                    label="นามสกุล"
                    value={delegateName.lastName || "-"}
                  />
                  <InfoItem
                    label="ที่อยู่ที่ติดต่อได้"
                    value={delegate.address || "-"}
                  />
                  <InfoItem
                    label="ตำบล/แขวง"
                    value={delegate.subdistrict || "-"}
                  />
                  <InfoItem
                    label="อำเภอ/เขต"
                    value={delegate.district || "-"}
                  />
                  <InfoItem label="จังหวัด" value={delegate.province || "-"} />
                  <InfoItem
                    label="รหัสไปรษณีย์"
                    value={delegate.zipcode || "-"}
                  />
                  <InfoItem label="อีเมล" value={delegate.email || "-"} />
                  <InfoItem
                    label="หมายเลขโทรศัพท์"
                    value={formatPhoneNumber_null(delegate.phone)}
                  />
                </Grid>
              </>
            )}

            <Box
              component="hr"
              sx={{
                border: "1px solid",
                height: "1px",
                backgroundColor: "#999",
                my: 3,
              }}
            />

            {/* ผู้ถูกร้องเรียน */}
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              fontSize={20}
              gutterBottom
            >
              ข้อมูลผู้ถูกร้องเรียน
            </Typography>
            <Grid container spacing={2} mb={3}>
              <InfoItem
                label="หมายเลขประจำตัวประชาชน"
                value={formatCitizenId_null(delegate.idCard)}
              />
              <InfoItem label="คำนำหน้า" value={delegate.title || "-"} />
              <InfoItem label="ชื่อ" value={delegate.firstName || "-"} />
              <InfoItem label="นามสกุล" value={delegate.lastName || "-"} />
              <InfoItem
                label="ที่อยู่ที่ติดต่อได้"
                value={delegate.address || "-"}
              />
              <InfoItem label="ตำบล/แขวง" value={delegate.subdistrict || "-"} />
              <InfoItem label="อำเภอ/เขต" value={delegate.district || "-"} />
              <InfoItem label="จังหวัด" value={delegate.province || "-"} />
              <InfoItem label="รหัสไปรษณีย์" value={delegate.zipcode || "-"} />
              <InfoItem label="อีเมล" value={delegate.email || "-"} />
              <InfoItem
                label="หมายเลขโทรศัพท์"
                value={formatPhoneNumber_null(delegate.phone)}
              />
            </Grid>

            <Box
              component="hr"
              sx={{
                border: "1px solid",
                height: "1px",
                backgroundColor: "#999",
                my: 3,
              }}
            />

            {/* ข้อมูลเรื่องร้องทุกข์ */}
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              fontSize={20}
              gutterBottom
            >
              ข้อมูลเรื่องร้องทุกข์
            </Typography>
            <Grid container spacing={2} mb={3}>
              <InfoItem
                label="เลข สป.กค."
                value={complaint.referenceNumber1 || "-"}
              />
              <InfoItem
                label="วันที่ สป.กค."
                value={formatDate(complaint.referenceDate1)}
              />
              <InfoItem
                label="เลข สป.สร."
                value={complaint.referenceNumber2 || "-"}
              />
              <InfoItem
                label="วันที่ สป.สร."
                value={formatDate(complaint.referenceDate2)}
              />
              <InfoItem
                label="เลข สตป."
                value={complaint.referenceNumber3 || "-"}
              />
              <InfoItem
                label="วันที่ สตป."
                value={formatDate(complaint.referenceDate3)}
              />
              <InfoItem
                label="เลข สรร. (สารบัญ)"
                value={complaint.referenceNumber4 || "-"}
              />
              <InfoItem
                label="วันที่ สรร."
                value={formatDate(complaint.referenceDate4)}
              />
              <InfoItem
                label="เลขที่หนังสือ"
                value={complaint.documentNumber || "-"}
              />
              <InfoItem
                label="วันที่หนังสือ"
                value={formatDate(complaint.documentDate)}
              />
              <InfoItem
                label="หน่วยงานอื่นที่ส่งเรื่องมา"
                value={complaint.senderAgency || "-"}
              />
              <InfoItem
                label="ชั้นความลับ"
                value={complaint.securityLevel || "-"}
              />
              <InfoItem
                label="ชั้นความเร่งด่วน"
                value={complaint.urgencyLevel || "-"}
              />
              <InfoItem
                label="ประเภทเรื่องร้องเรียน"
                value={complaint.complaintType || "-"}
              />
              <InfoItem
                label="วันและเวลาที่เกิดเหตุ"
                value={formatThaiDateTime(additionalDetails.incidentDateTime)}
              />
              <Grid item xs={12}>
                <InfoItem
                  label="รายละเอียดเรื่องร้องทุกข์"
                  value={additionalDetails.additionalDescription || "-"}
                />
              </Grid>
            </Grid>

            {/* วันที่รับเรื่องและเสนองาน */}
            <Grid container spacing={2} mb={3}>
              <InfoItem
                label="วันที่รับเรื่องของเจ้าพนักงาน"
                value={
                  complaint?.attachment?.[0]?.created_at
                    ? safeFormatThaiDateTime(complaint.attachment[0].created_at)
                    : "-"
                }
              />
              <InfoItem
                label="วันที่เสนองาน ผอ.สรร."
                value={
                  complaint?.incidentDate
                    ? safeFormatThaiDateTime(complaint.incidentDate)
                    : "-"
                }
              />
            </Grid>

            {/* ไฟล์แนบ */}
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              เอกสารประกอบการร้องทุกข์
            </Typography>
            <Box mb={3}>
              {files.length > 0 ? (
                files.map((file, index) => {
                  const ext = getFileExt(file.fileName || "");
                  const fileSizeMB = formatFileSize(file.fileSize);
                  const createdDate = formatDate(file.created_at);

                  return (
                    <Box
                      key={file.id || index}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        px: 2,
                        py: 1,
                        mb: 1,
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "#f5f5f5",
                        },
                      }}
                      onClick={() => window.open(file.fileUrl, "_blank")}
                    >
                      {getFileIcon(ext)}
                      <Typography fontSize={14} color="text.secondary">
                        {file.fileName} {fileSizeMB} MB ({createdDate})
                      </Typography>
                    </Box>
                  );
                })
              ) : (
                <Typography fontSize={14}>ไม่มีไฟล์แนบ</Typography>
              )}
            </Box>

            <Typography fontSize={16} mb={2}>
              ข้าพเจ้าขอรับรองว่าข้อเท็จจริงที่ได้ยื่นเรื่องร้องเรียน/ร้องทุกข์ข้างต้นเป็นความจริงทุกประการ
            </Typography>
            <Typography fontSize={16} mb={3}>
              หมายเหตุ : เอกสารฉบับนี้ไม่สามารถนำไปใช้อ้างอิงเอกสารอื่น
            </Typography>

            <Box
              component="hr"
              sx={{
                border: "1px solid",
                height: "1px",
                backgroundColor: "#999",
                my: 3,
              }}
            />

            {/* ลงชื่อผู้ร้องทุกข์ */}
            <Grid container spacing={2} mb={3}>
              <Grid item xs={6}>
                <Typography fontSize={16} fontWeight="bold">
                  ลงชื่อผู้ร้องทุกข์: {complainant.firstName}{" "}
                  {complainant.lastName}
                </Typography>
                <Typography fontSize={14} color="text.secondary">
                  วันที่: {formatThaiDate(created_at || updated_at)}
                </Typography>
              </Grid>
              {delegate && Object.keys(delegate).length > 0 && (
                <Grid item xs={6}>
                  <Typography fontSize={16} fontWeight="bold">
                    ลงชื่อผู้รับมอบอำนาจ: {delegate.firstName}{" "}
                    {delegate.lastName}
                  </Typography>
                  <Typography fontSize={14} color="text.secondary">
                    วันที่: {formatThaiDate(created_at || updated_at)}
                  </Typography>
                </Grid>
              )}
            </Grid>

            <Grid container spacing={2} mb={3}>
              <Grid item xs={6}>
                <Typography fontSize={16} fontWeight="bold">
                  ลงชื่อเจ้าหน้าที่บันทึกข้อมูล: {currentUserName}
                </Typography>
                <Typography fontSize={14} color="text.secondary">
                  วันที่: {formatThaiDate(new Date().toISOString())}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </div>

      {/* Action Buttons */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "center",
          alignItems: "center",
          marginTop: 4,
          gap: 2,
        }}
      >
        {/* เพิ่มปุ่มกลับ */}
        <ButtonService
          label="กลับ"
          color="secondary"
          variant="outlined"
          onClick={handleBackClick}
          disabled={submitting || isSubmitting}
          iconLeft={<ArrowBackIcon />}
        />
        <ButtonService
          label={submitting || isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
          color="ยืนยัน"
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || isSubmitting}
          iconRight={<CheckIcon />}
        />
        <ButtonService
          label="ส่งออก"
          color="ส่งออก"
          variant="contained"
          onClick={() => exportElementToPDF(pdfRef, "แบบฟอร์มร้องทุกข์.pdf")}
          disabled={submitting || isSubmitting}
          iconRight={<CheckIcon />}
        />
      </Box>
    </>
  );
};

export default SearchComplaintsPreview;
