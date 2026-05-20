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
  parseThaiName,
  resolveTitleFromList,
  formatFullNameFromParts,
} from "@utils/Formats";
import CheckIcon from "@mui/icons-material/Check";
import { exportElementToPDF3 } from "@utils/exportPDF3";
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
import RefreshIcon from "@mui/icons-material/Refresh";

const DATA_SESSION_KEY = "complaintsPreviewData";

const SearchComplaintsPreview = ({ data, onBack }) => {
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    // ให้ข้อมูลที่มาจาก props มีความสำคัญกว่า sessionStorage เสมอ
    if (data) {
      try {
        sessionStorage.setItem(DATA_SESSION_KEY, JSON.stringify(data));
      } catch {}
      setPreviewData(data);
      setFormData(data);
      return;
    }

    // ถ้าไม่มี props ค่อย fallback ไปที่ sessionStorage
    const stored = sessionStorage.getItem(DATA_SESSION_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreviewData(parsed);
        setFormData(parsed);
      } catch (e) {
        console.warn("Invalid preview data in sessionStorage", e);
        sessionStorage.removeItem(DATA_SESSION_KEY);
      }
    }
  }, [data]);

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
  const [titleOptions, setTitleOptions] = useState([]);
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
      label: "แบบรับคำร้องเรียนผ่านเว็บไซต์กระทรวงการคลัง",
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

  // ดึงรายการคำนำหน้าจากหลังบ้าน เพื่อใช้ resolve title_id/prefix_other ให้เป็นเนื้อเดียวกัน
  useEffect(() => {
    let active = true;
    (async () => {
      try {
  const { GetAllSelect } = await import("@pages/api/allselect/allselect");
  const res = await GetAllSelect();
        if (active && res?.res_code === "0000") {
          setTitleOptions(Array.isArray(res.res_data) ? res.res_data : []);
        }
      } catch (e) {
        console.error("Error fetching title options:", e);
        setTitleOptions([]);
      }
    })();
    return () => {
      active = false;
    };
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
    console.log("🍪 Raw Cookie 'info':", cookieInfo);
    if (cookieInfo) {
      try {
        const parsedInfo = JSON.parse(cookieInfo);
        console.log("📋 Parsed userInfo structure:", parsedInfo);
        console.log("📋 userInfo keys:", Object.keys(parsedInfo));
        console.log("📋 userInfo.full_name_with_title:", parsedInfo.full_name_with_title);
        console.log("📋 userInfo.first_name:", parsedInfo.first_name);
        console.log("📋 userInfo.last_name:", parsedInfo.last_name);
        console.log("📋 userInfo.title_id:", parsedInfo.title_id);
        console.log("📋 userInfo.prefix_other:", parsedInfo.prefix_other);
        setUserInfo(parsedInfo);
      } catch (err) {
        console.error("❌ Error parsing user info cookie:", err);
      }
    } else {
      console.warn("⚠️ Cookie 'info' not found!");
    }
  }, []);

  useEffect(() => {
    if (previewData) {
      setFormData(previewData);
      setLoading(false);
    }
  }, [previewData]);

  // ฟังก์ชันรีเฟรชข้อมูลจาก backend หลังจากอัปเดต
  const refreshComplaintData = async (complaintId) => {
    try {
      const res = await GetComplaintByID(complaintId);
      if (res?.res_data) {
        setFormData(res.res_data);
        // อัปเดต sessionStorage ด้วย
        try {
          sessionStorage.setItem(DATA_SESSION_KEY, JSON.stringify(res.res_data));
        } catch {}
      }

      // รีเฟรชข้อมูล staff users ด้วย
      try {
        const users = await UsersSearchByRole();
        const filteredUsers = users.filter(user => {
          const roleDescription = user.roles?.[0]?.role_description;
          return roleDescription !== "กลุ่มที่ 1 : ประชาชน";
        });
        setStaffUsers(filteredUsers);
      } catch (err) {
        console.error("Error refreshing staff users:", err);
      }
    } catch (error) {
      console.error("Error refreshing complaint data:", error);
    }
  };

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

    const toISO = (v) => {
      if (!v) return null;
      try {
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d.toISOString();
      } catch {
        return null;
      }
    };  

    const confirmAssignedDate =
      step4General.officerReceivedDate ??
      baseData.assignment_form?.registration_date ??
      null;
    const directorSubmissionDate =
      step4General.directorSubmittedDate ??
      baseData.assignment_form?.director_submission_date ??
      null;

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
       assignment_form: {
        ...(baseData.assignment_form || {}),
        registration_date: toISO(confirmAssignedDate),
        director_submission_date: toISO(directorSubmissionDate),
        assigned_officer_id:
          responsibleOfficerValue ||
          baseData.assignment_form?.assigned_officer_id ||
          "",
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

  const splitThaiName = (fullName) => parseThaiName(fullName);

  // Helper function to safely get nested data
  const getNestedData = (obj, ...paths) => {
    for (const path of paths) {
      const result = path.split('.').reduce((acc, key) => acc?.[key], obj);
      if (result && Object.keys(result).length > 0) return result;
    }
    return {};
  };

  // ตรวจสอบว่ามีข้อมูลจริงหรือไม่ (ไม่ใช่แค่ object ว่าง)
  const hasRealData = (dataObj) => dataObj && Object.keys(dataObj).length > 0 && Object.values(dataObj).some(v => v !== null && v !== undefined && v !== '');

  // ดึงข้อมูลจาก step1 (รองรับทั้ง Backend และ Frontend structure)
  const governmentDataStep1 = getNestedData(step1, 'general.government', 'general.general.government');
  const corporateDataStep1 = getNestedData(step1, 'general.corporate', 'general.general.corporate');
  const generalDataStep1 = getNestedData(step1, 'general.general', 'general.general.general');
  const signerDataStep1 = getNestedData(step1, 'general.signer', 'general.general.signer');
  const delegateDataStep1 = getNestedData(step1, 'general.delegate', 'general.general.delegate');

  let complainant = {};
  let complainantType = "individual";
  let delegate = {};

  if (hasRealData(governmentDataStep1)) {
    // หนังสือร้องเรียนถึง กค.
    complainant = governmentDataStep1;
    complainantType = "government";
    delegate = {}; // หน่วยงานรัฐไม่มีผู้รับมอบอำนาจ
    console.log('✅ SearchComplaintsPreview: แสดง หนังสือร้องเรียนถึง กค.');
  } else if (hasRealData(corporateDataStep1)) {
    // นิติบุคคล
    complainant = corporateDataStep1;
    complainantType = "corporate";
    delegate = signerDataStep1;
    console.log('✅ SearchComplaintsPreview: แสดง นิติบุคคล');
  } else {
    // บุคคลทั่วไป (default)
    complainant = generalDataStep1 || step1.general?.general || {};
    complainantType = "individual";
    delegate = delegateDataStep1 || step1.general?.delegate || {};
    console.log('✅ SearchComplaintsPreview: แสดง บุคคลทั่วไป');
  }

  // ข้อมูลจาก step1 (ผู้ร้องทุกข์)
  // พยายาม resolve จาก title_id/prefix_other ถ้ามี มิฉะนั้น fallback parseThaiName
  const complainantTitle = resolveTitleFromList(
    complainant.title_id,
    complainant.prefix_other,
    titleOptions
  );
  const { title, firstName, lastName } = complainantTitle
    ? { title: complainantTitle, firstName: complainant.first_name || splitThaiName(complainant.name).firstName, lastName: complainant.last_name || splitThaiName(complainant.name).lastName }
    : splitThaiName(complainant.name);
  const {
    title: delegateTitle,
    firstName: delegateFirstName,
    lastName: delegateLastName,
  } = (() => {
    const t = resolveTitleFromList(delegate.title_id, delegate.prefix_other, titleOptions);
    if (t) {
      return {
        title: t,
        firstName: delegate.first_name || splitThaiName(delegate.name).firstName,
        lastName: delegate.last_name || splitThaiName(delegate.name).lastName,
      };
    }
    return splitThaiName(delegate.name);
  })();

  // ข้อมูลจาก step2 (ผู้ถูกร้องเรียน)
  const respondentActiveType = step2.general?.activeType;
  const respondent = respondentActiveType === "corporate"
    ? step2.general?.corporate || {}
    : respondentActiveType === "government"
    ? step2.general?.government || {}
    : step2.general?.individual || step2.general?.corporate || step2.general?.government || {};

  const { title: respondentTitle, firstName: respondentFirstName, lastName: respondentLastName } = (() => {
    const t = resolveTitleFromList(
      respondent.title_id,
      respondent.prefix_other,
      titleOptions
    );
    if (t) {
      return {
        title: t,
        firstName: respondent.first_name || splitThaiName(respondent.name).firstName,
        lastName: respondent.last_name || splitThaiName(respondent.name).lastName,
      };
    }
    return splitThaiName(respondent.name);
  })();
  // ข้อมูลจาก step3 (เรื่องร้องทุกข์)
  const complaint = step3.general || {};
  // รองรับข้อมูลจาก assignment_form (ถ้าผ่านมาพร้อมกันใน previewData)
  const assignmentForm = formData.assignment_form || formData.assignmentForm || {};

  const files = complaint.attachment || [];

  // ข้อมูลจาก step4 (รายละเอียดเพิ่มเติม)
  const additionalDetails = step4.general || {};

  console.log("Debug formData structure:", {
    formData: formData,
    assignmentForm: assignmentForm,
    step4: step4,
    additionalDetails: additionalDetails
  });

  const InfoItem = ({ label, value, fullWidth = false, className = "" }) => (
    <Grid item xs={12} sm={fullWidth ? 12 : 6}>
      <Typography fontSize={16} sx={{ whiteSpace: "normal", wordBreak: "break-word" }} className={className}>
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
  const currentUserName = (() => {
    if (!userInfo) return "กำลังโหลด...";

    // ✅ ลองใช้ full_name_with_title ก่อน (ถ้ามีใน cookie)
    if (userInfo.full_name_with_title) {
      return userInfo.full_name_with_title;
    }

    // ถ้า userInfo มี title_id/prefix_other ให้ resolve ชื่อเต็มอย่างเป็นทางการ
    const fullName = formatFullNameFromParts(
      {
        title_id: userInfo.title_id,
        prefix_other: userInfo.prefix_other,
        first_name: userInfo.first_name,
        last_name: userInfo.last_name,
      },
      titleOptions
    );
    return fullName || `${userInfo.first_name || ""} ${userInfo.last_name || ""}`.trim() || "ผู้ใช้ไม่ระบุชื่อ";
  })();

  // Resolve responsible officer's display name consistently
  const responsibleOfficerName = (() => {
    // ลองหาข้อมูลเจ้าหน้าที่จากหลายแหล่ง
    const ro = additionalDetails?.responsibleOfficer;
    const assignedOfficerId = assignmentForm?.assigned_officer_id || formData?.assigned_officer_id;
    const assignedToName = assignmentForm?.assigned_to || formData?.assigned_to;

    // เพิ่มตัวเลือกจาก root level
    const rootAssignedTo = formData?.assigned_to;
    const rootAssignedDate = formData?.assigned_date;

    console.log("Debug responsibleOfficerName:", {
      ro,
      assignedOfficerId,
      assignedToName,
      rootAssignedTo,
      rootAssignedDate,
      staffUsersCount: staffUsers.length,
      assignmentForm,
      additionalDetails
    });

    // 1. ลองใช้ชื่อจาก assigned_to ก่อน (เป็นข้อมูลที่ชัดเจนที่สุด)
    if (assignedToName && typeof assignedToName === "string" && assignedToName !== "") {
      return assignedToName;
    }

    // 1.1 ลองใช้จาก root level
    if (rootAssignedTo && typeof rootAssignedTo === "string" && rootAssignedTo !== "") {
      return rootAssignedTo;
    }

    // 2. ถ้ามีข้อมูลจาก additionalDetails
    if (ro) {
      const id =
        (typeof ro === "object" && (ro.id || ro.value)) ||
        (typeof ro === "string" && ro) ||
        "";
      if (id) {
        const found = staffUsers.find((u) => String(u.value) === String(id) || String(u.id) === String(id));
        if (found) {
          if (found.label) return found.label;
          const composed = formatFullNameFromParts(
            {
              title_id: found.title_id,
              prefix_other: found.prefix_other,
              first_name: found.first_name || found.fullName?.split(" ")[0],
              last_name: found.last_name || found.fullName?.split(" ")[1],
            },
            titleOptions
          );
          return composed || found.fullName || found.name || id;
        }
      }
      if (typeof ro === "object") {
        return (
          ro.label ||
          formatFullNameFromParts(
            {
              title_id: ro.title_id,
              prefix_other: ro.prefix_other,
              first_name: ro.first_name,
              last_name: ro.last_name,
            },
            titleOptions
          ) ||
          ro.fullName ||
          ro.name ||
          "-"
        );
      }
      if (typeof ro === "string") return ro;
    }

    // 3. หาจาก assigned_officer_id
    if (assignedOfficerId) {
      const found = staffUsers.find((u) => String(u.value) === String(assignedOfficerId) || String(u.id) === String(assignedOfficerId));
      if (found) {
        if (found.label) return found.label;
        const composed = formatFullNameFromParts(
          {
            title_id: found.title_id,
            prefix_other: found.prefix_other,
            first_name: found.first_name || found.fullName?.split(" ")[0],
            last_name: found.last_name || found.fullName?.split(" ")[1],
          },
          titleOptions
        );
        return composed || found.fullName || found.name || assignedOfficerId;
      }
    }

    // 4. fallback สุดท้าย - ลองหาจาก assigned_officer_id ว่าเป็น UUID หรือไม่
    if (assignedOfficerId && assignedOfficerId.length > 10) {
      return `เจ้าหน้าที่ ID: ${assignedOfficerId.substring(0, 8)}...`;
    }

    // 5. แสดง debug info ถ้าไม่พบ
    console.warn("ไม่พบข้อมูลเจ้าหน้าที่ผู้รับผิดชอบ", {
      assignedToName,
      rootAssignedTo,
      assignedOfficerId
    });

    return "ไม่ระบุเจ้าหน้าที่";
  })();

  const officerReceived =
    additionalDetails.officerReceivedDate ||
    assignmentForm.registration_date ||
    null;
    
  const directorSubmitted =
    additionalDetails.directorSubmittedDate ||
    assignmentForm.director_submission_date ||
    null;

  return (
    <>
      <BreadcrumbsService items={breadcrumbItems} />
      <div ref={pdfRef}>
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              height: 40,
              background: "linear-gradient(to right, #ffffffff, #ffffffff)",
              borderTopRightRadius: 8,
              borderTopLeftRadius: 8,
            }}
          />
          <Paper sx={{ mt: -1, p: 4, borderRadius: 2 }}>
            {/* Title */}
            <Box display="flex" alignItems="center" justifyContent="center" mb={3}>
              <Image
                src="/logo_blue.png"
                alt="โลโก้"
                width={130}
                height={130}
                style={{ objectFit: "contain" }}
                className="pdf-header-logo"
              />
              <Typography variant="h5" fontWeight="bold" ml={2} className="pdf-header-title">
                แบบรับคำร้องเรียนผ่านเว็บไซต์กระทรวงการคลัง
              </Typography>
            </Box>

            {/* ข้อมูลหัวเรื่อง */}
            <Grid container spacing={2} mb={3}>
              <InfoItem label="วันที่ร้องทุกข์" value={formatThaiDate()} />
              <InfoItem
                label="ช่องทางเรื่องร้องเรียน"
                value={(() => {
                  const channelValue = complaint.channel || complaint.complaint_channel_name || data?.assignment_form?.complaint_channel_name || previewData?.complaintChannelLabel || "-";
                  console.log("🔍 Debug ช่องทางเรื่องร้องเรียน:", {
                    "complaint.channel": complaint.channel,
                    "complaint.complaint_channel_name": complaint.complaint_channel_name,
                    "data?.assignment_form?.complaint_channel_name": data?.assignment_form?.complaint_channel_name,
                    "previewData?.complaintChannelLabel": previewData?.complaintChannelLabel,
                    "Final Value": channelValue,
                    "complaint object": complaint,
                    "data object": data,
                    "previewData object": previewData
                  });
                  return channelValue;
                })()}
                className="pdf-small-text"
              />
              <InfoItem
                label="ประเภทเรื่องร้องทุกข์"
                value={previewData.complaintTypeLabel || "-"}
              />
              <InfoItem
                label="ประเภทเรื่องย่อย"
                value={previewData.complaintSubTypeLabel || "-"}
              />
              <InfoItem label="เรื่อง" value={complaint.subject || "-"} fullWidth />
              <Grid item xs={12}>
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
              {complainantType === "government" ? (
                // หนังสือร้องเรียนถึง กค.
                <>
                  <InfoItem
                    label="หมายเลขประจำตัวประชาชน"
                    value={formatCitizenId_null(complainant.idCard)}
                  />
                  <InfoItem
                    label="ชื่อ - นามสกุล"
                    value={complainant.fullName || "-"}
                  />
                  <InfoItem
                    label="ที่อยู่ที่สามารถติดต่อได้"
                    value={complainant.address || "-"}
                  />
                  <InfoItem
                    label="หมายเลขโทรศัพท์"
                    value={formatPhoneNumber_null(complainant.phone)}
                  />
                  <InfoItem
                    label="จังหวัด"
                    value={
                      typeof complainant.province === 'object'
                        ? complainant.province?.label || complainant.province?.name || "-"
                        : complainant.province || "-"
                    }
                  />
                  <InfoItem
                    label="อำเภอ/เขต"
                    value={
                      typeof complainant.districts === 'object'
                        ? complainant.districts?.label || complainant.districts?.name || "-"
                        : complainant.districts || "-"
                    }
                  />
                  <InfoItem label="อีเมล" value={complainant.email || "-"} />
                  <InfoItem
                    label="ตำบล/แขวง"
                    value={
                      typeof complainant.subdistricts === 'object'
                        ? complainant.subdistricts?.label || complainant.subdistricts?.name || "-"
                        : complainant.subdistricts || "-"
                    }
                  />
                  <InfoItem
                    label="รหัสไปรษณีย์"
                    value={
                      typeof complainant.zipcode === 'object'
                        ? complainant.zipcode?.label || complainant.zipcode?.name || "-"
                        : complainant.zipcode || "-"
                    }
                  />
                </>
              ) : complainantType === "corporate" ? (
                // นิติบุคคล
                <>
                  <InfoItem
                    label="หมายเลขประจำตัวประชาชน"
                    value={formatCitizenId_null(complainant.idCard)}
                  />
                  <InfoItem
                    label="ชื่อบริษัท"
                    value={complainant.companyName || "-"}
                  />
                  <InfoItem
                    label="ชื่อ - นามสกุล ผู้ลงนาม"
                    value={delegate.signatoryName || delegate.name || "-"}
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
                </>
              ) : (
                // บุคคลทั่วไป
                <>
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
                </>
              )}
            </Grid>

            {/* ผู้รับมอบอำนาจร้องเรียน */}
            {delegate && Object.keys(delegate).length > 0 && (
              <>
              <Box id="delegate-section" data-pdf-section="delegate-section">
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
                </Box>
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
            <Box id="complaint-info-section" data-pdf-section="complaint-info-section">
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
                value={
                  assignmentForm.reference_number || complaint.referenceNumber1 || "-"
                }
              />
              <InfoItem
                label="วันที่ สป.กค."
                value={
                  formatThaiFullDate(
                    assignmentForm.reference_date || complaint.referenceDate1
                  )
                }
              />
              <InfoItem
                label="เลข สป.สร."
                value={
                  assignmentForm.reference_number2 || complaint.referenceNumber2 || "-"
                }
              />
              <InfoItem
                label="วันที่ สป.สร."
                value={
                  formatThaiFullDate(
                    assignmentForm.reference_date2 || complaint.referenceDate2
                  ) || "-"
                }
              />
              <InfoItem
                label="เลข สตป."
                value={
                  assignmentForm.reference_number3 || complaint.referenceNumber3 || "-"
                }
              />
              <InfoItem
                label="วันที่ สตป."
                value={
                  formatThaiFullDate(
                    assignmentForm.reference_date3 || complaint.referenceDate3
                  )
                }
              />
              <InfoItem
                label="เลข สรร. (สารบัญ)"
                value={
                  assignmentForm.reference_number4 ||
                  complaint.referenceNumber4 ||
                  "-"
                }
              />
              <InfoItem
                label="วันที่ สรร."
                value={
                  formatThaiFullDate(
                    assignmentForm.reference_date4 || complaint.referenceDate4
                  )
                }
              />
              <InfoItem
                label="เลขที่หนังสือ"
                value={assignmentForm.document_number || complaint.documentNumber || "-"}
              />
              <InfoItem
                label="วันที่หนังสือ"
                value={formatThaiFullDate(assignmentForm.document_date || complaint.documentDate)}
              />
              <InfoItem
                label="หน่วยงานอื่นที่ส่งเรื่องมา"
                value={assignmentForm.agency_sender || complaint.senderAgencyName || "-"}
              />
              <InfoItem
                label="ชั้นความลับ"
                value={getSecurityLevelThai(
                  assignmentForm.confidentiality_level || complaint.securityLevel
                )}
              />
              <InfoItem
                label="ชั้นความเร่งด่วน"
                value={getUrgencyLevelThai(
                  assignmentForm.urgency_level || complaint.urgencyLevel
                )}
              />
              <InfoItem
                label="ประเภทเรื่องร้องเรียน"
                value={
                  previewData.complaintTypeLabel || assignmentForm.complaint_type_name || "-"
                }
              />
              <InfoItem
                label="วันและเวลาที่เกิดเหตุ"
                value={formatThaiDateTime(
                  additionalDetails.incidentDate || complaint.incidentDate
                )}
              />
            </Grid>
            </Box>

            {/* รายละเอียดเรื่องร้องทุกข์ - ขึ้นหน้าใหม่ */}
            <Box
              id="complaint-detail-section"
              data-pdf-section="complaint-detail-section"
              sx={{
                breakInside: "avoid",
                pageBreakInside: "avoid",
                pageBreakBefore: "always",
                "@media print": {
                  breakInside: "avoid",
                  pageBreakInside: "avoid",
                  pageBreakBefore: "always"
                },
              }}
            >
              <Grid
                item
                xs={12}
                mb={3}
                id="complaint-detail"
                data-pdf-section="complaint-detail"
                sx={{
                  breakInside: "avoid",
                  pageBreakInside: "avoid",
                  "@media print": {
                    breakInside: "avoid",
                    pageBreakInside: "avoid"
                  },
                }}
              >
              <Typography fontSize={16}>
                <Box component="span" fontWeight="bold">รายละเอียดเรื่องร้องทุกข์:</Box>
              </Typography>

              <Typography
                fontSize={16}
                sx={{
                  mt: 1,
                  whiteSpace: "pre-wrap",     // ✅ รักษา \n เป็นย่อหน้า
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                  lineHeight: 1.8,
                  textAlign: "justify",
                }}
              >
                {complaint.description || additionalDetails.additionalDescription || "-"}
              </Typography>
            </Grid>
            </Box>

            {/* วันที่รับเรื่องและเสนองาน */}
            <Grid
              container
              spacing={2}
              mb={3}
              id="officer-dates"
              data-pdf-section="officer-dates"
              sx={{ breakInside: "avoid", pageBreakInside: "avoid",
                    "@media print": { breakInside: "avoid", pageBreakInside: "avoid" } }}
            >
              <InfoItem
                label="วันที่รับเรื่องของเจ้าพนักงาน"
                value={formatThaiFullDateTime(officerReceived) || "-"}
              />
              <InfoItem
                label="วันที่เสนองาน ผอ.สรร."
                value={formatThaiFullDateTime(directorSubmitted) || "-"}
              />
            </Grid>


            {/* ไฟล์แนบ */}
            <Box
              id="attachments-section"
              data-pdf-section="attachments-section"
              sx={{ breakInside: "avoid", pageBreakInside: "avoid",
                    "@media print": { breakInside: "avoid", pageBreakInside: "avoid" } }}
              mb={3}
            >
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                เอกสารประกอบการร้องทุกข์
              </Typography>

              <Box>
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
                          breakInside: "avoid",         // ✅ ไม่ตัดกลางการ์ด
                          pageBreakInside: "avoid",
                          "&:hover": { backgroundColor: "#f5f5f5" },
                        }}
                        onClick={() => window.open(file.fileUrl, "_blank")}
                      >
                        {getFileIcon(ext)}
                        <Typography fontSize={14} color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                          {file.fileName} {fileSizeMB} MB
                        </Typography>
                      </Box>
                    );
                  })
                ) : (
                  <Typography fontSize={14}>ไม่มีไฟล์แนบ</Typography>
                )}
              </Box>
            </Box>


            <Box
              id="declaration-section"
              data-pdf-section="declaration-section"
              sx={{ breakInside: "avoid", pageBreakInside: "avoid",
                    "@media print": { breakInside: "avoid", pageBreakInside: "avoid" } }}
              mb={3}
            >
              <Typography fontSize={16} mb={2}>
                ข้าพเจ้าขอรับรองว่าข้อเท็จจริงที่ได้ยื่นเรื่องร้องเรียน/ร้องทุกข์ข้างต้นเป็นความจริงทุกประการ
              </Typography>
              <Typography fontSize={16}>
                หมายเหตุ : เอกสารฉบับนี้ไม่สามารถนำไปใช้อ้างอิงเอกสารอื่น
              </Typography>
            </Box>

            {/* ข้อมูลเจ้าหน้าที่ผู้รับผิดชอบ */}
            <Box
              id="processing-info"
              data-pdf-section="processing-info"
              sx={{ breakInside: "avoid", pageBreakInside: "avoid",
                    "@media print": { breakInside: "avoid", pageBreakInside: "avoid" } }}
              mb={3}
            >
              <Typography variant="subtitle1" fontWeight="bold" fontSize={18} gutterBottom>
                ข้อมูลการประมวลผล
              </Typography>
              <Grid container spacing={2}>
                <InfoItem label="เจ้าหน้าที่ผู้รับผิดชอบ" value={responsibleOfficerName} />
                <InfoItem
                  label="สถานะ"
                  value={
                    assignmentForm?.status === "reviewed" ? "แจ้งผลการพิจารณา" :
                    assignmentForm?.status === "in_process" ? "กำลังดำเนินการ" :
                    assignmentForm?.status === "submitted" ? "รับเรื่อง" :
                    assignmentForm?.status || "ไม่ระบุสถานะ"
                  }
                />
                {assignmentForm?.assigned_remark && (
                  <Grid item xs={12}>
                    <InfoItem label="หมายเหตุการมอบหมาย" value={assignmentForm.assigned_remark} />
                  </Grid>
                )}
              </Grid>
            </Box>


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
                  {responsibleOfficerName}
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
          label="รีเฟรชข้อมูล"
          color="info"
          variant="outlined"
          onClick={async () => {
            if (id) {
              setLoading(true);
              try {
                await refreshComplaintData(id);
                alertSuccess("รีเฟรชสำเร็จ", "ข้อมูลได้รับการอัปเดตแล้ว");
              } catch (error) {
                alertError("ข้อผิดพลาด", "ไม่สามารถรีเฟรชข้อมูลได้");
              } finally {
                setLoading(false);
              }
            }
          }}
          iconLeft={<RefreshIcon />}
          disabled={submitting || isSubmitting || !id || loading}
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
          onClick={() =>
          exportElementToPDF3(pdfRef, "แบบฟอร์มร้องทุกข์.pdf", {
            marginTop: 7,
            marginBottom: 10,
            marginLeft: 4,
            marginRight: 4,
            fontSizePx: 32,
            lineHeight: 1.7,
            scale: 3,
            pageBreakBeforeSelectors: ["#complaint-detail-section"], // << เริ่มหน้าใหม่ตรงหัวข้อ
            forcePageBreakSelectors: ["#complaint-detail", '[data-pdf-section="complaint-detail"]'],
          })
        }

          disabled={submitting || isSubmitting}
          iconRight={<CheckIcon />}
        />
      </Box>
    </>
  );
};

export default SearchComplaintsPreview;
