import React, { useState } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import { Box, Typography } from "@mui/material";
import ButtonService from "@services/ButtonService/ButtonService";
import AddIcon from "@mui/icons-material/Add";
import { useRouter } from "next/router";
import SelectField from "@services/SelectField/SelectField";

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

  // Options สำหรับรัฐวิสาหกิจ
  const stateEnterpriseOptions = [
    { label: "การไฟฟ้าฝ่ายผลิตแห่งประเทศไทย (กฟผ.)", value: "egat" },
    { label: "การไฟฟ้านครหลวง (กฟน.)", value: "mea" },
    { label: "การไฟฟ้าส่วนภูมิภาค (กฟภ.)", value: "pea" },
    { label: "บริษัท ปตท. จำกัด (มหาชน)", value: "ptt" },
    { label: "การประปานครหลวง", value: "mwa" },
    { label: "การประปาส่วนภูมิภาค", value: "pwa" },
    { label: "การทางพิเศษแห่งประเทศไทย", value: "exat" },
    { label: "การรถไฟแห่งประเทศไทย", value: "srt" },
    { label: "การรถไฟฟ้าขนส่งมวลชนแห่งประเทศไทย", value: "bmta" },
    { label: "การท่าเรือแห่งประเทศไทย", value: "pat" },
    { label: "บริษัท ทีโอที จำกัด (มหาชน)", value: "tot" },
    { label: "บริษัท กสท โทรคมนาคม จำกัด (มหาชน)", value: "kat" },
    { label: "ธนาคารกรุงไทย จำกัด (มหาชน)", value: "ktb" },
    { label: "ธนาคารกรุงเทพ จำกัด (มหาชน)", value: "bbl" },
    { label: "บริษัท ไปรษณีย์ไทย จำกัด", value: "thailand_post" },
  ];

  // Options สำหรับส่วนราชการ
  const governmentOptions = [
    { label: "กระทรวงมหาดไทย", value: "ministry_interior" },
    { label: "กระทรวงการคลัง", value: "ministry_finance" },
    { label: "กระทรวงศึกษาธิการ", value: "ministry_education" },
    { label: "กระทรวงสาธารณสุข", value: "ministry_health" },
    { label: "กระทรวงคมนาคม", value: "ministry_transport" },
    { label: "กระทรวงพาณิชย์", value: "ministry_commerce" },
    { label: "กระทรวงอุตสาหกรรม", value: "ministry_industry" },
    { label: "กระทรวงเกษตรและสหกรณ์", value: "ministry_agriculture" },
    {
      label: "กระทรวงทรัพยากรธรรมชาติและสิ่งแวดล้อม",
      value: "ministry_environment",
    },
    { label: "กระทรวงพลังงาน", value: "ministry_energy" },
    { label: "กระทรวงแรงงาน", value: "ministry_labour" },
    { label: "กระทรวงวิทยาศาสตร์และเทคโนโลยี", value: "ministry_science" },
    {
      label: "กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์",
      value: "ministry_social",
    },
    { label: "กระทรวงวัฒนธรรม", value: "ministry_culture" },
    { label: "กระทรวงการท่องเที่ยวและกีฬา", value: "ministry_tourism" },
    { label: "กระทรวงดิจิทัลเพื่อเศรษฐกิจและสังคม", value: "ministry_digital" },
    { label: "สำนักนายกรัฐมนตรี", value: "prime_minister_office" },
    { label: "กรมการปกครอง", value: "department_provincial" },
    { label: "กรมส่งเสริมการปกครองท้องถิ่น", value: "department_local_admin" },
    { label: "กรมพัฒนาที่ดิน", value: "land_development_department" },
  ];

  // Options สำหรับอื่นๆ
  const otherOptions = [
    {
      label: "สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตแห่งชาติ",
      value: "nacc",
    },
    {
      label: "สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ",
      value: "pacc",
    },
    { label: "สำนักงานอัยการสูงสุด", value: "attorney_general" },
    { label: "สำนักงานตำรวจแห่งชาติ", value: "royal_police" },
    { label: "สำนักงานผู้ตรวจการแผ่นดิน", value: "ombudsman" },
    { label: "สำนักงานศาลยุติธรรม", value: "courts_justice" },
    { label: "สำนักงานคณะกรรมการการเลือกตั้ง", value: "election_commission" },
    {
      label: "สำนักงานคณะกรรมการข้าราชการพลเรือน",
      value: "civil_service_commission",
    },
    { label: "สำนักงานการตรวจเงินแผ่นดิน", value: "state_audit_office" },
    { label: "ธนาคารแห่งประเทศไทย", value: "bank_of_thailand" },
    {
      label: "สำนักงานคณะกรรมการกำกับหลักทรัพย์และตลาดหลักทรัพย์",
      value: "sec",
    },
    {
      label: "สำนักงานคณะกรรมการคุ้มครองผู้บริโภค",
      value: "consumer_protection",
    },
    { label: "องค์การบริหารส่วนจังหวัด", value: "provincial_admin" },
    { label: "เทศบาลนคร", value: "city_municipality" },
    { label: "เทศบาลเมือง", value: "town_municipality" },
    { label: "เทศบาลตำบล", value: "subdistrict_municipality" },
    { label: "องค์การบริหารส่วนตำบล", value: "subdistrict_admin" },
  ];

  // ← แก้ไข: เปลี่ยนจาก object เดียวเป็น object แยกตาม field
  const [formData, setFormData] = useState({});

  // State to track the number of signatory boxes
  const [signatoryBoxes, setSignatoryBoxes] = useState(2);

  // State to track additional select menus for each section and signatory
  const [additionalSelects, setAdditionalSelects] = useState({});

  // ← แก้ไข: ปรับปรุง handleInputChange ให้จัดการแต่ละ field แยกกัน
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    console.log("📝 Input changed:", { name, value }); // debug log

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
              <SelectField
                label="เลือกหน่วยงานอื่นๆ (เพิ่มเติม)"
                options={otherOptions}
                value={formData[`other2_${number}`] || ""}
                onChange={handleInputChange}
                name={`other2_${number}`}
              />
            </Box>
            {renderAdditionalSelects("other", number)}
            <DepartmentButton section="other" signatoryNumber={number} />
          </Box>
        </Box>
      </Box>
    </Box>
  );

  // ← เพิ่ม debug function เพื่อดู current state
  console.log("🔍 Current formData:", formData);

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
          label="เพิ่มหน่วยงาน"
          variant="outlined"
          iconLeft={<AddIcon />}
          onClick={() => {
            console.log("💾 Saving data:", formData);
            router.push("/admin/settinggeneral/department/add");
          }}
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
