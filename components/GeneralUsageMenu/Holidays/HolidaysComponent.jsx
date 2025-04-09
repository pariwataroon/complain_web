import React, { useState } from "react";
import { Box, Typography, Grid, IconButton } from "@mui/material";
import BreadcrumbsService from "@services/Breadcrumbs/breadcrumbs";
import styles from "./HolidaysComponent.module.scss";

const breadcrumbItems = [
  {
    label: "เมนูกำหนดวันหยุดเมนูกำหนดการใช้งานทั่วไป",
    icon: (
      <img
        src="/icons/settingico.png"
        alt="Settings Icon"
        style={{ width: "24px", height: "24px", marginBottom: "-8px" }}
      />
    ),
  },
  {
    label: "กำหนดวันหยุด",
  },
];

export default function HolidaysComponent() {
  return (
    <div className={styles.Container}>
      <BreadcrumbsService items={breadcrumbItems} />
      <div className={styles.iframeContainer}>
        <iframe
          src="https://calendar.google.com/calendar/embed?src=th.th%23holiday%40group.v.calendar.google.com&ctz=Asia%2FBangkok&hl=th"
          style={{ border: "0" }}
          width="100%" // กำหนดให้ความกว้างเป็น 100% ของ container
          height="100%" // กำหนดให้ความสูงเป็น 100% ของ container
        ></iframe>
      </div>
    </div>
  );
}
