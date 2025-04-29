import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  Checkbox,
  FormControlLabel,
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete"; // Icon for trash can
import { keyframes } from "@mui/system"; // For creating animations
import SelectMenuService from "@services/SelectMenu/SelectMenu";
import ButtonService from "@services/ButtonService/ButtonService";
import TextfieldService from "@services/TextfieldService/TextfieldService";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import {
  Diversity3Outlined as IcHome,
  DashboardOutlined as IcDash,
  TuneOutlined as IcTune,
  DriveFileRenameOutlineOutlined as IcEdit,
  MoveToInboxOutlined as IcBox,
  InsertChartOutlined as IcDoc,
  ArticleOutlined as IcDefault,
  AssessmentOutlined as IcReport,
  PersonOutlineOutlined as IcUser,
  SettingsOutlined as IcSetting,
  FeedbackOutlined as IcComplaint,
  FolderOutlined as IcFolder,
  SearchOutlined as IcSearch,
  ChatBubbleOutlineOutlined as IcChat,
  NewspaperOutlined as IcNews,
  AddCircleOutline as IcToggle,
} from "@mui/icons-material";
import { alertSuccess, alertWarning } from "@utils/Alerts";
import {
  getMenuPermission,
  deletePermission,
  createPermission,
  getUserStatsByRole,
  createRole,
  deleteRole,
  createUserPermission,
  deleteUserPermission,
  getUsersByRole,
} from "@pages/api/role/role";

const rotateOpen = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(45deg);
  }
`;

const rotateClose = keyframes`
  from {
    transform: rotate(45deg);
  }
  to {
    transform: rotate(0deg);
  }
