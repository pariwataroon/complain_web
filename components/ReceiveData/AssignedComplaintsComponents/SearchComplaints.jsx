import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Box, Paper, Typography, Grid } from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import ImageIcon from "@mui/icons-material/Image";
import Image from "next/image";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import ButtonService from "@services/ButtonService/ButtonService";
import {
  GetComplaintByID,
  ConfirmAssignment,
} from "@pages/api/complaint/complaint";
import {
  formatThaiDate,
  formatThaiDateTime,
  formatPhoneNumber_null,
  formatCitizenId_null,
  formatThaiFullDate,
} from "@utils/Formats";
import {
  showLoading,
  closeAlert,
  alertError,
  alertSuccess,
  showConfirm,
} from "@utils/Alerts";

const InfoItem = ({ label, value }) => (
  <Grid item xs={12} sm={6}>
    <Typography fontSize={16}>
      <Box component="span" fontWeight="bold">
        {label}  :
      </Box>
      {typeof value === "object" ? value?.label || "-" : value || "-"}
    </Typography>
  </Grid>
);

function getSecurityLevelThai(level) {
  switch (level) {
    case "normal":
      return "ปกติ";
    case "confidential":
      return "ลับ";
    case "secret":
      return "ลับมาก";
    case "top_secret":
      return "ลับที่สุด";
    default:
      return "-";
  }
}

function getUrgencyLevelThai(level) {
  switch (level) {
    case "low":
      return "ปกติ";
    case "medium":
      return "เร่งด่วน";
    case "high":
      return "ด่วน";
    case "urgent":
      return "ด่วนมาก";
    case "critical":
      return "ด่วนที่สุด";
    default:
      return "-";
  }
}

