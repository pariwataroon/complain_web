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
} from "@mui/icons-material";
import { useRouter } from "next/router";
import styles from "./Sidebar.module.scss";
import NotificationsIcon from "@mui/icons-material/Notifications";
import {
  getNotifications,
  markNotificationAsSeen,
} from "@pages/api/notifications/notifications";

/* ───────── submenu config ───────── */
const submenuItems = {
  /* (เนื้อหาเต็มตามเดิม — ยกมาให้ครบ) */
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
    {
      label: "เรื่องร้องเรียนที่ได้รับมอบหมาย",
      type: "item",
      to: "/admin/edit/assigned-complaints",
    },
    {
      label: "บัตรสนเท่ห์ที่ได้รับมอบหมาย",
      type: "item",
      to: "/admin/edit/assigned-anonymous",
    },
    {
      label: "แบบรายงานส่งหน่วยงานที่เกี่ยวข้อง",
      type: "item",
      to: "/admin/edit/forward-to-agency",
    },
    {
      label:
        "แบบรายงานแจ้งผู้ร้องเรียนหรือส่วนราชการที่ส่งเรื่องมากระทรวงทราบเบื้องต้น",
      type: "item",
      to: "/admin/edit/initial-notification-to-complainant-or-agency",
    },
    {
      label: "แบบรายงานขอทราบผลการพิจารณาหรือผลความคืบหน้า",
      type: "item",
      to: "/admin/edit/request-result-or-progress",
    },
    {
      label: "แบบรายงานแจ้งผลการให้ผู้เกี่ยวข้องทราบ",
      type: "item",
      to: "/admin/edit/inform-related-parties",
    },
  ],
  box: [
    { label: "คลังเอกสาร", type: "header" },
    { label: "คลังเรื่องราวร้องทุกข์", type: "item", to: "/admin/box/list" },
    { label: "คลังบัตรสนเท่ห์", type: "item", to: "/admin/box/new" },
  ],
  homepage: [
    { label: "จัดการข้อมูล", type: "header" },
    {
      label: "กำหนดคำถาม Chat Bot",
      type: "item",
      to: "/admin/homepage/chatbot",
    },
    { label: "กำหนดข่าวสาร", type: "item", to: "/admin/homepage/new" },
    {
      label: "รายงานคำถามจากผู้ร้อง",
      type: "item",
      to: "/admin/homepage/complainant-questions",
    },
  ],
  document: [
    { label: "รายงาน", type: "header" },
    {
      label: "รายงานติดตามสถานะ",
      type: "item",
      to: "/admin/document/status-tracking-report",
    },
    {
      label: "รายงานสรุปเรื่องร้องเรียนของหน่วยงาน",
      type: "item",
      to: "/admin/document/agency-complaint-summary",
    },
    {
      label: "รายงานสรุปเรื่องเข้าใหม่และร้องเพิ่มทั้งหมด",
      type: "item",
      to: "/admin/document/new-additional-complaints-summary",
    },
    {
      label: "รายงานสรุปเรื่องราวร้องทุกข์ของผู้ตรวจประจำปีงบประมาณ",
      type: "item",
      to: "/admin/document/annual-inspector-complaints-summary",
    },
    {
      label: "รายงานการติดตามงานค้าง",
      type: "item",
      to: "/admin/document/pending-work-follow-up",
    },
    {
      label: "รายงานผลการจัดการเรื่องร้องเรียนของผู้ตรวจ",
      type: "item",
      to: "/admin/document/inspector-complaint-management",
    },
    {
      label: "รายงานสรุปเรื่องร้องเรียนประจำปีงบประมาณ",
      type: "item",
      to: "/admin/document/annual-complaint-summary",
    },
    {
      label: "รายงานการแจ้งเตือนเจ้าหน้าที่",
      type: "item",
      to: "/admin/document/staff-notification",
    },
  ],
};

