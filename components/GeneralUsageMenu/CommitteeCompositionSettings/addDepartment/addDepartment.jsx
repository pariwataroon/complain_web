import React, { useState, useEffect } from "react";
import { Box, Typography, IconButton, Modal } from "@mui/material";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import ButtonService from "@services/ButtonService/ButtonService";
import SearchIcon from "@mui/icons-material/Search";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import RemoveCircleOutlineOutlinedIcon from "@mui/icons-material/RemoveCircleOutlineOutlined";
import styles from "./departmentManagement.module.scss";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import { SketchPicker } from "react-color";
import TextfieldService from "@services/TextfieldService/TextfieldService";
import {
  GetDetailDepartment,
  CreateVenue,
  DeleteVenue,
  UpdateVenue,
} from "@pages/api/settinggeneral/department/department";
import { alertSuccess, showConfirm, alertError } from "@utils/Alerts";
import SelectField from "@services/SelectField/SelectField";

/* -------------------------------------------------------------------------- */
/*  static data                                                               */
/* -------------------------------------------------------------------------- */
const breadcrumbItems = [
  {
    label: "เมนูกำหนดการใช้งานทั่วไป",
    icon: (
      <img
        src="/icons/settingico.png"
        alt="icon"
        style={{ width: "24px", height: "24px", marginBottom: "-8px" }}
      />
    ),
  },
  {
    label: "กำหนดหน่วยงานในสังกัด",
    url: "/admin/settinggeneral/department",
  },
];

// Mock options สำหรับส่วนราชการ
const mockGovernmentOptions = [
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
  { label: "กรมทรัพยากรน้ำ", value: "department_water_resources" },
  { label: "กรมอุตุนิยมวิทยา", value: "meteorological_department" },
  {
    label: "กรมป้องกันและบรรเทาสาธารณภัย",
    value: "disaster_prevention_department",
  },
  { label: "กรมโยธาธิการและผังเมือง", value: "public_works_department" },
  { label: "กรมสรรพากร", value: "revenue_department" },
];

// Mock options สำหรับรัฐวิสาหกิจ
const mockStateEnterpriseOptions = [
  { label: "การไฟฟ้าฝ่ายผลิตแห่งประเทศไทย (กฟผ.)", value: "egat" },
  { label: "การไฟฟ้านครหลวง (กฟน.)", value: "mea" },
  { label: "การไฟฟ้าส่วนภูมิภาค (กฟภ.)", value: "pea" },
  { label: "บริษัท ปตท. จำกัด (มหาชน)", value: "ptt" },
  { label: "บริษัท ปตท. สำรวจและผลิตปิโตรเลียม จำกัด (มหาชน)", value: "pttep" },
  { label: "บริษัท ปตท. โกลบอล เคมิคอล จำกัด (มหาชน)", value: "pttgc" },
  { label: "การประปานครหลวง", value: "mwa" },
  { label: "การประปาส่วนภูมิภาค", value: "pwa" },
  { label: "การทางพิเศษแห่งประเทศไทย", value: "exat" },
  { label: "การรถไฟแห่งประเทศไทย", value: "srt" },
  { label: "การรถไฟฟ้าขนส่งมวลชนแห่งประเทศไทย", value: "bmta" },
  { label: "การท่าเรือแห่งประเทศไทย", value: "pat" },
  { label: "การท่าอากาศยานแห่งประเทศไทย", value: "aot" },
  { label: "บริษัท ทีโอที จำกัด (มหาชน)", value: "tot" },
  { label: "บริษัท กสท โทรคมนาคม จำกัด (มหาชน)", value: "kat" },
  { label: "ธนาคารกรุงไทย จำกัด (มหาชน)", value: "ktb" },
  { label: "ธนาคารกรุงเทพ จำกัด (มหาชน)", value: "bbl" },
  { label: "ธนาคารกสิกรไทย จำกัด (มหาชน)", value: "kbank" },
  { label: "บริษัท ไปรษณีย์ไทย จำกัด", value: "thailand_post" },
  {
    label: "บริษัท ท่อส่งก๊าซธรรมชาติแห่งประเทศไทย จำกัด (มหาชน)",
    value: "pttngd",
  },
  { label: "การยางแห่งประเทศไทย", value: "raot" },
  { label: "การนิคมอุตสาหกรรมแห่งประเทศไทย", value: "ieat" },
  { label: "การไฟฟ้าส่วนภูมิภาค", value: "pea_regional" },
  { label: "บริษัท บางจาก คอร์ปอเรชั่น จำกัด (มหาชน)", value: "bjc" },
  { label: "บริษัท ไทยออยล์ จำกัด (มหาชน)", value: "top" },
];

