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
import stylesNoti from "./SidebarNoti.module.scss";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { getUsersByGroup } from "@pages/api/role/role";
import {
  getNotifications,
  markNotificationAsSeen,
} from "@pages/api/notifications/notifications";
import { showLoading, closeAlert, alertError } from "@utils/Alerts";
import { formatElapsedThaiTime } from "@utils/Formats";
import LayersIcon from '@mui/icons-material/Layers';
import TuneIcon from '@mui/icons-material/Tune';
import Cookies from "js-cookie";

export default function Sidebar() {
  const router = useRouter();
  const notificationRef = useRef(null);

  const [activeMenu, setActiveMenu] = useState("");
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationBell, setShowNotificationBell] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [menuData, setMenuData] = useState([]);
  const sidebarRef = useRef(null);
  const notifArr = Array.isArray(notifications) ? notifications : [];
  const unreadExists = notifArr.some((n) => !n.is_read);

  const toggleBell = () => setShowNotifications((p) => !p);

  const groupIcons = {
    homepage: Settings,
    box: Inventory2,
    document: Description,
    edit: Edit,
    dashboard: Dashboard,
    stacked_line_chart: LayersIcon,
    account_box: AccountBox,
  };

  const headerTextMap = {
    setting: "กำหนดการใช้งานทั่วไป",
    edit: "รับเข้าข้อมูล",
    box: "คลังเอกสาร",
    homepage: "จัดการข้อมูล",
    document: "รายงาน",
  };

  useEffect(() => {
    const info = Cookies.get("info");
    let roles = [];
    try {
      roles = info ? JSON.parse(info).roles : [];
    } catch (err) {
      console.error("Cookie parsing failed", err);
    }

    if (roles.includes("people")) return;

    (async () => {
      try {
        const res = await getNotifications();
        const data = res?.res_data;
        setNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("ดึงข้อมูลการแจ้งเตือนล้มเหลว", err);
        setNotifications([]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      showLoading("กำลังโหลดเมนู...");
      try {
        const data = await getUsersByGroup();
        if (!data?.res_data) {
          await alertError("ผิดพลาด", "ไม่พบข้อมูลเมนู");
          return;
        }

        const info = Cookies.get("info");
        const userRoles = info ? JSON.parse(info).roles : [];

        if (userRoles.includes("admin_home")) {
          setShowNotificationBell(false);
        } else {
          try {
            const notiRes = await getNotifications();
            const notiData = notiRes?.res_data;
            setNotifications(Array.isArray(notiData) ? notiData : []);
          } catch (notiErr) {
            console.error("ดึงข้อมูลการแจ้งเตือนล้มเหลว", notiErr);
            setNotifications([]);
          }
        }

        const filteredMenu = data.res_data.map((group) => {
          const resources = group.resources || [];

          return {
            group_id: group.group_id,
            group_name: group.group_name,
            display_name: group.display_name,
            order_index: group.order_index,
            resources: resources.map((res) => ({
              label: res.description,
              display_name: res.display_name ?? res.description,
              path: res.path,
              type: "item",
            })),
          };
        });

        setMenuData(filteredMenu);
      } catch (err) {
        console.error(err);

        if (err.response?.status === 403) {
          router.push("/");
        } else {
          await alertError("ผิดพลาด", "โหลดข้อมูลเมนูล้มเหลว");
        }
      } finally {
        closeAlert();
      }
    })();
  }, []);

  if (!menuData.length) {
    return null;
  }

  const renderMenuItem = (key, IconC, submenu = []) => {
    return (
      <Box key={key} onMouseEnter={() => setOpenSubmenu(null)} style={{ position: "relative" }}>
        <ListItemButton
        onClick={(e) => {
          setOpenSubmenu(openSubmenu === key ? null : key);
          setActiveMenu(key);
          const sidebarRect = sidebarRef.current.getBoundingClientRect();
          const submenuHeight = 320;
        }}
        >
          <ListItemIcon className={activeMenu === key ? styles.activeIcon : ""}>
            <IconC />
          </ListItemIcon>
        </ListItemButton>

        {submenu.length > 0 && openSubmenu === key && (
          <Box
          className={`${styles.submenu} ${openSubmenu === key ? styles.submenuVisible : ""}`}
          style={{ left: "80px" }}  
            onMouseEnter={() => setOpenSubmenu(key)}
            onMouseLeave={() => setOpenSubmenu(null)}
          >
            <ul>
              {submenu.map((item, i) => (
                <React.Fragment key={i}>
                  <li
                    className={item.type === "header" ? styles.headerItem : ""}
                  >
                    {item.type === "header" ? (
                      <span className={styles.headerText}>
                        {item.display_name || item.label}
                      </span>
                    ) : (
                      <span
                        className={styles.linkText}
                        onClick={() => {
                          const target = item.to || item.path;
                          if (target) {
                            router.push(target);
                          }
                        }}
                      >
                        {item.display_name || item.label}
                      </span>
                    )}
                  </li>
                  {i < submenu.length - 1 && <hr />}
                </React.Fragment>
              ))}
            </ul>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box className={styles.sidebar} ref={sidebarRef}>
      {/* Logo */}
      <Box className={styles.logo}>
        <img src="/Logo_Gold.png" alt="กระทรวงการคลัง" />
      </Box>

      {/* Main nav */}
      <List className={styles.navList}>
        {menuData.map((group) => {
          const IconC = groupIcons[group.group_name] || Settings;

          const submenu = [
            {
              type: "header",
              label: headerTextMap[group.group_name] || group.display_name,
            },
            ...group.resources,
          ];

          if (group.resources.length === 1) {
            const singleResource = group.resources[0];
            return (
              <Box key={group.group_id}>
                <ListItemButton
                  onClick={() => {
                    setActiveMenu(group.group_name);
                    router.push(singleResource.path);
                  }}
                >
                  <ListItemIcon
                    className={
                      activeMenu === group.group_name ? styles.activeIcon : ""
                    }
                  >
                    <IconC />
                  </ListItemIcon>
                </ListItemButton>
              </Box>
            );
          }

          return renderMenuItem(group.group_name, IconC, submenu);
        })}
      </List>

      {/* Footer */}
      <Box className={styles.bottom}>
        {/* Bell */}
        {showNotificationBell && (
          <Box sx={{ position: "relative" }}>
            <IconButton
              className={`${styles.notificationIcon} notifications-icon`}
              onClick={toggleBell}
              sx={{ position: "relative" }}
            >
              <NotificationsIcon />
              {unreadExists && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    width: 10,
                    height: 10,
                    backgroundColor: "#ff3b30",
                    borderRadius: "50%",
                    border: "2px solid white",
                    zIndex: 1,
                  }}
                />
              )}
            </IconButton>

            {showNotifications && (
              <Paper
                ref={notificationRef}
                className={`${stylesNoti.notificationBox} ${stylesNoti.show}`}
              >
                {/* Header */}
                <Box className={stylesNoti.notifHeader}>
                  <Typography variant="h6">การแจ้งเตือน</Typography>
                  {unreadExists && (
                    <Typography
                      variant="body2"
                      sx={{
                        cursor: "pointer",
                        color: "#1976d2",
                        fontWeight: "bold",
                      }}
                      onClick={async () => {
                        try {
                          const unread = notifications.filter(
                            (n) => !n.is_read
                          );
                          if (!unread.length) return;
                          await Promise.all(
                            unread.map((n) => markNotificationAsSeen(n.id))
                          );
                          setNotifications((prev) =>
                            prev.map((n) => ({ ...n, is_read: true }))
                          );
                        } catch (err) {
                          console.error("Error marking all as read:", err);
                        }
                      }}
                    >
                      อ่านทั้งหมด
                    </Typography>
                  )}
                </Box>

                <hr style={{ margin: "8px 0", borderColor: "#d1d5db" }} />

                {/* Notifications List */}
                {notifications.length > 0 ? (
                  notifications.map((n, i) => (
                    <React.Fragment key={n.id ?? i}>
                      <Box
                        className={stylesNoti.notifItem}
                        onClick={() => {
                          if (n.redirect_url) {
                            router.push(n.redirect_url);
                            setShowNotifications(false);
                          }
                        }}
                      >
                        {!n.is_read && <Box className={stylesNoti.notifDot} />}
                        <Box className={stylesNoti.notifContent}>
                          <div className={stylesNoti.notifTitle}>{n.title}</div>
                          <div className={stylesNoti.notifMessage}>
                            {n.message}
                          </div>
                          <div className={stylesNoti.notifTime}>
                            {formatElapsedThaiTime(n.created_at)}
                          </div>
                        </Box>
                      </Box>
                      {i < notifications.length - 1 && (
                        <hr
                          style={{ margin: "8px 0", borderColor: "#e0e0e0" }}
                        />
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <Typography
                    variant="body2"
                    sx={{ mt: 2, textAlign: "center", color: "#aaa" }}
                  >
                    ไม่พบข้อมูลการแจ้งเตือน
                  </Typography>
                )}
              </Paper>
            )}
          </Box>
        )}
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