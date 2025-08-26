import React, { useState, useEffect } from "react";
import styles from "./UserManagement.module.scss";
import { Box, Typography, Grid, IconButton } from "@mui/material";
import SelectMenuService from "@services/SelectMenu/SelectMenu";
import TextfieldService from "@services/TextfieldService/TextfieldService";
import ButtonService from "@services/ButtonService/ButtonService";
import { Search, Visibility, VisibilityOff } from "@mui/icons-material";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import RemoveCircleOutlineOutlinedIcon from "@mui/icons-material/RemoveCircleOutlineOutlined";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import AddUserModal from "./modal/AddUserModal";
import {
  GetDetailedStatsbyRole,
  DelUsers,
  GetTitleDetails,
  GetRoles,
} from "@pages/api/settinggeneral/users";
import {
  formatThaiDateTime,
  formatPhoneNumber_null,
  formatCitizenId_null,
} from "@utils/Formats";
import {
  showLoading,
  closeAlert,
  alertError,
  alertSuccess,
  showConfirm,
} from "@utils/Alerts";
import Image from "next/image";

const breadcrumbItems = [
  {
    label: "เมนูการใช้งานทั่วไป",
    icon: (
      <img
        src="/icons/settingico.png"
        alt="Settings Icon"
        style={{ width: "24px", height: "24px", marginBottom: "-8px" }}
      />
    ),
  },
  {
    label: "กำหนดผู้ใช้งาน",
  },
];

// Function to mask citizen ID - show only last 4 digits
const formatMaskedCitizenId = (citizenId) => {
  if (!citizenId) return "-";

  // Remove dashes and get clean number
  const cleanId = citizenId.replace(/-/g, "");

  if (cleanId.length < 4) return citizenId;

  // Get last 4 digits
  const lastFour = cleanId.slice(-4);

  // Create masked version with asterisks
  const maskedPart = "*".repeat(cleanId.length - 4);

  // Format with dashes like original: *-****-****-**-1234
  if (cleanId.length === 13) {
    return `*-****-****-**-${lastFour}`;
  }

  // Fallback for other lengths
  return `${maskedPart}${lastFour}`;
};

// Function to format full citizen ID with dashes
const formatFullCitizenId = (citizenId) => {
  if (!citizenId) return "-";

  // Remove existing dashes
  const cleanId = citizenId.replace(/-/g, "");

  // Format as X-XXXX-XXXXX-XX-X for 13 digits
  if (cleanId.length === 13) {
    return `${cleanId.substring(0, 1)}-${cleanId.substring(
      1,
      5
    )}-${cleanId.substring(5, 10)}-${cleanId.substring(
      10,
      12
    )}-${cleanId.substring(12, 13)}`;
  }

  // Return original if not 13 digits
  return citizenId;
};