/* ───────── fallback ───────── */
const fallbackNotifications = [
  {
    id: 0,
    title: "ไม่พบข้อมูลการแจ้งเตือน",
    message: "--",
    created_at: new Date().toISOString(),
    is_read: true,
  },
];

/* Bangkok offset (UTC → UTC+7) */
const BKK_MS = 7 * 60 * 60 * 1000;

/* เวลา (UTC) → แปลงเป็นเวลาประเทศไทย แล้วหาค่าผ่านไปเท่าไร */
const getElapsed = (isoUtc) => {
  // แปลงเวลาที่ได้รับ (อยู่ใน UTC) ให้เป็นเวลาไทย (+7 ชม.)
  const then = new Date(isoUtc).getTime() + BKK_MS;

  // เวลาปัจจุบันของเครื่อง (เชื่อว่าเป็นเวลาไทยอยู่แล้ว) *ไม่ต้อง* บวก 7
  const now = Date.now();

  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} วัน ${hours % 24} ชม.`;
  if (hours > 0) return `${hours} ชม. ${minutes % 60} นาที`;
  return `${minutes} นาที`;
};

export default function Sidebar() {
  const router = useRouter();
  const notificationRef = useRef(null);
  const [activeMenu, setActiveMenu] = useState("setting");
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  /* ───────── fetch notifs ───────── */
  useEffect(() => {
    (async () => {
      try {
        const res = await getNotifications();
        const data = res?.res_data;
        setNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("⚠️ ดึงข้อมูลการแจ้งเตือนล้มเหลว", err);
        setNotifications([]);
      }
    })();
  }, []);

  /* ───────── click-outside ───────── */
  useEffect(() => {
    const clickAway = (e) => {
      if (
        !e.target.closest(`.${styles.submenu}`) &&
        !e.target.closest(".MuiListItemButton-root")
      )
        setOpenSubmenu(null);
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target) &&
        !e.target.closest(".notifications-icon")
      )
        setShowNotifications(false);
    };
    document.addEventListener("click", clickAway);
    return () => document.removeEventListener("click", clickAway);
  }, []);

  /* ───────── handlers ───────── */
  const toggleBell = () => setShowNotifications((p) => !p);

  const handleNotificationRedirect = async (url, id) => {
    try {
      await markNotificationAsSeen(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(`Error marking ${id} seen:`, err);
    }
    if (url) {
      router.push(url);
      setShowNotifications(false);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    if (!unread.length) return;
    try {
      await Promise.all(unread.map((n) => markNotificationAsSeen(n.id)));
      setNotifications((p) => p.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  /* ───────── safe array guards ───────── */
  const notifArr = Array.isArray(notifications) ? notifications : [];
  const unreadExists = notifArr.some((n) => !n.is_read);
  const listToShow = notifArr.length ? notifArr : fallbackNotifications;
  const [submenuTop, setSubmenuTop] = useState(0);

  /* ───────── nav render helpers ───────── */
  const renderMenuItem = (key, IconC) => (
    <Box key={key} onMouseEnter={() => setOpenSubmenu(null)}>
      <ListItemButton
        onClick={(e) => {
          setOpenSubmenu(openSubmenu === key ? null : key);
          setActiveMenu(key);
          const rect = e.currentTarget.getBoundingClientRect();
          const buttonHeight = rect.height;
          const submenuHeight = 320;
          const offset = submenuHeight / 2 - buttonHeight / 2;
          setSubmenuTop(rect.top - offset);
        }}
      >
        <ListItemIcon className={activeMenu === key ? styles.activeIcon : ""}>
          <IconC />
        </ListItemIcon>
      </ListItemButton>
      {submenuItems[key] && (
        <Box
          className={`${styles.submenu} ${openSubmenu === key ? styles.submenuVisible : ""}`}
          style={{ top: submenuTop, left: "80px" }}
          onMouseEnter={() => setOpenSubmenu(key)}
          onMouseLeave={() => setOpenSubmenu(null)}
        >

          <ul>
            {submenuItems[key].map((item, i) => (
              <React.Fragment key={i}>
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
                {i < submenuItems[key].length - 1 && <hr />}
              </React.Fragment>
            ))}
          </ul>
        </Box>
      )}
    </Box>
  );

  const navItem = (name, IconC, path) => (
    <Box key={name}>
      <ListItemButton
        onClick={() => {
          setActiveMenu(name);
          router.push(path);
        }}
      >
        <ListItemIcon className={activeMenu === name ? styles.activeIcon : ""}>
          <IconC />
        </ListItemIcon>
      </ListItemButton>
    </Box>
  );

  /* ───────── JSX ───────── */
  return (
    <Box className={styles.sidebar}>
      {/* Logo */}
      <Box className={styles.logo}>
        <img src="/Logo_Gold.png" alt="กระทรวงการคลัง" />
      </Box>

      {/* Main nav */}
      <List className={styles.navList}>
        {navItem("Dashboard", Dashboard, "/admin/dashboard")}
        {renderMenuItem("setting", Settings)}
        {renderMenuItem("edit", Edit)}
        {renderMenuItem("homepage", Settings)}
        {renderMenuItem("box", Inventory2)}
        {renderMenuItem("document", Description)}
        {navItem(
          "StackedLineChart",
          StackedLineChart,
          "/admin/StackedLineChart"
        )}
        {navItem("AccountBox", AccountBox, "/admin/AccountBox")}
      </List>

      {/* Footer */}
      <Box className={styles.bottom}>
        {/* Bell */}
        <Box sx={{ position: "relative" }}>
          <IconButton
            className={`${styles.notificationIcon} notifications-icon`}
            onClick={toggleBell}
          >
            <NotificationsIcon />
            {unreadExists && (
              <span
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 8,
                  height: 8,
                  minWidth: 8,
                  minHeight: 8,
                  flexShrink: 0,
                  backgroundColor: "#ff0000",
                  borderRadius: "50%",
                }}
              />
            )}
          </IconButton>

          {showNotifications && (
            <Paper
              ref={notificationRef}
              className={styles.notificationBox}
              sx={{
                position: "absolute",
                bottom: 0,
                left: 61,
                width: 300,
                maxHeight: 400,
                overflowY: "auto",
                p: 2,
                zIndex: 1000,
                boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
                border: "4px solid #91cbff",
                borderRadius: "10px",
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Typography variant="h6">
                  การแจ้งเตือน <NotificationsIcon sx={{ mb: -0.5 }} />
                </Typography>
                {unreadExists && (
                  <Typography
                    variant="body2"
                    sx={{ cursor: "pointer", color: "primary.main" }}
                    onClick={markAllRead}
                  >
                    อ่านทั้งหมด
                  </Typography>
                )}
              </Box>
              <hr />

              {/* List */}
              {listToShow.map((n, i) => (
                <React.Fragment key={n.id ?? i}>
                  <Box
                    sx={{
                      mt: 2,
                      cursor: n.redirect_url ? "pointer" : "default",
                      display: "flex",
                      alignItems: "center",
                    }}
                    onClick={() =>
                      handleNotificationRedirect(n.redirect_url, n.id)
                    }
                  >
                    {!n.is_read && (
                      <span
                        style={{
                          display: "inline-block",
                          width: 8,
                          height: 8,
                          minWidth: 8,
                          minHeight: 8,
                          flexShrink: 0,
                          backgroundColor: "#ff0000",
                          borderRadius: "50%",
                          marginRight: 8,
                        }}
                      />
                    )}
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "bold", mb: 1 }}
                      >
                        {n.title}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {n.message}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getElapsed(n.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                  {i < listToShow.length - 1 && <hr />}
                </React.Fragment>
              ))}
            </Paper>
          )}
        </Box>

        {/* Avatar & collapse */}
        <Avatar src="/user-icon.png" className={styles.avatar} />
        <IconButton
          className={styles.collapse}
          onClick={() => setOpenSubmenu(null)}
        >
          <ChevronLeft />
        </IconButton>
      </Box>
    </Box>
  );
}
