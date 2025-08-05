import React, { useState, useEffect } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import { Box, Typography } from "@mui/material";
import ButtonService from "@services/ButtonService/ButtonService";
import AddIcon from "@mui/icons-material/Add";
import { useRouter } from "next/router";
import SelectField from "@services/SelectField/SelectField";
import { getDepartmentGroup } from "@pages/api/department/department";

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

  // Options สำหรับตำแหน่งผู้ลงนาม
  const positionOptions = [
    { label: "ผู้อำนวยการ", value: "director" },
    { label: "รองผู้อำนวยการ", value: "deputy_director" },
    { label: "ผู้จัดการ", value: "manager" },
    { label: "รองผู้จัดการ", value: "deputy_manager" },
    { label: "หัวหน้าแผนก", value: "department_head" },
    { label: "รองหัวหน้าแผนก", value: "deputy_department_head" },
    { label: "ผู้อำนวยการฝ่าย", value: "division_director" },
    { label: "ผู้จัดการฝ่าย", value: "division_manager" },
    { label: "ประธานกรรมการ", value: "chairman" },
    { label: "รองประธานกรรมการ", value: "vice_chairman" },
    { label: "เลขานุการ", value: "secretary" },
    { label: "นายกเทศมนตรี", value: "mayor" },
    { label: "รองนายกเทศมนตรี", value: "deputy_mayor" },
    { label: "ปลัดเทศบาล", value: "municipal_clerk" },
    { label: "หัวหน้าส่วนราชการ", value: "government_head" },
  ];

  // Options สำหรับชื่อผู้ลงนาม
  const signatoryNameOptions = [
    { label: "นายสมชาย ใจดี", value: "somchai_jaidee" },
    { label: "นางสาวสุนีย์ รักเรียน", value: "sunee_rakrian" },
    { label: "นายอนุรักษ์ พัฒนา", value: "anurak_pattana" },
    { label: "นางมาลี สวยงาม", value: "malee_suayngam" },
    { label: "นายประเสริฐ ก้าวหน้า", value: "prasert_gaowana" },
    { label: "นางสาววิมล เก่งเรียน", value: "wimon_kengrian" },
    { label: "นายสุรชัย ขยันดี", value: "surachai_khayandee" },
    { label: "นางนิภา รับผิดชอบ", value: "nipa_rapphitchop" },
    { label: "นายธนากร บริการดี", value: "thanakorn_borikandee" },
    { label: "นางสาวพิมพ์ใจ ซื่อสัตย์", value: "pimjai_suesat" },
  ];

  // Helper: แปลง departments array เป็น options
  function mapDepartmentsToOptions(departments) {
    if (!Array.isArray(departments)) return [];
    return departments.map((dep) => ({
      label: dep.name,
      value: dep.id,
    }));
  }

  const [stateEnterpriseOptions, setStateEnterpriseOptions] = useState([]);
  const [governmentOptions, setGovernmentOptions] = useState([]);
  const [otherOptions, setOtherOptions] = useState([]);
  const [otherGroupOptions, setOtherGroupOptions] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      const res = await getDepartmentGroup();
      if (Array.isArray(res?.res_data)) {
        // จัดกลุ่ม
        const resData = res.res_data;
        // รัฐวิสาหกิจ, ส่วนราชการ, อื่น ๆ
        const stateEnterprise = resData.find(
          (item) => item.name === "รัฐวิสาหกิจ"
        );
        const government = resData.find((item) => item.name === "ส่วนราชการ");
        const others = resData.find((item) => item.name === "อื่น ๆ");

        setStateEnterpriseOptions(
          mapDepartmentsToOptions(stateEnterprise?.departments)
        );
        setGovernmentOptions(mapDepartmentsToOptions(government?.departments));
        setOtherOptions(mapDepartmentsToOptions(others?.departments));
        // กลุ่มอื่นๆ ตั้งแต่ตัวที่ 4 เป็นต้นไป
        const otherGroups = resData.slice(3).map((group) => ({
          groupName: group.name,
          label: group.name,
          options: mapDepartmentsToOptions(group.departments),
        }));
        setOtherGroupOptions(otherGroups);
      }
    };
    fetchOptions();
  }, []);

  // ← แก้ไข: เปลี่ยนจาก object เดียวเป็น object แยกตาม field
  const [formData, setFormData] = useState({});

  // State to track the number of signatory boxes
  const [signatoryBoxes, setSignatoryBoxes] = useState(2);

  // State to track additional select menus for each section and signatory
  const [additionalSelects, setAdditionalSelects] = useState({});

  // ← แก้ไข: ปรับปรุง handleInputChange ให้จัดการแต่ละ field แยกกัน
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    // console.log("📝 Input changed:", { name, value }); // debug log

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

  const DepartmentButton = ({
    section,
    signatoryNumber,
    label = "เพิ่มหน่วยงาน",
  }) => (
    <Box mt={1}>
      <ButtonService
        label={label}
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
          fontSize: "14px",  // ลดขนาดฟอนต์
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

    // เลือก options ตามประเภท section
    let options = [];
    switch (section) {
      case "name":
        options = signatoryNameOptions;
        break;
      case "state_enterprise":
        options = stateEnterpriseOptions;
        break;
      case "government":
        options = governmentOptions;
        break;
      case "other":
        options = otherOptions;
        break;
      default:
        options = [];
    }

    return selects.map((id) => (
      <Box mt={1} key={id}>
        <SelectField
          options={options}
          value={
            formData[`${section}_${signatoryNumber}_additional_${id}`] || ""
          }
          onChange={handleInputChange}
          name={`${section}_${signatoryNumber}_additional_${id}`}
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
        height: "auto",
        backgroundColor: "white",
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
            <SelectField
              label="เลือกตำแหน่ง"
              options={positionOptions}
              value={formData[`position_${number}`] || ""}
              onChange={handleInputChange}
              name={`position_${number}`}
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
            <SelectField
              label="เลือกชื่อผู้ลงนาม"
              options={signatoryNameOptions}
              value={formData[`name_${number}`] || ""}
              onChange={handleInputChange}
              name={`name_${number}`}
            />
            {renderAdditionalSelects("name", number)}
            <DepartmentButton
              section="name"
              signatoryNumber={number}
              label="เพิ่มผู้ลงนาม"
            />
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
            <SelectField
              label="เลือกรัฐวิสาหกิจ"
              options={stateEnterpriseOptions}
              value={formData[`state_enterprise_${number}`] || ""}
              onChange={handleInputChange}
              name={`state_enterprise_${number}`}
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
            <SelectField
              label="เลือกส่วนราชการ"
              options={governmentOptions}
              value={formData[`government_${number}`] || ""}
              onChange={handleInputChange}
              name={`government_${number}`}
            />
            {renderAdditionalSelects("government", number)}
            <DepartmentButton section="government" signatoryNumber={number} />

            <Typography sx={{ fontWeight: "bold", color: "#2499FF", mt: 1 }}>
              อื่นๆ
            </Typography>
            <SelectField
              label="เลือกหน่วยงานอื่นๆ"
              options={otherOptions}
              value={formData[`other1_${number}`] || ""}
              onChange={handleInputChange}
              name={`other1_${number}`}
            />
            <Box mt={1}>
              {/* ถ้าไม่มีกลุ่มอื่นๆเลย ให้ใช้ options ของ 'อื่น ๆ' แบบเดิม */}
              {otherGroupOptions.length === 0 ? (
                <SelectField
                  label="เลือกหน่วยงานอื่นๆ (เพิ่มเติม)"
                  options={otherOptions}
                  value={formData[`other2_${number}`] || ""}
                  onChange={handleInputChange}
                  name={`other2_${number}`}
                />
              ) : (
                otherGroupOptions.map((group, idx) => (
                  <SelectField
                    key={group.groupName}
                    label={group.label}
                    options={group.options}
                    value={formData[`other_${group.groupName}_${number}`] || ""}
                    onChange={handleInputChange}
                    name={`other_${group.groupName}_${number}`}
                  />
                ))
              )}
            </Box>
            {renderAdditionalSelects("other", number)}
            <DepartmentButton section="other" signatoryNumber={number} />
          </Box>
        </Box>
      </Box>
    </Box>
  );

  // ← เพิ่ม debug function เพื่อดู current state
  // console.log("🔍 Current formData:", formData);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: {
            xs: "column",
            md: "row",  
          },
          gap: {
            xs: 1.5,
            md: 0,
          },
          mb: 2,
        }}
      >
        <BreadcrumbsService items={breadcrumbItems} />
        <ButtonService
          label="เพิ่มหน่วยงาน"
          variant="outlined"
          iconLeft={<AddIcon />}
          onClick={() => {
            // console.log("💾 Saving data:", formData);
            router.push("/admin/settinggeneral/department/add");
          }}
          sx={{
            background: "#0067B1",
            color: "#ffffff",
            borderRadius: "15px",
            padding: "8px 20px",
            width: {
              xs: "100%",
              sm: "auto", 
            },
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
