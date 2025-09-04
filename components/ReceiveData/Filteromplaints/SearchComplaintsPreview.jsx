import React, { useState, useEffect, useRef, useMemo } from "react";
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
  formatThaiFullDate,
  formatThaiFullDateTime,
} from "@utils/Formats";
import CheckIcon from "@mui/icons-material/Check";
import { exportElementToPDF } from "@utils/exportPDF";
import {
  showLoading,
  closeAlert,
  alertError,
  alertSuccess,
  showConfirm,
} from "@utils/Alerts";
import useFilteromplaintsPreview from "@hooks/admin/websitecomplaints/useFilteromplaintsPreview";
import {
  GetAllSelectComplaintTypes,
  UsersSearchByRole,
} from "@pages/api/allselect/allselect";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const DATA_SESSION_KEY = "complaintsPreviewData";

const SearchComplaintsPreview = ({ data, onBack }) => {
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(DATA_SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setPreviewData(parsed);
      setFormData(parsed); // สำคัญตรงนี้
      console.log("set previewData and formData from sessionStorage");
    } else if (data) {
      sessionStorage.setItem(DATA_SESSION_KEY, JSON.stringify(data));
      setPreviewData(data);
      setFormData(data); // สำคัญตรงนี้
      console.log(
        "set sessionStorage, previewData and formData from props.data (first enter)"
      );
    }
  }, []);

  const router = useRouter();

  const id = useMemo(() => {
    if (router.query.id) {
      return router.query.id;
    }

    if (router.query.previewData) {
      try {
        const parsedData = JSON.parse(router.query.previewData);
        return parsedData.id;
      } catch (error) {
        console.error("Error parsing query previewData:", error);
        return null;
      }
    }

    return null;
  }, [router.query.id, router.query.previewData]);

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [complaintTypes, setComplaintTypes] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [groupedStaffUsers, setGroupedStaffUsers] = useState({}); 
  const pdfRef = useRef();

  const { handleUpdateAssignment, isSubmitting, preparedFormData } =
    useFilteromplaintsPreview();

  const handleBreadcrumbClick = (url) => {
    sessionStorage.removeItem(DATA_SESSION_KEY);
    if (url) {
      router.push(url);
    }
  };

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
      onClick: () => handleBreadcrumbClick(), // ไม่ไปไหน
    },
    {
      label: "สืบค้นเรื่องร้องเรียน",
      url: "/admin/edit/search",
      onClick: () => handleBreadcrumbClick("/admin/edit/search"),
    },
    {
      label: "คัดกรองเรื่องร้องเรียน",
      url: "/admin/edit/search/Filteromplaints",
      onClick: () =>
        handleBreadcrumbClick("/admin/edit/search/Filteromplaints"),
    },
    {
      label: "แบบรับคำร้องเรียน / ร้องทุกข์กระทรวง",
      url: id
        ? `/admin/edit/search/Filteromplaints/${id}`
        : "/admin/edit/website-complaints/SearchComplaints",
      onClick: () =>
        handleBreadcrumbClick(
          id
            ? `/admin/edit/search/Filteromplaints/${id}`
            : "/admin/edit/website-complaints/SearchComplaints"
        ),
    },
    { label: "ตัวอย่างเอกสาร", onClick: () => {} }, // ไม่มี url
  ];

  // เพิ่ม useEffect สำหรับดึงข้อมูล complaint types
  useEffect(() => {
    const fetchComplaintTypes = async () => {
      try {
        const response = await GetAllSelectComplaintTypes();
        if (response?.res_code === "0000") {
          const activeTypes = response.res_data
            .filter((t) => t.is_active)
            .map((t) => ({ value: t.id, label: t.name }));
          setComplaintTypes(activeTypes);
        }
      } catch (err) {
        console.error("Error fetching complaint types:", err);
      }
    };
    fetchComplaintTypes();
  }, []);

  // เพิ่ม useEffect สำหรับดึงข้อมูล staff users
  useEffect(() => {
    const fetchStaffUsers = async () => {
      try {
        const users = await UsersSearchByRole();

        const filteredUsers = users.filter(user => {
          const roleDescription = user.roles?.[0]?.role_description;
          return roleDescription !== "กลุ่มที่ 1 : ประชาชน";
        });

        const groupedUsers = filteredUsers.reduce((groups, user) => {
          const roleDescription = user.roles?.[0]?.role_description || "ไม่ระบุกลุ่ม";

          if (!groups[roleDescription]) {
            groups[roleDescription] = [];
          }
          groups[roleDescription].push(user);
          return groups;
        }, {});

        const sortedGroups = Object.keys(groupedUsers).sort().reduce((obj, key) => {
          obj[key] = groupedUsers[key].sort((a, b) => a.label.localeCompare(b.label));
          return obj;
        }, {});

        setStaffUsers(filteredUsers);
        setGroupedStaffUsers(sortedGroups);

      } catch (err) {
        console.error("Error fetching staff users:", err);
      }
    };
    fetchStaffUsers();
  }, []);

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
    if (previewData) {
      setFormData(previewData);
      setLoading(false);
    }
  }, [previewData]);

  function prepareFormDataForAssignment(formData, dataFromProps) {
    // ใช้ dataFromProps เป็นหลัก
    const baseData = dataFromProps || formData || {};
    const step4General = baseData?.step4?.general || {};

    // ดึง responsibleOfficer จาก previewData จาก props
    let ro = step4General.responsibleOfficer;
    let responsibleOfficerValue = "";
    if (typeof ro === "object" && ro !== null) {
      responsibleOfficerValue = ro.id || ro.value || "";
    } else if (typeof ro === "string") {
      responsibleOfficerValue = ro;
    }
    console.log("DEBUG responsibleOfficer raw:", ro);
    console.log(
      ">> responsibleOfficerId (before submit):",
      responsibleOfficerValue
    );

    // ดึง complaintTypeId จาก props (root level)
    const complaintTypeId = baseData.complaintTypeId || "";

    return {
      ...baseData,
      complaintTypeId, // แนบไว้ที่ root ส่งไป backend
      step4: {
        ...baseData.step4,
        general: {
          ...step4General,
          responsibleOfficer: responsibleOfficerValue,
          responsibleOfficerId: responsibleOfficerValue,
        },
      },
    };
  }

  const handleSubmit = async () => {
    if (!id) {
      alertError("ข้อผิดพลาด", "ไม่พบ ID เรื่องร้องทุกข์");
      return;
    }

    if (!formData && !previewData) {
      alertError("ข้อผิดพลาด", "ไม่พบข้อมูลที่จะส่ง");
      return;
    }

    if (!userInfo) {
      alertError("ข้อผิดพลาด", "ไม่พบข้อมูลผู้ใช้");
      return;
    }

    // เตรียมข้อมูลก่อนส่ง โดย responsibleOfficerId = assigned_officer_id ที่จะถูกใช้ใน preparedData
    // ลองใช้ formData ถ้าไม่มีให้ fallback ไป previewData (prop)
    const preparedFormData = prepareFormDataForAssignment(
      formData || previewData,
      previewData
    );

    setSubmitting(true);

    try {
      await handleUpdateAssignment(id, preparedFormData, userInfo);

      alertSuccess(
        "บันทึกสำเร็จ",
        "ข้อมูลได้รับการบันทึกและดำเนินการเสร็จสิ้นแล้ว"
      );

      setTimeout(() => {
        router.push("/admin/edit/website-complaints");
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
  // เพิ่มฟังก์ชันแปลงรหัสเป็นภาษาไทย
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

  function splitThaiName(fullName) {
    if (!fullName) return { title: "", firstName: "", lastName: "" };
    const parts = fullName.trim().split(" ");
    if (parts.length >= 3) {
      // ชื่อนามสกุล + คำนำหน้า (ที่มีช่องว่าง เช่น "ดร. สมชาย ใจดี")
      return {
        title: parts[0],
        firstName: parts[1],
        lastName: parts.slice(2).join(" "),
      };
    }
    if (parts.length === 2) {
      // คำนำหน้า ชื่อ-นามสกุล
      return {
        title: parts[0],
        firstName: parts[1],
        lastName: "",
      };
    }
    return {
      title: "",
      firstName: fullName,
      lastName: "",
    };
  }
  // ข้อมูลจาก step1 (ผู้ร้องทุกข์)
  const complainant = step1.general?.general || {};

  const { title, firstName, lastName } = splitThaiName(complainant.name);
  const delegate = step1.general?.delegate || {};
  const {
    title: delegateTitle,
    firstName: delegateFirstName,
    lastName: delegateLastName,
  } = splitThaiName(delegate.name);

  // ข้อมูลจาก step2 (ผู้ถูกร้องเรียน)
  const respondent = step2.general?.individual || {};

  const {
    title: respondentTitle,
    firstName: respondentFirstName,
    lastName: respondentLastName,
  } = splitThaiName(respondent.name);
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

  // Current user name for display
  const currentUserName = userInfo
    ? `${userInfo.first_name || ""} ${userInfo.last_name || ""}`.trim() ||
      "ผู้ใช้ไม่ระบุชื่อ"
    : "กำลังโหลด...";

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
                  value={previewData.complaintTypeLabel || "-"}
                />
                <InfoItem
                  label="ประเภทเรื่องย่อย"
                  value={previewData.complaintSubTypeLabel || "-"}
                />
                <InfoItem label="เรื่อง" value={complaint.subject || "-"} />
                <InfoItem
                  label="ช่องทางเรื่องร้องเรียน"
                  value={previewData.step3.general.complaintChannel || "-"}
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
              <InfoItem label="คำนำหน้า" value={title || "-"} />
              <InfoItem label="ชื่อ" value={firstName || "-"} />
              <InfoItem label="นามสกุล" value={lastName || "-"} />
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

            {/* ผู้รับมอบอำนาจร้องเรียน */}
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
                  <InfoItem label="คำนำหน้า" value={delegateTitle || "-"} />
                  <InfoItem label="ชื่อ" value={delegateFirstName || "-"} />
                  <InfoItem label="นามสกุล" value={delegateLastName || "-"} />
                  <InfoItem
                    label="ที่อยู่ที่ติดต่อได้"
                    value={delegate.address || "-"}
                  />
                  <InfoItem
                    label="ตำบล/แขวง"
                    value={delegate?.subdistricts?.label || "-"}
                  />
                  <InfoItem
                    label="อำเภอ/เขต"
                    value={delegate?.districts?.label || "-"}
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
                value={formatCitizenId_null(respondent.idCard)}
              />
              <InfoItem label="คำนำหน้า" value={respondentTitle || "-"} />
              <InfoItem label="ชื่อ" value={respondentFirstName || "-"} />
              <InfoItem label="นามสกุล" value={respondentLastName || "-"} />
              <InfoItem
                label="ที่อยู่ที่ติดต่อได้"
                value={respondent.address || "-"}
              />
              <InfoItem
                label="ตำบล/แขวง"
                value={respondent?.subdistricts?.label || "-"}
              />
              <InfoItem
                label="อำเภอ/เขต"
                value={respondent?.districts?.label || "-"}
              />
              <InfoItem
                label="จังหวัด"
                value={respondent?.province?.label || "-"}
              />
              <InfoItem
                label="รหัสไปรษณีย์"
                value={respondent.zipcode || "-"}
              />
              <InfoItem label="อีเมล" value={respondent.email || "-"} />
              <InfoItem
                label="หมายเลขโทรศัพท์"
                value={formatPhoneNumber_null(respondent.phone)}
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
                value={formatThaiFullDate(complaint.referenceDate1)}
              />
              <InfoItem
                label="เลข สป.สร."
                value={complaint.referenceNumber2 || "-"}
              />
              <InfoItem
                label="วันที่ สป.สร."
                value={formatThaiFullDate(complaint.referenceDate2) || "-"}
              />
              <InfoItem
                label="เลข สตป."
                value={complaint.referenceNumber3 || "-"}
              />
              <InfoItem
                label="วันที่ สตป."
                value={formatThaiFullDate(complaint.referenceDate3)}
              />
              <InfoItem
                label="เลข สรร. (สารบัญ)"
                value={complaint.referenceNumber4 || "-"}
              />
              <InfoItem
                label="วันที่ สรร."
                value={formatThaiFullDate(complaint.referenceDate4)}
              />
              <InfoItem
                label="เลขที่หนังสือ"
                value={complaint.documentNumber || "-"}
              />
              <InfoItem
                label="วันที่หนังสือ"
                value={formatThaiFullDate(complaint.documentDate)}
              />
              <InfoItem
                label="หน่วยงานอื่นที่ส่งเรื่องมา"
                value={complaint.senderAgencyName || "-"}
              />
              <InfoItem
                label="ชั้นความลับ"
                value={getSecurityLevelThai(complaint.securityLevel)}
              />
              <InfoItem
                label="ชั้นความเร่งด่วน"
                value={getUrgencyLevelThai(complaint.urgencyLevel)}
              />
              <InfoItem
                label="ประเภทเรื่องร้องเรียน"
                value={previewData.complaintTypeLabel || "-"}
              />
              <InfoItem
                label="วันและเวลาที่เกิดเหตุ"
                value={formatThaiDateTime(additionalDetails.incidentDateTime)}
              />
            </Grid>
            <Grid item xs={12} mb={3}>
              <InfoItem
                label="รายละเอียดเรื่องร้องทุกข์"
                value={additionalDetails.additionalDescription || "-"}
              />
            </Grid>

            {/* วันที่รับเรื่องและเสนองาน */}
            <Grid container spacing={2} mb={3}>
              <InfoItem
                label="วันที่รับเรื่องของเจ้าพนักงาน"
                value={formatThaiFullDateTime(additionalDetails.officer_received_date || "-")}
              />
              <InfoItem
                label="วันที่เสนองาน ผอ.สรร."
                value={formatThaiFullDateTime(additionalDetails.director_submission_date || "-")}
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
                        {file.fileName} {fileSizeMB} MB
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
                  ลงชื่อผู้ร้องทุกข์: {firstName} {lastName}
                </Typography>
                <Typography fontSize={14} color="text.secondary">
                  วันที่: {formatThaiDate(created_at || updated_at)}
                </Typography>
              </Grid>
              {delegate && Object.keys(delegate).length > 0 && (
                <Grid item xs={6}>
                  <Typography fontSize={16} fontWeight="bold">
                    ลงชื่อผู้รับมอบอำนาจ: {delegateFirstName} {delegateLastName}
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
              <Grid item xs={6}>
                <Typography fontSize={16} fontWeight="bold">
                  ลงชื่อเจ้าหน้าที่ผู้รับผิดชอบ:{" "}
                  {additionalDetails.responsibleOfficer?.fullName || ""}
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
        <ButtonService
          label="ย้อนกลับ"
          color="secondary"
          variant="outlined"
          onClick={() => {
            sessionStorage.removeItem(DATA_SESSION_KEY); // ลบ sessionStorage ก่อน
            if (onBack) {
              onBack();
            } else {
              router.back();
            }
          }}
          iconLeft={<ArrowBackIcon />}
          disabled={submitting || isSubmitting}
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
