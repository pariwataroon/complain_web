import React, { useState } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import {
  Box,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import TextfieldService from "@services/TextfieldService/TextfieldService"; // Import your custom TextfieldService
import SelectMenuService from "@services/SelectMenu/SelectMenu"; // Import your custom SelectMenuService
import ButtonService from "@services/ButtonService/ButtonService";
import AddIcon from "@mui/icons-material/Add";

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
    label: "กำหนดหน่วยงานในสังกัด",
  },
];

const CommitteeCompositionSettings = () => {
  const options = [
    { label: "ตำแหน่ง 1", value: "ตำแหน่ง 1" },
    { label: "ตำแหน่ง 2", value: "ตำแหน่ง 2" },
    { label: "ตำแหน่ง 3", value: "ตำแหน่ง 3" },
  ];

  const [formData, setFormData] = useState({
    name: "", // ชื่อผู้ลงนาม
    position: "", // ตำแหน่ง
  });

  // Handle input change for all fields
  const handleInputChange = (event) => {
    const { name, value } = event.target; // Destructure name and value
    setFormData((prevState) => {
      const updatedFormData = {
        ...prevState,
        [name]: value, // Dynamically update the field based on the 'name' attribute
      };

      console.log(updatedFormData); // Log the updated state

      return updatedFormData;
    });
  };

  return (
    <Box sx={{ padding: "16px" }}>
      <Box sx={{ marginBottom: "16px" }}>
        <BreadcrumbsService items={breadcrumbItems} />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "row", // Split layout into two columns
          borderRadius: "10px",
          border: "2px solid #2499FF",
          boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
          height: "400px",
        }}
      >
        {/* Sidebar for "ผู้ลงนาม" */}
        <Box
          sx={{
            width: "70px",
            background: "linear-gradient(to bottom, #0067B1, #2499FF)",
            borderTopRightRadius: "8px",
            borderBottomRightRadius: "8px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transform: "rotate(180deg)", // Rotating the text 180 degrees
            writingMode: "vertical-lr", // Ensure vertical text layout
            color: "white",
            fontWeight: "bold",
            marginRight: "16px", // Adjust spacing between left and right columns
            height: "100%",
          }}
        >
          <Typography variant="h5">ผู้ลงนาม</Typography>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            padding: 2,
          }}
        >
          <Grid container spacing={3}>
            {/* Left Grid - Name and Position */}
            <Grid item xs={12} md={6}>
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", color: "#1120A3" }}
              >
                ชื่อผู้ลงนาม
              </Typography>

              <Typography sx={{ fontWeight: "bold", color: "#1120A3" }}>
                ตำแหน่ง
              </Typography>
              <SelectMenuService
                options={options}
                value={formData.position} // Ensuring the value is bound to the state
                handleChange={handleInputChange} // Handle state update
                name="position" // Ensure the name matches the state field
                width="100%"
              />
            </Grid>

            {/* Right Grid - Name Input */}
            <Grid item xs={12} md={6}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  marginTop: { xs: "0px", md: "30px" },
                  color: "#1120A3",
                }}
              >
                ชื่อผู้ลงนาม
              </Typography>
              <SelectMenuService
                options={options}
                value={formData.name}
                onChange={handleInputChange}
                name="name"
                width="100%"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", color: "#2499FF" }}
              >
                หน่วยงานรับผิดชอบเรื่องร้องเรียนร้องทุกข์
              </Typography>
              <Typography sx={{ fontWeight: "bold", color: "#2499FF" }}>
                รัฐวิสาหกิจ
              </Typography>
              <Box>
                <SelectMenuService
                  options={options}
                  value={formData.name}
                  onChange={handleInputChange}
                  name="name"
                  width="100%"
                />
              </Box>
              <Box mt={1}>
                <ButtonService
                  label="เพิ่มหน่วยงาน"
                  color="#2499FF"
                  iconRight={<AddIcon />}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default CommitteeCompositionSettings;
