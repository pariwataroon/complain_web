import React, { useState, useEffect } from "react";
import styles from "./UserManagement.module.scss";
import { Box, Typography, Grid, IconButton } from "@mui/material";
import SelectMenuService from "@services/SelectMenu/SelectMenu";
import TextfieldService from "@services/TextfieldService/TextfieldService";
import ButtonService from "@services/ButtonService/ButtonService";
import { Search } from "@mui/icons-material";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import RemoveCircleOutlineOutlinedIcon from "@mui/icons-material/RemoveCircleOutlineOutlined";
import AddUserModal from "./modal/AddUserModal";
import {
  GetDetailedStatsbyRole,
  DelUsers,
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

const mockData = {
  admin: [
    {
      permission: "admin_mof",
      username: "admin_mof",
      displayName: "นาย A",
      roleName: "ผู้ดูแลระบบ",
      expanded: true,
      details: {
        password: "admin123",
        fullName: "นาย A",
        idCard: "0-0000-0000-001",
        email: "admin@example.com",
        phone: "000-000-0001",
        addressCard: "บ้านเลขที่ 1 ถนน X",
        addressContact: "บ้านเลขที่ 1 ถนน X",
        lastUpdated: "10 พ.ค. 2568",
      },
    },
  ],
  public: [
    {
      permission: "public_mof",
      username: "nana_public",
      displayName: "ณัฎฐิรา วอนานนท์",
      roleName: "ประชาชน",
      expanded: true,
      details: {
        password: "123456789",
        fullName: "ณัฎฐิรา วอนานนท์",
        idCard: "0-0000-0000-000",
        email: "nnnnn_n@hotmail.com",
        phone: "000-000-0000",
        addressCard: "บ้านเลขที่00 ถนน xxx ซอย 00",
        addressContact: "บ้านเลขที่00 ถนน xxx ซอย 00",
        lastUpdated: "01 ม.ค. 2568",
      },
    },
  ],
  executive: [
    {
      permission: "executive_mof",
      username: "executive_mof",
      displayName: "นาย B",
      roleName: "ผู้บริหาร",
      expanded: true,
      details: {
        password: "executive123",
        fullName: "นาย B",
        idCard: "0-0000-0000-002",
        email: "executive@example.com",
        phone: "000-000-0002",
        addressCard: "บ้านเลขที่ 2 ถนน Y",
        addressContact: "บ้านเลขที่ 2 ถนน Y",
        lastUpdated: "15 มิ.ย. 2568",
      },
    },
  ],
  agency: [],
  officer: [],
};

const sections = [
  {
    title: "ผู้ดูแลระบบ (แอดมิน)",
    users: mockData.admin,
  },
  {
    title: "ประชาชน",
    users: mockData.public,
  },
  {
    title: "ผู้บริหาร / ผู้สนงาน",
    users: mockData.executive,
  },
  {
    title: "หน่วยงานในสังกัด",
    users: mockData.agency,
  },
  {
    title: "เจ้าหน้าที่ สรร.",
    users: mockData.officer,
  },
];

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

export default function UserManagementUI() {
  const [stats, setStats] = useState([]);
  const [originalStats, setOriginalStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [userDetailsExpanded, setUserDetailsExpanded] = useState({}); // Track user details expansion

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await GetDetailedStatsbyRole();
        setStats(data);
        setOriginalStats(data);
        // Initialize expanded sections - all collapsed by default (false)
        if (data?.res_data) {
          setExpandedSections(new Array(data.res_data.length).fill(false));
        }
      } catch (err) {
        console.error("โหลดข้อมูลไม่สำเร็จ:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
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
    } catch (err) {
      console.error("โหลดข้อมูลไม่สำเร็จ:", err);
      alertError("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      closeAlert();
      setLoading(false);
    }
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
  const [formData, setFormData] = useState({
    password: "",
    group: "",
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    district: "",
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

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

  const [permission, setPermission] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [fullName, setFullName] = useState("");
  const [loginDate, setLoginDate] = useState("");

  // Options for the dropdown
  const permissionOptions = [
    { value: "all", label: "ทั้งหมด" },
    { value: "admin", label: "ผู้ดูแลระบบ" },
    { value: "people", label: "ประชาชน" },
    { value: "admin_home", label: "ผู้ดูแลหน้าหลัก" },
    { value: "executive", label: "ผู้บริหาร" },
    { value: "agency", label: "หน่วยงานในสังกัด" },
    { value: "officer", label: "เจ้าหน้าที่" },
  ];

  const roleNameMap = {
    admin: "ผู้ดูแลระบบ",
    people: "ประชาชน",
    admin_home: "ผู้ดูแลหน้าหลัก",
    executive: "ผู้บริหาร",
    agency: "หน่วยงานในสังกัด",
    officer: "เจ้าหน้าที่",
    staff: "เจ้าหน้าที่ สรร.",
    supervisor: "ผู้บริหาร / ผู้สั่งงาน",
    department: "หน่วยงานในสังกัด",
  };

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

  const handleLoginDateChange = (event) => {
    setLoginDate(event.target.value);
  };

  // Search function
  const handleSearch = () => {
    showLoading("กำลังค้นหา...");
    setHasSearched(true); // Mark that user has searched

    setTimeout(() => {
      if (!originalStats?.res_data) {
        closeAlert();
        return;
      }

      let filteredData;
      let foundUserIds = []; // เก็บ ID ของผู้ใช้ที่เจอ

      // ถ้าเลือกสิทธิ์เฉพาะ (ไม่ใช่ "ทั้งหมด")
      if (permission && permission !== "all") {
        // แสดงเฉพาะกลุ่มสิทธิ์ที่เลือก
        filteredData = originalStats.res_data
          .filter((section) => section.role_name === permission)
          .map((section) => {
            const filteredUsers = section.users.filter((user) => {
              // Filter by display name (full_name)
              const matchesDisplayName =
                !displayName ||
                (user.full_name &&
                  user.full_name
                    .toLowerCase()
                    .includes(displayName.toLowerCase()));

              // Filter by full name (full_name_with_title)
              const matchesFullName =
                !fullName ||
                (user.full_name_with_title &&
                  user.full_name_with_title
                    .toLowerCase()
                    .includes(fullName.toLowerCase()));

              // Filter by login date
              const matchesLoginDate =
                !loginDate ||
                (user.last_login && user.last_login.includes(loginDate)) ||
                (user.updated_at &&
                  formatThaiDateTime(user.updated_at).includes(loginDate));

              const matches =
                matchesDisplayName && matchesFullName && matchesLoginDate;

              // เก็บ ID ของผู้ใช้ที่เจอ
              if (matches) {
                foundUserIds.push(user.id);
              }

              return matches;
            });

            return {
              ...section,
              users: filteredUsers,
            };
          })
          .filter((section) => section.users.length > 0); // แสดงเฉพาะกลุ่มที่มีข้อมูล

        // เปิด collapse สำหรับกลุ่มที่แสดง
        setExpandedSections(new Array(filteredData.length).fill(true));
      } else {
        // แสดงทั้งหมด (เหมือนเดิม)
        filteredData = originalStats.res_data
          .map((section) => {
            const filteredUsers = section.users.filter((user) => {
              // Filter by display name (full_name)
              const matchesDisplayName =
                !displayName ||
                (user.full_name &&
                  user.full_name
                    .toLowerCase()
                    .includes(displayName.toLowerCase()));

              // Filter by full name (full_name_with_title)
              const matchesFullName =
                !fullName ||
                (user.full_name_with_title &&
                  user.full_name_with_title
                    .toLowerCase()
                    .includes(fullName.toLowerCase()));

              // Filter by login date
              const matchesLoginDate =
                !loginDate ||
                (user.last_login && user.last_login.includes(loginDate)) ||
                (user.updated_at &&
                  formatThaiDateTime(user.updated_at).includes(loginDate));

              const matches =
                matchesDisplayName && matchesFullName && matchesLoginDate;

              // เก็บ ID ของผู้ใช้ที่เจอ
              if (matches) {
                foundUserIds.push(user.id);
              }

              return matches;
            });

            return {
              ...section,
              users: filteredUsers,
            };
          })
          .filter((section) => section.users.length > 0); // แสดงเฉพาะกลุ่มที่มีข้อมูล

        // เปิด collapse ทั้งหมด
        setExpandedSections(new Array(filteredData.length).fill(true));
      }

      // เปิด user details ของผู้ใช้ที่เจอทั้งหมด
      const newUserDetailsExpanded = {};
      foundUserIds.forEach((userId) => {
        newUserDetailsExpanded[userId] = true;
      });
      setUserDetailsExpanded(newUserDetailsExpanded);

      setStats({ ...originalStats, res_data: filteredData });
      closeAlert();
    }, 800);
  };

  // State for showing/hiding passwords
  const [userPasswordVisibility, setUserPasswordVisibility] = useState(() => {
    return sections.map(
      (section) => section.users.map(() => false) // Default all users' password hidden
    );
  });

  const togglePasswordVisibility = (sectionIndex, userIdx) => {
    const updatedVisibility = [...userPasswordVisibility];
    updatedVisibility[sectionIndex][userIdx] =
      !updatedVisibility[sectionIndex][userIdx];
    setUserPasswordVisibility(updatedVisibility);
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

  // Handle Open Modal for Edit User
  const handleEditUser = (user) => {
    showLoading("กำลังโหลดข้อมูล...");
    setTimeout(() => {
      // สร้าง object ที่มีข้อมูลครบสำหรับ Modal
      const completeUserData = {
        id: user.id,
        citizen_id: user.citizen_id,
        username:
          user.username ||
          (user.citizen_id ? user.citizen_id.replace(/-/g, "") : ""),
        full_name: user.full_name,
        full_name_with_title: user.full_name_with_title,

        // แมป role_name ให้ตรงกับ section.role_name ที่มาจาก API
        role_name: getRoleNameFromSection(user, stats), // ดึงจาก section ที่ user อยู่

        // ตำแหน่ง - ลองหาจากหลายๆ field
        position:
          user.position ||
          user.job_title ||
          user.title ||
          roleNameMap[getRoleNameFromSection(user, stats)] ||
          "ไม่ระบุ",

        phone: user.phone,
        email: user.email,
        address: user.address || "",
        contact_address: user.contact_address || user.address || "",
        profile_image: user.profile_image || "",
        last_login: user.last_login,
        updated_at: user.updated_at,

        // ข้อมูลเพิ่มเติมที่อาจจะใช้
        address_card: user.address_card || user.address || "",
        address_contact: user.address_contact || user.contact_address || "",
      };

      setEditingUser(completeUserData); // ส่งข้อมูลที่ครบถ้วน
      setOpenModal(true);
      closeAlert();
    }, 300);
  };

  // Helper function เพื่อหา role_name จาก section ที่ user อยู่
  const getRoleNameFromSection = (user, statsData) => {
    if (!statsData?.res_data) return "";

    for (const section of statsData.res_data) {
      const foundUser = section.users.find((u) => u.id === user.id);
      if (foundUser) {
        return section.role_name;
      }
    }
    return "";
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
            options={permissionOptions}
            handleChange={handlePermissionChange}
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
          <TextfieldService
            placeholder="วัน / เวลาที่เข้าใช้"
            value={loginDate}
            onChange={handleLoginDateChange}
          />
        </Grid>

        {/* แถวสุดท้าย: ปุ่มค้นหา */}
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
                width: "100%",
                height: "42px",
                fontSize: "20px",
                "&:hover": {
                  backgroundColor: "#1E88E5",
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
            <div className={styles.headerCell}>ชื่อผู้ใช้งานในระบบ</div>
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
                              {formatMaskedCitizenId(user.citizen_id)}
                            </div>
                            <div className={styles.userCell}>
                              {user.full_name}
                            </div>
                            <div className={styles.userCell}>
                              {user.full_name_with_title}
                            </div>
                            <div className={styles.roleActions}>
                              <div className={styles.role}>
                                {roleNameMap[section.role_name]}
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
                                    src="/icons/pencilyellow.png"
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
                                  {formatMaskedCitizenId(user.citizen_id)}
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
      />
    </Box>
  );
}
