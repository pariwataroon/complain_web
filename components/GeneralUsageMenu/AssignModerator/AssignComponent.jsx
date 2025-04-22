import React, { useState } from "react";
import styles from "./UserManagement.module.scss";
import { Box, Typography, Grid, IconButton } from "@mui/material";
import SelectMenuService from "@services/SelectMenu/SelectMenu";
import TextfieldService from "@services/TextfieldService/TextfieldService";
import ButtonService from "@services/ButtonService/ButtonService";
import { Search } from "@mui/icons-material";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import RemoveCircleOutlineOutlinedIcon from "@mui/icons-material/RemoveCircleOutlineOutlined";
import AddUserModal from "./modal/AddUserModal";
import AddIcon from "@mui/icons-material/Add";

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
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
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

          {/* Section Groups */}
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className={styles.section}>
              {/* Section Header */}
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                  <div
                    onClick={() => toggleSection(sectionIndex)}
                    className={`${styles.iconWrapper} ${
                      expandedSections[sectionIndex] ? styles.iconRotate : ""
                    }`}
                  >
                    {expandedSections[sectionIndex] ? (
                      <RemoveCircleOutlineOutlinedIcon />
                    ) : (
                      <AddCircleOutlineOutlinedIcon />
                    )}
                  </div>
                  <span>{section.title}</span>
                </div>
                <IconButton
                  className={styles.addButton}
                  onClick={handleOpenModal}
                >
                  <img
                    src="/icons/Add.png"
                    alt="Add"
                    style={{ width: "24px", height: "24px" }}
                  />
                </IconButton>
                <AddUserModal
                  className={styles.addButton}
                  open={openModal}
                  onClose={handleCloseModal}
                />
              </div>

              {/* User Rows - Only show if section is expanded */}
              {expandedSections[sectionIndex] &&
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
                    <div key={userIdx} className={styles.userRow}>
                      <div className={styles.userContainer}>
                        <div className={styles.userInfo}>
                          <div className={styles.userCell}>
                            {user.permission}
                          </div>
                          <div className={styles.userCell}>{user.username}</div>
                          <div className={styles.userCell}>
                            {user.displayName}
                          </div>
                          <div className={styles.roleActions}>
                            <div className={styles.role}>{user.roleName}</div>
                            <div className={styles.actionButtons}>
                              <button className={styles.actionButton}>✓</button>
                              <button className={styles.actionButton}>✎</button>
                              <button className={styles.actionButton}>×</button>
                            </div>
                          </div>
                        </div>

                        {/* Expanded User Details */}
                        {user.expanded && user.details && (
                          <div className={styles.userDetails}>
                            <div className={styles.detailsColumn}>
                              <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>
                                  Password :
                                </span>
                                <span className={styles.detailValue}>
                                  <span
                                    style={{
                                      border: "none",
                                      background: "transparent",
                                    }}
                                  >
                                    {userPasswordVisibility[sectionIndex][
                                      userIdx
                                    ]
                                      ? user.details.password
                                      : "************"}
                                  </span>
                                  <IconButton
                                    onClick={() =>
                                      togglePasswordVisibility(
                                        sectionIndex,
                                        userIdx
                                      )
                                    }
                                    sx={{ padding: 0, margin: 0 }}
                                  >
                                    {userPasswordVisibility[sectionIndex][
                                      userIdx
                                    ] ? (
                                      <VisibilityOff />
                                    ) : (
                                      <Visibility />
                                    )}
                                  </IconButton>
                                </span>
                              </div>
                              <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>
                                  ชื่อ - นามสกุล :
                                </span>
                                <span className={styles.detailValue}>
                                  {user.details.fullName}
                                </span>
                              </div>
                              <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>
                                  เลขบัตรประชาชน :
                                </span>
                                <span className={styles.detailValue}>
                                  {user.details.idCard}
                                </span>
                              </div>
                              <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>
                                  อีเมล :
                                </span>
                                <span className={styles.detailValue}>
                                  {user.details.email}
                                </span>
                              </div>
                              <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>
                                  หมายเลขโทรศัพท์ :
                                </span>
                                <span className={styles.detailValue}>
                                  {user.details.phone}
                                </span>
                              </div>
                            </div>
                            <div className={styles.detailsColumn}>
                              <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>
                                  ที่อยู่ตามบัตรประชาชน :
                                </span>
                                <span className={styles.detailValue}>
                                  {user.details.addressCard}
                                </span>
                              </div>
                              <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>
                                  ที่อยู่ที่ติดต่อได้ :
                                </span>
                                <span className={styles.detailValue}>
                                  {user.details.addressContact}
                                </span>
                              </div>
                              <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>
                                  แก้ไขครั้งล่าสุด :
                                </span>
                                <span className={styles.detailValue}>
                                  {user.details.lastUpdated}
                                </span>
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
    </Box>
  );
}