export default function UserManagementUI() {
  const [stats, setStats] = useState([]);
  const [originalStats, setOriginalStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [userDetailsExpanded, setUserDetailsExpanded] = useState({}); // Track user details expansion
  const [roles, setRoles] = useState([]);

  // State สำหรับควบคุมการแสดง/ซ่อนเลขบัตรประชาชน
  const [citizenIdVisibility, setCitizenIdVisibility] = useState({});
  const [roleOptions, setRoleOptions] = useState([]);
  // เพิ่ม state สำหรับ titleOptions
  const [titleOptions, setTitleOptions] = useState([
    { value: 1, label: "อื่น ๆ" },
    { value: 2, label: "นาย" },
    { value: 3, label: "นาง" },
    { value: 4, label: "นางสาว" },
  ]);

  // โหลดข้อมูลเริ่มต้น
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // โหลดข้อมูลผู้ใช้
        const statsData = await GetDetailedStatsbyRole();
        setStats(statsData);

        setOriginalStats(statsData);

        const roles = statsData.res_data.map((item) => ({
          role_id: item.role_id,
          role_name: item.role_name,
          role_description: item.role_description,
        }));
        setRoles(roles);

        // Initialize expanded sections - all collapsed by default (false)
        if (statsData?.res_data) {
          setExpandedSections(new Array(statsData.res_data.length).fill(false));
        }

        // โหลดข้อมูลคำนำหน้า
        const titleData = await GetTitleDetails();
        if (
          titleData &&
          titleData.res_data &&
          Array.isArray(titleData.res_data)
        ) {
          const formattedOptions = titleData.res_data.map((item) => ({
            value: item.title_id,
            label: item.title_name || item.short_name,
          }));
          setTitleOptions(formattedOptions);
        }
      } catch (err) {
        console.error("โหลดข้อมูลไม่สำเร็จ:", err);
        alertError("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const fetchStats = async () => {
    try {
      showLoading("กำลังโหลดข้อมูล...");
      const data = await GetDetailedStatsbyRole();
      setStats(data);
      setOriginalStats(data);
      // Reset expanded sections to collapsed
      if (data?.res_data) {
        setExpandedSections(new Array(data.res_data.length).fill(false));
      }
      setHasSearched(false); // Reset search state
      setUserDetailsExpanded({}); // Reset user details expansion
      setCitizenIdVisibility({}); // Reset citizen ID visibility
    } catch (err) {
      console.error("โหลดข้อมูลไม่สำเร็จ:", err);
      alertError("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      closeAlert();
      setLoading(false);
    }
  };

  const handleReopenModal = () => {
    setOpenModal(true);
  };

  const handleDeleteUser = async (user) => {
    const confirm = await showConfirm(
      "ยืนยันการลบผู้ใช้งาน",
      `คุณต้องการลบผู้ใช้งาน <strong>${user.full_name}</strong> ใช่หรือไม่?`
    );

    if (confirm) {
      try {
        showLoading("กำลังลบผู้ใช้งาน...");
        await DelUsers(user.id);
        alertSuccess("ลบผู้ใช้งานสำเร็จ");
        await fetchStats();
      } catch (err) {
        alertError("เกิดข้อผิดพลาด", "ไม่สามารถลบผู้ใช้งานได้");
        closeAlert();
      }
    }
  };

  const [expandedSections, setExpandedSections] = useState([]);

  const toggleSection = (index) => {
    const newExpandedSections = [...expandedSections];
    newExpandedSections[index] = !newExpandedSections[index];
    setExpandedSections(newExpandedSections);
  };

  // Toggle user details expansion
  const toggleUserDetails = (userId) => {
    setUserDetailsExpanded((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Toggle citizen ID visibility
  const toggleCitizenIdVisibility = (userId) => {
    setCitizenIdVisibility((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const [permission, setPermission] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [fullName, setFullName] = useState("");
  const [loginDate, setLoginDate] = useState("");

  // Options for the dropdown
  const permissionOptions = [
    { value: "admin", label: "ผู้ดูแลระบบ" },
    { value: "people", label: "ประชาชน" },
    { value: "admin_home", label: "ผู้ดูแลหน้าหลัก" },
    { value: "executive", label: "ผู้บริหาร" },
    { value: "agency", label: "หน่วยงานในสังกัด" },
    { value: "officer", label: "เจ้าหน้าที่" },
  ];

  useEffect(() => {
    const fetchRoles = async () => {
      const roleApi = await GetRoles();
      if (roleApi && Array.isArray(roleApi.res_data)) {
        setRoleOptions(
          roleApi.res_data.map((r) => ({
            value: r.name,
            label: r.description ? r.description : r.name,
          }))
        );
      }
    };
    fetchRoles();
  }, []);

  // Handle change events
  const handlePermissionChange = (event) => {
    setPermission(event.target.value);
  };

  const handleDisplayNameChange = (event) => {
    setDisplayName(event.target.value);
  };

  const handleFullNameChange = (event) => {
    setFullName(event.target.value);
  };

  // ฟังก์ชันค้นหา user
  const handleSearch = () => {
    const getDateString = (isoString) => {
      if (!isoString) return "";
      return isoString.slice(0, 10);
    };

    let filteredData,
      foundUserIds = [];
    const hasDisplayName = displayName && displayName.trim() !== "";
    const hasFullName = fullName && fullName.trim() !== "";

    // ฟังก์ชันกรองที่รวมทุกช่อง
    const userFilterFn = (user) => {
      // เงื่อนไขวัน/เวลาเข้าใช้
      const matchesLoginDate =
        !loginDate ||
        (user.updated_at &&
          getDateString(user.updated_at) === getDateString(loginDate));
      // เงื่อนไขชื่อผู้ใช้งานในระบบ (full_name)
      const matchesDisplayName =
        !hasDisplayName ||
        (user.full_name &&
          user.full_name.toLowerCase().includes(displayName.toLowerCase()));
      // เงื่อนไขชื่อที่ลงทะเบียน (full_name_with_title)
      const matchesFullName =
        !hasFullName ||
        (user.full_name_with_title &&
          user.full_name_with_title
            .toLowerCase()
            .includes(fullName.toLowerCase()));

      const allMatch =
        matchesLoginDate && matchesDisplayName && matchesFullName;
      if (allMatch) foundUserIds.push(user.id);
      return allMatch;
    };

    if (permission && permission !== "all") {
      filteredData = originalStats.res_data
        .filter((section) => section.role_name === permission)
        .map((section) => {
          const filteredUsers = section.users.filter(userFilterFn);
          return { ...section, users: filteredUsers };
        })
        .filter((section) => section.users.length > 0);
    } else {
      filteredData = originalStats.res_data
        .map((section) => {
          const filteredUsers = section.users.filter(userFilterFn);
          return { ...section, users: filteredUsers };
        })
        .filter((section) => section.users.length > 0);
    }
    setStats({ ...originalStats, res_data: filteredData });
  };

  // Modal States
  const [openModal, setOpenModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // เก็บข้อมูลผู้ใช้ที่กำลังแก้ไข

  // Handle Open Modal for Add User
  const handleOpenModal = () => {
    showLoading("กำลังโหลด...");
    setTimeout(() => {
      setEditingUser(null); // Reset editing user
      setOpenModal(true);
      closeAlert();
    }, 300);
  };

  // ฟังก์ชันสำหรับแยกคำนำหน้าจาก full_name_with_title
  const extractTitleId = (fullNameWithTitle, titleOptions) => {
    if (!fullNameWithTitle || !Array.isArray(titleOptions)) return "3";

    // หาคำนำหน้าที่ตรงกัน
    for (const option of titleOptions) {
      if (fullNameWithTitle.startsWith(option.label)) {
        return option.value.toString();
      }
    }

    // ถ้าไม่เจอให้ใช้ค่าเริ่มต้น
    return "3"; // นาง (default)
  };

  // Update the extractFirstName function to use titleOptions
  const extractFirstName = (fullNameWithTitle, titleOptions) => {
    if (!fullNameWithTitle || !Array.isArray(titleOptions)) return "";

    let nameWithoutTitle = fullNameWithTitle.trim();

    // Sort titles by length (longest first) to avoid partial matches
    // For example, "นางสาว" should be checked before "นาง"
    const sortedTitles = [...titleOptions].sort(
      (a, b) => b.label.length - a.label.length
    );

    // Try to find and remove the title prefix
    for (const title of sortedTitles) {
      if (fullNameWithTitle.trim().startsWith(title.label)) {
        nameWithoutTitle = fullNameWithTitle
          .substring(title.label.length)
          .trim();
        break;
      }
    }

    // แยกชื่อและนามสกุล
    const nameParts = nameWithoutTitle.split(/\s+/);

    // ตรวจสอบว่ามีชื่อหรือไม่
    if (nameParts.length > 0) {
      return nameParts[0];
    }

    return "";
  };

  // Update the extractLastName function to use titleOptions
  const extractLastName = (fullNameWithTitle, titleOptions) => {
    if (!fullNameWithTitle || !Array.isArray(titleOptions)) return "";

    let nameWithoutTitle = fullNameWithTitle.trim();

    // Sort titles by length (longest first) to avoid partial matches
    const sortedTitles = [...titleOptions].sort(
      (a, b) => b.label.length - a.label.length
    );

    // Try to find and remove the title prefix
    for (const title of sortedTitles) {
      if (fullNameWithTitle.trim().startsWith(title.label)) {
        nameWithoutTitle = fullNameWithTitle
          .substring(title.label.length)
          .trim();
        break;
      }
    }

    // แยกชื่อและนามสกุล
    const nameParts = nameWithoutTitle.split(/\s+/);

    // ตรวจสอบว่ามีนามสกุลหรือไม่
    if (nameParts.length > 1) {
      return nameParts.slice(1).join(" "); // รวมทุกส่วนที่เหลือเป็นนามสกุล
    }

    return "";
  };

  const getRoleInfoFromSection = (user, statsData) => {
    if (!statsData?.res_data)
      return { role_id: "", role_name: "", role_description: "" };

    for (const section of statsData.res_data) {
      const foundUser = section.users.find((u) => u.id === user.id);
      if (foundUser) {
        return {
          role_id: section.role_id,
          role_name: section.role_name,
          role_description: section.role_description,
        };
      }
    }
    return { role_id: "", role_name: "", role_description: "" };
  };

  const handleEditUser = (user) => {
    showLoading("กำลังโหลดข้อมูล...");
    setTimeout(() => {
      // หา role info เพิ่มเติมจาก roles state
      const userRole =
        roles.find((role) => role.role_id === user.role_id) || {};

      // Fallback หา role info จาก section ด้วย getRoleInfoFromSection
      const sectionRole = getRoleInfoFromSection(user, stats);

      // สร้าง object ที่มีข้อมูลครบสำหรับ Modal
      const completeUserData = {
        id: user.id,
        citizen_id: user.citizen_id,
        username:
          user.username ||
          (user.citizen_id ? user.citizen_id.replace(/-/g, "") : ""),

        // ข้อมูลชื่อ
        full_name: user.full_name,
        full_name_with_title: user.full_name_with_title,

        // แยกคำนำหน้า ชื่อ นามสกุล จาก full_name_with_title - ส่ง titleOptions เข้าไป
        title_id:
          user.title_id?.toString() ||
          extractTitleId(
            user.full_name_with_title || user.full_name,
            titleOptions
          ),
        first_name:
          user.first_name ||
          extractFirstName(
            user.full_name_with_title || user.full_name,
            titleOptions
          ),
        last_name:
          user.last_name ||
          extractLastName(
            user.full_name_with_title || user.full_name,
            titleOptions
          ),

        // แมป role_name, role_id, role_description ให้ตรงกับ roles หรือ section
        role_id: userRole.role_id || sectionRole.role_id || user.role_id || "",
        role_name:
          userRole.role_name || sectionRole.role_name || user.role_name || "",
        role_description:
          userRole.role_description ||
          sectionRole.role_description ||
          user.role_description ||
          "",

        // ตำแหน่ง - ลองหาจากหลายๆ field
        position: user.role_id || "",

        // ข้อมูลติดต่อ
        phone: user.phone || "",
        email: user.email || "",

        // ข้อมูลที่อยู่
        address: user.address || user.address_card || "",
        contact_address: user.contact_address || user.address_contact || "",
        address_card: user.address_card || user.address || "",
        address_contact: user.address_contact || user.contact_address || "",

        // ข้อมูลเพิ่มเติม
        profile_image: user.profile_image || "",
        last_login: user.last_login,
        updated_at: user.updated_at,

        // ข้อมูลจังหวัด/อำเภอ/ตำบล (ถ้ามี)
        province: user.province || null,
        districts: user.districts || user.district || null,
        subdistricts: user.subdistricts || user.subdistrict || null,
        zipcode: user.zipcode || user.zip_code || null,

        // ที่อยู่ติดต่อ
        province2: user.province2 || user.contact_province || null,
        districts2: user.districts2 || user.contact_district || null,
        subdistricts2: user.subdistricts2 || user.contact_subdistrict || null,
        zipcode2: user.zipcode2 || user.contact_zipcode || null,
      };

      setEditingUser(completeUserData);
      setOpenModal(true);
      closeAlert();
    }, 300);
  };
  const handleClearFilters = () => {
    setPermission("");
    setDisplayName("");
    setFullName("");
    setLoginDate("");
    setStats(originalStats); // รีเซตข้อมูล user table
    setHasSearched(false);
  };
  // Handle Close Modal
  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingUser(null); // Reset editing user
    closeAlert();
  };

  return (
    <Box>
      <Grid size={{ xs: 12 }}>
        <BreadcrumbsService items={breadcrumbItems} />
      </Grid>
      <Grid container spacing={2}>
        {/* แถวที่ 1: สิทธิการใช้งาน + ชื่อผู้ใช้งานในระบบ */}
        <Grid item xs={12} sm={6} md={3} lg={2.4} xl={2.4}>
          <Typography
            variant="body2"
            color="#1120A3"
            sx={{ fontWeight: "bold" }}
          >
            สิทธิการใช้งาน
          </Typography>
          <SelectMenuService
            options={roleOptions}
            handleChange={(e) => setPermission(e.target.value)}
            value={permission}
            width="100%"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3} lg={2.4} xl={2.4}>
          <Typography
            variant="body2"
            color="#1120A3"
            sx={{ fontWeight: "bold" }}
          >
            ชื่อผู้ใช้งานในระบบ
          </Typography>
          <TextfieldService
            placeholder="ชื่อผู้ใช้งานในระบบ"
            value={displayName}
            onChange={handleDisplayNameChange}
          />
        </Grid>

        {/* แถวที่ 2: ชื่อที่ลงทะเบียน + วัน / เวลาที่เข้าใช้ */}
        <Grid item xs={12} sm={6} md={3} lg={2.4} xl={2.4}>
          <Typography
            variant="body2"
            color="#1120A3"
            sx={{ fontWeight: "bold" }}
          >
            ชื่อที่ลงทะเบียน
          </Typography>
          <TextfieldService
            placeholder="ชื่อที่ลงทะเบียน"
            value={fullName}
            onChange={handleFullNameChange}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3} lg={2.4} xl={2.4}>
          <Typography
            variant="body2"
            color="#1120A3"
            sx={{ fontWeight: "bold" }}
          >
            วัน / เวลาที่เข้าใช้
          </Typography>
          <DateThaiPickerService
            value={loginDate}
            onChange={(val) => {
              setLoginDate(val);
            }}
            time
            placeholder="วัน / เวลาที่เข้าใช้"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3} lg={2.4} xl={2.4}>
          <Box
            mt={{
              xs: 0,
              sm: 0,
              md: 2.5,
              lg: 2.5,
              xl: 2.5,
            }}
            sx={{
              width: "100%",
              display: "flex",
              gap: 1,
            }}
          >
            <ButtonService
              label="ค้นหา"
              color="#0088FF"
              iconRight={<Search />}
              onClick={handleSearch}
              sx={{
                backgroundColor: "#2196F3",
                color: "#FFF",
                borderRadius: "15px",
                flex: 1, // ใช้ flex แทน width
                minWidth: 120,
                height: "42px",
                fontSize: "20px",
                whiteSpace: "nowrap",
                "&:hover": {
                  backgroundColor: "#1E88E5",
                },
              }}
            />
            <ButtonService
              iconRight={<CleaningServicesIcon />}
              label="ล้างข้อมูล"
              onClick={handleClearFilters}
              sx={{
                backgroundColor: "red",
                color: "white",
                borderRadius: "15px",
                flex: 1, // ใช้ flex แทน width
                minWidth: 120,
                height: "42px",
                fontSize: "20px",
                whiteSpace: "nowrap",
                "&:hover": {
                  backgroundColor: "red",
                },
              }}
            />
          </Box>
        </Grid>
      </Grid>

      <Box
        sx={{ padding: 3, borderRadius: 5, border: "2px solid #2499FF" }}
        mt={2}
      >
        <div className={styles.userManagement}>
          {/* Header Row */}
          <div className={styles.headerRow}>
            {" "}
            <div className={styles.headerCell}></div>
            <div className={styles.headerCell}>เลขบัตรประชาชน</div>
            <div className={styles.headerCell}>อีเมล</div>
            <div className={styles.headerCell}>ชื่อ - นามสกุลที่ลงทะเบียน</div>
            <div className={styles.headerCell}>ตำแหน่ง</div>
          </div>

          {Array.isArray(stats?.res_data) &&
            stats.res_data.map((section, idx) => (
              <div key={idx} className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>
                    <div
                      onClick={() => toggleSection(idx)}
                      className={`${styles.iconWrapper} ${
                        expandedSections[idx] ? styles.iconRotate : ""
                      }`}
                    >
                      {expandedSections[idx] ? (
                        <RemoveCircleOutlineOutlinedIcon />
                      ) : (
                        <AddCircleOutlineOutlinedIcon />
                      )}
                    </div>
                    <span>{section.role_description}</span>
                  </div>
                  <IconButton
                    className={styles.addButton}
                    onClick={handleOpenModal}
                    sx={{ padding: 0 }}
                  >
                    <img
                      src="/icons/Add.png"
                      alt="Add"
                      style={{ width: 24, height: 24 }}
                    />
                  </IconButton>
                </div>

                {expandedSections[idx] &&
                  (section.users.length === 0 ? (
                    <Box
                      sx={{
                        padding: 3,
                        borderRadius: 5,
                        border: "2px dashed #F1D079",
                        textAlign: "center",
                        marginTop: 2,
                      }}
                    >
                      <Typography variant="h6" color="#1120A3">
                        ไม่มีข้อมูล
                      </Typography>
                    </Box>
                  ) : (
                    section.users.map((user, userIdx) => (
                      <div key={user.id} className={styles.userRow}>
                        <div className={styles.userContainer}>
                          <div className={styles.userInfo}>
                            <div className={styles.userCell}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <span>
                                  {citizenIdVisibility[user.id]
                                    ? formatFullCitizenId(user.citizen_id)
                                    : formatMaskedCitizenId(user.citizen_id)}
                                </span>
                                <IconButton
                                  onClick={() =>
                                    toggleCitizenIdVisibility(user.id)
                                  }
                                  size="small"
                                  sx={{
                                    padding: "2px",
                                    color: "#1120A3",
                                    "&:hover": {
                                      backgroundColor: "rgba(17, 32, 163, 0.1)",
                                    },
                                  }}
                                >
                                  {citizenIdVisibility[user.id] ? (
                                    <VisibilityOff fontSize="small" />
                                  ) : (
                                    <Visibility fontSize="small" />
                                  )}
                                </IconButton>
                              </div>
                            </div>
                            <div className={styles.userCell} style={{wordBreak: "break-word",whiteSpace: "normal",lineHeight: "1.4",}}>
                              {user.email}
                            </div>
                            <div className={styles.userCell}>
                              {user.full_name_with_title}
                            </div>
                            <div className={styles.roleActions}>
                              <div className={styles.role}>
                                {roles.find(
                                  (role) => role.role_name === section.role_name
                                )?.role_description || section.role_name}
                              </div>

                              <div className={styles.actionButtons}>
                                {/* Arrow Button for Details Toggle */}
                                <button
                                  className={styles.actionButton}
                                  onClick={() => toggleUserDetails(user.id)}
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
                                    transition: "all 0.3s ease",
                                  }}
                                >
                                  <Image
                                    src="/icons/arrowyellow.png"
                                    alt="Toggle Details"
                                    width={25}
                                    height={26}
                                    style={{
                                      transform: userDetailsExpanded[user.id]
                                        ? "rotate(180deg)"
                                        : "rotate(0deg)",
                                      transition: "transform 0.3s ease",
                                    }}
                                  />
                                </button>

                                {/* Edit Button */}
                                <button
                                  className={styles.actionButton}
                                  onClick={() => handleEditUser(user)}
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
                                  }}
                                >
                                  <Image
                                    src="/icons/PencilYellow.png"
                                    alt="Edit User"
                                    width={25}
                                    height={26}
                                  />
                                </button>

                                {/* Delete Button */}
                                <button
                                  className={styles.actionButton}
                                  onClick={() => handleDeleteUser(user)}
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
                                  }}
                                >
                                  <Image
                                    src="/icons/binyellow.png"
                                    alt="Delete User"
                                    width={25}
                                    height={26}
                                  />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* User Details - Show/Hide based on userDetailsExpanded state */}
                          {userDetailsExpanded[user.id] && (
                            <div className={styles.userDetails}>
                              <div className={styles.detailsColumn}>
                                <div className={styles.detailRow}>
                                  <span className={styles.detailLabel}>
                                    ชื่อ - นามสกุล:
                                  </span>{" "}
                                  {user.full_name_with_title}
                                </div>
                                <div className={styles.detailRow}>
                                  <span className={styles.detailLabel}>
                                    เลขบัตรประชาชน:
                                  </span>{" "}
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                    }}
                                  >
                                    <span>
                                      {citizenIdVisibility[user.id]
                                        ? formatFullCitizenId(user.citizen_id)
                                        : formatMaskedCitizenId(
                                            user.citizen_id
                                          )}
                                    </span>
                                    <IconButton
                                      onClick={() =>
                                        toggleCitizenIdVisibility(user.id)
                                      }
                                      size="small"
                                      sx={{
                                        padding: "2px",
                                        color: "#1120A3",
                                        "&:hover": {
                                          backgroundColor:
                                            "rgba(17, 32, 163, 0.1)",
                                        },
                                      }}
                                    >
                                      {citizenIdVisibility[user.id] ? (
                                        <VisibilityOff fontSize="small" />
                                      ) : (
                                        <Visibility fontSize="small" />
                                      )}
                                    </IconButton>
                                  </div>
                                </div>
                                <div className={styles.detailRow}>
                                  <span className={styles.detailLabel}>
                                    อีเมล:
                                  </span>{" "}
                                  {user.email}
                                </div>
                                <div className={styles.detailRow}>
                                  <span className={styles.detailLabel}>
                                    หมายเลขโทรศัพท์:
                                  </span>{" "}
                                  {formatPhoneNumber_null(user.phone)}
                                </div>
                              </div>
                              <div className={styles.detailsColumn}>
                                <div className={styles.detailRow}>
                                  <span className={styles.detailLabel}>
                                    ที่อยู่ตามบัตรประชาชน:
                                  </span>{" "}
                                  #
                                </div>

                                <div className={styles.detailRow}>
                                  <span className={styles.detailLabel}>
                                    ที่อยู่ที่ติดต่อได้:
                                  </span>{" "}
                                  #
                                </div>
                                <div className={styles.detailRow}>
                                  <span className={styles.detailLabel}>
                                    แก้ไขครั้งล่าสุด:
                                  </span>{" "}
                                  {formatThaiDateTime(user.updated_at)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ))}
              </div>
            ))}
        </div>
      </Box>

      {/* Modal Component */}
      <AddUserModal
        open={openModal}
        onClose={handleCloseModal}
        editingUser={editingUser} // ส่งข้อมูลผู้ใช้ที่จะแก้ไข
        onUserUpdated={fetchStats} // Callback เมื่อบันทึกข้อมูลสำเร็จ
        onReopen={handleReopenModal}
      />
    </Box>
  );
}
