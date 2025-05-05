import React, { useState } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import { Box, Typography } from "@mui/material";
import SelectMenuService from "@services/SelectMenu/SelectMenu";
import ButtonService from "@services/ButtonService/ButtonService";
import AddIcon from "@mui/icons-material/Add";
import { useRouter } from "next/router";

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
  const router = useRouter();

  const options = [
    { label: "ตำแหน่ง 1", value: "ตำแหน่ง 1" },
    { label: "ตำแหน่ง 2", value: "ตำแหน่ง 2" },
    { label: "ตำแหน่ง 3", value: "ตำแหน่ง 3" },
  ];

  const [formData, setFormData] = useState({
    name: "",
    position: "",
  });

  // State to track the number of signatory boxes
  const [signatoryBoxes, setSignatoryBoxes] = useState(2);

  // State to track additional select menus for each section and signatory
  const [additionalSelects, setAdditionalSelects] = useState({});

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Function to add a new select menu to a specific section
  const addSelectMenu = (section, signatoryNumber) => {
    const sectionKey = `${section}_${signatoryNumber}`;

    setAdditionalSelects((prevState) => {
      const currentSelects = prevState[sectionKey] || [];
      return {
        ...prevState,
        [sectionKey]: [...currentSelects, Date.now()], // Use timestamp as unique ID
      };
    });
  };

  // Department Button Component with functionality to add select menus
  const DepartmentButton = ({ section, signatoryNumber }) => (
    <Box mt={1}>
      <ButtonService
        label="เพิ่มหน่วยงาน"
        color="#2499FF"
        iconRight={<AddIcon />}
        variant="outlined"
        onClick={() => addSelectMenu(section, signatoryNumber)}
        sx={{
          backgroundColor: "#ffffff",
          color: "#1E88E5",
          borderRadius: "15px",
          width: "100%",
          height: "40px",
          fontSize: "17px",
          "&:hover": {
            backgroundColor: "#1E88E5",
            color: "#ffffff",
          },
        }}
      />
    </Box>
  );

  // Function to add a new signatory box
  const addSignatoryBox = () => {
    setSignatoryBoxes(signatoryBoxes + 1);
  };

  // Render additional select menus for a specific section
  const renderAdditionalSelects = (section, signatoryNumber) => {
    const sectionKey = `${section}_${signatoryNumber}`;
    const selects = additionalSelects[sectionKey] || [];

    return selects.map((id) => (
      <Box mt={1} key={id}>
        <SelectMenuService
          options={options}
          value=""
          onChange={handleInputChange}
          name={`${section}_${signatoryNumber}_additional_${id}`}
          width="100%"
        />
      </Box>
    ));
  };

  // Component for a single signatory box
  const SignatoryBox = ({ number }) => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        borderRadius: "10px",
        border: "2px solid #2499FF",
        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
        mb: 2,
        height: "auto", // Allow height to adjust based on content
      }}
    >
      {/* Vertical sidebar */}
      <Box
        sx={{
          width: "70px",
          background: "linear-gradient(to bottom, #2499FF, #0067B1)",
          borderTopRightRadius: "8px",
          borderBottomRightRadius: "8px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          transform: "rotate(180deg)",
          writingMode: "vertical-lr",
          color: "white",
          fontWeight: "bold",
          alignSelf: "stretch", // This makes the sidebar stretch to match parent's height
        }}
      >
        <Typography variant="h5">ผู้ลงนาม {number}</Typography>
      </Box>

      {/* Content area */}
      <Box
        sx={{
          flexGrow: 1,
          padding: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            width: "100%",
          }}
        >
          {/* Left side */}
          <Box
            sx={{
              width: { xs: "100%", md: "50%" },
              pr: { xs: 0, md: 2 },
              mb: { xs: 2, md: 0 },
            }}
          >
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
              value={formData.position}
              handleChange={handleInputChange}
              name={`position_${number}`}
              width="100%"
            />
          </Box>

          {/* Right side */}
          <Box sx={{ width: { xs: "100%", md: "50%" } }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                marginTop: { xs: 0, md: "23px" },
                color: "#1120A3",
              }}
            >
              ชื่อผู้ลงนาม
            </Typography>
            <SelectMenuService
              options={options}
              value={formData.name}
              onChange={handleInputChange}
              name={`name_${number}`}
              width="100%"
            />
            {renderAdditionalSelects("name", number)}
            <DepartmentButton section="name" signatoryNumber={number} />
          </Box>
        </Box>

        {/* Complaint handling departments section */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            width: "100%",
            mt: 2,
          }}
        >
          {/* Left side - State Enterprises */}
          <Box
            sx={{
              width: { xs: "100%", md: "50%" },
              pr: { xs: 0, md: 2 },
              mb: { xs: 2, md: 0 },
            }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: "bold", color: "#2499FF" }}
            >
              หน่วยงานรับผิดชอบเรื่องร้องเรียนร้องทุกข์
            </Typography>
            <Typography sx={{ fontWeight: "bold", color: "#2499FF" }}>
              รัฐวิสาหกิจ
            </Typography>
            <SelectMenuService
              options={options}
              value={formData.name}
              onChange={handleInputChange}
              name={`state_enterprise_${number}`}
              width="100%"
            />
            {renderAdditionalSelects("state_enterprise", number)}
            <DepartmentButton
              section="state_enterprise"
              signatoryNumber={number}
            />
          </Box>

          {/* Right side - Government and Other */}
          <Box sx={{ width: { xs: "100%", md: "50%" } }}>
            <Typography
              sx={{
                fontWeight: "bold",
                color: "#2499FF",
                mt: { xs: 0, md: 4 },
              }}
            >
              ส่วนราชการ
            </Typography>
            <SelectMenuService
              options={options}
              value={formData.name}
              onChange={handleInputChange}
              name={`government_${number}`}
              width="100%"
            />
            {renderAdditionalSelects("government", number)}
            <DepartmentButton section="government" signatoryNumber={number} />

            <Typography sx={{ fontWeight: "bold", color: "#2499FF", mt: 1 }}>
              อื่นๆ
            </Typography>
            <SelectMenuService
              options={options}
              value={formData.name}
              onChange={handleInputChange}
              name={`other1_${number}`}
              width="100%"
            />
            <Box mt={1}>
              <SelectMenuService
                options={options}
                value={formData.name}
                onChange={handleInputChange}
                name={`other2_${number}`}
                width="100%"
              />
            </Box>
            {renderAdditionalSelects("other", number)}
            <DepartmentButton section="other" signatoryNumber={number} />
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <BreadcrumbsService items={breadcrumbItems} />
        <ButtonService
          label="บันทึก"
          variant="outlined"
          iconLeft={<AddIcon />}
          onClick={() => router.push("/admin/settinggeneral/department/add")}
          sx={{
            background: "#0067B1",
            color: "#ffffff",
            borderRadius: "15px",
            padding: "8px 20px",
            width: "200px",
            fontSize: "16px",
            border: "2px solid #0067B1",
          }}
        />
      </Box>

      {/* Render signatory boxes based on state */}
      {Array.from({ length: signatoryBoxes }).map((_, index) => (
        <SignatoryBox key={index} number={index + 1} />
      ))}

      {/* Add new signatory box button */}
      <Box mt={2} display="flex" justifyContent="center">
        <ButtonService
          label="เพิ่มผู้ลงนาม"
          color="#2499FF"
          iconRight={<AddIcon />}
          variant="contained"
          onClick={addSignatoryBox}
          sx={{
            backgroundColor: "#2499FF",
            color: "#ffffff",
            borderRadius: "15px",
            padding: "10px 30px",
            fontSize: "18px",
            "&:hover": {
              backgroundColor: "#0067B1",
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default CommitteeCompositionSettings;
