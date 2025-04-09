import React, { useState } from "react";
import styles from "./UserManagement.module.scss";
import { Box, Typography, Grid } from "@mui/material";
import SelectMenuService from "@services/SelectMenu/SelectMenu";
import TextfieldService from "@services/TextfieldService/TextfieldService";
import ButtonService from "@services/ButtonService/ButtonService";
import { Search } from "@mui/icons-material";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";

const mockData = [
  {
    permission: "กกกก_mof",
    username: "nana_mof",
    displayName: "ณัฎฐิรา วอนานนท์ณัฎรัต",
    roleName: "ประชาชน",
    expanded: true,
    details: {
      password: "************",
      fullName: "ณัฎฐิรา วอนานนท์ณัฎรัต",
      idCard: "0-0000-0000-000",
      email: "nnnnn_n@hotmail.com",
      phone: "000-000-0000",
      addressCard:
        "บ้านเลขที่00 ถนน xxx ซอย 00 แขวงวัฒนนคร เขตวัฒนนา กรุงเทพมหานคร 10120",
      addressContact:
        "บ้านเลขที่00 ถนน xxx ซอย 00 แขวงวัฒนนคร เขตวัฒนนา กรุงเทพมหานคร 10120",
      lastUpdated: "01 ม.ค. 2568",
    },
  },
  {
    permission: "กกกก_mof",
    username: "nana_mof",
    displayName: "ณัฎฐิรา วอนานนท์ณัฎรัต",
    roleName: "ประชาชน",
    expanded: false,
  },
  {
    permission: "กกกก_mof",
    username: "nana_mof",
    displayName: "ณัฎฐิรา วอนานนท์ณัฎรัต",
    roleName: "ประชาชน",
    expanded: false,
  },
];

// Group sections based on the image
const sections = [
  {
    title: "ประชาชน",
    expanded: true,
    users: mockData,
  },
  {
    title: "ผู้ดูแลระบบ (แอดมิน)",
    expanded: true,
    users: mockData.slice(0, 3),
  },
  {
    title: "ผู้ดูแลหน้าหลัก (แอดมิน Home page)",
    expanded: true,
    users: [],
  },
  {
    title: "ผู้บริหาร / ผู้สนงาน",
    expanded: true,
    users: [],
  },
  {
    title: "หน่วยงานในสังกัด",
    expanded: true,
    users: [],
  },
  {
    title: "เจ้าหน้าที่ สรร.",
    expanded: true,
    users: [],
  },
];

const breadcrumbItems = [
  {
    label: "เมนูกำหนดการใช้งานทั่วไป",
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
              xs: 0, // Margin-top 2 สำหรับขนาดหน้าจอ xs
              sm: 0, // Margin-top 2.5 สำหรับขนาดหน้าจอ sm
              md: 2.5, // Margin-top 3 สำหรับขนาดหน้าจอ md
              lg: 2.5, // Margin-top 3.5 สำหรับขนาดหน้าจอ lg
              xl: 2.5, // Margin-top 4 สำหรับขนาดหน้าจอ xl
            }}
            sx={{
              width: {
                xs: "100%", // ความกว้าง 100% สำหรับขนาดหน้าจอ xs
                sm: "100%", // ความกว้าง 100% สำหรับขนาดหน้าจอ sm
                md: "80%", // ความกว้าง 80% สำหรับขนาดหน้าจอ md
                lg: "70%", // ความกว้าง 70% สำหรับขนาดหน้าจอ lg
                xl: "60%", // ความกว้าง 60% สำหรับขนาดหน้าจอ xl
              },
            }}
          >
            <ButtonService
              label="ค้นหา"
              color="#0088FF"
              iconRight={<Search />}
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
              <div
                className={styles.sectionHeader}
                onClick={() => toggleSection(sectionIndex)}
              >
                <div className={styles.sectionTitle}>
                  <div className={styles.circleIcon}>○</div>
                  <span>{section.title}</span>
                </div>
                <div className={styles.addButton}>+</div>
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
                                  {user.details.password}
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
