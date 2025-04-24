import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  Checkbox,
  FormControlLabel,
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import HomeIcon from "@mui/icons-material/Home";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete"; // Icon for trash can
import { keyframes } from "@mui/system"; // For creating animations
import SelectMenuService from "@services/SelectMenu/SelectMenu";
import ButtonService from "@services/ButtonService/ButtonService";
import TextfieldService from "@services/TextfieldService/TextfieldService";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import Diversity3OutlinedIcon from "@mui/icons-material/Diversity3Outlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import PortraitOutlinedIcon from "@mui/icons-material/PortraitOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DriveFileRenameOutlineOutlinedIcon from "@mui/icons-material/DriveFileRenameOutlineOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import MoveToInboxOutlinedIcon from "@mui/icons-material/MoveToInboxOutlined";
import { getRoles } from "@pages/api/role/role";

const rotateOpen = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(45deg);
  }
`;

const rotateClose = keyframes`
  from {
    transform: rotate(45deg);
  }
  to {
    transform: rotate(0deg);
  }
`;

const SetRole = () => {
  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("ผู้ร่วมแอดมิน");
  const [openDeleteModal, setOpenDeleteModal] = useState(false); // Added this state
  const [groupToDelete, setGroupToDelete] = useState(null);
  // Handle modal open/close
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  const [sections, setSections] = useState([
    {
      id: 1,
      title: "Home page",
      icon: <Diversity3OutlinedIcon />,
      items: [],
      open: false,
    },
    {
      id: 2,
      title: "Dashboard",
      icon: <DashboardOutlinedIcon />,
      items: [],
      open: false,
    },
    {
      id: 3,
      title: "กำหนดการใช้งานทั่วไป",
      icon: <TuneOutlinedIcon />,
      items: [
        { name: "กำหนดระยะเวลา", icon: <HourglassEmptyOutlinedIcon /> },
        { name: "กำหนดผู้ใช้งาน", icon: <PersonOutlineOutlinedIcon /> },
        { name: "กำหนดสิทธิ์การเข้าถึง", icon: <MenuOutlinedIcon /> },
        { name: "กำหนดหน่วยงานในสังกัด", icon: <PortraitOutlinedIcon /> },
        { name: "กำหนดวันหยุด", icon: <CalendarMonthOutlinedIcon /> },
      ],
      open: false,
    },
    {
      id: 4,
      title: "จัดการข้อมูลในระบบ",
      icon: <DriveFileRenameOutlineOutlinedIcon />,
      items: [
        { name: "สืบค้นเรื่องร้องเรียน", icon: <ArticleOutlinedIcon /> },
        {
          name: "เรื่องราวร้องทุกข์ช่องทางเว็บไซต์",
          icon: <ArticleOutlinedIcon />,
        },
        { name: "จัดการเรื่องร้องเรียน", icon: <ArticleOutlinedIcon /> },
        {
          name: "แบบรับเรื่องรายงานผลการพิจารณาจากหน่วยงาน",
          icon: <ArticleOutlinedIcon />,
        },
        {
          name: "ส่งออกขอทราบผลการพิจารณา/ผลความคืบหน้า ",
          icon: <ArticleOutlinedIcon />,
        },
      ],
      open: false,
    },
    {
      id: 5,
      title: "คลังเอกสาร",
      icon: <MoveToInboxOutlinedIcon />,
      items: [
        { name: "คลังเรื่องราวร้องทุกข์", icon: <MoveToInboxOutlinedIcon /> },
        { name: "คลังบัตรสนเท่ห์", icon: <MoveToInboxOutlinedIcon /> },
      ],
      open: false,
    },
    {
      id: 6,
      title: "รายงาน",
      icon: <InsertChartOutlinedIcon />,
      items: [
        { name: "รายงานติดตามสถานะ", icon: <InsertChartOutlinedIcon /> },
        {
          name: "รายงานสรุปเรื่องร้องเรียนของหน่วยงานในสังกัด",
          icon: <InsertChartOutlinedIcon />,
        },
        {
          name: "รายงานสรุปเรื่องเข้าใหม่และร้องเพิ่มทั้งหมด",
          icon: <InsertChartOutlinedIcon />,
        },
        {
          name: "รายงานสรุปเรื่องราวร้องทุกข์ของผู้ตรวจประจำปีงบประมาณ",
          icon: <InsertChartOutlinedIcon />,
        },
        {
          name: "รายงานการติดตามงานค้าง",
          icon: <InsertChartOutlinedIcon />,
        },
        {
          name: "รายงานผลการจัดการเรื่องร้องเรียนของผู้ตรวจ",
          icon: <InsertChartOutlinedIcon />,
        },
        {
          name: "รายงานสรุปเรื่องร้องเรียนประจำปีงบประมาณ",
          icon: <InsertChartOutlinedIcon />,
        },
        {
          name: "รายงานการแจ้งเตือนเจ้าหน้าที่",
          icon: <InsertChartOutlinedIcon />,
        },
      ],
      open: false,
    },
    // {
    //   id: 7,
    //   title: "การจัดการผู้ใช้",
    //   icon: <HomeIcon />,
    //   items: [
    //     { name: "เพิ่มผู้ใช้ใหม่", icon: <Diversity3OutlinedIcon /> },
    //     { name: "แก้ไขข้อมูลผู้ใช้", icon: <Diversity3OutlinedIcon /> },
    //     { name: "ลบผู้ใช้", icon: <Diversity3OutlinedIcon /> },
    //     { name: "ดูประวัติการใช้งาน", icon: <Diversity3OutlinedIcon /> },
    //     { name: "ดูสิทธิ์การเข้าถึง", icon: <Diversity3OutlinedIcon /> },
    //   ],
    //   open: false,
    // },
    // {
    //   id: 8,
    //   title: "การจัดการสิทธิ์",
    //   icon: <HomeIcon />,
    //   items: [
    //     { name: "เพิ่มสิทธิ์ผู้ใช้", icon: <Diversity3OutlinedIcon /> },
    //     { name: "แก้ไขสิทธิ์ผู้ใช้", icon: <Diversity3OutlinedIcon /> },
    //     { name: "ลบสิทธิ์ผู้ใช้", icon: <Diversity3OutlinedIcon /> },
    //     { name: "ดูสิทธิ์การเข้าถึง", icon: <Diversity3OutlinedIcon /> },
    //     {
    //       name: "จัดการการอนุญาตการเข้าถึงระบบ",
    //       icon: <Diversity3OutlinedIcon />,
    //     },
    //   ],
    //   open: false,
    // },
    // {
    //   id: 9,
    //   title: "ตั้งค่าระบบ",
    //   icon: <HomeIcon />,
    //   items: [
    //     { name: "ตั้งค่าผู้ดูแลระบบ", icon: <Diversity3OutlinedIcon /> },
    //     { name: "ตั้งค่าระบบการแจ้งเตือน", icon: <Diversity3OutlinedIcon /> },
    //     { name: "ตั้งค่าภาษา", icon: <Diversity3OutlinedIcon /> },
    //     { name: "ตั้งค่าการสำรองข้อมูล", icon: <Diversity3OutlinedIcon /> },
    //     { name: "ตั้งค่าความปลอดภัย", icon: <Diversity3OutlinedIcon /> },
    //   ],
    //   open: false,
    // },
    // {
    //   id: 10,
    //   title: "รายงานสรุปการดำเนินการ",
    //   icon: <HomeIcon />,
    //   items: [
    //     {
    //       name: "รายงานการดำเนินการประจำวัน",
    //       icon: <Diversity3OutlinedIcon />,
    //     },
    //     {
    //       name: "รายงานการดำเนินการประจำเดือน",
    //       icon: <Diversity3OutlinedIcon />,
    //     },
    //     { name: "รายงานการดำเนินการประจำปี", icon: <Diversity3OutlinedIcon /> },
    //     { name: "รายงานกิจกรรมพิเศษ", icon: <Diversity3OutlinedIcon /> },
    //   ],
    //   open: false,
    // },
  ]);

  // State for selected menu and submenu
  const [selectedMenu, setSelectedMenu] = useState({
    mainMenu: "กำหนดการใช้งานทั่วไป",
    subMenu: "กำหนดเวลาการใช้งาน",
  });

  // ฟังก์ชันในการสลับสถานะการเปิด/ปิด
  const handleToggle = (id) => {
    const newSections = sections.map((section) =>
      section.id === id ? { ...section, open: !section.open } : section
    );
    setSections(newSections);
  };

  const handleMenuItemClick = (sectionTitle, item) => {
    setSelectedMenu({
      mainMenu: sectionTitle,
      subMenu: item.name, // ส่งแค่ name ของ item, ไม่ใช่ item ทั้งตัว
    });
  };

  // Groups state with dynamic structure
  const [groups, setGroups] = useState([
    { id: 1, name: "ประชาชน", selected: false },
    { id: 2, name: "ผู้ดูแลระบบ (แอดมิน)", selected: true },
    { id: 3, name: "ผู้ดูแลหน้าหลัก (แอดมิน Home page)", selected: true },
    { id: 4, name: "เจ้าหน้าที่ สสส.", selected: false },
    { id: 5, name: "ผู้รับเรื่อง / ผู้สำรวจ", selected: false },
    { id: 6, name: "หน่วยงานในสังกัด", selected: false },
    { id: 7, name: "ผู้ร่วมแอดมิน", selected: true },
  ]);

  // Calculate next group number dynamically
  const nextGroupNumber =
    groups.length > 0 ? Math.max(...groups.map((group) => group.id)) + 1 : 1;

  // Handler for checkbox changes
  const handleGroupChange = (groupId) => {
    setGroups(
      groups.map((group) =>
        group.id === groupId ? { ...group, selected: !group.selected } : group
      )
    );
  };

  // Handler for adding a new group
  const handleAddGroup = () => {
    // Add new group with next sequential ID
    const newGroup = {
      id: nextGroupNumber,
      name: newGroupName,
      selected: false,
    };
    setGroups([...groups, newGroup]);
    setNewGroupName(""); // Reset field
    handleCloseModal();
  };

  const handleGroupDelete = (groupId) => {
    setGroupToDelete(groupId); // Set the group to be deleted
    setOpenDeleteModal(true); // Open the delete modal
  };

  const cancelDelete = () => {
    setOpenDeleteModal(false); // Close the modal without deleting
  };

  const confirmDelete = () => {
    // Remove the group from the list
    setGroups(groups.filter((group) => group.id !== groupToDelete));
    setOpenDeleteModal(false); // Close the modal after confirming delete
  };

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
      label: "กำหนดสิทธิ์การเข้าถึง",
    },
  ];

  // First, add these new state variables at the beginning of your component
  const [openUserModal, setOpenUserModal] = useState(false);
  const [openDeleteUserModal, setOpenDeleteUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [newUser, setNewUser] = useState({
    name: "",
    group: "2", // Default group ID
  });

  // Add state for individual users
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "นางสาวสุภัสร โชติพรรณ",
      groupId: "2",
      groupName: "ผู้ดูแลระบบ (แอดมิน)",
      selected: true,
    },
    // You can add more default users here
  ]);

  // Handle modal open/close for user operations
  const handleOpenUserModal = () => setOpenUserModal(true);
  const handleCloseUserModal = () => setOpenUserModal(false);

  // Handler for adding a new user
  const handleAddUser = () => {
    const groupObject = groups.find(
      (group) => group.id === parseInt(newUser.group)
    );
    const newUserObject = {
      id: users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1,
      name: newUser.name,
      groupId: newUser.group,
      groupName: groupObject ? groupObject.name : "",
      selected: false,
    };

    setUsers([...users, newUserObject]);
    setNewUser({ name: "", group: "2" }); // Reset fields
    handleCloseUserModal();
  };

  // Handler for user checkbox changes
  const handleUserChange = (userId) => {
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, selected: !user.selected } : user
      )
    );
  };

  // Handle user deletion
  const handleUserDelete = (userId) => {
    setUserToDelete(userId);
    setOpenDeleteUserModal(true);
  };

  const cancelUserDelete = () => {
    setOpenDeleteUserModal(false);
  };

  const confirmUserDelete = () => {
    setUsers(users.filter((user) => user.id !== userToDelete));
    setOpenDeleteUserModal(false);
  };

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const rolesData = await getRoles(); // เรียกใช้งานฟังก์ชัน getRoles
      setRoles(rolesData); // ตั้งค่าข้อมูล roles
      console.log("Roles data:", rolesData); // ล็อกข้อมูล
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles(); // เรียกใช้ฟังก์ชัน fetchRoles เมื่อ component ถูก mount
  }, []);
  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <BreadcrumbsService items={breadcrumbItems} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              padding: 2,
              paddingRight: "16px", // เพิ่ม Padding ด้านขวาเพื่อขยับ Scrollbar เข้าซ้าย
              backgroundColor: "#91CBFF",
              border: "2px solid #2499FF",
              borderRadius: 2,
              boxShadow: 2,
              maxHeight: "calc(100vh - 200px)",
              overflowY: "auto",
              "&::-webkit-scrollbar": {
                width: "6px", // ความกว้างของ scrollbar
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#414DB5", // สีของ thumb
                borderRadius: "10px", // ขอบโค้งมน
                margin: "8px 0", // ระยะห่างบนล่างของ thumb
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#FFFFFF", // พื้นหลังสีขาว
                marginRight: "4px", // เว้นระยะจากทางขวา
              },
            }}
          >
            {sections.map((section) => (
              <div key={section.id}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    color:
                      selectedMenu.mainMenu === section.title
                        ? "#FFFFFF"
                        : "#1120A3",

                    borderRadius:
                      selectedMenu.mainMenu === section.title ? 1 : 0,
                    padding:
                      selectedMenu.mainMenu === section.title
                        ? "4px 0"
                        : "4px 0",
                  }}
                >
                  {/* ไอคอนสำหรับเปิด/ปิดเมนู with animation */}
                  <IconButton
                    onClick={() => handleToggle(section.id)}
                    sx={{
                      marginRight: 1,
                      color:
                        selectedMenu.mainMenu === section.title
                          ? "#FFFFFF"
                          : "#1120A3",
                      animation: section.open
                        ? `${rotateOpen} 0.3s forwards`
                        : `${rotateClose} 0.3s forwards`,
                      transition: "all 0.3s ease",
                    }}
                  >
                    <AddCircleOutlineIcon />
                  </IconButton>
                  {/* ไอคอนหน้า title และทำให้สามารถคลิกได้ */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      "&:hover": {
                        opacity: 0.8,
                      },
                    }}
                    onClick={() =>
                      section.items.length > 0 &&
                      handleMenuItemClick(section.title, section.items[0].name)
                    }
                  >
                    {/* ไอคอนของ title */}
                    <Box
                      sx={{
                        color:
                          selectedMenu.mainMenu === section.title
                            ? "#FFFFFF"
                            : "#1120A3",
                      }}
                    >
                      {section.icon}
                    </Box>
                    <Box component="span" sx={{ ml: 1 }}>
                      <Typography sx={{ fontSize: "18px", fontWeight: "bold" }}>
                        {section.title}
                      </Typography>
                    </Box>
                  </Box>
                </Typography>

                <Box
                  sx={{
                    height: section.open ? "auto" : 0,
                    overflow: "hidden",
                    transition: "height 0.3s ease-in-out",
                  }}
                >
                  {section.items.map((item, index) => (
                    <Typography
                      component="span"
                      key={index}
                      sx={{
                        marginLeft: 10,
                        display: "flex",
                        alignItems: "center",
                        color:
                          selectedMenu.mainMenu === section.title &&
                          selectedMenu.subMenu === item.name
                            ? "#FFFFFF"
                            : "#1120A3",
                        cursor: "pointer",
                        padding: "4px 8px",
                        borderRadius: 1,
                        fontSize: "18px",
                        fontWeight: "bold",
                      }}
                      onClick={() => handleMenuItemClick(section.title, item)} // ส่ง item ไปให้ handleMenuItemClick
                    >
                      <Box
                        sx={{
                          color:
                            selectedMenu.mainMenu === section.title &&
                            selectedMenu.subMenu === item.name
                              ? "#FFFFFF"
                              : "#1120A3",
                          mr: 1,
                        }}
                      >
                        {item.icon} {/* แสดง icon ของ item */}
                      </Box>
                      {item.name} {/* แสดง name ของ item */}
                    </Typography>
                  ))}
                </Box>
              </div>
            ))}
          </Paper>
        </Grid>

        {/* Right Section for Form - New UI based on the yellow-framed image */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              padding: 3,
              backgroundColor: "#FFFFFF",
              borderRadius: 8,
              boxShadow: 0,
              border: "1px solid #FFC107",
            }}
          >
            <Typography
              component="span"
              variant="h6"
              sx={{
                fontWeight: "bold",
                color: "#304FFE",
                fontSize: "1.2rem",
                marginBottom: 2,
              }}
            >
              ข้อมูลเมนู
            </Typography>
            {/* Main Menu Dropdown Section */}
            <Box sx={{ mb: 2 }}>
              <Typography component="span" sx={{ color: "#304FFE", mb: 1 }}>
                เมนูหลัก
              </Typography>

              {/* ใช้ SelectMenuService แทน TextField */}
              <SelectMenuService
                options={sections.map((section) => ({
                  value: section.title,
                  label: section.title,
                }))}
                handleChange={(e) =>
                  setSelectedMenu({ ...selectedMenu, mainMenu: e.target.value })
                }
                value={selectedMenu.mainMenu}
                width="100%" // ใช้ width แบบเต็ม
                name="mainMenu"
              />
            </Box>
            {/* Sub Menu Dropdown Section */}
            <Box sx={{ mb: 4 }}>
              <Typography component="span" sx={{ color: "#304FFE", mb: 1 }}>
                เมนูย่อย
              </Typography>

              {/* ใช้ SelectMenuService แทน TextField */}
              <SelectMenuService
                options={
                  // แก้ไขตรงนี้โดยดึงค่า name จาก item
                  (
                    sections.find(
                      (section) => section.title === selectedMenu.mainMenu
                    )?.items || []
                  ).map((item) => ({
                    value: item.name, // ใช้ชื่อเป็นค่า value
                    label: item.name, // ใช้ชื่อเป็น label
                  }))
                }
                handleChange={(e) =>
                  setSelectedMenu({ ...selectedMenu, subMenu: e.target.value })
                }
                value={selectedMenu.subMenu}
                width="100%"
                name="subMenu"
              />
            </Box>
            {/* User Group Rights Section */}
            <Typography
              component="span"
              variant="h6"
              sx={{
                fontWeight: "bold",
                color: "#304FFE",
                fontSize: "1.1rem",
                mb: 2,
              }}
            >
              กำหนดสิทธิ์กลุ่มผู้ใช้งาน
            </Typography>
            {/* กำหนดสิทธิ์กลุ่มผู้ใช้งาน section - แก้ไขให้แสดง icon ลบเฉพาะกลุ่มที่ id >= 7 */}
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}
            >
              {groups.map((group) => (
                <Box
                  key={group.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={group.selected}
                        onChange={() => handleGroupChange(group.id)}
                        sx={{
                          color: "#304FFE",
                          "&.Mui-checked": {
                            color: "#304FFE",
                          },
                        }}
                      />
                    }
                    label={`กลุ่มที่ ${group.id} : ${group.name}`}
                    sx={{ color: "#304FFE" }}
                  />
                  {/* แสดงไอคอนลบเฉพาะกลุ่มที่มี id ตั้งแต่ 7 เป็นต้นไป */}
                  {group.id >= 7 && (
                    <IconButton
                      onClick={() => handleGroupDelete(group.id)}
                      sx={{
                        color: "red",
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              ))}

              {/* Dynamic Add group button */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  color: "#304FFE",
                  cursor: "pointer",
                  ml: 1,
                }}
                onClick={handleOpenModal}
              >
                <AddIcon fontSize="small" sx={{ mr: 0.5 }} />
                <Typography component="span">
                  เพิ่มกลุ่มที่ {nextGroupNumber}
                </Typography>
              </Box>
            </Box>

            <Typography
              component="span"
              variant="h6"
              sx={{
                fontWeight: "bold",
                color: "#304FFE",
                fontSize: "1.1rem",
                mb: 2,
              }}
            >
              กำหนดสิทธิ์รายบุคคล
            </Typography>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}
            >
              {/* รายการบุคคลพร้อมปุ่มลบ */}
              {users.map((user) => (
                <Box
                  key={user.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={user.selected}
                        onChange={() => handleUserChange(user.id)}
                        sx={{
                          color: "#304FFE",
                          "&.Mui-checked": {
                            color: "#304FFE",
                          },
                        }}
                      />
                    }
                    label={`${user.name} (กลุ่มที่ ${user.groupId} : ${user.groupName})`}
                    sx={{ color: "#304FFE" }}
                  />
                  {/* ปุ่มลบสำหรับรายการบุคคล */}
                  <IconButton
                    onClick={() => handleUserDelete(user.id)}
                    sx={{
                      color: "red",
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}

              {/* Add user button */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  color: "#304FFE",
                  cursor: "pointer",
                  ml: 1,
                }}
                onClick={handleOpenUserModal}
              >
                <AddIcon fontSize="small" sx={{ mr: 0.5 }} />
                <Typography component="span">เพิ่มบุคคล</Typography>
              </Box>
            </Box>
            {/* Add User Modal */}
            <Dialog
              open={openUserModal}
              onClose={handleCloseUserModal}
              PaperProps={{
                sx: {
                  width: "600px",
                  borderRadius: "12px",
                  padding: "10px",
                },
              }}
            >
              <DialogTitle
                sx={{
                  textAlign: "center",
                  color: "#1120A3",
                  fontWeight: "bold",
                  fontSize: "1.2rem",
                  pb: 1,
                }}
              >
                เพิ่มสิทธิ์รายบุคคล
                <IconButton
                  aria-label="close"
                  onClick={handleCloseUserModal}
                  sx={{
                    position: "absolute",
                    right: 12,
                    top: 12,
                    color: "grey.500",
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent sx={{ py: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Typography
                    component="span"
                    sx={{
                      mr: 2,
                      color: "#1120A3",
                      width: "60px",
                      flexShrink: 0,
                      fontWeight: "bold",
                    }}
                  >
                    ชื่อ :
                  </Typography>
                  <TextfieldService
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    placeholder="ชื่อ-นามสกุล"
                    sx={{
                      ".MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Typography
                    component="span"
                    sx={{
                      mr: 2,
                      color: "#1120A3",
                      width: "60px",
                      flexShrink: 0,
                      fontWeight: "bold",
                    }}
                  >
                    กลุ่ม :
                  </Typography>
                  <SelectMenuService
                    options={groups.map((group) => ({
                      value: group.id.toString(),
                      label: `กลุ่มที่ ${group.id} : ${group.name}`,
                    }))}
                    handleChange={(e) =>
                      setNewUser({ ...newUser, group: e.target.value })
                    }
                    value={newUser.group}
                    width="100%"
                    name="userGroup"
                  />
                </Box>
              </DialogContent>
              <DialogActions sx={{ justifyContent: "center", pb: 3, px: 3 }}>
                <ButtonService
                  label="ยกเลิก"
                  variant="outlined"
                  onClick={handleCloseUserModal}
                  color="#50ADFF"
                  iconLeft={<CloseIcon />}
                  sx={{
                    width: "195px",
                    height: "47.588932037353516px",
                    borderRadius: "15px",
                    fontSize: "20px",
                    "&:hover": {
                      backgroundColor: "#D0E8FC",
                    },
                  }}
                />
                <ButtonService
                  label="ยืนยัน"
                  variant="contained"
                  onClick={handleAddUser}
                  color="#2196F3"
                  iconRight={<CheckOutlinedIcon />}
                  sx={{
                    width: "195px",
                    height: "47.588932037353516px",
                    borderRadius: "15px",
                    fontSize: "20px",
                    "&:hover": {
                      backgroundColor: "#1E88E5",
                    },
                  }}
                />
              </DialogActions>
            </Dialog>
            {/* Delete User Modal */}
            <Dialog
              open={openDeleteUserModal}
              onClose={cancelUserDelete}
              PaperProps={{
                sx: {
                  borderRadius: "12px",
                  overflow: "hidden",
                  padding: "0 60px",
                },
              }}
            >
              <DialogTitle
                sx={{
                  textAlign: "center",
                  color: "#932626",
                  backgroundColor: "#F5F7FF",
                  fontWeight: "bold",
                }}
              >
                ลบสิทธิ์รายบุคคล
              </DialogTitle>

              <DialogContent>
                <Typography
                  sx={{
                    color: "#932626",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                >
                  การลบสิทธิ์รายบุคคลจะทำให้ผู้ใช้นี้ไม่สามารถเข้าถึงได้
                </Typography>
                <Typography
                  sx={{
                    color: "#932626",
                    textAlign: "center",
                    py: 2,
                    fontWeight: "bold",
                  }}
                >
                  ยืนยันการลบสิทธิ์รายบุคคลหรือไม่?
                </Typography>
              </DialogContent>

              <DialogActions
                sx={{
                  justifyContent: "center",
                  padding: 2,
                  backgroundColor: "#F8F9FF",
                  gap: 2,
                }}
              >
                <ButtonService
                  label="ยกเลิก"
                  variant="outlined"
                  onClick={cancelUserDelete}
                  color="#DF615D"
                  iconLeft={<CloseOutlinedIcon />}
                  sx={{
                    width: "32%",
                    height: "56px",
                    borderRadius: "15px",
                    fontSize: "20px",
                    "&:hover": {
                      backgroundColor: "#D0E8FC",
                      boxShadow: "none",
                    },
                  }}
                />
                <ButtonService
                  label="ยืนยัน"
                  variant="contained"
                  onClick={confirmUserDelete}
                  iconRight={<CheckOutlinedIcon />}
                  color="#D52C27"
                  sx={{
                    width: "32%",
                    height: "56px",
                    borderRadius: "15px",
                    fontSize: "20px",
                    "&:hover": {
                      backgroundColor: "#D50000",
                    },
                  }}
                />
              </DialogActions>
            </Dialog>
            {/* Action buttons */}
            <Box
              sx={{ display: "flex", justifyContent: "center", mt: 2, gap: 2 }}
            >
              <ButtonService
                label="ล้าง"
                variant="outlined"
                onClick={[]} // ใส่ฟังก์ชันที่ต้องการจะทำเมื่อคลิก
                iconLeft={<CloseIcon />}
                sx={{
                  backgroundColor: "#E3F2FD",
                  color: "#304FFE",
                  borderRadius: "15px",
                  boxShadow: "none",
                  width: "23%",
                  height: "55px",
                  fontSize: "24px",
                  border: "2px solid #50ADFF",
                  "&:hover": {
                    backgroundColor: "#D0E8FC",
                    boxShadow: "none",
                  },
                }}
              />

              <ButtonService
                label="บันทึก"
                variant="contained"
                iconRight={<CheckOutlinedIcon />}
                onClick={[]} // ใส่ฟังก์ชันที่ต้องการจะทำเมื่อคลิก
                sx={{
                  backgroundColor: "#2196F3",
                  color: "#FFF",
                  borderRadius: "15px",
                  width: "23%",
                  height: "55px",
                  fontSize: "24px",
                  "&:hover": {
                    backgroundColor: "#1E88E5",
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Delete Group Modal */}
        <Dialog
          open={openDeleteModal}
          onClose={cancelDelete}
          PaperProps={{
            sx: {
              borderRadius: "12px", // กำหนดขอบโค้งให้ Modal
              overflow: "hidden", // เพื่อให้ขอบโค้งแสดงผลถูกต้อง
              padding: "0 60px",
            },
          }}
        >
          <DialogTitle
            sx={{
              textAlign: "center",
              color: "#932626",
              backgroundColor: "#F5F7FF", // เพิ่มสีพื้นหลังส่วนหัว
              fontWeight: "bold",
            }}
          >
            ลบกลุ่มสิทธิ์
          </DialogTitle>

          <DialogContent>
            <Typography
              sx={{ color: "#932626", textAlign: "center", fontWeight: "bold" }}
            >
              การลบกลุ่มสิทธิ์จะทำให้บัญชีในกลุ่มสิทธิ์นี้หายไปทั้งหมด
            </Typography>{" "}
            <Typography
              sx={{ color: "#932626", textAlign: "center", fontWeight: "bold" }}
            >
              โปรดสำรองข้อมูลของบัญชีในกลุ่มสิทธิ์นี้ก่อนการลบกลุ่มสิทธิ์
            </Typography>{" "}
            <Typography
              sx={{
                color: "#932626",
                textAlign: "center",
                py: 2,
                fontWeight: "bold",
              }}
            >
              ยืนยันการลบกลุ่มสิทธิ์หรือไม่?
            </Typography>
          </DialogContent>

          <DialogActions
            sx={{
              justifyContent: "center",
              padding: 2,
              backgroundColor: "#F8F9FF", // สีพื้นหลังส่วนปุ่ม
              gap: 2,
            }}
          >
            <ButtonService
              label="ยกเลิก"
              variant="outlined"
              onClick={cancelDelete}
              color="#DF615D"
              iconLeft={<CloseOutlinedIcon />}
              sx={{
                width: "32%",
                height: "56px",
                borderRadius: "15px", // ขอบโค้งปุ่มยกเลิก
                fontSize: "20px",
                "&:hover": {
                  backgroundColor: "#D0E8FC",
                  boxShadow: "none",
                },
              }}
            />
            <ButtonService
              label="ยืนยัน"
              variant="contained"
              onClick={confirmDelete}
              iconRight={<CheckOutlinedIcon />}
              color="#D52C27"
              sx={{
                width: "32%",
                height: "56px",
                borderRadius: "15px",
                fontSize: "20px",
                "&:hover": {
                  backgroundColor: "#D50000",
                },
              }}
            />
          </DialogActions>
        </Dialog>
      </Grid>

      {/* Add Group Modal - Now using dynamic group number */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        PaperProps={{
          sx: {
            width: "400px",
            borderRadius: "12px",
            padding: "10px",
          },
        }}
      >
        <DialogTitle
          sx={{
            textAlign: "center",
            color: "#1120A3",
            fontWeight: "bold",
            fontSize: "1.2rem",
            pb: 1,
          }}
        >
          เพิ่มกลุ่มสิทธิ์
          <IconButton
            aria-label="close"
            onClick={handleCloseModal}
            sx={{
              position: "absolute",
              right: 12,
              top: 12,
              color: "grey.500",
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography
              component="span"
              sx={{
                mr: 2,
                color: "#1120A3",
                width: "80px",
                flexShrink: 0,
                fontWeight: "bold",
              }}
            >
              กลุ่มที่ {nextGroupNumber} :
            </Typography>
            {/* ใช้ TextfieldService แทน TextField */}
            <TextfieldService
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="ชื่อกลุ่ม"
              sx={{
                ".MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3, px: 3 }}>
          <ButtonService
            label="ยกเลิก"
            variant="outlined"
            startIcon={<CloseIcon />}
            onClick={handleCloseModal}
            color="#50ADFF" // ใส่สีพื้นหลังตามที่ต้องการ
            iconLeft={<CloseIcon />}
            sx={{
              width: "195px",
              height: "47.588932037353516px",
              borderRadius: "15px",
              fontSize: "20px",
              "&:hover": {
                backgroundColor: "#D0E8FC", // สีเมื่อ hover
              },
            }}
          />
          <ButtonService
            label="ยืนยัน"
            variant="contained"
            startIcon={<CheckIcon />}
            onClick={handleAddGroup}
            color="#2196F3"
            iconRight={<CheckOutlinedIcon />}
            sx={{
              width: "195px",
              height: "47.588932037353516px",
              borderRadius: "15px",
              fontSize: "20px",
              "&:hover": {
                backgroundColor: "#1E88E5", // สีเมื่อ hover
              },
            }}
          />
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SetRole;
