import React, { useState, useEffect } from "react";
import { Box, Typography, IconButton, Modal } from "@mui/material";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import SelectMenuService from "@services/SelectMenu/SelectMenu";
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

const departmentData = {
  res_data: [
    {
      role_name: "bank",
      role_description: "ธนาคารแห่งประเทศไทย",
      users: [
        {
          id: 1,
          main_department: "บริษัท บริหารสินทรัพย์สุขุมวิท จำกัด",
          sub_department: "บสก. / SAM",
          color_code: "#EA33F7",
        },
        {
          id: 2,
          main_department: "บริษัท บริหารสินทรัพย์กรุงเทพพาณิชย์ จำกัด",
          sub_department: "",
          color_code: "#8D3AF6",
        },
      ],
    },
    {
      role_name: "conservation",
      role_description: "กรมอุทยานฯ",
      users: [
        {
          id: 3,
          main_department: "สำนักอนุรักษ์สัตว์ป่า",
          sub_department: "ฝ่ายภาคกลาง",
          color_code: "#22C55E",
        },
      ],
    },
    {
      role_name: "centralAccounting",
      role_description: "กรมบัญชีกลาง",
      users: [
        {
          id: 4,
          main_department: "กองบริหารการคลัง",
          sub_department: "ฝ่ายงบประมาณ",
          color_code: "#3B82F6",
        },
      ],
    },
    {
      role_name: "customs",
      role_description: "กรมศุลกากร",
      users: [
        {
          id: 5,
          main_department: "สำนักงานศุลกากรท่าเรือกรุงเทพ",
          sub_department: "ฝ่ายตรวจปล่อย",
          color_code: "#EC4899",
        },
      ],
    },
    {
      role_name: "excise",
      role_description: "กรมสรรพสามิต",
      users: [
        {
          id: 6,
          main_department: "สรรพสามิตพื้นที่กรุงเทพฯ",
          sub_department: "ฝ่ายควบคุมเครื่องดื่ม",
          color_code: "#F59E0B",
        },
      ],
    },
    {
      role_name: "revenue",
      role_description: "กรมสรรพากร",
      users: [
        {
          id: 7,
          main_department: "สำนักงานสรรพากรพื้นที่กรุงเทพมหานคร",
          sub_department: "ฝ่ายตรวจสอบ",
          color_code: "#10B981",
        },
      ],
    },
    {
      role_name: "sepo",
      role_description: "สำนักงานคณะกรรมการนโยบายรัฐวิสาหกิจ",
      users: [
        {
          id: 8,
          main_department: "ฝ่ายกำกับดูแลรัฐวิสาหกิจ",
          sub_department: "ส่วนวิเคราะห์ผล",
          color_code: "#6366F1",
        },
      ],
    },
    {
      role_name: "pdmo",
      role_description: "สำนักงานบริหารหนี้สาธารณะ",
      users: [
        {
          id: 9,
          main_department: "กองบริหารหนี้ภาครัฐ",
          sub_department: "ฝ่ายแผนงาน",
          color_code: "#8B5CF6",
        },
      ],
    },
    {
      role_name: "fpo",
      role_description: "สำนักงานเศรษฐกิจการคลัง",
      users: [
        {
          id: 10,
          main_department: "กลุ่มยุทธศาสตร์เศรษฐกิจ",
          sub_department: "ฝ่ายวิจัย",
          color_code: "#EF4444",
        },
      ],
    },
    {
      role_name: "gsb",
      role_description: "ธนาคารออมสิน",
      users: [
        {
          id: 11,
          main_department: "ฝ่ายสินเชื่อรายย่อย",
          sub_department: "แผนกภาคใต้",
          color_code: "#F472B6",
        },
      ],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*  component                                                                  */
/* -------------------------------------------------------------------------- */
const DepartmentManagement = () => {
  /* ---------------------------------- state --------------------------------- */
  const [stats, setStats] = useState(departmentData);
  const [expandedSections, setExpandedSections] = useState({ 0: true });
  const [addSectionIdx, setAddSectionIdx] = useState(null); // section index for Add modal
  const [editUser, setEditUser] = useState(null); // user object for Edit modal
  const [deleteUser, setDeleteUser] = useState(null); // user object for Delete modal

  // search form
  const [formData, setFormData] = useState({
    government: "",
    stateEnterprise: "",
    sub_department: "",
    other: "",
  });

  /* ---------------------------------- data ---------------------------------- */
  const governmentOptions = [
    { label: "ตำแหน่ง 1", value: "ตำแหน่ง 1" },
    { label: "ตำแหน่ง 2", value: "ตำแหน่ง 2" },
    { label: "ตำแหน่ง 3", value: "ตำแหน่ง 3" },
  ];
  const stateEnterpriseOptions = [
    { label: "รัฐวิสาหกิจ 1", value: "รัฐวิสาหกิจ 1" },
    { label: "รัฐวิสาหกิจ 2", value: "รัฐวิสาหกิจ 2" },
    { label: "รัฐวิสาหกิจ 3", value: "รัฐวิสาหกิจ 3" },
  ];
  const otherOptions = [
    { label: "อื่นๆ 1", value: "อื่นๆ 1" },
    { label: "อื่นๆ 2", value: "อื่นๆ 2" },
    { label: "อื่นๆ 3", value: "อื่นๆ 3" },
  ];

  /* ------------------------------- id helpers ------------------------------- */
  const getNextId = () => {
    const ids = stats.res_data.flatMap((s) => s.users.map((u) => u.id));
    return ids.length ? Math.max(...ids) + 1 : 1;
  };

  /* -------------------------------- handlers -------------------------------- */
  const handleInputChange = (event, value, name) => {
    if (event?.target) {
      const { name: eventName, value: eventValue } = event.target;
      setFormData((prev) => ({ ...prev, [eventName]: eventValue }));
    } else if (name) {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSearch = () => {
    console.log("ค้นหา:", formData);
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

    const handleSave = () => {
      const newUser = {
        id: getNextId(),
        main_department: mainDepartment,
        sub_department: subDepartment,
        color_code: colorCode,
      };

      setStats((prevState) => {
        const updatedData = prevState.res_data.map((section, idx) => {
          if (idx !== sectionIdx) return section;
          return { ...section, users: [...section.users, newUser] };
        });
        return { ...prevState, res_data: updatedData };
      });

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

    const handleSave = () => {
      onSave({
        ...user,
        main_department: selectedDepartment,
        sub_department: selectedSubDepartment,
        color_code: selectedColor,
      });
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

    const handleDelete = (user) => {
      setStats((prevState) => {
        const updatedData = prevState.res_data.map((section) => {
          const updatedUsers = section.users.filter((u) => u.id !== user.id);
          return { ...section, users: updatedUsers };
        });
        return { ...prevState, res_data: updatedData };
      });
      setDeleteUser(null);
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
              onClick={() => handleDelete(user)}
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
              sx={{ fontSize: 18, fontWeight: "bold", color: "#1120A3" }}
            >
              {field.label}
            </Typography>
            <SelectMenuService
              options={field.options}
              value={formData[field.name]}
              onChange={(e, v) => handleInputChange(e, v, field.name)}
              name={field.name}
              width="100%"
              placeholder={`เลือก${field.label}`}
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
            {stats.res_data.map((section, idx) => (
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
