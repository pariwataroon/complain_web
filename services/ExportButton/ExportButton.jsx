import React from "react";
import { Button } from "@mui/material";

const ExportButton = ({ label = "Export PDF", onClick, sx = {}, ...props }) => {
  return (
    <Button
      variant="outlined"
      onClick={onClick}
      sx={{
        backgroundColor: "#E8E9F6",
        color: "#414DB5",
        border: "2px solid #414DB5",
        borderRadius: "12px",
        fontWeight: "bold",
        px: 3,
        py: 1,
        whiteSpace: "nowrap", // ป้องกันการขึ้นบรรทัดใหม่
        minWidth: "fit-content", // ขนาดตามเนื้อหา
        "&:hover": {
          backgroundColor: "#dfe0f0",
        },
        ...sx, // เพิ่มรองรับ sx props จากภายนอก
      }}
      {...props}
    >
      {label}
    </Button>
  );
};

export default ExportButton;
