import React, { useState } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  IconButton,
  Avatar,
  Paper,
  Collapse,
} from "@mui/material";
import {
  Home,
  Settings,
  Article,
  Dashboard,
  ChevronLeft,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";

import styles from "./Sidebar.module.scss";

export default function Sidebar() {
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  return (
    <Box className={styles.sidebar}>
      {/* Logo */}
      <Box className={styles.logo}>
        <img src="/Logo_Gold.png" alt="กระทรวงการคลัง" />
      </Box>

      {/* Menu */}
      <List className={styles.navList}>
        {/* Dashboard */}
        <ListItem disablePadding>
          <ListItemButton className={styles.menuButton}>
            <ListItemIcon>
              <Dashboard />
            </ListItemIcon>
          </ListItemButton>
        </ListItem>

        {/* Home */}
        <ListItem disablePadding>
          <ListItemButton className={styles.menuButton}>
            <ListItemIcon>
              <Home />
            </ListItemIcon>
          </ListItemButton>
        </ListItem>

        {/* Settings */}
        <ListItem disablePadding>
          <ListItemButton className={styles.menuButton}>
            <ListItemIcon>
              <Settings />
            </ListItemIcon>
          </ListItemButton>
        </ListItem>

        {/* Article with submenu (click to toggle) */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => toggleMenu("article")}
            className={styles.menuButton}
          >
            <ListItemIcon>
              <Article />
            </ListItemIcon>
            {openMenu === "article" ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>

        <Collapse in={openMenu === "article"} timeout="auto" unmountOnExit>
          <Paper className={styles.submenu}>
            <ul>
              <li>จัดการข้อมูล</li>
              <li>กำหนดคำถาม Chat Bot</li>
              <li>กำหนดข่าวสาร</li>
            </ul>
          </Paper>
        </Collapse>
      </List>

      {/* Footer */}
      <Box className={styles.bottom}>
        <Avatar src="/user-icon.png" className={styles.avatar} />
        <IconButton className={styles.collapse}>
          <ChevronLeft />
        </IconButton>
      </Box>
    </Box>
  );
}
