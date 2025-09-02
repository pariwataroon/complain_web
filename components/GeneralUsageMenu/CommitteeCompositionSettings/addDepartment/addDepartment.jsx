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
  getDepartmentGroup,
  // ===== เพิ่ม API สำหรับสร้างหน่วยงานหลัก =====
  CreateDepartment,
  getDepartmentGroups,
  postDepartment,
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

/* -------------------------------------------------------------------------- */
/*  component                                                                  */
/* -------------------------------------------------------------------------- */
const DepartmentManagement = () => {
  /* ---------------------------------- state --------------------------------- */

  const [expandedSections, setExpandedSections] = useState({ 0: true });
  const [addSectionIdx, setAddSectionIdx] = useState(null); // section index for Add modal
  const [editUser, setEditUser] = useState(null); // user object for Edit modal
  const [deleteUser, setDeleteUser] = useState(null); // user object for Delete modal

  // เพิ่ม state สำหรับ Add Main Department Modal
  const [openAddMainDepartment, setOpenAddMainDepartment] = useState(false);

  // search form
  const [formData, setFormData] = useState({
    government: "",
    stateEnterprise: "",
    other: "",
  });

  /* ------------------------------ state ----------------------------------- */
  const [stats, setStats] = useState({ res_data: [] });
  const [filteredStats, setFilteredStats] = useState({ res_data: [] });
  const [stateEnterpriseOptions, setStateEnterpriseOptions] = useState([]);
  const [governmentOptions, setGovernmentOptions] = useState([]);
  const [otherOptions, setOtherOptions] = useState([]);
  /* ------------------------------- โหลดข้อมูล dropdown ------------------------------- */
  const fetchDropdownOptions = async () => {
    try {
      const res = await getDepartmentGroup(); // API จริง
      const groups = Array.isArray(res?.res_data) ? res.res_data : [];

      // หา group
      const stateGroup = groups.find((g) => g.name === "รัฐวิสาหกิจ");
      const govGroup = groups.find((g) => g.name === "ส่วนราชการ");
      const otherGroup = groups.find(
        (g) => g.name === "อื่น ๆ" || g.name === "อื่นๆ"
      );

      // map departments -> options
      const toOptions = (arr) =>
        Array.isArray(arr)
          ? arr.map((d) => ({
              label: `${d.name} (${d.short_name || ""})`, // แสดงชื่อ + ตัวย่อ
              value: d.id, // ใช้ id จริง
              code: d.code, // เก็บรหัสไว้ด้วย
            }))
          : [];

      setStateEnterpriseOptions(toOptions(stateGroup?.departments));
      setGovernmentOptions(toOptions(govGroup?.departments));
      setOtherOptions(toOptions(otherGroup?.departments));

      // console.log("Dropdown Options Loaded:", {
      //   gov: toOptions(govGroup?.departments),
      //   state: toOptions(stateGroup?.departments),
      //   other: toOptions(otherGroup?.departments),
      // });
    } catch (err) {
      console.error("Error fetching dropdown options:", err);
      setGovernmentOptions([]);
      setStateEnterpriseOptions([]);
      setOtherOptions([]);
    }
  };

  /* ------------------------------- โหลดข้อมูลตาราง ------------------------------- */
  const fetchDepartmentDetails = async () => {
    try {
      const response = await GetDetailDepartment();

      const mappedData = response.res_data.map((department) => ({
        department_id: department.department_id || department.id,
        role_name: department.department_code?.toLowerCase() || "",
        role_description: department.department_name,
        users: department.venue_groups.flatMap((group) =>
          group.venues.map((venue) => ({
            id: venue.id,
            main_department: venue.name,
            sub_department: venue.short_name || "-",
            color_code: venue.color_code,
            group_name: group.group_name,
            department_id: department.department_id,
          }))
        ),
      }));

      setStats({ res_data: mappedData });
      setFilteredStats({ res_data: mappedData });
    } catch (err) {
      console.error("Error fetching department details:", err);
      setStats({ res_data: [] });
      setFilteredStats({ res_data: [] });
    }
  };

  const [mainDepartmentGroupOptions, setMainDepartmentGroupOptions] = useState(
    []
  );

  // โหลด main department group options สำหรับ modal เพิ่มหน่วยงานหลัก
  const fetchMainDepartmentGroups = async () => {
    try {
      const res = await getDepartmentGroups();
      // สมมติ res.res_data เป็น array ที่ต้องการ
      // ตัวอย่าง { id: 1, name: "ส่วนราชการ" }
      if (Array.isArray(res?.res_data)) {
        setMainDepartmentGroupOptions(
          res.res_data.map((g) => ({
            label: g.name,
            value: g.id, // หรือ g.id ถ้าอยากได้เป็น id
          }))
        );
      } else {
        setMainDepartmentGroupOptions([]);
      }
    } catch (e) {
      setMainDepartmentGroupOptions([]);
    }
  };

  // เรียกโหลด group options เมื่อเปิด modal เพิ่มหน่วยงานหลัก
  useEffect(() => {
    if (openAddMainDepartment) {
      fetchMainDepartmentGroups();
    }
    // eslint-disable-next-line
  }, [openAddMainDepartment]);

  /* ------------------------------- useEffect ------------------------------- */
  useEffect(() => {
    fetchDepartmentDetails();
    fetchDropdownOptions();
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    const { government, stateEnterprise, other } = formData;

    if (!government && !stateEnterprise && !other) {
      setFilteredStats(stats);
      return;
    }

    const selectedIds = [government, stateEnterprise, other].filter(Boolean);

    // กรอง sections
    const filteredSections = stats.res_data
      .map((section) => {
        // เช็คว่าตรง department_id
        if (selectedIds.includes(section.department_id)) {
          return section;
        }

        // ถ้าไม่ตรง section แต่มี users ที่ตรง department_id → กรอง user
        const filteredUsers = section.users.filter((u) =>
          selectedIds.includes(u.department_id)
        );
        if (filteredUsers.length > 0) {
          return { ...section, users: filteredUsers };
        }
        return null;
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
  /*  Add Main Department Modal                                                 */
  /* -------------------------------------------------------------------------- */
  /*  Add Main Department Modal                                                 */
  /* -------------------------------------------------------------------------- */
  const AddMainDepartmentModal = ({ open, onClose }) => {
    // option กลุ่มหลัก (group_id)
    const [groupId, setGroupId] = useState("");
    const [mainDepartment, setMainDepartment] = useState(""); // name
    const [departmentCode, setDepartmentCode] = useState(""); // code
    const [shortName, setShortName] = useState(""); // short_name

    // เมื่อ modal เปิดใหม่ ให้ reset form
    useEffect(() => {
      if (open) {
        setGroupId("");
        setMainDepartment("");
        setDepartmentCode("");
        setShortName("");
      }
    }, [open]);

    const handleSave = async () => {
      if (!mainDepartment || !groupId || !departmentCode || !shortName) {
        alertError("กรุณากรอกข้อมูลให้ครบถ้วน", "");
        return;
      }
      try {
        const payload = {
          name: mainDepartment,
          short_name: shortName,
          code: departmentCode,
          parent_id: null,
          group_id: groupId,
          order_index: 100,
          is_active: true,
        };
        await postDepartment(payload);
        await fetchDepartmentDetails();
        await fetchDropdownOptions();
        alertSuccess("สำเร็จ!", "เพิ่มหน่วยงานหลักเรียบร้อยแล้ว");
        onClose();
      } catch (error) {
        console.error("postDepartment error:", error);
        alertError("เกิดข้อผิดพลาด", "ไม่สามารถเพิ่มหน่วยงานหลักได้");
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
          <Typography variant="h5" color="#1120A3" mb={2}>
            เพิ่มหน่วยงานหลัก
          </Typography>
          {/* ประเภทกลุ่ม (group_id) */}
          <Typography fontSize={18} mb={1} color="#1120A3">
            ประเภท <span style={{ color: "red" }}>*</span>
          </Typography>
          <SelectField
            label="เลือกประเภท"
            options={mainDepartmentGroupOptions}
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            name="group_id"
          />
          {/* ชื่อหน่วยงานหลัก */}
          <Typography fontSize={18} mb={1} color="#1120A3" mt={2}>
            ชื่อหน่วยงานหลัก <span style={{ color: "red" }}>*</span>
          </Typography>
          <TextfieldService
            value={mainDepartment}
            onChange={(e) => setMainDepartment(e.target.value)}
            placeholder="ชื่อหน่วยงานหลัก"
            name="main_department"
          />
          {/* ตัวย่อหน่วยงาน */}
          <Typography fontSize={18} mb={1} color="#1120A3" mt={2}>
            ตัวย่อหน่วยงาน <span style={{ color: "red" }}>*</span>
          </Typography>
          <TextfieldService
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
            placeholder="ตัวย่อหน่วยงาน"
            name="short_name"
          />
          {/* รหัสหน่วยงานหลัก */}
          <Typography fontSize={18} mb={1} color="#1120A3" mt={2}>
            รหัสหน่วยงานหลัก <span style={{ color: "red" }}>*</span>
          </Typography>
          <TextfieldService
            value={departmentCode}
            onChange={(e) => setDepartmentCode(e.target.value)}
            placeholder="รหัสหน่วยงานหลัก"
            name="department_code"
          />
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
        <Box sx={{ flex: "0 0 auto", display: "flex", gap: 1 }}>
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
          {/* ===== ปุ่มเพิ่มหน่วยงานหลัก ===== */}
          <ButtonService
            label="เพิ่มหน่วยงานหลัก"
            variant="contained"
            color="success"
            onClick={() => setOpenAddMainDepartment(true)}
            sx={{
              marginBottom: 17,
              backgroundColor: "#43A047",
              color: "#ffffff",
              borderRadius: 30,
              px: 3,
              height: 40,
              boxShadow: 2,
              fontWeight: "bold",
              fontSize: 16, // เพิ่มขนาดอักษรหรือลดตามต้องการ
              minWidth: 180, // กำหนดความกว้างขั้นต่ำให้พอสำหรับข้อความ
              whiteSpace: "nowrap", // บังคับข้อความไม่ขึ้นบรรทัดใหม่
              "&:hover": { backgroundColor: "#388E3C" },
            }}
            iconRight={<AddCircleOutlineOutlinedIcon />}
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
      <AddMainDepartmentModal
        open={openAddMainDepartment}
        onClose={() => setOpenAddMainDepartment(false)}
      />
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