const SearchComplaints = () => {
  const { id } = useRouter().query;
  const [complaintData, setComplaintData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchComplaintData = async () => {
      if (id) {
        setLoading(true);
        const data = await GetComplaintByID(id);
        if (data && data.res_code === "0000") {
          setComplaintData(data.res_data);
        }
        setLoading(false);
      }
    };
    fetchComplaintData();
  }, [id]);

  const handleGoBack = () => {
    router.push("/admin/edit/assigned-complaints/");
  };

  const handleSave = async () => {
    const isConfirmed = await showConfirm(
      "ยืนยันการบันทึก",
      "คุณต้องการยืนยันรับงานนี้หรือไม่?",
      "ยืนยัน",
      "ยกเลิก"
    );

    if (isConfirmed) {
      try {
        showLoading("กำลังบันทึกข้อมูล...");

        const result = await ConfirmAssignment(
          id,
          "ยืนยันรับงานร้องทุกข์กระทรวงการคลัง"
        );

        closeAlert();

        if (result && result.res_code === "0000") {
          await alertSuccess("สำเร็จ", "บันทึกข้อมูลเรียบร้อยแล้ว");
          router.push("/admin/edit/assigned-complaints/");
        } else if (result && result.res_code === "4000") {
          // จัดการกรณี error 4000 - ยืนยันไปแล้ว
          const errorData = result.res_data;
          let errorMessage = "ไม่สามารถบันทึกข้อมูลได้";

          if (errorData && errorData.error) {
            // แปลงเวลาจาก "2025-08-18 17:49" เป็นรูปแบบไทย
            const timeMatch = errorData.error.match(
              /(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/
            );
            if (timeMatch) {
              const dateTime = new Date(timeMatch[1]);
              const thaiDateTime = formatThaiDateTime(dateTime.toISOString());
              errorMessage = errorData.error.replace(
                timeMatch[1],
                thaiDateTime
              );
            } else {
              errorMessage = errorData.error;
            }
          }

          alertError("เกิดข้อผิดพลาด", errorMessage);
        } else {
          alertError("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้");
        }
      } catch (error) {
        closeAlert();
        console.error("Error saving:", error);

        // จัดการ error response จาก API
        if (error.response && error.response.data) {
          const errorData = error.response.data;

          if (
            errorData.res_code === "4000" &&
            errorData.res_data &&
            errorData.res_data.error
          ) {
            let errorMessage = errorData.res_data.error;

            const timeMatch = errorMessage.match(
              /(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/
            );
            if (timeMatch) {
              const dateTime = new Date(timeMatch[1]);
              const thaiDateTime = formatThaiDateTime(dateTime.toISOString());
              errorMessage = errorMessage.replace(timeMatch[1], thaiDateTime);
            }

            alertError("เกิดข้อผิดพลาด", errorMessage);
          } else {
            alertError("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้");
          }
        } else {
          alertError("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้");
        }
      }
    }
  };

  const complaint = complaintData || {};
  const complainant = complaint.step1?.general?.general || {};
  const delegate = complaint.step2?.general || {};
  const complaintDetails = complaint.step3?.general || {};
  const files = complaintDetails.attachment || [];

  const isComplainantCorporate = false;

  // ตรวจสอบข้อมูลผู้ถูกร้อง จาก step2
  const respondentData = complaint.step2?.general;
  const respondentType = respondentData?.activeType || "individual";
  const respondent = respondentData?.[respondentType] || {};

  const breadcrumbItems = [
    {
      label: "เรื่องร้องเรียนที่ได้รับมอบหมาย",
      url: "/admin/edit/assigned-complaints/",
      icon: (
        <img
          src="/icons/Pencil.png"
          alt="pencil"
          style={{ width: 24, height: 24, marginBottom: -8 }}
        />
      ),
    },
    {
      label: "แบบรับคำร้องเรียนผ่านเว็บไซต์กระทรวงการคลัง",
      url: id
        ? `/admin/edit/assigned-complaints/${id}`
        : "/admin/edit/assigned-complaints/",
    },
    { label: id },
  ];

  const renderRespondentFields = () => {
    // เช็คว่ามีข้อมูลผู้ถูกร้องหรือไม่
    if (
      !respondentData ||
      respondent.category === "NO_DATA_PROVIDED" ||
      !respondent ||
      Object.keys(respondent).length === 0
    ) {
      return (
        <Grid item xs={12}>
          <Typography fontSize={16} color="text.secondary">
            ไม่มีข้อมูลผู้ถูกร้อง
          </Typography>
        </Grid>
      );
    }

    if (respondentType === "individual") {
      return (
        <>
          <InfoItem
            label="หมายเลขบัตรประชาชน"
            value={formatCitizenId_null(respondent.idCard)}
          />
          <InfoItem label="ชื่อ - นามสกุล" value={respondent.name} />
          <InfoItem
            label="ที่อยู่ที่สามารถติดต่อได้"
            value={respondent.address}
          />
          <InfoItem label="จังหวัด" value={respondent.province} />
          <InfoItem label="อำเภอ/เขต" value={respondent.districts} />
          <InfoItem label="ตำบล/แขวง" value={respondent.subdistricts} />
          <InfoItem label="รหัสไปรษณีย์" value={respondent.zipcode} />
          <InfoItem
            label="หมายเลขโทรศัพท์"
            value={formatPhoneNumber_null(respondent.phone)}
          />
          <InfoItem label="อีเมล" value={respondent.email} />
        </>
      );
    }
    if (respondentType === "corporate") {
      return (
        <>
          <InfoItem label="เลขทะเบียนนิติบุคคล" value={respondent.idCard} />
          <InfoItem label="ชื่อบริษัท/องค์กร" value={respondent.companyName} />
          <InfoItem
            label="ชื่อผู้มีอำนาจลงนาม"
            value={respondent.signatoryName}
          />
          <InfoItem
            label="ที่อยู่บริษัท/องค์กรที่ติดต่อได้"
            value={respondent.address}
          />
          <InfoItem label="จังหวัด" value={respondent.province} />
          <InfoItem label="อำเภอ/เขต" value={respondent.districts} />
          <InfoItem label="ตำบล/แขวง" value={respondent.subdistricts} />
          <InfoItem label="รหัสไปรษณีย์" value={respondent.zipcode} />
          <InfoItem
            label="หมายเลขโทรศัพท์"
            value={formatPhoneNumber_null(respondent.phone)}
          />
          <InfoItem label="อีเมล" value={respondent.email} />
        </>
      );
    }
    if (respondentType === "government") {
      return (
        <>
          <InfoItem
            label="หมายเลขบัตรประชาชน"
            value={formatCitizenId_null(respondent.idCard)}
          />
          <InfoItem label="หน่วยงาน" value={respondent.agencyName} />
          <InfoItem
            label="ชื่อ - นามสกุล"
            value={respondent.fullName}
          />
          <InfoItem
            label="ที่อยู่หน่วยงานที่ติดต่อได้"
            value={respondent.address}
          />
          <InfoItem label="จังหวัด" value={respondent.province} />
          <InfoItem label="อำเภอ/เขต" value={respondent.districts} />
          <InfoItem label="ตำบล/แขวง" value={respondent.subdistricts} />
          <InfoItem label="รหัสไปรษณีย์" value={respondent.zipcode} />
          <InfoItem
            label="หมายเลขโทรศัพท์"
            value={formatPhoneNumber_null(respondent.phone)}
          />
          <InfoItem label="อีเมล" value={respondent.email} />
        </>
      );
    }
    return null;
  };

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
    return filename.substring(filename.lastIndexOf("."));
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <>
      <BreadcrumbsService items={breadcrumbItems} />
      <Box>
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
              แบบรับคำร้องเรียนผ่านเว็บไซต์กระทรวงการคลัง
            </Typography>
          </Box>

          {/* ข้อมูลหัวเรื่อง */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12}>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Box flex={1} minWidth={280}>
                  <InfoItem label="วันที่ร้องทุกข์" value={formatThaiDate()} />
                </Box>
                <Box flex={1} minWidth={280}>
                  <InfoItem
                    label="ช่องทางเรื่องร้องเรียน"
                    value={complaint.channel || data?.assignment_form?.complaint_channel_name}
                  />
                </Box>
              </Box>
              <InfoItem
                label="ประเภทเรื่องร้องทุกข์"
                value={complaintDetails.complaintType}
              />
              <InfoItem label="เรื่อง" value={complaintDetails.subject} />
              <Typography fontSize={16} fontWeight="bold">
                เรียนปลัดกระทรวงการคลัง
              </Typography>
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

          {/* ผู้ร้อง */}
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            fontSize={20}
            gutterBottom
          >
            ข้อมูลผู้ร้องทุกข์
          </Typography>
          <Grid container spacing={2} mb={3}>
            {!isComplainantCorporate ? (
              <>
                <InfoItem
                  label="หมายเลขประจำตัวประชาชน"
                  value={formatCitizenId_null(complainant.idCard)}
                />
                <InfoItem label="ชื่อ - นามสกุล" value={complainant.name} />
                <InfoItem
                  label="ที่อยู่ที่ติดต่อได้"
                  value={complainant.address}
                />
                <InfoItem label="จังหวัด" value={complainant.province} />
                <InfoItem label="อำเภอ/เขต" value={complainant.districts} />
                <InfoItem label="ตำบล/แขวง" value={complainant.subdistricts} />
                <InfoItem label="รหัสไปรษณีย์" value={complainant.zipcode} />
                <InfoItem label="อีเมล" value={complainant.email} />
                <InfoItem
                  label="หมายเลขโทรศัพท์"
                  value={formatPhoneNumber_null(complainant.phone)}
                />
              </>
            ) : (
              <>
                <InfoItem
                  label="เลขทะเบียนนิติบุคคล"
                  value={complainant.idCard}
                />
                <InfoItem
                  label="ชื่อบริษัท/องค์กร"
                  value={complainant.companyName}
                />
                <InfoItem
                  label="ที่อยู่บริษัท/องค์กรที่ติดต่อได้"
                  value={complainant.address}
                />
                <InfoItem label="จังหวัด" value={complainant.province} />
                <InfoItem label="อำเภอ/เขต" value={complainant.districts} />
                <InfoItem label="ตำบล/แขวง" value={complainant.subdistricts} />
                <InfoItem label="รหัสไปรษณีย์" value={complainant.zipcode} />
                <InfoItem label="อีเมล" value={complainant.email} />
                <InfoItem
                  label="หมายเลขโทรศัพท์"
                  value={formatPhoneNumber_null(complainant.phone)}
                />
              </>
            )}
          </Grid>

          {/* ผู้รับมอบอำนาจร้องเรียน */}
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            ผู้รับมอบอำนาจร้องเรียน
          </Typography>
          <Grid container spacing={2} mb={3}>
            {delegate.activeType === "individual" &&
            delegate.individual?.category !== "NO_DATA_PROVIDED" ? (
              <>
                <InfoItem
                  label="หมายเลขประจำตัวประชาชน"
                  value={formatCitizenId_null(delegate.individual?.idCard)}
                />
                <InfoItem
                  label="ชื่อ - นามสกุล"
                  value={delegate.individual?.name}
                />
                <InfoItem
                  label="ที่อยู่ที่ติดต่อได้"
                  value={delegate.individual?.address}
                />
                <InfoItem
                  label="จังหวัด"
                  value={delegate.individual?.province}
                />
                <InfoItem
                  label="อำเภอ/เขต"
                  value={delegate.individual?.districts}
                />
                <InfoItem
                  label="ตำบล/แขวง"
                  value={delegate.individual?.subdistricts}
                />
                <InfoItem
                  label="รหัสไปรษณีย์"
                  value={delegate.individual?.zipcode}
                />
                <InfoItem label="อีเมล" value={delegate.individual?.email} />
                <InfoItem
                  label="หมายเลขโทรศัพท์"
                  value={formatPhoneNumber_null(delegate.individual?.phone)}
                />
              </>
            ) : delegate.activeType === "corporate" &&
              delegate.corporate?.category !== "NO_DATA_PROVIDED" ? (
              <>
                <InfoItem
                  label="หมายเลขประจำตัวประชาชน"
                  value={formatCitizenId_null(delegate.corporate?.idCard)}
                />
                <InfoItem
                  label="ชื่อผู้มีอำนาจลงนาม"
                  value={delegate.corporate?.signatoryName}
                />
                <InfoItem
                  label="ที่อยู่ที่ติดต่อได้"
                  value={delegate.corporate?.address}
                />
                <InfoItem
                  label="จังหวัด"
                  value={delegate.corporate?.province}
                />
                <InfoItem
                  label="อำเภอ/เขต"
                  value={delegate.corporate?.districts}
                />
                <InfoItem
                  label="ตำบล/แขวง"
                  value={delegate.corporate?.subdistricts}
                />
                <InfoItem
                  label="รหัสไปรษณีย์"
                  value={delegate.corporate?.zipcode}
                />
                <InfoItem label="อีเมล" value={delegate.corporate?.email} />
                <InfoItem
                  label="หมายเลขโทรศัพท์"
                  value={formatPhoneNumber_null(delegate.corporate?.phone)}
                />
              </>
            ) : (
              <Grid item xs={12}>
                <Typography fontSize={16} color="text.secondary">
                  ไม่มีข้อมูลผู้รับมอบอำนาจ
                </Typography>
              </Grid>
            )}
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

          {/* ผู้ถูกร้อง */}
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            fontSize={20}
            gutterBottom
          >
            ข้อมูลผู้ถูกร้อง (ข้อมูลจากผู้ร้องทุกข์)
          </Typography>
          <Grid container spacing={2} mb={3}>
            {renderRespondentFields()}
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
          <Typography variant="subtitle1" fontWeight="bold" fontSize={20}>
            ข้อมูลเรื่องร้องทุกข์
          </Typography>
          <Grid container spacing={2} mb={3}>
            <InfoItem
              label="เลข สป.กค."
              value={complaint.assignment_form?.reference_number || "-"}
            />
            <InfoItem
              label="วันที่ สป.กค."
              value={formatThaiFullDate(
                complaint.assignment_form?.reference_date
              )}
            />
            <InfoItem
              label="เลข สป.สร."
              value={complaint.assignment_form?.reference_number2 || "-"}
            />
            <InfoItem
              label="วันที่ สป.สร."
              value={formatThaiFullDate(
                complaint.assignment_form?.reference_date2
              )}
            />
            <InfoItem
              label="เลข สตป."
              value={complaint.assignment_form?.reference_number3 || "-"}
            />
            <InfoItem
              label="วันที่ สตป."
              value={formatThaiFullDate(
                complaint.assignment_form?.reference_date3
              )}
            />
            <InfoItem
              label="เลข สรร. (สารบัญ)"
              value={
                complaint.assignment_form?.reference_number4 ||
                complaint.complaint_number ||
                "-"
              }
            />
            <InfoItem
              label="วันที่ สรร."
              value={formatThaiFullDate(
                complaint.assignment_form?.reference_date4
              )}
            />
            <InfoItem
              label="เลขที่หนังสือ"
              value={complaint.assignment_form?.document_number || "-"}
            />
            <InfoItem
              label="วันที่หนังสือ"
              value={formatThaiFullDate(
                complaint.assignment_form?.document_date
              )}
            />
            <InfoItem
              label="หน่วยงานอื่นที่ส่งเรื่องมา"
              value={complaint.assignment_form?.agency_sender || "-"}
            />
            <InfoItem
              label="ชั้นความลับ"
              value={getSecurityLevelThai(
                complaint.assignment_form?.confidentiality_level
              )}
            />
            <InfoItem
              label="ชั้นความเร่งด่วน"
              value={getUrgencyLevelThai(
                complaint.assignment_form?.urgency_level
              )}
            />
            <InfoItem
              label="ประเภทเรื่องร้องเรียน"
              value={complaint.assignment_form?.complaint_type_name || "-"}
            />
            <InfoItem
              label="วันและเวลาที่เกิดเหตุ"
              value={formatThaiDateTime(complaintDetails.incidentDate)}
            />
            <Grid item xs={12}>
              <InfoItem
                label="รายละเอียดเรื่องร้องทุกข์"
                value={complaintDetails.description}
              />
            </Grid>
          </Grid>

          {/* ไฟล์แนบ */}
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            เอกสารประกอบการร้องทุกข์
          </Typography>
          <Box mb={3}>
            {files.length > 0 ? (
              files.map((file, index) => {
                const ext = getFileExt(file.fileName || "");
                const fileSizeMB = (file.fileSize / (1024 * 1024)).toFixed(2);

                const formatDate = (isoString) => {
                  const date = new Date(isoString);
                  const day = date.getDate().toString().padStart(2, "0");
                  const month = (date.getMonth() + 1)
                    .toString()
                    .padStart(2, "0");
                  const year = (date.getFullYear() + 543).toString().slice(-2);
                  return `${day}/${month}/${year}`;
                };

                const baseUrl =
                  process.env.NEXT_PUBLIC_UPLOADS_BASE_URL?.replace(
                    /\/$/,
                    ""
                  ) || "";
                const fileUrl = file.fileUrl?.startsWith("http")
                  ? file.fileUrl
                  : `${baseUrl}/${file.fileUrl?.replace(/^\//, "") || ""}`;

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
                    component="a"
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    {getFileIcon(ext)}
                    <Typography fontSize={14} color="text.secondary">
                      {file.fileName} {fileSizeMB} MB (
                      {formatDate(file.created_at)})
                    </Typography>
                  </Box>
                );
              })
            ) : (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  px: 2,
                  py: 1,
                  mb: 1,
                }}
              >
                <DescriptionIcon sx={{ color: "#757575", mr: 1 }} />
                <Typography fontSize={14}>ไม่มีเอกสารประกอบ</Typography>
              </Box>
            )}
          </Box>
          <Typography fontSize={16}>
            ข้าพเจ้าขอรับรองว่าข้อเท็จจริงที่ได้ยื่นเรื่องร้องเรียน/ร้องทุกข์ข้างต้นเป็นความจริงทุกประการ
          </Typography>
          <Typography fontSize={16}>
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
            <InfoItem
              label="ลงชื่อผู้ร้องทุกข์"
              value={complainant.name || complainant.companyName}
            />
            <InfoItem
              label="ลงชื่อผู้รับมอบอำนาจ"
              value={
                delegate.individual?.name || delegate.corporate?.signatoryName
              }
            />
            <InfoItem
              label="เจ้าหน้าที่ผู้รับผิดชอบ"
              value={
                complaint.assignment_form?.assigned_to ||
                complaint.assigned_to ||
                "-"
              }
            />
            <InfoItem
              label="วันที่เริ่มรับผิดชอบเจ้าหน้าที่"
              value={formatThaiDate(complaint.assignment_form.assigned_date || "-")}
            />
          </Grid>
        </Paper>
      </Box>
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
        <ButtonService
          label="ย้อนกลับ"
          color="secondary"
          variant="outlined"
          onClick={handleGoBack}
        />
        <ButtonService
          label="บันทึก"
          color="ยืนยัน"
          variant="contained"
          onClick={handleSave}
        />
      </Box>
    </>
  );
};

export default SearchComplaints;