// Mock options สำหรับอื่นๆ
const mockOtherOptions = [
  {
    label: "สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตแห่งชาติ (ป.ป.ช.)",
    value: "nacc",
  },
  {
    label: "สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ (ป.ป.ท.)",
    value: "pacc",
  },
  { label: "สำนักงานอัยการสูงสุด", value: "attorney_general" },
  { label: "สำนักงานตำรวจแห่งชาติ", value: "royal_police" },
  { label: "สำนักงานผู้ตรวจการแผ่นดิน", value: "ombudsman" },
  { label: "สำนักงานศาลยุติธรรม", value: "courts_justice" },
  { label: "สำนักงานศาลปกครอง", value: "administrative_court" },
  {
    label: "สำนักงานคณะกรรมการการเลือกตั้ง (กกต.)",
    value: "election_commission",
  },
  {
    label: "สำนักงานคณะกรรมการข้าราชการพลเรือน (ก.พ.)",
    value: "civil_service_commission",
  },
  { label: "สำนักงานการตรวจเงินแผ่นดิน", value: "state_audit_office" },
  { label: "ธนาคารแห่งประเทศไทย", value: "bank_of_thailand" },
  {
    label: "สำนักงานคณะกรรมการกำกับหลักทรัพย์และตลาดหลักทรัพย์ (ก.ล.ต.)",
    value: "sec",
  },
  {
    label: "สำนักงานคณะกรรมการคุ้มครองผู้บริโภค",
    value: "consumer_protection",
  },
  {
    label: "สำนักงานคณะกรรมการข้าราชการครู (ก.ค.ศ.)",
    value: "teacher_council",
  },
  {
    label: "สำนักงานคณะกรรมการพัฒนาการเศรษฐกิจและสังคมแห่งชาติ (สศช.)",
    value: "nesdb",
  },
  { label: "องค์การบริหารส่วนจังหวัด", value: "provincial_admin" },
  { label: "เทศบาลนคร", value: "city_municipality" },
  { label: "เทศบาลเมือง", value: "town_municipality" },
  { label: "เทศบาลตำบล", value: "subdistrict_municipality" },
  { label: "องค์การบริหารส่วนตำบล (อบต.)", value: "subdistrict_admin" },
  { label: "กรุงเทพมหานคร (กทม.)", value: "bangkok_metro" },
  { label: "เมืองพัทยา", value: "pattaya_city" },
  { label: "สำนักงานปลัดสำนักนายกรัฐมนตรี", value: "pmo_secretariat" },
  { label: "สำนักข่าวกรองแห่งชาติ (สขช.)", value: "nis" },
  { label: "สำนักงานสภาความมั่นคงแห่งชาติ (สมช.)", value: "nsc" },
];

