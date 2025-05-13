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
import { GetDetailedStatsbyRole, DelUsers } from "@pages/api/settinggeneral/users";
import { formatThaiDateTime, formatPhoneNumber_null, formatCitizenId_null } from "@utils/Formats";
import { showLoading, closeAlert, alertError, alertSuccess, showConfirm } from "@utils/Alerts";

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

export default function UserManagementUI() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await GetDetailedStatsbyRole();
        setStats(data);        
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
  
  

  const [expandedSections, setExpandedSections] = useState(
    sections.map((section) => section.expanded)
  );
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    group: "",
    fullName: "",
    idCard: "",
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

  const [permission, setPermission] = useState("");

  // Options for the dropdown
  const permissionOptions = [
    { value: "all", label: "ทั้งหมด" },
    { value: "admin", label: "ผู้ดูแลระบบ" },
    { value: "public", label: "ประชาชน" },
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


  // Handle change event
  const handlePermissionChange = (event) => {
    setPermission(event.target.value);
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

  const [openModal, setOpenModal] = useState(false);
  const handleOpenModal = () => {
    showLoading("กำลังโหลด...");
    setTimeout(() => {
      setOpenModal(true);
      closeAlert();
    }, 300);
  };
  

  const handleCloseModal = () => {
    setOpenModal(false);
    closeAlert();
  };

  return (
    <Box>
      <Grid size={{ xs: 12 }}>
        <BreadcrumbsService items={breadcrumbItems} />
      </Grid>
      <Grid container spacing={2}>
        {/* แถวที่ 1: สิทธิการใช้งาน + Username */}
        <Grid item xs={12} sm={6} md={3} lg={1.5} xl={1.5}>
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

        <Grid item xs={12} sm={6} md={3} lg={1.5} xl={1.5}>
          <Typography
            variant="body2"
            color="#1120A3"
            sx={{ fontWeight: "bold" }}
          >
            Username
          </Typography>
          <TextfieldService placeholder="Username" />
        </Grid>

        {/* แถวที่ 2: เลขบัตรประชาชน + ชื่อผู้ใช้งานในระบบ */}
        <Grid item xs={12} sm={6} md={3} lg={1.5} xl={1.5}>
          <Typography
            variant="body2"
            color="#1120A3"
            sx={{ fontWeight: "bold" }}
          >
            เลขบัตรประชาชน
          </Typography>
          <TextfieldService placeholder="เลขบัตรประชาชน" />
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          md={3}
          lg={1.5}
          xl={1.5}
          sx={{ fontWeight: "bold" }}
        >
          <Typography variant="body2" color="#1120A3">
            ชื่อผู้ใช้งานในระบบ
          </Typography>
          <TextfieldService placeholder="ชื่อผู้ใช้งานในระบบ" />
        </Grid>

        {/* แถวที่ 3: ชื่อที่ลงทะเบียน + วัน / เวลาที่เข้าใช้ */}
        <Grid
          item
          xs={12}
          sm={6}
          md={3}
          lg={1.5}
          xl={1.5}
          sx={{ fontWeight: "bold" }}
        >
          <Typography
            variant="body2"
            color="#1120A3"
            sx={{ fontWeight: "bold" }}
          >
            ชื่อที่ลงทะเบียน
          </Typography>
          <TextfieldService placeholder="ชื่อที่ลงทะเบียน" />
        </Grid>

        <Grid item xs={12} sm={6} md={3} lg={1.5} xl={1.5}>
          <Typography
            variant="body2"
            color="#1120A3"
            sx={{ fontWeight: "bold" }}
          >
            วัน / เวลาที่เข้าใช้
          </Typography>
          <TextfieldService placeholder="วัน / เวลาที่เข้าใช้" />
        </Grid>

        {/* แถวสุดท้าย: ปุ่มค้นหา */}
        <Grid item xs={12} sm={6} md={3} lg={1.5} xl={1.5}>
          <Box
            mt={{
              xs: 0,
              sm: 0,
              md: 2.5,
              lg: 2.5,
              xl: 2.5,
            }}
            sx={{
              width: {
                xs: "100%",
                sm: "100%",
                md: "80%",
                lg: "70%",
                xl: "60%",
              },
            }}
          >
            <ButtonService
              label="ค้นหา"
              color="#0088FF"
              iconRight={<Search />}
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
            <div className={styles.headerCell}>สิทธิการใช้งาน</div>
            <div className={styles.headerCell}>Username</div>
            <div className={styles.headerCell}>ชื่อผู้ใช้งานในระบบ</div>
            <div className={styles.headerCell}>ชื่อ - นามสกุลที่ลงทะเบียน</div>
            <div className={styles.headerCell}>ตำแหน่ง</div>
          </div>

          {Array.isArray(stats?.res_data) && stats.res_data.map((section, idx) => (
            <div key={idx} className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                  <div onClick={() => toggleSection(idx)} className={`${styles.iconWrapper} ${expandedSections[idx] ? styles.iconRotate : ""}`}>
                    {expandedSections[idx] ? <RemoveCircleOutlineOutlinedIcon /> : <AddCircleOutlineOutlinedIcon />}
                  </div>
                  <span>{section.role_description}</span>
                </div>
                <IconButton className={styles.addButton} onClick={handleOpenModal}>
                  <img src="/icons/Add.png" alt="Add" style={{ width: 24, height: 24 }} />
                </IconButton>
                <AddUserModal open={openModal} onClose={handleCloseModal} />
              </div>

              {expandedSections[idx] && (section.users.length === 0 ? (
                <Box sx={{ padding: 3, borderRadius: 5, border: "2px dashed #F1D079", textAlign: "center", marginTop: 2 }}>
                  <Typography variant="h6" color="#1120A3">ไม่มีข้อมูล</Typography>
                </Box>
              ) : (
                section.users.map((user, userIdx) => (
                  <div key={user.id} className={styles.userRow}>
                    <div className={styles.userContainer}>
                      <div className={styles.userInfo}>
                        <div className={styles.userCell}>{section.role_name}</div>
                        <div className={styles.userCell}>{section.role_name}</div>
                        <div className={styles.userCell}>{user.full_name}</div>
                        <div className={styles.roleActions}>
                          <div className={styles.role}>{roleNameMap[section.role_name]}</div>
                          <div className={styles.actionButtons}>
                            <button className={styles.actionButton}>✓</button>
                            <button className={styles.actionButton}>✎</button>
                            <button
                              className={styles.actionButton}
                              onClick={() => handleDeleteUser(user)}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className={styles.userDetails}>
                        <div className={styles.detailsColumn}>
                          <div className={styles.detailRow}><span className={styles.detailLabel}>Password:</span> #</div>
                          <div className={styles.detailRow}><span className={styles.detailLabel}>ชื่อ - นามสกุล:</span> {user.full_name_with_title}</div>
                          <div className={styles.detailRow}><span className={styles.detailLabel}>เลขบัตรประชาชน:</span> {formatCitizenId_null(user.citizen_id)}</div>
                          <div className={styles.detailRow}><span className={styles.detailLabel}>อีเมล:</span> {user.email}</div>
                          <div className={styles.detailRow}><span className={styles.detailLabel}>หมายเลขโทรศัพท์:</span> {formatPhoneNumber_null(user.phone)}</div>
                        </div>
                        <div className={styles.detailsColumn}>
                          <div className={styles.detailRow}><span className={styles.detailLabel}>ที่อยู่ตามบัตรประชาชน:</span> #</div>

                          <div className={styles.detailRow}><span className={styles.detailLabel}>ที่อยู่ที่ติดต่อได้:</span> #</div>
                          <div className={styles.detailRow}><span className={styles.detailLabel}>แก้ไขครั้งล่าสุด:</span> {formatThaiDateTime(user.updated_at)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ))}
            </div>
          ))}
        </div>
      </Box>
    </Box>
  );
}