`;

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
    label: "กำหนดสิทธิ์การเข้าถึง",
  },
];
const SetRole = () => {
  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState(""); // สำหรับชื่อกลุ่ม
  const [newGroupDescription, setNewGroupDescription] = useState(""); // สำหรับคำอธิบายกลุ่ม

  const [openDeleteModal, setOpenDeleteModal] = useState(false); // Added this state
  const [groupToDelete, setGroupToDelete] = useState(null);
  // Handle modal open/close
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  // State for selected menu and submenu

  // ฟังก์ชันในการสลับสถานะการเปิด/ปิด
  const handleToggle = (id) => {
    const newSections = sections.map((section) =>
      section.id === id ? { ...section, open: !section.open } : section
    );
    setSections(newSections);
  };

  const handleAddGroup = async () => {
    try {
      // เรียกใช้งาน createRole เพื่อสร้างกลุ่มใหม่
      const response = await createRole({
        name: newGroupName,
        description: newGroupDescription, // เพิ่มคำอธิบายกลุ่ม
      });

      console.log("Role created successfully:", response.res_code);

      // ตรวจสอบว่า response มี res_code เป็น 5000 หรือไม่
      if (response.res_code && response.res_code === "5000") {
        handleCloseModal(); // Close the modal
        alertWarning("มีชื่อซ้ำในระบบ กรุณาเปลี่ยนชื่อกลุ่ม").then(() => {
          setNewGroupName("");
          setNewGroupDescription("");
          handleOpenModal(); // Reopen the modal after the alert is closed
        });
        return;
      }

      // เพิ่มกลุ่มที่สร้างลงในรายการ groups
      setGroups([
        ...groups,
        {
          id: nextGroupNumber, // nextGroupNumber ต้องมีการคำนวณหรืออัปเดต
          name: newGroupName,
          selected: false,
        },
      ]);

      // รีเซ็ตชื่อกลุ่มใหม่และคำอธิบาย
      setNewGroupName("");
      setNewGroupDescription("");
      handleCloseModal(); // ปิด Modal หลังจากสร้างกลุ่มเสร็จ

      alertSuccess("กลุ่มสร้างสำเร็จ");
    } catch (error) {
      console.error("Failed to create role:", error);
      alertWarning("เกิดข้อผิดพลาดในการสร้างกลุ่ม");
    }
  };

  const handleGroupDelete = (roleId) => {
    setGroupToDelete(roleId); // Store the role_id of the group to be deleted
    setOpenDeleteModal(true); // Open the delete modal
  };

  const cancelDelete = () => {
    setOpenDeleteModal(false); // Close the modal without deleting
  };

  const confirmDelete = async () => {
    try {
      const response = await deleteRole(groupToDelete);

      console.log("Response from deleteRole:", response);

      setGroups(groups.filter((group) => group.id !== groupToDelete));

      console.log("Updated groups list after deletion:", groups);

      const { res_data } = await getMenuPermission();
      setMenuData(res_data);
      setSections(buildSections(res_data));

      setOpenDeleteModal(false);

      console.log("Delete modal closed.");

      alertSuccess("ลบกลุ่มสิทธิ์สำเร็จ");
    } catch (error) {
      console.error("Error while deleting role:", error);
      alertWarning("เกิดข้อผิดพลาดในการลบกลุ่ม");
    }
  };

  // First, add these new state variables at the beginning of your component
  const [openUserModal, setOpenUserModal] = useState(false);
  const [openDeleteUserModal, setOpenDeleteUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Handle modal open/close for user operations
  const handleOpenUserModal = () => setOpenUserModal(true);
  const handleCloseUserModal = () => setOpenUserModal(false);

  const handleUserDelete = (userId) => {
    // ค้นหาผู้ใช้ที่ต้องการลบจาก users
    const user = users.find((u) => u.id === userId);

    if (!user) {
      alertWarning("ไม่พบผู้ใช้ในระบบ");
      return;
    }

    // ตรวจสอบว่า user.permission_id มีข้อมูลหรือไม่
    if (!user.permission_id) {
      alertWarning("ข้อมูลสิทธิ์ของผู้ใช้ไม่ถูกต้อง");
      return;
    }

    const permissionId = user.permission_id; // ดึง permission_id โดยตรงจาก user

    // เก็บ userId และ permissionId สำหรับการลบใน confirmUserDelete
    setUserToDelete({
      userId,
      permissionId,
    });

    // เปิด modal การยืนยันการลบ
    setOpenDeleteUserModal(true);
  };

  const confirmUserDelete = () => {
    const { userId, permissionId } = userToDelete;

    // เรียกใช้ deleteUserPermission เพื่อทำการลบ
    deleteUserPermission(permissionId)
      .then((response) => {
        if (response.res_code === "0000") {
          alertSuccess("ลบสิทธิ์ผู้ใช้สำเร็จ");

          // ลบผู้ใช้จาก state ของ users
          setUsers(users.filter((user) => user.id !== userId));
        } else {
          alertWarning("เกิดข้อผิดพลาดในการลบสิทธิ์ผู้ใช้");
        }
      })
      .catch((error) => {
        console.error("Error deleting user permission:", error);
        alertWarning("เกิดข้อผิดพลาดในการลบสิทธิ์ผู้ใช้");
      });

    // ปิด modal
    setOpenDeleteUserModal(false);
  };

  const cancelUserDelete = () => {
    setOpenDeleteUserModal(false);
  };

  /* ---------- state ---------- */
  const [menuData, setMenuData] = useState([]);
  const [sections, setSections] = useState([]);
  const [groups, setGroups] = useState([]); // roles_tracking
  const [users, setUsers] = useState([]); // user_permissions
  const [selectedMenu, setSelectedMenu] = useState({
    mainMenu: "",
    resourceId: "",
    subMenuName: "",
  });

  const nextGroupNumber = useMemo(
    () => (groups.length ? Math.max(...groups.map((g) => g.id)) + 1 : 1),
    [groups]
  );

  /* ---------- click sub-menu ---------- */
  const handleMenuItemClick = (sectionTitle, item) => {
    setSelectedMenu({
      mainMenu: sectionTitle,
      resourceId: item.id,
      subMenuName: item.label,
    });
  };

  const [userlist, setUserlist] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]); // State สำหรับเก็บกลุ่ม
  const [userOptions, setUserOptions] = useState([]); // State สำหรับเก็บผู้ใช้
  const [newUser, setNewUser] = useState({ group: "", userId: "" }); // State สำหรับเก็บข้อมูลของผู้ใช้ใหม่

  // ฟังก์ชั่นดึงข้อมูลกลุ่มและผู้ใช้จาก API
  const fetchUsersAndGroups = async () => {
    try {
      const response = await getUsersByRole(); // ดึงข้อมูลจาก API
      const groups = response.res_data.map((group) => ({
        value: group.role_id, // role_id เป็น value ของกลุ่ม
        label: group.role_description, // role_description เป็น label
      }));

      // อัปเดตกลุ่ม options
      setGroupOptions(groups);

      // ฟิลเตอร์ผู้ใช้จากแต่ละกลุ่ม
      const users = response.res_data.flatMap((group) =>
        group.users.map((user) => ({
          value: user.id, // ใช้ user id
          label: user.full_name, // ใช้ full_name ของผู้ใช้
          role_id: group.role_id, // เชื่อมโยง user กับ role_id ของกลุ่ม
        }))
      );

      setUserlist(users); // อัปเดต user list
    } catch (err) {
      console.error("Error fetching users and groups:", err);
    }
  };

  // เรียกใช้ fetchUsersAndGroups เมื่อ component โหลด
  useEffect(() => {
    fetchUsersAndGroups();
  }, []);

  // เมื่อเลือกกลุ่ม จะทำการกรองผู้ใช้ที่เกี่ยวข้องกับกลุ่มนั้น
  const handleGroupUserChange = (e) => {
    const selectedGroup = e.target.value;
    setNewUser({ ...newUser, group: selectedGroup, userId: "" });

    // กรองผู้ใช้ที่มี role_id ตรงกับกลุ่มที่เลือก
    const filteredUsers = userlist.filter(
      (user) => user.role_id === selectedGroup
    );
    setUserOptions(filteredUsers); // อัปเดต user options ที่แสดงตามกลุ่มที่เลือก
  };

  const handleSaveUserPermission = async () => {
    try {
      const { group, userId } = newUser; // ดึงข้อมูลกลุ่มและผู้ใช้ที่เลือก

      if (!group || !userId) {
        handleCloseUserModal(); // ปิด Modal ก่อนที่จะแสดง alert
        alertWarning("กรุณาเลือกกลุ่มและผู้ใช้ก่อนบันทึก").then(() => {
          handleOpenUserModal(); // เปิด Modal ใหม่หลังจากที่ alert ปิด
        });
        return;
      }

      // สร้างสิทธิ์ให้กับผู้ใช้
      const response = await createUserPermission({
        user_id: userId, // ส่ง userId ที่เลือก
        resource_id: selectedMenu.resourceId, // ส่ง resourceId ที่เลือกจากเมนู
        can_create: true, // ค่าตัวอย่าง, ปรับตามความต้องการ
        can_read: true,
        can_update: true,
        can_delete: true,
        override_role: true, // ค่าตัวอย่าง, ปรับตามความต้องการ
      });

      if (response.res_code === "0001") {
        // รีเฟรชข้อมูลจาก getMenuPermission
        const { res_data } = await getMenuPermission();
        setMenuData(res_data);
        setSections(buildSections(res_data));

        alertSuccess("บันทึกสิทธิ์รายบุคคลสำเร็จ"); // แสดงข้อความสำเร็จ
        setNewUser({ group: "", userId: "" });
        handleCloseUserModal(); // ปิด Modal
      } else {
        alertWarning(response.res_message || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (error) {
      console.error("Error creating user permission:", error);
      alertWarning("เกิดข้อผิดพลาดในการบันทึกสิทธิ์รายบุคคล");
    }
  };

  const [pendingDeletes, setPendingDeletes] = useState([]); // State for pending deletes
  const [pendingCreates, setPendingCreates] = useState([]); // State for pending creates

  const handleGroupChange = (groupId) => {
    setGroups((prev) =>
      prev.map((group) => {
        if (group.id === groupId) {
          const updatedGroup = { ...group, selected: !group.selected }; // Toggle selected state

          // หาก group ไม่มี permission_id หรือ permission_id เป็นค่าว่าง
          if (
            updatedGroup.permission_id === "" ||
            updatedGroup.permission_id == null
          ) {
            console.log(
              "permission_id is empty or null, will create new permission."
            );

            // ถ้าไม่มี permission_id ให้เพิ่ม group.id ลงใน pendingCreates แต่ไม่ซ้ำ
            setPendingCreates((prevCreates) => {
              if (!prevCreates.includes(group.id)) {
                return [...prevCreates, group.id];
              }
              return prevCreates;
            });

            // ลบ group.id ออกจาก pendingDeletes
            setPendingDeletes((prevDeletes) =>
              prevDeletes.filter((id) => id !== group.id)
            );
          } else {
            console.log("permission_id exists, will delete permission.");

            // ถ้ามี permission_id ให้เพิ่ม group.id ลงใน pendingDeletes แต่ไม่ซ้ำ
            setPendingDeletes((prevDeletes) => {
              if (!prevDeletes.includes(group.id)) {
                return [...prevDeletes, group.id];
              }
              return prevDeletes;
            });

            // ลบ group.id ออกจาก pendingCreates
            setPendingCreates((prevCreates) =>
              prevCreates.filter((id) => id !== group.id)
            );
          }

          return updatedGroup;
        }
        return group;
      })
    );
  };

  // Handle save function
  const handleSave = async () => {
    try {
      // ตรวจสอบว่า selectedMenu.resourceId มีค่าหรือไม่
      const resourceId = selectedMenu.resourceId;
      if (!resourceId) {
        console.error("resourceId is not selected.");
        return; // ถ้า resourceId ไม่มีค่า จะไม่ทำการบันทึก
      }

      // ลบสิทธิ์ทั้งหมดใน pendingDeletes
      if (pendingDeletes.length) {
        console.log("Deleting permissions:", pendingDeletes);
        await Promise.all(
          pendingDeletes.map(async (id) => {
            const group = groups.find((group) => group.id === id);
            if (group && group.permission_id) {
              console.log(
                `Calling deletePermission for ID: ${group.permission_id}`
              );
              await deletePermission(group.permission_id); // เรียกใช้ deletePermission API
            }
          })
        );
      }

      // สร้างสิทธิ์ทั้งหมดใน pendingCreates
      if (pendingCreates.length) {
        console.log("Creating permissions:", pendingCreates);
        await Promise.all(
          pendingCreates.map(async (id) => {
            const group = groups.find((group) => group.id === id);
            if (group && group.role_id && group.selected) {
              console.log(
                `Calling createPermission for role_id: ${group.role_id}, resource_id: ${resourceId}`
              );
              await createPermission({
                role_id: group.role_id,
                resource_id: resourceId,
              });
            }
          })
        );
      }

      // เคลียร์รายการที่ต้องลบและต้องสร้างหลังจากบันทึกเสร็จ
      setPendingDeletes([]);
      setPendingCreates([]);

      // รีเฟรชข้อมูลจาก getMenuPermission
      const { res_data } = await getMenuPermission();
      setMenuData(res_data);
      setSections(buildSections(res_data));

      alertSuccess("บันทึกสำเร็จ");
    } catch (error) {
      console.error("Error during save process:", error);
      alertWarning("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  /* ---------- first load ---------- */
  useEffect(() => {
    (async () => {
      const { res_data } = await getMenuPermission();
      setMenuData(res_data);
      setSections(buildSections(res_data));

      const g0 = res_data[0];
      const r0 = g0?.resources?.[0];
      setSelectedMenu({
        mainMenu: g0?.display_name ?? "",
        resourceId: r0?.id ?? "",
        subMenuName: r0?.description || r0?.name || "",
      });
    })();
  }, []);

  /* ---------- when menu changes ---------- */
  useEffect(() => {
    if (!selectedMenu.resourceId) {
      setGroups([]);
      setUsers([]);
      return;
    }

    const grp = menuData.find((g) => g.display_name === selectedMenu.mainMenu);
    const res = grp?.resources?.find((r) => r.id === selectedMenu.resourceId);

    if (!res) {
      setGroups([]);
      setUsers([]);
      return;
    }

    /* roles_tracking → groups */
    setGroups(
      (res.roles_tracking ?? []).map((role, i) => ({
        id: i + 1,
        role_id: role.role_id,
        name: role.role_description ?? role.role_name,
        permission_id: role.permission_id || null,
        selected: role.found,
        permissions: {
          create: role.can_create,
          read: role.can_read,
          update: role.can_update,
          delete: role.can_delete,
        },
      }))
    );

    /* user_permissions → users */
    setUsers(
      (res.user_permissions ?? []).map((u, i) => ({
        id: i + 1,
        user_id: u.user_id,
        name: u.full_name,
        selected: u.can_read || u.override_role,
        groupId: u.roles?.[0]?.role_id || "",
        groupName: u.roles?.[0]?.role_description || "",
        permission_id: u.permission_id || "",
        permissions: {
          create: u.can_create,
          read: u.can_read,
          update: u.can_update,
          delete: u.can_delete,
          override: u.override_role,
        },
      }))
    );
  }, [selectedMenu, menuData]);

  /* ---------- helper : buildSections ---------- */
  const buildSections = (data) =>
    data.map((group, gi) => {
      /* group icon */
      const gIcon = {
        homepage: <IcHome />,
        dashboard: <IcDash />,
        setting: <IcTune />,
        edit: <IcEdit />,
        box: <IcBox />,
        document: <IcDoc />,
        stacked_line_chart: <IcDefault />,
        account_box: <IcDefault />,
      }[group.group_name] || <IcDefault />;

      /* sub-menu items */
      const items = (group.resources ?? []).map((res) => {
        const key = (res.name || "").toLowerCase();
        const iIcon = key.includes("report") ? (
          <IcReport />
        ) : key.includes("user") ? (
          <IcUser />
        ) : key.includes("setting") ? (
          <IcSetting />
        ) : key.includes("complaint") ? (
          <IcComplaint />
        ) : key.includes("document") ? (
          <IcFolder />
        ) : key.includes("search") ? (
          <IcSearch />
        ) : key.includes("chat") ? (
          <IcChat />
        ) : key.includes("news") ? (
          <IcNews />
        ) : (
          <IcDefault />
        );

        const display = res.description?.trim() || res.name?.trim();
        return { id: res.id, label: display, name: display, icon: iIcon };
      });

      return {
        id: gi + 1,
        title: group.display_name,
        icon: gIcon,
        items,
        open: false,
      };
    });

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <BreadcrumbsService items={breadcrumbItems} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              padding: 2,
              paddingRight: "16px", // เพิ่ม Padding ด้านขวาเพื่อขยับ Scrollbar เข้าซ้าย
              backgroundColor: "#91CBFF",
              border: "2px solid #2499FF",
              borderRadius: 2,
              boxShadow: 2,
              maxHeight: "calc(100vh - 200px)",
              overflowY: "auto",
              "&::-webkit-scrollbar": {
                width: "6px", // ความกว้างของ scrollbar
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#414DB5", // สีของ thumb
                borderRadius: "10px", // ขอบโค้งมน
                margin: "8px 0", // ระยะห่างบนล่างของ thumb
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#FFFFFF", // พื้นหลังสีขาว
                marginRight: "4px", // เว้นระยะจากทางขวา
              },
            }}
          >
            {sections.map((section) => (
              <div key={section.id}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    color:
                      selectedMenu.mainMenu === section.title
                        ? "#FFFFFF"
                        : "#1120A3",

                    borderRadius:
                      selectedMenu.mainMenu === section.title ? 1 : 0,
                    padding:
                      selectedMenu.mainMenu === section.title
                        ? "4px 0"
                        : "4px 0",
                  }}
                >
                  {/* ไอคอนสำหรับเปิด/ปิดเมนู with animation */}
                  <IconButton
                    onClick={() => handleToggle(section.id)}
                    sx={{
                      marginRight: 1,
                      color:
                        selectedMenu.mainMenu === section.title
                          ? "#FFFFFF"
                          : "#1120A3",
                      animation: section.open
                        ? `${rotateOpen} 0.3s forwards`
                        : `${rotateClose} 0.3s forwards`,
                      transition: "all 0.3s ease",
                    }}
                  >
                    <AddCircleOutlineIcon />
                  </IconButton>
                  {/* ไอคอนหน้า title และทำให้สามารถคลิกได้ */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      "&:hover": {
                        opacity: 0.8,
                      },
                    }}
                    onClick={() => {
                      if (!section.items.length) return; // เปลี่ยน sec → section
                      handleMenuItemClick(section.title, section.items[0]); // sec → section
                    }}
                  >
                    {/* ไอคอนของ title */}
                    <Box
                      sx={{
                        color:
                          selectedMenu.mainMenu === section.title
                            ? "#FFFFFF"
                            : "#1120A3",
                      }}
                    >
                      {section.icon}
                    </Box>
                    <Box component="span" sx={{ ml: 1 }}>
                      <Typography sx={{ fontSize: "18px", fontWeight: "bold" }}>
                        {section.title}
                      </Typography>
                    </Box>
                  </Box>
                </Typography>

                <Box
                  sx={{
                    height: section.open ? "auto" : 0,
                    overflow: "hidden",
                    transition: "height 0.3s ease-in-out",
                  }}
                >
                  {section.items.map((item, index) => (
                    <Typography
                      component="span"
                      key={index}
                      sx={{
                        marginLeft: 10,
                        display: "flex",
                        alignItems: "center",
                        color:
                          selectedMenu.mainMenu === section.title &&
                          selectedMenu.subMenuName === item.label
                            ? "#FFFFFF"
                            : "#1120A3",
                        cursor: "pointer",
                        padding: "4px 8px",
                        borderRadius: 1,
                        fontSize: "18px",
                        fontWeight: "bold",
                      }}
                      onClick={() => handleMenuItemClick(section.title, item)}
                    >
                      <Box
                        sx={{
                          color:
                            selectedMenu.mainMenu === section.title &&
                            selectedMenu.subMenuName === item.label
                              ? "#FFFFFF"
                              : "#1120A3",
                          mr: 1,
                        }}
                      >
                        {item.icon} {/* แสดง icon ของ item */}
                      </Box>
                      {item.name} {/* แสดง name ของ item */}
                    </Typography>
                  ))}
                </Box>
              </div>
            ))}
          </Paper>
        </Grid>

        {/* Right Section for Form - New UI based on the yellow-framed image */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              padding: 3,
              backgroundColor: "#FFFFFF",
              borderRadius: 8,
              boxShadow: 0,
              border: "1px solid #FFC107",
            }}
          >
            <Typography
              component="span"
              variant="h6"
              sx={{
                fontWeight: "bold",
                color: "#304FFE",
                fontSize: "1.2rem",
                marginBottom: 2,
              }}
            >
              ข้อมูลเมนู
            </Typography>
            {/* Main Menu Dropdown Section */}
            <Box sx={{ mb: 2 }}>
              <Typography component="span" sx={{ color: "#304FFE", mb: 1 }}>
                เมนูหลัก
              </Typography>

              {/* ใช้ SelectMenuService แทน TextField */}
              <SelectMenuService
                options={sections.map((section) => ({
                  value: section.title,
                  label: section.title,
                }))}
                handleChange={(e) =>
                  setSelectedMenu({ ...selectedMenu, mainMenu: e.target.value })
                }
                value={selectedMenu.mainMenu}
                width="100%" // ใช้ width แบบเต็ม
                name="mainMenu"
              />
            </Box>
            {/* Sub-Menu Dropdown */}
            <Box sx={{ mb: 4 }}>
              <Typography component="span" sx={{ color: "#304FFE", mb: 1 }}>
                เมนูย่อย
              </Typography>

              {/* SelectMenuService ใช้รายการ item ที่ตรงกับ mainMenu */}
              <SelectMenuService
                options={
                  (
                    sections.find((s) => s.title === selectedMenu.mainMenu)
                      ?.items || []
                  ).map((it) => ({ value: it.id, label: it.label })) // ⭐ value=id
                }
                /* เมื่อผู้ใช้เลือกจาก dropdown */
                handleChange={(e) => {
                  const sec = sections.find(
                    (s) => s.title === selectedMenu.mainMenu
                  );
                  const it = sec?.items.find((i) => i.id === e.target.value);
                  if (!it) return;
                  setSelectedMenu({
                    mainMenu: sec.title,
                    resourceId: it.id, // ⭐ อัปเดตเหมือนคลิกซ้าย
                    subMenuName: it.label,
                  });
                }}
                value={selectedMenu.resourceId} // ⭐ ผูกด้วย id
                width="100%"
                name="subMenu"
              />
            </Box>

            {/* User Group Rights Section */}
            <Typography
              component="span"
              variant="h6"
              sx={{
                fontWeight: "bold",
                color: "#304FFE",
                fontSize: "1.1rem",
                mb: 2,
              }}
            >
              กำหนดสิทธิ์กลุ่มผู้ใช้งาน
            </Typography>
            {/* กำหนดสิทธิ์กลุ่มผู้ใช้งาน section - แก้ไขให้แสดง icon ลบเฉพาะกลุ่มที่ id >= 7 */}
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}
            >
              {groups.map((group) => (
                <Box
                  key={group.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={group.selected}
                        onChange={() => handleGroupChange(group.id)}
                        sx={{
                          color: "#304FFE",
                          "&.Mui-checked": {
                            color: "#304FFE",
                          },
                        }}
                      />
                    }
                    label={`${group.name}`}
                    sx={{ color: "#304FFE" }}
                  />
                  {/* แสดงไอคอนลบเฉพาะกลุ่มที่มี id ตั้งแต่ 7 เป็นต้นไป */}
                  {group.id >= 7 && (
                    <IconButton
                      onClick={() => handleGroupDelete(group.role_id)} // Pass the group.id to the delete handler
                      sx={{
                        color: "red",
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              ))}

              {/* Dynamic Add group button */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  color: "#304FFE",
                  cursor: "pointer",
                  ml: 1,
                }}
                onClick={handleOpenModal}
              >
                <AddIcon fontSize="small" sx={{ mr: 0.5 }} />
                <Typography component="span">
                  เพิ่มกลุ่มที่ {nextGroupNumber}
                </Typography>
              </Box>
            </Box>

            <Typography
              component="span"
              variant="h6"
              sx={{
                fontWeight: "bold",
                color: "#304FFE",
                fontSize: "1.1rem",
                mb: 2,
              }}
            >
              กำหนดสิทธิ์รายบุคคล
            </Typography>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}
            >
              {/* รายการบุคคลพร้อมปุ่มลบ */}
              {users.map((user) => (
                <Box
                  key={user.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    sx={{
                      color: "#304FFE",
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                  >
                    {user.name} ({user.groupName})
                  </Typography>

                  {/* ปุ่มลบสำหรับรายการบุคคล */}
                  <IconButton
                    onClick={() => handleUserDelete(user.id)}
                    sx={{ color: "red" }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}

              {/* Add user button */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  color: "#304FFE",
                  cursor: "pointer",
                  ml: 1,
                }}
                onClick={handleOpenUserModal}
              >
                <AddIcon fontSize="small" sx={{ mr: 0.5 }} />
                <Typography component="span">เพิ่มสิทธิ์รายบุคคล</Typography>
              </Box>
            </Box>

            {/* Add User Modal */}
            <Dialog
              open={openUserModal}
              onClose={handleCloseUserModal}
              PaperProps={{
                sx: { width: "600px", borderRadius: "12px", padding: "10px" },
              }}
            >
              <DialogTitle
                sx={{
                  textAlign: "center",
                  color: "#1120A3",
                  fontWeight: "bold",
                  fontSize: "1.2rem",
                  pb: 1,
                }}
              >
                เพิ่มสิทธิ์รายบุคคล
                <IconButton
                  aria-label="close"
                  onClick={handleCloseUserModal}
                  sx={{
                    position: "absolute",
                    right: 12,
                    top: 12,
                    color: "grey.500",
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent sx={{ py: 2 }}>
                {/* 1. Select Group */}
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Typography
                    component="span"
                    sx={{
                      mr: 2,
                      width: 60,
                      fontWeight: "bold",
                      color: "#1120A3",
                    }}
                  >
                    กลุ่ม :
                  </Typography>
                  <SelectMenuService
                    options={groupOptions} // ใช้ข้อมูลกลุ่มที่ได้จาก fetch
                    handleChange={handleGroupUserChange}
                    value={newUser.group}
                    width="100%"
                    name="userGroup"
                  />
                </Box>

                {/* 2. Select User (based on group selection) */}
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Typography
                    component="span"
                    sx={{
                      mr: 2,
                      width: 60,
                      fontWeight: "bold",
                      color: "#1120A3",
                    }}
                  >
                    ชื่อ :
                  </Typography>
                  <SelectMenuService
                    options={userOptions} // ผู้ใช้ที่กรองตามกลุ่ม
                    handleChange={(e) =>
                      setNewUser({ ...newUser, userId: e.target.value })
                    }
                    value={newUser.userId}
                    width="100%"
                    name="userName"
                  />
                </Box>
              </DialogContent>
              <DialogActions sx={{ justifyContent: "center", pb: 3, px: 3 }}>
                <ButtonService
                  label="ยกเลิก"
                  variant="outlined"
                  onClick={handleCloseUserModal}
                  color="#50ADFF"
                  iconLeft={<CloseIcon />}
                  sx={{
                    width: "195px",
                    height: "47.588932037353516px",
                    borderRadius: "15px",
                    fontSize: "20px",
                    "&:hover": { backgroundColor: "#D0E8FC" },
                  }}
                />
                <ButtonService
                  label="บันทึก"
                  variant="contained"
                  onClick={handleSaveUserPermission}
                  color="#2196F3"
                  iconRight={<CheckOutlinedIcon />}
                  sx={{
                    width: "195px",
                    height: "47.588932037353516px",
                    borderRadius: "15px",
                    fontSize: "20px",
                    "&:hover": { backgroundColor: "#1E88E5" },
                  }}
                />
              </DialogActions>
            </Dialog>

            {/* Delete User Modal */}
            <Dialog
              open={openDeleteUserModal}
              onClose={cancelUserDelete}
              PaperProps={{
                sx: {
                  borderRadius: "12px",
                  overflow: "hidden",
                  padding: "0 60px",
                },
              }}
            >
              <DialogTitle
                sx={{
                  textAlign: "center",
                  color: "#932626",
                  backgroundColor: "#F5F7FF",
                  fontWeight: "bold",
                }}
              >
                ลบสิทธิ์รายบุคคล
              </DialogTitle>

              <DialogContent>
                <Typography
                  sx={{
                    color: "#932626",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                >
                  การลบสิทธิ์รายบุคคลจะทำให้ผู้ใช้นี้ไม่สามารถเข้าถึงได้
                </Typography>
                <Typography
                  sx={{
                    color: "#932626",
                    textAlign: "center",
                    py: 2,
                    fontWeight: "bold",
                  }}
                >
                  ยืนยันการลบสิทธิ์รายบุคคลหรือไม่?
                </Typography>
              </DialogContent>

              <DialogActions
                sx={{
                  justifyContent: "center",
                  padding: 2,
                  backgroundColor: "#F8F9FF",
                  gap: 2,
                }}
              >
                <ButtonService
                  label="ยกเลิก"
                  variant="outlined"
                  onClick={cancelUserDelete}
                  color="#DF615D"
                  iconLeft={<CloseOutlinedIcon />}
                  sx={{
                    width: "32%",
                    height: "56px",
                    borderRadius: "15px",
                    fontSize: "20px",
                    "&:hover": {
                      backgroundColor: "#D0E8FC",
                      boxShadow: "none",
                    },
                  }}
                />
                <ButtonService
                  label="ยืนยัน"
                  variant="contained"
                  onClick={confirmUserDelete}
                  iconRight={<CheckOutlinedIcon />}
                  color="#D52C27"
                  sx={{
                    width: "32%",
                    height: "56px",
                    borderRadius: "15px",
                    fontSize: "20px",
                    "&:hover": {
                      backgroundColor: "#D50000",
                    },
                  }}
                />
              </DialogActions>
            </Dialog>
            {/* Action buttons */}
            <Box
              sx={{ display: "flex", justifyContent: "center", mt: 2, gap: 2 }}
            >
              <ButtonService
                label="ล้าง"
                variant="outlined"
                onClick={[]} // ใส่ฟังก์ชันที่ต้องการจะทำเมื่อคลิก
                iconLeft={<CloseIcon />}
                sx={{
                  backgroundColor: "#E3F2FD",
                  color: "#304FFE",
                  borderRadius: "15px",
                  boxShadow: "none",
                  width: "23%",
                  height: "55px",
                  fontSize: "24px",
                  border: "2px solid #50ADFF",
                  "&:hover": {
                    backgroundColor: "#D0E8FC",
                    boxShadow: "none",
                  },
                }}
              />

              <ButtonService
                label="บันทึก"
                variant="contained"
                iconRight={<CheckOutlinedIcon />}
                onClick={handleSave}
                sx={{
                  backgroundColor: "#2196F3",
                  color: "#FFF",
                  borderRadius: "15px",
                  width: "23%",
                  height: "55px",
                  fontSize: "24px",
                  "&:hover": { backgroundColor: "#1E88E5" },
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Delete Group Modal */}
        <Dialog
          open={openDeleteModal}
          onClose={cancelDelete}
          PaperProps={{
            sx: {
              borderRadius: "12px", // กำหนดขอบโค้งให้ Modal
              overflow: "hidden", // เพื่อให้ขอบโค้งแสดงผลถูกต้อง
              padding: "0 60px",
            },
          }}
        >
          <DialogTitle
            sx={{
              textAlign: "center",
              color: "#932626",
              backgroundColor: "#F5F7FF", // เพิ่มสีพื้นหลังส่วนหัว
              fontWeight: "bold",
            }}
          >
            ลบกลุ่มสิทธิ์
          </DialogTitle>

          <DialogContent>
            <Typography
              sx={{ color: "#932626", textAlign: "center", fontWeight: "bold" }}
            >
              การลบกลุ่มสิทธิ์จะทำให้บัญชีในกลุ่มสิทธิ์นี้หายไปทั้งหมด
            </Typography>{" "}
            <Typography
              sx={{ color: "#932626", textAlign: "center", fontWeight: "bold" }}
            >
              โปรดสำรองข้อมูลของบัญชีในกลุ่มสิทธิ์นี้ก่อนการลบกลุ่มสิทธิ์
            </Typography>{" "}
            <Typography
              sx={{
                color: "#932626",
                textAlign: "center",
                py: 2,
                fontWeight: "bold",
              }}
            >
              ยืนยันการลบกลุ่มสิทธิ์หรือไม่?
            </Typography>
          </DialogContent>

          <DialogActions
            sx={{
              justifyContent: "center",
              padding: 2,
              backgroundColor: "#F8F9FF", // สีพื้นหลังส่วนปุ่ม
              gap: 2,
            }}
          >
            <ButtonService
              label="ยกเลิก"
              variant="outlined"
              onClick={cancelDelete}
              color="#DF615D"
              iconLeft={<CloseOutlinedIcon />}
              sx={{
                width: "32%",
                height: "56px",
                borderRadius: "15px", // ขอบโค้งปุ่มยกเลิก
                fontSize: "20px",
                "&:hover": {
                  backgroundColor: "#D0E8FC",
                  boxShadow: "none",
                },
              }}
            />
            <ButtonService
              label="ยืนยัน"
              variant="contained"
              onClick={confirmDelete}
              iconRight={<CheckOutlinedIcon />}
              color="#D52C27"
              sx={{
                width: "32%",
                height: "56px",
                borderRadius: "15px",
                fontSize: "20px",
                "&:hover": {
                  backgroundColor: "#D50000",
                },
              }}
            />
          </DialogActions>
        </Dialog>
      </Grid>

      {/* Add Group Modal - Now using dynamic group number */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        PaperProps={{
          sx: {
            width: "500px",
            borderRadius: "12px",
            padding: "10px",
          },
        }}
      >
        <DialogTitle
          sx={{
            textAlign: "center",
            color: "#1120A3",
            fontWeight: "bold",
            fontSize: "1.2rem",
            pb: 1,
          }}
        >
          เพิ่มกลุ่มสิทธิ์
          <IconButton
            aria-label="close"
            onClick={handleCloseModal}
            sx={{
              position: "absolute",
              right: 12,
              top: 12,
              color: "grey.500",
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography
              component="span"
              sx={{
                mr: 2,
                color: "#1120A3",
                width: "80px",
                flexShrink: 0,
                fontWeight: "bold",
              }}
            >
              กลุ่มที่ {nextGroupNumber}
            </Typography>
            {/* ใช้ TextfieldService แทน TextField สำหรับ Name */}
            <TextfieldService
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="ชื่อกลุ่มภาษาอังกฤษ"
              sx={{
                ".MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography
              component="span"
              sx={{
                mr: 2,
                color: "#1120A3",
                width: "80px",
                flexShrink: 0,
                fontWeight: "bold",
              }}
            >
              กลุ่มที่ {nextGroupNumber}
            </Typography>
            {/* ใช้ TextfieldService แทน TextField สำหรับ Description */}
            <TextfieldService
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
              placeholder="ชื่อกลุ่มภาษาไทย"
              sx={{
                ".MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3, px: 3 }}>
          <ButtonService
            label="ยกเลิก"
            variant="outlined"
            startIcon={<CloseIcon />}
            onClick={handleCloseModal}
            color="#50ADFF" // ใส่สีพื้นหลังตามที่ต้องการ
            iconLeft={<CloseIcon />}
            sx={{
              width: "195px",
              height: "47.588932037353516px",
              borderRadius: "15px",
              fontSize: "20px",
              "&:hover": {
                backgroundColor: "#D0E8FC", // สีเมื่อ hover
              },
            }}
          />
          <ButtonService
            label="ยืนยัน"
            variant="contained"
            startIcon={<CheckIcon />}
            onClick={handleAddGroup}
            color="#2196F3"
            iconRight={<CheckOutlinedIcon />}
            disabled={!newGroupName || !newGroupDescription} // ตรวจสอบว่ามีชื่อกลุ่มและคำอธิบายหรือไม่
            sx={{
              width: "195px",
              height: "47.588932037353516px",
              borderRadius: "15px",
              fontSize: "20px",
              backgroundColor:
                !newGroupName || !newGroupDescription ? "#B0BEC5" : "#2196F3", // กำหนดสีพื้นหลังสีเทาเมื่อ disabled
              "&:hover": {
                backgroundColor:
                  !newGroupName || !newGroupDescription ? "#B0BEC5" : "#1E88E5", // เปลี่ยนสีเมื่อ hover
              },
            }}
          />
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SetRole;
