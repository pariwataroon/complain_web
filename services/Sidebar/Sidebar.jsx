import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  Avatar,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import {
  Settings,
  Dashboard,
  ChevronLeft,
  Edit,
  Inventory2,
  Description,
  StackedLineChart,
  AccountBox,
  Badge,
} from "@mui/icons-material";
import { useRouter } from "next/router";
import styles from "./Sidebar.module.scss";
import NotificationsIcon from "@mui/icons-material/Notifications";

const submenuItems = {
  setting: [
    { label: "กำหนดการใช้งานทั่วไป", type: "header" },
    { label: "กำหนดระยะเวลา", type: "item", to: "/admin/settinggeneral/times" },
    {
      label: "กำหนดผู้ใช้งาน",
      type: "item",
      to: "/admin/settinggeneral/users",
    },
    {
      label: "กำหนดสิทธิ์การเข้าถึง",
      type: "item",
      to: "/admin/settinggeneral/access",
    },
    {
      label: "กำหนดหน่วยงานในสังกัด",
      type: "item",
      to: "/admin/settinggeneral/department",
    },
    {
      label: "กำหนดวันหยุด",
      type: "item",
      to: "/admin/settinggeneral/holidays",
    },
  ],
  edit: [
    { label: "รับเข้าข้อมูล", type: "header" },
    { label: "สืบค้นเรื่องร้องเรียน", type: "item", to: "/admin/edit/search" },
    {
      label: "เรื่องราวร้องทุกข์ช่องทางเว็บไซต์",
      type: "item",
      to: "/admin/edit/website-complaints",
    },
    {
      label: "เรื่องราวร้องทุกข์ช่องทางเว็บไซต์ OPM1111",
      type: "item",
      to: "/admin/edit/opm1111",
    },
    {
      label: "รับเรื่องรายงานผลการพิจารณาจากหน่วยงาน",
      type: "item",
      to: "/admin/edit/report",
    },
  ],
  box: [
    { label: "คลังเอกสาร", type: "header" },
    { label: "คลังเรื่องราวร้องทุกข์", type: "item", to: "/admin/box/list" },
    { label: "คลังบัตรสนเท่ห์", type: "item", to: "/admin/box/new" },
  ],
  document: [
    { label: "รายงาน", type: "header" },
    { label: "รายงานติดตามสถานะ", type: "item", to: "/admin/document/pending" },
    {
      label: "รายงานสรุปเรื่องร้องเรียนของหน่วยงาน",
      type: "item",
      to: "/admin/document/pending",
    },
    {
      label: "รายงานสรุปเรื่องเข้าใหม่และร้องเพิ่มทั้งหมด",
      type: "item",
      to: "/admin/document/pending",
    },
    {
      label: "รายงานสรุปเรื่องราวร้องทุกข์ของผู้ตรวจประจำปีงบประมาณ",
      type: "item",
      to: "/admin/document/pending",
    },
    {
      label: "รายงานการติดตามงานค้าง",
      type: "item",
      to: "/admin/document/pending",
    },
    {
      label: "รายงานผลการจัดการเรื่องร้องเรียนของผู้ตรวจ",
      type: "item",
      to: "/admin/document/pending",
    },
    {
      label: "รายงานสรุปเรื่องร้องเรียนประจำปีงบประมาณ",
      type: "item",
      to: "/admin/document/pending",
    },
    {
      label: "รายงานการแจ้งเตือนเจ้าหน้าที่",
      type: "item",
      to: "/admin/document/pending",
    },
  ],
};

