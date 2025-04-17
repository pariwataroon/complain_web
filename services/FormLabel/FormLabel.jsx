import React from "react";
import { Typography } from "@mui/material";

const FormLabel = ({ children }) => (
    <Typography
        variant="body2"
        sx={{
            fontWeight: "bold",
            fontSize: "16px",
            color: "#1120A3",
            mb: 1,
        }}
    >
        {children}
    </Typography>
);

export default FormLabel;
