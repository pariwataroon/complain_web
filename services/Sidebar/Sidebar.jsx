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
  Tabs,
  Tab,
  Badge,
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
import { getElapsedTimeTH } from "@utils/Formats";
import LayersIcon from "@mui/icons-material/Layers";
import HistoryIcon from "@mui/icons-material/History";
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
  const [notificationFilter, setNotificationFilter] = useState(0);
  const sidebarRef = useRef(null);
  const notifArr = Array.isArray(notifications) ? notifications : [];
  const unreadExists = notifArr.some((n) => !n.is_read);

  const handleNotificationClick = async (n) => {
    try {
      // markNotificationAsSeen ทุกครั้งที่คลิก
      if (!n.is_read) {
        await markNotificationAsSeen(n.id);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === n.id ? { ...item, is_read: true } : item
          )
        );
      }

      if (n.redirect_url) {
        if (n.redirect_url.startsWith("/complaints/")) {
          const complaintId = n.redirect_url.replace("/complaints/", "");
          router.push(`/admin/edit/website-complaints/${complaintId}/`);
        } else if (n.redirect_url.startsWith("/users/")) {
          router.push("/admin/settinggeneral/users/");
        } else {
          router.push(n.redirect_url);
        }
        setShowNotifications(false);
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // ฟังก์ชันสำหรับกรองการแจ้งเตือนตามประเภท
  const getFilteredNotifications = () => {
    if (notificationFilter === 0) return notifArr; // ทั้งหมด

    if (notificationFilter === 1) {
      // เรื่องร้องเรียนใหม่ - กรองตาม title หรือ message ที่ไม่ใช่ผู้ใช้ใหม่
      return notifArr.filter(
        (n) =>
          !(
            n.title?.includes("ลงทะเบียน") ||
            n.title?.includes("สมัคร") ||
            n.title?.includes("ผู้ใช้ใหม่") ||
            n.message?.includes("ลงทะเบียน") ||
            n.message?.includes("สมัคร") ||
            n.message?.includes("ผู้ใช้ใหม่") ||
            n.type === "user_registration" ||
            n.category === "registration"
          )
      );
    }

    if (notificationFilter === 2) {
      // ผู้ใช้ลงทะเบียนใหม่ - กรองตาม title หรือ message ที่มีคำว่า "ลงทะเบียน", "สมัคร", "ผู้ใช้ใหม่"
      return notifArr.filter(
        (n) =>
          n.title?.includes("ลงทะเบียน") ||
          n.title?.includes("สมัคร") ||
          n.title?.includes("ผู้ใช้ใหม่") ||
          n.message?.includes("ลงทะเบียน") ||
          n.message?.includes("สมัคร") ||
          n.message?.includes("ผู้ใช้ใหม่") ||
          n.type === "user_registration" || // หากมี field type
          n.category === "registration" // หากมี field category
      );
    }

    return notifArr;
  };

  // นับจำนวนการแจ้งเตือนแต่ละประเภท
  const getNotificationCounts = () => {
    const total = notifArr.length;
    const newUsers = notifArr.filter(
      (n) =>
        n.title?.includes("ลงทะเบียน") ||
        n.title?.includes("สมัคร") ||
        n.title?.includes("ผู้ใช้ใหม่") ||
        n.message?.includes("ลงทะเบียน") ||
        n.message?.includes("สมัคร") ||
        n.message?.includes("ผู้ใช้ใหม่") ||
        n.type === "user_registration" ||
        n.category === "registration"
    ).length;
    const complaints = total - newUsers;

    // นับ unread สำหรับแต่ละประเภท
    const unreadTotal = notifArr.filter((n) => !n.is_read).length;
    const unreadNewUsers = notifArr.filter(
      (n) =>
        !n.is_read &&
        (n.title?.includes("ลงทะเบียน") ||
          n.title?.includes("สมัคร") ||
          n.title?.includes("ผู้ใช้ใหม่") ||
          n.message?.includes("ลงทะเบียน") ||
          n.message?.includes("สมัคร") ||
          n.message?.includes("ผู้ใช้ใหม่") ||
          n.type === "user_registration" ||
          n.category === "registration")
    ).length;
    const unreadComplaints = unreadTotal - unreadNewUsers;

    return {
      total: { count: total, unread: unreadTotal },
      complaints: { count: complaints, unread: unreadComplaints },
      newUsers: { count: newUsers, unread: unreadNewUsers },
    };
  };

  const filteredNotifications = getFilteredNotifications();
  const notificationCounts = getNotificationCounts();

  const groupIcons = {
    homepage: Settings,
    box: Inventory2,
    document: Description,
    edit: Edit,
    dashboard: Dashboard,
    stacked_line_chart: LayersIcon,
    account_box: AccountBox,
    admin: HistoryIcon,
  };

  const headerTextMap = {
    setting: "กำหนดการใช้งานทั่วไป",
    edit: "จัดการข้อมูลในระบบ",
    box: "คลังเอกสาร",
    homepage: "จัดการข้อมูล",
    document: "รายงาน",
    admin: "บันทึกการใช้งาน",
  };

  useEffect(() => {
    const info = Cookies.get("info");
    let roles = [];
    try {
      roles = info ? JSON.parse(info).roles : [];
    } catch (err) {
      console.error("Cookie parsing failed", err);
    }

    if (roles.includes("admin_home")) return;

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
    const submenuItems = submenu.filter((item) => item.type !== "header");
    return (
      <Box
        key={key}
        className={styles.menuItemContainer}
        onMouseEnter={() => {
          if (submenuItems.length > 0) {
            setOpenSubmenu(key);
          }
        }}
        onMouseLeave={() => {
          if (submenuItems.length > 0) {
            setOpenSubmenu(null);
          }
        }}
      >
        <ListItemButton
          onClick={() => {
            setActiveMenu(key);
          }}
        >
          <ListItemIcon className={activeMenu === key ? styles.activeIcon : ""}>
            <IconC />
          </ListItemIcon>
        </ListItemButton>

        {submenuItems.length > 0 && (
          <Box
            className={`${styles.submenu} ${
              openSubmenu === key ? styles.submenuVisible : ""
            }`}
            onMouseEnter={() => setOpenSubmenu(key)}
            onMouseLeave={() => setOpenSubmenu(null)}
          >
            <ul>
              {submenu.map((item, i) => (
                <React.Fragment key={i}>
                  <li
                    className={
                      item.type === "header"
                        ? styles.headerItem
                        : styles.menuItem
                    }
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
                            setOpenSubmenu(null);
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
      <Box
        className={styles.logo}
        style={{ cursor: "pointer" }}
        onClick={() => router.push("/")}
      >
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
          <Box
            className={styles.notificationContainer}
            onMouseEnter={() => setShowNotifications(true)}
            onMouseLeave={() => setShowNotifications(false)}
          >
            <IconButton
              className={`${styles.notificationIcon} notifications-icon`}
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

            <Paper
              ref={notificationRef}
              className={`${stylesNoti.notificationBox} ${
                showNotifications ? stylesNoti.show : ""
              }`}
              onMouseEnter={() => setShowNotifications(true)}
              onMouseLeave={() => setShowNotifications(false)}
              sx={{
                zIndex: 9999,
                width: 380,
                minHeight: 400,
                maxHeight: 500,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Header */}
              <Box className={stylesNoti.notifHeader} sx={{ flexShrink: 0 }}>
                <Typography variant="h6">การแจ้งเตือน</Typography>
                {filteredNotifications.some((n) => !n.is_read) && (
                  <Typography
                    variant="body2"
                    sx={{
                      cursor: "pointer",
                      color: "#1976d2",
                      fontWeight: "bold",
                    }}
                    onClick={async () => {
                      try {
                        const unread = filteredNotifications.filter(
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

              {/* Filter Tabs */}
              <Box
                sx={{
                  borderBottom: 1,
                  borderColor: "divider",
                  flexShrink: 0,
                }}
              >
                <Tabs
                  value={notificationFilter}
                  onChange={(e, newValue) => setNotificationFilter(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    minHeight: 36,
                    "& .MuiTab-root": {
                      minHeight: 36,
                      fontSize: "11px",
                      textTransform: "none",
                      minWidth: "auto",
                      padding: "6px 12px",
                    },
                    "& .MuiTabs-flexContainer": {
                      gap: 1.5,
                    },
                  }}
                >
                  <Tab
                    label={
                      <Box display="flex" alignItems="center" gap={0.75}>
                        <span>ทั้งหมด</span>
                        {notificationCounts.total.unread > 0 && (
                          <Badge
                            badgeContent={notificationCounts.total.unread}
                            color="error"
                            sx={{
                              ml: 0.5,
                              "& .MuiBadge-badge": {
                                fontSize: "10px",
                                height: 18,
                                minWidth: 18,
                              },
                            }}
                          />
                        )}
                      </Box>
                    }
                  />
                  <Tab
                    label={
                      <Box display="flex" alignItems="center" gap={0.75}>
                        <span>เรื่องร้องเรียน</span>
                        {notificationCounts.complaints.unread > 0 && (
                          <Badge
                            badgeContent={notificationCounts.complaints.unread}
                            color="error"
                            sx={{
                              ml: 0.5,
                              "& .MuiBadge-badge": {
                                fontSize: "10px",
                                height: 18,
                                minWidth: 18,
                              },
                            }}
                          />
                        )}
                      </Box>
                    }
                  />
                  <Tab
                    label={
                      <Box display="flex" alignItems="center" gap={0.75}>
                        <span>ผู้ใช้ใหม่</span>
                        {notificationCounts.newUsers.unread > 0 && (
                          <Badge
                            badgeContent={notificationCounts.newUsers.unread}
                            color="error"
                            sx={{
                              ml: 0.5,
                              "& .MuiBadge-badge": {
                                fontSize: "10px",
                                height: 18,
                                minWidth: 18,
                              },
                            }}
                          />
                        )}
                      </Box>
                    }
                  />
                </Tabs>
              </Box>

              {/* Notifications List */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  minHeight: 280,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((n, i) => (
                    <React.Fragment key={n.id ?? i}>
                      <Box
                        className={stylesNoti.notifItem}
                        onClick={() => handleNotificationClick(n)}
                      >
                        {!n.is_read && <Box className={stylesNoti.notifDot} />}
                        <Box className={stylesNoti.notifContent}>
                          <div className={stylesNoti.notifTitle}>{n.title}</div>
                          <div className={stylesNoti.notifMessage}>
                            {n.message}
                          </div>
                          <div className={stylesNoti.notifTime}>
                            {getElapsedTimeTH(n.created_at)}
                          </div>
                        </Box>
                      </Box>
                      {i < filteredNotifications.length - 1 && (
                        <hr
                          style={{ margin: "8px 0", borderColor: "#e0e0e0" }}
                        />
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 200,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ textAlign: "center", color: "#aaa" }}
                    >
                      {notificationFilter === 0 && "ไม่พบข้อมูลการแจ้งเตือน"}
                      {notificationFilter === 1 && "ไม่พบเรื่องร้องเรียนใหม่"}
                      {notificationFilter === 2 && "ไม่พบผู้ใช้ลงทะเบียนใหม่"}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
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