const mockNotifications = [
  {
    id: 1,
    title: "มีเรื่องร้องเรียนใหม่",
    description: "#REF12345",
    timestamp: "เมื่อ 2 นาทีที่แล้ว",
  },
  {
    id: 2,
    title: "มีการตอบกลับเรื่องร้องเรียน",
    description: "#REF98765",
    timestamp: "เมื่อ 3 ชั่วโมงที่แล้ว",
  },
  {
    id: 3,
    title: "ครบกำหนดการตอบกลับ",
    description: "#REF56789",
    timestamp: "เมื่อ 1 วันที่แล้ว",
  },
  {
    id: 4,
    title: "อัปเดตสถานะเรื่องร้องเรียน",
    description: "#REF11223",
    timestamp: "เมื่อ 15 นาทีที่แล้ว",
  },
  {
    id: 5,
    title: "แจ้งเตือนระบบ",
    description: "ระบบจะปิดปรับปรุงใน 1 ชม.",
    timestamp: "เมื่อ 40 นาทีที่แล้ว",
  },
  {
    id: 6,
    title: "มีการแก้ไขข้อมูลเรื่องร้องเรียน",
    description: "#REF44556",
    timestamp: "เมื่อ 5 ชั่วโมงที่แล้ว",
  },
  {
    id: 7,
    title: "เรื่องร้องเรียนถูกมอบหมาย",
    description: "#REF77889",
    timestamp: "เมื่อ 2 วันที่แล้ว",
  },
  {
    id: 8,
    title: "แจ้งเตือนความล่าช้า",
    description: "#REF99001",
    timestamp: "เมื่อ 6 ชั่วโมงที่แล้ว",
  },
  {
    id: 9,
    title: "มีการเพิ่มความคิดเห็นใหม่",
    description: "#REF33221",
    timestamp: "เมื่อ 25 นาทีที่แล้ว",
  },
  {
    id: 10,
    title: "สรุปการทำงานประจำสัปดาห์",
    description: "ดูรายงานสรุป",
    timestamp: "เมื่อ 2 สัปดาห์ที่แล้ว",
  },
];
export default function Sidebar() {
  const [activeMenu, setActiveMenu] = useState("setting");
  const [hoverMenu, setHoverMenu] = useState(null);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const router = useRouter();
  const [invisible, setInvisible] = useState(false); // ตั้งเป็น false เพื่อแสดงว่ามีการแจ้งเตือน
  const [showNotifications, setShowNotifications] = useState(false); // เพิ่ม state สำหรับการแสดง notification box
  const notificationRef = useRef(null);
  const notificationIconRef = useRef(null);

  // ปิดเมนูเมื่อคลิกที่ส่วนอื่นๆ ของหน้าจอ
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest(".submenu") &&
        !event.target.closest(".MuiListItemButton-root")
      ) {
        setOpenSubmenu(null); // ปิดเมนูถ้าคลิกที่นอกเมนู
      }

      // ปิด notification box เมื่อคลิกที่นอกกล่อง
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target) &&
        !event.target.closest(".notifications-icon")
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    setInvisible(true); // เมื่อกดที่ไอคอนแจ้งเตือน จะเคลียร์จุดแจ้งเตือนแดง
  };

  const renderMenuItem = (key, IconComponent) => (
    <Box
      key={key}
      className={styles.hoverTarget}
      onMouseEnter={() => setHoverMenu(null)}
    >
      <ListItemButton
        onClick={() => {
          if (openSubmenu === key) {
            setOpenSubmenu(null);
            return;
          }
          setOpenSubmenu(key);
          setActiveMenu(key);
        }}
      >
        <ListItemIcon className={activeMenu === key ? styles.activeIcon : ""}>
          <IconComponent />
        </ListItemIcon>
      </ListItemButton>

      {submenuItems[key] && (
        <Box
          className={`${styles.submenu} ${
            openSubmenu === key ? styles.submenuVisible : ""
          }`}
        >
          <ul>
            {submenuItems[key].map((item, index) => (
              <React.Fragment key={index}>
                <li className={item.type === "header" ? styles.headerItem : ""}>
                  {item.type === "header" ? (
                    <span className={styles.headerText}>{item.label}</span>
                  ) : (
                    <span
                      className={styles.linkText}
                      onClick={() => router.push(item.to)}
                    >
                      {item.label}
                    </span>
                  )}
                </li>
                {index < submenuItems[key].length - 1 && <hr />}
              </React.Fragment>
            ))}
          </ul>
        </Box>
      )}
    </Box>
  );

  return (
    <Box className={styles.sidebar}>
      <Box className={styles.logo}>
        <img src="/Logo_Gold.png" alt="กระทรวงการคลัง" />
      </Box>

      <List className={styles.navList}>
        <Box>
          <ListItemButton
            onClick={() => {
              setActiveMenu("Dashboard");
              router.push("/admin/dashboard");
            }}
          >
            <ListItemIcon
              className={activeMenu === "Dashboard" ? styles.activeIcon : ""}
            >
              <Dashboard />
            </ListItemIcon>
          </ListItemButton>
        </Box>

        {/* เมนูอื่นๆ */}
        {renderMenuItem("setting", Settings)}
        {renderMenuItem("edit", Edit)}
        {renderMenuItem("box", Inventory2)}
        {renderMenuItem("document", Description)}

        {/* เมนูที่ไม่มี submenu */}
        <Box>
          <ListItemButton
            onClick={() => {
              setActiveMenu("StackedLineChart");
              router.push("/admin/StackedLineChart");
            }}
          >
            <ListItemIcon
              className={
                activeMenu === "StackedLineChart" ? styles.activeIcon : ""
              }
            >
              <StackedLineChart />
            </ListItemIcon>
          </ListItemButton>
        </Box>

        <Box>
          <ListItemButton
            onClick={() => {
              setActiveMenu("AccountBox");
              router.push("/admin/AccountBox");
            }}
          >
            <ListItemIcon
              className={activeMenu === "AccountBox" ? styles.activeIcon : ""}
            >
              <AccountBox />
            </ListItemIcon>
          </ListItemButton>
        </Box>
      </List>

      <Box className={styles.bottom}>
        <Box sx={{ position: "relative" }}>
          <IconButton
            className={`${styles.notificationIcon} notifications-icon`}
            onClick={handleNotificationClick}
            ref={notificationIconRef}
          >
            <NotificationsIcon />
            {/* จุดแจ้งเตือนสีแดง */}
            {!invisible && (
              <div
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#ff0000",
                  borderRadius: "50%",
                  zIndex: 1,
                }}
              />
            )}
          </IconButton>

          {/* Notification Box - ตำแหน่งข้าง icon แจ้งเตือน */}
          {showNotifications && (
            <Paper
              ref={notificationRef}
              className={styles.notificationBox}
              style={{
                position: "absolute",
                bottom: "0",
                left: "61px",
                width: "300px",
                maxHeight: "400px",
                overflowY: "auto",
                padding: "16px",
                zIndex: 1000,
                boxShadow: "0 3px 10px rgba(0, 0, 0, 0.2)",
                border: "2px solid #91cbff",
              }}
            >
              <Typography variant="h6" style={{ marginBottom: "10px" }}>
                การแจ้งเตือน <NotificationsIcon sx={{ marginBottom: "-5px" }} />
              </Typography>
              <hr />
              {mockNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 1, fontWeight: "bold" }}
                    >
                      {notification.title}: {notification.description}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", mb: 2 }}
                    >
                      {notification.timestamp}
                    </Typography>
                  </Box>
                  {index < mockNotifications.length - 1 && <hr />}
                </React.Fragment>
              ))}
            </Paper>
          )}
        </Box>

        <Avatar src="/user-icon.png" className={styles.avatar} />
        <IconButton className={styles.collapse}>
          <ChevronLeft />
        </IconButton>
      </Box>
    </Box>
  );
}