/* -------------------------------------------------------------------------- */
/*  component                                                                  */
/* -------------------------------------------------------------------------- */
const DepartmentManagement = () => {
  /* ---------------------------------- state --------------------------------- */

  const [expandedSections, setExpandedSections] = useState({ 0: true });
  const [addSectionIdx, setAddSectionIdx] = useState(null); // section index for Add modal
  const [editUser, setEditUser] = useState(null); // user object for Edit modal
  const [deleteUser, setDeleteUser] = useState(null); // user object for Delete modal

  // search form
  const [formData, setFormData] = useState({
    government: "",
    stateEnterprise: "",
    other: "",
  });

  /* ------------------------------ state ----------------------------------- */
  const [stats, setStats] = useState({ res_data: [] });
  const [filteredStats, setFilteredStats] = useState({ res_data: [] });
  const [stateEnterpriseOptions, setStateEnterpriseOptions] = useState(
    mockStateEnterpriseOptions
  );
  const [governmentOptions, setGovernmentOptions] = useState(
    mockGovernmentOptions
  );
  const [otherOptions, setOtherOptions] = useState(mockOtherOptions);

  /* ------------------------------- useEffect -------------------------------- */
  const fetchDepartmentDetails = async () => {
    try {
      const response = await GetDetailDepartment();

      /* ---------- 1. ดึง venues เฉพาะกลุ่ม "รัฐวิสาหกิจ" ---------- */
      const wisetakitVenues = response.res_data.flatMap((dept) =>
        dept.venue_groups
          .filter((g) => g.group_name === "รัฐวิสาหกิจ")
          .flatMap((g) => g.venues)
      );

      /* ---------- 2. สร้าง options แล้วเก็บใน state ใหม่ ---------- */
      const wisetakitOptions = wisetakitVenues.map((v) => ({
        label: v.name, // หรือ v.short_name แล้วแต่ต้องการแสดง
        value: v.id, // จะใช้ code / abbreviation ก็เปลี่ยนตรงนี้
      }));
      // Merge กับ mock data
      setStateEnterpriseOptions([
        ...mockStateEnterpriseOptions,
        ...wisetakitOptions,
      ]);

      /* ---------- 1. ดึง venues เฉพาะกลุ่ม "ส่วนราชการ" ---------- */
      const GovVenues = response.res_data.flatMap((dept) =>
        dept.venue_groups
          .filter((g) => g.group_name === "ส่วนราชการ")
          .flatMap((g) => g.venues)
      );

      /* ---------- 2. สร้าง options แล้วเก็บใน state ใหม่ ---------- */
      const govOptions = GovVenues.map((v) => ({
        label: v.name, // หรือ v.short_name แล้วแต่ต้องการแสดง
        value: v.id, // จะใช้ code / abbreviation ก็เปลี่ยนตรงนี้
      }));
      // Merge กับ mock data
      setGovernmentOptions([...mockGovernmentOptions, ...govOptions]);

      /* ---------- 1. ดึง venues เฉพาะกลุ่ม "อื่นๆ" ---------- */
      const OtherVenues = response.res_data.flatMap((dept) =>
        dept.venue_groups
          .filter((g) => g.group_name === "อื่นๆ")
          .flatMap((g) => g.venues)
      );

      /* ---------- 2. สร้าง options แล้วเก็บใน state ใหม่ ---------- */
      const otherOpts = OtherVenues.map((v) => ({
        label: v.name, // หรือ v.short_name แล้วแต่ต้องการแสดง
        value: v.id, // จะใช้ code / abbreviation ก็เปลี่ยนตรงนี้
      }));
      // Merge กับ mock data
      setOtherOptions([...mockOtherOptions, ...otherOpts]);

      /* ---------- 3. map ข้อมูลเดิมไว้ใช้งานหน้าตาราง ---------- */
      const mappedData = response.res_data.map((department) => ({
        department_id: department.department_id || department.id,
        role_name: department.department_code.toLowerCase(),
        role_description: department.department_name,
        users: department.venue_groups.flatMap((group) =>
          group.venues.map((venue) => ({
            id: venue.id,
            main_department: venue.name,
            sub_department: venue.short_name || "-",
            color_code: venue.color_code,
            group_name: group.group_name,
          }))
        ),
      }));

      setStats({ res_data: mappedData });
      setFilteredStats({ res_data: mappedData });
    } catch (err) {
      console.error("Error fetching department details:", err);
      // ใช้ mock data ถ้า API error
      const mockData = {
        res_data: [
          {
            department_id: 1,
            role_name: "government",
            role_description: "ส่วนราชการ",
            users: [
              {
                id: 1,
                main_department: "กระทรวงมหาดไทย",
                sub_department: "มท.",
                color_code: "#FF5722",
                group_name: "ส่วนราชการ",
              },
              {
                id: 2,
                main_department: "กระทรวงการคลัง",
                sub_department: "กค.",
                color_code: "#4CAF50",
                group_name: "ส่วนราชการ",
              },
            ],
          },
          {
            department_id: 2,
            role_name: "state_enterprise",
            role_description: "รัฐวิสาหกิจ",
            users: [
              {
                id: 3,
                main_department: "การไฟฟ้าฝ่ายผลิตแห่งประเทศไทย",
                sub_department: "กฟผ.",
                color_code: "#2196F3",
                group_name: "รัฐวิสาหกิจ",
              },
              {
                id: 4,
                main_department: "บริษัท ปตท. จำกัด (มหาชน)",
                sub_department: "ปตท.",
                color_code: "#FF9800",
                group_name: "รัฐวิสาหกิจ",
              },
            ],
          },
          {
            department_id: 3,
            role_name: "other",
            role_description: "อื่นๆ",
            users: [
              {
                id: 5,
                main_department:
                  "สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตแห่งชาติ",
                sub_department: "ป.ป.ช.",
                color_code: "#9C27B0",
                group_name: "อื่นๆ",
              },
              {
                id: 6,
                main_department: "ธนาคารแห่งประเทศไทย",
                sub_department: "ธปท.",
                color_code: "#607D8B",
                group_name: "อื่นๆ",
              },
            ],
          },
        ],
      };
      setStats(mockData);
      setFilteredStats(mockData);
    }
  };

  /* ------------------------------- useEffect -------------------------------- */
  useEffect(() => {
    fetchDepartmentDetails();
  }, []);

  /* ---------------------------------- data ---------------------------------- */

  /* ------------------------------- id helpers ------------------------------- */
  const getNextId = () => {
    const ids = stats.res_data.flatMap((s) => s.users.map((u) => u.id));
    return ids.length ? Math.max(...ids) + 1 : 1;
  };

  /* -------------------------------- handlers -------------------------------- */
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // console.log("SelectField change →", updated);
      return updated;
    });
  };

  const handleSearch = () => {
    const { government, stateEnterprise, other } = formData;

    // ไม่มีเงื่อนไข → แสดงทั้งหมด
    if (!government && !stateEnterprise && !other) {
      setFilteredStats(stats);
      return;
    }

    // กรองแต่ละ section แล้วรวมใหม่
    const filteredSections = stats.res_data
      .map((section) => {
        // เงื่อนไขของ section (government)
        if (government && section.role_description !== government) return null;

        // เงื่อนไขของ user ภายใน (stateEnterprise / other)
        const filteredUsers = section.users.filter((user) => {
          const matchStateEnt = !stateEnterprise || user.id === stateEnterprise;
          const matchOther = !other || user.sub_department === other;
          return matchStateEnt && matchOther;
        });

        if (filteredUsers.length === 0) return null;
        return { ...section, users: filteredUsers };
      })
      .filter(Boolean);

    setFilteredStats({ res_data: filteredSections });
  };

  const toggleSection = (idx) => {
    setExpandedSections((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  /* -------------------------------------------------------------------------- */
  /*  Add Modal                                                                 */
  /* -------------------------------------------------------------------------- */
  const AddUserModal = ({ open, sectionIdx, onClose }) => {
    /* ------------------------------ local state ----------------------------- */
    const [mainDepartment, setMainDepartment] = useState("");
    const [subDepartment, setSubDepartment] = useState("");
    const [colorCode, setColorCode] = useState("#FFFFFF");
    const [colorOptions, setColorOptions] = useState([]);

    /* ------------------------------- effects -------------------------------- */
    useEffect(() => {
      if (colorCode && !colorOptions.some((c) => c.value === colorCode)) {
        setColorOptions((prev) => [
          ...prev,
          { label: colorCode.toUpperCase(), value: colorCode.toUpperCase() },
        ]);
      }
    }, [colorCode]);

    /* ------------------------------ handlers ------------------------------- */
    const handleColorChange = (color) => {
      setColorCode(color.hex.toUpperCase());
    };

    const handleColorInputChange = (e) => {
      setColorCode((e.target.value || "").toUpperCase());
    };

    const handleSave = async () => {
      // สร้าง obj สำหรับ UI
      const newUser = {
        id: getNextId(),
        main_department: mainDepartment,
        sub_department: subDepartment,
        color_code: colorCode,
        group_name: stats.res_data[sectionIdx]?.users[0]?.group_name || "อื่นๆ", // default
      };

      // อัปเดต state ก่อน
      setStats((prev) => {
        const updated = prev.res_data.map((sec, i) =>
          i === sectionIdx ? { ...sec, users: [...sec.users, newUser] } : sec
        );
        return { ...prev, res_data: updated };
      });

      // เตรียม payload ส่ง API
      try {
        const section = stats.res_data[sectionIdx];
        const payload = {
          name: mainDepartment,
          code: subDepartment || mainDepartment.substring(0, 5).toUpperCase(),
          abbreviation: subDepartment,
          color_code: colorCode,
          short_name: subDepartment,
          group_name: newUser.group_name,
          department_id: section?.department_id,
        };
        await CreateVenue(payload);

        // Fetch updated department details after creating the new venue
        fetchDepartmentDetails();

        // Show success alert
        alertSuccess("สำเร็จ!", "เพิ่มหน่วยงานใหม่เรียบร้อยแล้ว");
      } catch (err) {
        console.error("CreateVenue error:", err);
        alertError("เกิดข้อผิดพลาด", "ไม่สามารถเพิ่มหน่วยงานได้ กรุณาลองใหม่");
      }

      onClose();
    };

    /* -------------------------------- render ------------------------------- */
    return (
      <Modal open={open} onClose={onClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            width: 500,
          }}
        >
          <Typography variant="h5" color="#1120A3" mb={2}>
            เพิ่มหน่วยงาน
          </Typography>

          {/* Main Department */}
          <Typography fontSize={18} mb={1} color="#1120A3">
            ชื่อหน่วยงานหลัก <span style={{ color: "red" }}>*</span>
          </Typography>
          <TextfieldService
            value={mainDepartment}
            onChange={(e) => setMainDepartment(e.target.value)}
            placeholder="ชื่อหน่วยงานหลัก"
            name="main_department"
          />

          {/* Sub Department */}
          <Typography fontSize={18} mb={1} color="#1120A3" mt={2}>
            ตัวย่อหน่วยงาน
          </Typography>
          <TextfieldService
            value={subDepartment}
            onChange={(e) => setSubDepartment(e.target.value)}
            placeholder="ตัวย่อหน่วยงาน"
            name="sub_department"
          />

          {/* Color */}
          <Typography fontSize={18} mb={1} color="#1120A3" mt={2}>
            สี <span style={{ color: "red" }}>*</span>
          </Typography>
          <TextfieldService
            value={colorCode}
            onChange={handleColorInputChange}
            placeholder="#RRGGBB"
            name="color_code"
          />

          {/* Sketch Picker */}
          <Box mt={2}>
            <Typography fontSize={18} mb={1} color="#1120A3">
              ตัวเลือกสีแบบละเอียด
            </Typography>
            <SketchPicker
              color={colorCode || "#FFFFFF"}
              onChangeComplete={handleColorChange}
              presetColors={colorOptions.map((c) => c.value)}
            />
          </Box>

          {/* Actions */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 1,
              mt: 4,
            }}
          >
            <ButtonService
              label="ยกเลิก"
              variant="outlined"
              onClick={onClose}
              color="#50ADFF"
              iconLeft={<CloseOutlinedIcon />}
              sx={{
                width: "48%",
                height: 56,
                borderRadius: 15,
                fontSize: 20,
                "&:hover": { backgroundColor: "#D0E8FC", boxShadow: "none" },
              }}
            />
            <ButtonService
              label="ยืนยัน"
              variant="contained"
              onClick={handleSave}
              iconRight={<CheckOutlinedIcon />}
              color="#2499FF"
              sx={{
                width: "48%",
                height: 56,
                borderRadius: 15,
                fontSize: 20,
                "&:hover": { backgroundColor: "#2499FF" },
              }}
            />
          </Box>
        </Box>
      </Modal>
    );
  };

  /* -------------------------------------------------------------------------- */
  /*  Edit Modal                                                                */
  /* -------------------------------------------------------------------------- */
  const EditUserModal = ({ open, onClose, onSave, user }) => {
    const [selectedDepartment, setSelectedDepartment] = useState(
      user?.main_department || ""
    );
    const [selectedSubDepartment, setSelectedSubDepartment] = useState(
      user?.sub_department || ""
    );
    const [selectedColor, setSelectedColor] = useState(
      (user?.color_code || "").toUpperCase()
    );
    const [colorOptions, setColorOptions] = useState(
      selectedColor ? [{ label: selectedColor, value: selectedColor }] : []
    );

    useEffect(() => {
      if (
        selectedColor &&
        !colorOptions.some((c) => c.value === selectedColor)
      ) {
        setColorOptions((prev) => [
          ...prev,
          { label: selectedColor, value: selectedColor },
        ]);
      }
    }, [selectedColor]);

    const handleColorChange = (color) => {
      setSelectedColor(color.hex.toUpperCase());
    };

    const handleColorInputChange = (e) => {
      setSelectedColor((e.target.value || "").toUpperCase());
    };

    const handleSave = async () => {
      const updatedUser = {
        ...user,
        main_department: selectedDepartment,
        sub_department: selectedSubDepartment,
        color_code: selectedColor,
      };

      // Call the UpdateVenue function to update the venue on the server
      try {
        const payload = {
          name: selectedDepartment,
          code:
            selectedSubDepartment ||
            selectedDepartment.substring(0, 5).toUpperCase(),
          abbreviation: selectedSubDepartment,
          color_code: selectedColor,
          short_name: selectedSubDepartment,
          group_name: user.group_name, // Assuming we want to keep the same group name
          department_id: user.department_id,
        };

        // Trigger the API call to update the venue
        await UpdateVenue(user.id, payload);

        // After successful update, update the local state as well
        onSave(updatedUser);

        // Fetch the department details again after the update is successful
        await fetchDepartmentDetails(); // Fetch updated details after successful update

        // Show success alert
        alertSuccess("สำเร็จ!", "ข้อมูลหน่วยงานถูกอัปเดตเรียบร้อย");

        onClose();
      } catch (err) {
        console.error("Error updating venue:", err);
        alertError(
          "เกิดข้อผิดพลาด",
          "ไม่สามารถอัปเดตข้อมูลหน่วยงานได้ กรุณาลองใหม่"
        );
      }
    };

    if (!user) return null;

    return (
      <Modal open={open} onClose={onClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            width: 500,
          }}
        >
          <Typography variant="h5" color="#1120A3" mb={2}>
            แก้ไขหน่วยงาน
          </Typography>
          {/* Main Department */}
          <Typography fontSize={18} mb={1} color="#1120A3">
            ชื่อหน่วยงานหลัก <span style={{ color: "red" }}>*</span>
          </Typography>
          <TextfieldService
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            placeholder="ชื่อหน่วยงานหลัก"
            name="main_department"
          />
          {/* Sub Department */}
          <Typography fontSize={18} mb={1} color="#1120A3" mt={2}>
            ตัวย่อหน่วยงาน
          </Typography>
          <TextfieldService
            value={selectedSubDepartment}
            onChange={(e) => setSelectedSubDepartment(e.target.value)}
            placeholder="ตัวย่อหน่วยงาน"
            name="sub_department"
          />
          {/* Color */}
          <Typography fontSize={18} mb={1} color="#1120A3" mt={2}>
            สี <span style={{ color: "red" }}>*</span>
          </Typography>
          <TextfieldService
            value={selectedColor}
            onChange={handleColorInputChange}
            placeholder="#RRGGBB"
            name="color_code"
          />
          {/* Sketch Picker */}
          <Box mt={2}>
            <Typography fontSize={18} mb={1} color="#1120A3">
              ตัวเลือกสีแบบละเอียด
            </Typography>
            <SketchPicker
              color={selectedColor || "#FFFFFF"}
              onChangeComplete={handleColorChange}
              presetColors={colorOptions.map((c) => c.value)}
            />
          </Box>
          {/* Actions */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 1,
              mt: 4,
            }}
          >
            <ButtonService
              label="ยกเลิก"
              variant="outlined"
              onClick={onClose}
              color="#50ADFF"
              iconLeft={<CloseOutlinedIcon />}
              sx={{
                width: "48%",
                height: 56,
                borderRadius: 15,
                fontSize: 20,
                "&:hover": { backgroundColor: "#D0E8FC", boxShadow: "none" },
              }}
            />
            <ButtonService
              label="ยืนยัน"
              variant="contained"
              onClick={handleSave}
              iconRight={<CheckOutlinedIcon />}
              color="#2499FF"
              sx={{
                width: "48%",
                height: 56,
                borderRadius: 15,
                fontSize: 20,
                "&:hover": { backgroundColor: "#2499FF" },
              }}
            />
          </Box>
        </Box>
      </Modal>
    );
  };

  /* -------------------------------------------------------------------------- */
  /*  Delete Modal                                                               */
  /* -------------------------------------------------------------------------- */
  const DeleteUserModal = ({ open, onClose, user }) => {
    if (!user) return null;

    const handleDelete = async (user) => {
      try {
        // Call DeleteVenue function directly when the user clicks "ตกลง"
        await DeleteVenue(user.id); // Pass user.id to delete the venue

        // Remove user from the state after successful deletion
        setStats((prevState) => {
          const updatedData = prevState.res_data.map((section) => {
            const updatedUsers = section.users.filter((u) => u.id !== user.id);
            return { ...section, users: updatedUsers };
          });
          return { ...prevState, res_data: updatedData };
        });

        // Fetch updated department details after successful deletion
        fetchDepartmentDetails();

        // Show success alert after deletion
        alertSuccess("สำเร็จ!", "ลบหน่วยงานเรียบร้อยแล้ว");

        setDeleteUser(null);
      } catch (err) {
        console.error("Error deleting venue:", err);
        alertError("เกิดข้อผิดพลาด", "ไม่สามารถลบหน่วยงานได้ กรุณาลองใหม่");
      }
    };

    return (
      <Modal open={open} onClose={onClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            width: 500,
          }}
        >
          <Typography fontSize={24} color="#932626" align="center" mb={2}>
            ลบหน่วยงาน
          </Typography>
          <Typography fontSize={16} color="#932626" align="center" mb={3}>
            การลบหน่วยงานจะเป็นการย้ายรายการนี้ไปยังคลังเก็บข้อมูลในฐานข้อมูล
            ซึ่งสามารถกู้คืนได้จากระบบหากจำเป็น และจะไม่แสดงผลในหน้านี้อีก
          </Typography>
          <Typography fontSize={16} color="#932626" align="center" mb={4}>
            ยืนยันการลบหน่วยงานหรือไม่
          </Typography>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}
          >
            <ButtonService
              label="ยกเลิก"
              variant="outlined"
              onClick={onClose}
              color="#DF615D"
              iconLeft={<CloseOutlinedIcon />}
              sx={{
                width: "48%",
                height: 56,
                borderRadius: 15,
                fontSize: 20,
                "&:hover": { backgroundColor: "#D0E8FC", boxShadow: "none" },
              }}
            />
            <ButtonService
              label="ยืนยัน"
              variant="contained"
              onClick={() => handleDelete(user)} // Directly delete without confirmation
              iconRight={<CheckOutlinedIcon />}
              color="#D52C27"
              sx={{
                width: "48%",
                height: 56,
                borderRadius: 15,
                fontSize: 20,
                "&:hover": { backgroundColor: "#D50000" },
              }}
            />
          </Box>
        </Box>
      </Modal>
    );
  };

  /* -------------------------------------------------------------------------- */
  /*  render                                                                    */
  /* -------------------------------------------------------------------------- */
  return (
    <Box>
      <BreadcrumbsService items={breadcrumbItems} />

      {/* -------------------------------------------------------------------- */}
      {/*  search controls                                                     */}
      {/* -------------------------------------------------------------------- */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          backgroundColor: "white",
          borderRadius: 1,
          alignItems: "flex-end",
          p: 2,
        }}
      >
        {[
          {
            label: "ส่วนราชการ",
            options: governmentOptions,
            name: "government",
          },
          {
            label: "รัฐวิสาหกิจ",
            options: stateEnterpriseOptions,
            name: "stateEnterprise",
          },
          { label: "อื่น ๆ", options: otherOptions, name: "other" },
        ].map((field) => (
          <Box sx={{ flex: "1 1 300px" }} key={field.name}>
            <Typography
              sx={{ fontSize: 18, fontWeight: "bold", color: "#1120A3", mb: 1 }}
            >
              {field.label}
            </Typography>
            <SelectField
              label={`เลือก${field.label}`}
              options={field.options}
              value={formData[field.name] || ""}
              onChange={handleInputChange}
              name={field.name}
            />
          </Box>
        ))}
        <Box sx={{ flex: "0 0 auto" }}>
          <ButtonService
            label="ค้นหา"
            variant="contained"
            color="primary"
            onClick={handleSearch}
            sx={{
              marginBottom: 17,
              backgroundColor: "#2499FF",
              color: "#ffffff",
              borderRadius: 30,
              px: 3,
              height: 40,
              boxShadow: 2,

              "&:hover": { backgroundColor: "#0067B1" },
            }}
            iconRight={<SearchIcon />}
          />
        </Box>
      </Box>
      {/* -------------------------------------------------------------------- */}
      {/*  list                                                                */}
      {/* -------------------------------------------------------------------- */}
      <Box sx={{ p: 3, borderRadius: 5, border: "2px solid #2499FF" }} mt={2}>
        <div className={styles.userManagementWrapper}>
          <div className={styles.userManagement}>
            {/* header row */}
            <div className={styles.headerRow}>
              <div className={styles.headerCell}>หน่วยงานหลัก</div>
              <div className={styles.headerCell}>หน่วยงานย่อยในสังกัด</div>
              <div className={styles.headerCell}>ตัวย่อหน่วยงาน</div>
              <div className={styles.headerCell}>สี</div>
              <div className={styles.headerCell}>รหัสสี</div>
              <div className={styles.headerCell}>⚙️</div>
            </div>

            {/* sections */}
            {filteredStats.res_data.map((section, idx) => (
              <div key={idx} className={styles.section}>
                {/* section header */}
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>
                    <div
                      onClick={() => toggleSection(idx)}
                      className={`${styles.iconWrapper} ${
                        expandedSections[idx] ? styles.iconRotate : ""
                      }`}
                    >
                      {expandedSections[idx] ? (
                        <RemoveCircleOutlineOutlinedIcon />
                      ) : (
                        <AddCircleOutlineOutlinedIcon />
                      )}
                    </div>
                    <span>{section.role_description}</span>
                  </div>
                  <IconButton
                    className={styles.addButton}
                    onClick={() => setAddSectionIdx(idx)}
                  >
                    <img
                      src="/icons/Add.png"
                      alt="Add"
                      width={24}
                      height={24}
                    />
                  </IconButton>
                </div>

                {/* users */}
                {expandedSections[idx] &&
                  (section.users.length === 0 ? (
                    <Box
                      sx={{
                        p: 3,
                        borderRadius: 5,
                        border: "2px dashed #F1D079",
                        textAlign: "center",
                        mt: 2,
                      }}
                    >
                      <Typography variant="h6" color="#1120A3">
                        ไม่มีข้อมูล
                      </Typography>
                    </Box>
                  ) : (
                    section.users.map((user) => (
                      <div key={user.id} className={styles.userRow}>
                        <div className={styles.userContainer}>
                          <div className={styles.userInfo}>
                            <div className={styles.userCell}>
                              {user.main_department}
                            </div>
                            <div className={styles.userCell}>
                              {user.sub_department || "-"}
                            </div>
                            <div className={styles.userCell}>
                              <span
                                style={{
                                  display: "inline-block",
                                  width: 16,
                                  height: 16,
                                  backgroundColor: user.color_code,
                                  borderRadius: 4,
                                }}
                              />
                            </div>
                            <div className={styles.userCell}>
                              {user.color_code}
                            </div>
                            <div className={styles.userCell}>
                              <div className={styles.actionButtons}>
                                <button
                                  className={styles.actionButton}
                                  style={{ color: "#2499ff" }}
                                  onClick={() => setEditUser(user)}
                                >
                                  <EditIcon />
                                </button>
                                <button
                                  className={styles.actionButton}
                                  style={{ color: "red" }}
                                  onClick={() => setDeleteUser(user)}
                                >
                                  <DeleteIcon />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ))}
              </div>
            ))}
          </div>
        </div>
      </Box>

      {/* -------------------------------------------------------------------- */}
      {/*  modals                                                               */}
      {/* -------------------------------------------------------------------- */}
      <AddUserModal
        open={addSectionIdx !== null}
        sectionIdx={addSectionIdx}
        onClose={() => setAddSectionIdx(null)}
      />
      <EditUserModal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        onSave={(updatedUser) => {
          setStats((prev) => {
            const updatedData = prev.res_data.map((section) => {
              const updatedUsers = section.users.map((u) =>
                u.id === updatedUser.id ? updatedUser : u
              );
              return { ...section, users: updatedUsers };
            });
            return { ...prev, res_data: updatedData };
          });
          setEditUser(null);
        }}
        user={editUser}
      />
      <DeleteUserModal
        open={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        user={deleteUser}
      />
    </Box>
  );
};

export default DepartmentManagement;
