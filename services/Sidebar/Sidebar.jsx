import React, { useState, useEffect } from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  Avatar,
  IconButton,
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

export default function Sidebar() {
  const [activeMenu, setActiveMenu] = useState("setting");
  const [hoverMenu, setHoverMenu] = useState(null);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const router = useRouter();
  const [invisible, setInvisible] = useState(true); // ตัวอย่างการใช้ invisible

  // ปิดเมนูเมื่อคลิกที่ส่วนอื่นๆ ของหน้าจอ
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest(".submenu") &&
        !event.target.closest(".MuiListItemButton-root")
      ) {
        setOpenSubmenu(null); // ปิดเมนูถ้าคลิกที่นอกเมนู
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

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
        {" "}
        <IconButton className={styles.notificationIcon}>
          <NotificationsIcon />
          {/* จุดแจ้งเตือนสีแดง */}
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
        </IconButton>
        <Avatar src="/user-icon.png" className={styles.avatar} />
        {/* ใช้ Badge กับไอคอนกระดิ่ง */}
        <IconButton className={styles.collapse}>
          <ChevronLeft />
        </IconButton>
      </Box>
    </Box>
  );
}
