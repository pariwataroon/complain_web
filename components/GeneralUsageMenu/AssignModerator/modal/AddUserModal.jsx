import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Grid,
  CircularProgress,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Controller } from "react-hook-form";
import { Add, Visibility, VisibilityOff } from "@mui/icons-material";
import TextfieldService from "@services/TextfieldService/TextfieldService";
import SelectMenuService from "@services/SelectMenu/SelectMenu";
import InputText from "@services/InputText/InputText";
import SelectFieldPAA from "@services/SelectFieldPAA/SelectFieldPAA";
import IDCardInput from "@services/IDCardInput/IDCardInput";
import InputPhone from "@services/InputPhone/InputPhone";
import ButtonService from "@services/ButtonService/ButtonService";
import useCRUDFormUsers from "@hooks/admin/setting/useCRUDFormUsers";
import {
  alertSuccess,
  alertError,
  alertWarning,
  alertInfo,
  showConfirm,
  closeAlert,
} from "@utils/Alerts";
import styles from "./AddUserModal.module.scss";
import {
  AddUsers,
  GetTitleDetails,
  GetRoles,
  PutUser,
  GetPositions,
  GetUserById,
} from "@pages/api/settinggeneral/users";

const AddUserModal = ({
  open,
  onClose,
  onReopen,
  editingUser,
  onUserUpdated,
}) => {
  const [titleOptions, setTitleOptions] = useState([]);
  const [isFormReset, setIsFormReset] = useState(false);
  const [roleMap, setRoleMap] = useState({});
  const [roleOptions, setRoleOptions] = useState([]);
  const [positionOptions, setPositionOptions] = useState([]);
  const [viewUserData, setViewUserData] = useState(null);
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // เพิ่ม state สำหรับ toggle password

  console.log("editingUser", editingUser);

  const {
    register,
    handleSubmit,
    control,
    errors,
    onSubmit: originalOnSubmit,
    watch,
    isSubmitting,
    setValue,
    getValues,
  } = useCRUDFormUsers(editingUser, onUserUpdated);

  // หากมี editingUser ให้โหลดข้อมูล user detail
  useEffect(() => {
    let ignore = false;
    async function fetchUserData() {
      if (open && editingUser?.id) {
        setLoadingUserData(true);
        setViewUserData(null);
        try {
          const res = await GetUserById(editingUser.id);
          if (!ignore) {
            const userData = res?.res_data || null;
            setViewUserData(userData);

            // ถ้าได้ข้อมูลแล้ว ให้ pre-fill ฟอร์ม
            if (userData) {
              setValue("citizen_id", userData.citizen_id || "");
              setValue("full_name", userData.full_name || "");

              // หา role ที่ตรงกับ roles ที่ได้จาก API
              const userRole = userData.roles?.[0];
              if (userRole) {
                setValue("group", userRole.role_id || "");
              }

              // แก้ไขการ set ค่า position - รองรับทั้ง primary_position และ positions array
              if (userData.primary_position) {
                // ใช้ position_id จาก primary_position
                setValue(
                  "position_id",
                  String(
                    userData.primary_position.position_id ||
                      userData.primary_position.id ||
                      ""
                  )
                );
              } else if (userData.positions && userData.positions.length > 0) {
                // ใช้ position แรกจาก positions array หากไม่มี primary_position
                const firstPosition = userData.positions[0];
                setValue(
                  "position_id",
                  String(firstPosition.position_id || firstPosition.id || "")
                );
              }

              const titleId = String(userData.title_id || "3");
              setValue("title_id", titleId);
              setValue("first_name", userData.first_name || "");
              setValue("last_name", userData.last_name || "");
              setValue("phone", userData.phone || "");
              setValue("email", userData.email || "");
              setValue("password", "");
              setValue("address", userData.address || "");

              // ตั้งค่าที่อยู่ติดต่อ
              setValue("address2", userData.address_other || "");
              setValue("profileImage", userData.profile_image || "");

              // ตั้งค่าจังหวัด อำเภอ ตำบล รหัสไปรษณีย์ (ที่อยู่หลัก)
              if (userData.address_details) {
                const addr = userData.address_details;
                if (addr.province) {
                  setValue("province", {
                    value: addr.province.id,
                    label: addr.province.name,
                  });
                }
                if (addr.amphure || addr.districts) {
                  const amphure = addr.amphure || addr.districts;
                  setValue("districts", {
                    value: amphure.id,
                    label: amphure.name,
                  });
                }
                if (addr.district || addr.subdistricts) {
                  const district = addr.district || addr.subdistricts;
                  setValue("subdistricts", {
                    value: district.id,
                    label: district.name,
                  });
                }
                if (addr.zipcode) {
                  setValue("zipcode", {
                    value: addr.zipcode.value || addr.zipcode_value,
                    label: String(addr.zipcode.value || addr.zipcode_value),
                  });
                }
              }

              // ตั้งค่าจังหวัด อำเภอ ตำบล รหัสไปรษณีย์ (ที่อยู่ติดต่อ)
              if (userData.address_other_details) {
                const addr2 = userData.address_other_details;
                if (addr2.province || addr2.province2) {
                  const province = addr2.province || addr2.province2;
                  setValue("province2", {
                    value: province.id,
                    label: province.name,
                  });
                }
                if (addr2.amphure || addr2.districts2) {
                  const amphure = addr2.amphure || addr2.districts2;
                  setValue("districts2", {
                    value: amphure.id,
                    label: amphure.name,
                  });
                }
                if (addr2.district || addr2.subdistricts2) {
                  const district = addr2.district || addr2.subdistricts2;
                  setValue("subdistricts2", {
                    value: district.id,
                    label: district.name,
                  });
                }
                if (addr2.zipcode || addr2.zipcode2) {
                  const zipcode = addr2.zipcode || addr2.zipcode2;
                  setValue("zipcode2", {
                    value: zipcode.value || addr2.zipcode_value,
                    label: String(zipcode.value || addr2.zipcode_value),
                  });
                }
              }

              setValue("syncAddress", userData.sync_address || false);
            }
          }
        } catch (err) {
          if (!ignore) setViewUserData("error");
        }
        setLoadingUserData(false);
      } else {
        setViewUserData(null);
      }
    }
    fetchUserData();
    return () => {
      ignore = true;
    };
  }, [open, editingUser, setValue]);

  useEffect(() => {
    if (open) {
      setValue("password", "");
      setIsPasswordUnlocked(false);
      setShowPassword(false); // reset password visibility เมื่อเปิด modal
    }
  }, [open, setValue]);

  const provinceCode = watch("province")?.value;
  const amphureCode = watch("districts")?.value;

  const provinceCode2 = watch("province2")?.value;
  const amphureCode2 = watch("districts2")?.value;

  const syncAddress = watch("syncAddress");

  // ฟังก์ชันสำหรับ reset ฟอร์มทั้งหมด
  const resetAllFormFields = () => {
    const fieldsToReset = [
      "citizen_id",
      "email",
      "first_name",
      "last_name",
      "password",
      "phone",
      "title_id",
      "full_name",
      "group",
      "profileImage",
      "position_id",
      "address",
      "address2",
      "province",
      "districts",
      "subdistricts",
      "zipcode",
      "province2",
      "districts2",
      "subdistricts2",
      "zipcode2",
    ];
    fieldsToReset.forEach((field) => setValue(field, ""));
    setValue("syncAddress", false);
    setIsFormReset(true);
    setIsPasswordUnlocked(false);
    setShowPassword(false); // reset password visibility
  };

  // โหลดข้อมูลตำแหน่งเมื่อ modal เปิด
  useEffect(() => {
    const fetchPositions = async () => {
      if (open) {
        try {
          const posData = await GetPositions();
          if (posData && Array.isArray(posData.res_data)) {
            const formatted = posData.res_data.map((item) => ({
              value: String(item.id),
              label: item.name,
            }));
            setPositionOptions(formatted);
          }
        } catch (err) {
          console.error("Error fetching positions:", err);
          setPositionOptions([{ value: "1", label: "เจ้าหน้าที่ทั่วไป" }]);
        }
      }
    };

    fetchPositions();
  }, [open]);

  // โหลดคำนำหน้า และ role
  useEffect(() => {
    const fetchTitleOptions = async () => {
      if (open) {
        try {
          const titleData = await GetTitleDetails();
          if (titleData && Array.isArray(titleData.res_data)) {
            const formattedOptions = titleData.res_data.map((item) => ({
              value: String(item.title_id),
              label: item.title_name || item.short_name,
            }));
            setTitleOptions(formattedOptions);
          }
        } catch (error) {
          console.error("Error loading title options:", error);
          onClose();
          setTimeout(async () => {
            await alertWarning(
              "ไม่สามารถโหลดข้อมูลคำนำหน้าได้",
              "ระบบจะใช้ข้อมูลค่าเริ่มต้น"
            );
            if (onReopen) {
              onReopen();
            }
          }, 100);
          setTitleOptions([
            { value: "1", label: "อื่น ๆ" },
            { value: "2", label: "นาย" },
            { value: "3", label: "นาง" },
            { value: "4", label: "นางสาว" },
          ]);
        }
      }
    };

    const fetchRolesMap = async () => {
      if (open) {
        try {
          const rolesData = await GetRoles();
          if (rolesData && Array.isArray(rolesData.res_data)) {
            const map = {};
            const options = rolesData.res_data.map((role) => ({
              value: role.id,
              label: role.description || role.name,
            }));
            rolesData.res_data.forEach((role) => {
              map[role.name] = role.id;
            });
            setRoleMap(map);
            setRoleOptions(options);
          }
        } catch (err) {
          console.error("Error fetching roles:", err);
        }
      }
    };

    fetchRolesMap();
    fetchTitleOptions();
  }, [open, onClose, onReopen]);

  // Reset form เมื่อเปิด Modal สำหรับสร้างใหม่
  useEffect(() => {
    if (open && !editingUser) {
      setTimeout(() => {
        resetAllFormFields();
      }, 100);
    }
  }, [open, editingUser]);

  // ฟังก์ชันสำหรับจัดรูปแบบข้อมูลก่อนส่ง API
  const formatDataForAPI = (formData) => {
    const cleanCitizenId = formData.citizen_id
      ? formData.citizen_id.replace(/-/g, "")
      : "";

    const cleanPhone = formData.phone ? formData.phone.replace(/-/g, "") : "";

    let position_ids = [];
    let primary_position_id = null;

    if (formData.position_id) {
      position_ids = [formData.position_id];
      primary_position_id = formData.position_id;
    } else if (Array.isArray(formData.position_ids)) {
      position_ids = formData.position_ids;
      primary_position_id =
        formData.primary_position_id || formData.position_ids[0];
    }

    return {
      citizen_id: cleanCitizenId,
      title_id: parseInt(formData.title_id) || 3,
      prefix_other: formData.prefix_other || "",
      first_name: formData.first_name || "",
      last_name: formData.last_name || "",
      email: formData.email || "",
      password: formData.password || "",
      phone: cleanPhone,
      address: formData.address || "",
      address2: formData.address2 || "",
      syncAddress: formData.syncAddress || false,
      profileImage: formData.profileImage || "",
      group: formData.group || "officer",
      province: formData.province || null,
      districts: formData.districts || null,
      subdistricts: formData.subdistricts || null,
      zipcode: formData.zipcode || null,
      province2: formData.province2 || null,
      districts2: formData.districts2 || null,
      subdistricts2: formData.subdistricts2 || null,
      zipcode2: formData.zipcode2 || null,
      roles: [
        {
          id: formData.group,
        },
      ],
      position_ids,
      primary_position_id,
    };
  };

  // handleFormSubmit
  const handleFormSubmit = async () => {
    const isConfirmed = await showConfirm(
      editingUser ? "ยืนยันการแก้ไข" : "ยืนยันการเพิ่มข้อมูล",
      editingUser
        ? "คุณต้องการแก้ไขข้อมูลผู้ใช้งานนี้ใช่หรือไม่?"
        : "คุณต้องการเพิ่มผู้ใช้งานใหม่ใช่หรือไม่?",
      "ยืนยัน",
      "ยกเลิก"
    );

    if (!isConfirmed) {
      await alertInfo("ยกเลิก", "การดำเนินการถูกยกเลิก");
      return;
    }

    const formData = getValues();

    if (!editingUser && (!formData.password || !formData.password.trim())) {
      await alertWarning(
        "กรุณากรอกรหัสผ่าน",
        "ต้องกรอกรหัสผ่านเมื่อเพิ่มผู้ใช้ใหม่"
      );
      return;
    }

    if (!formData.email || !formData.email.includes("@")) {
      await alertWarning("รูปแบบอีเมลไม่ถูกต้อง", "อีเมลต้องมีเครื่องหมาย @");
      return;
    }

    if (!editingUser) {
      // ------- กรณีเพิ่มผู้ใช้งาน -------
      const apiData = formatDataForAPI(formData);

      const requiredFields = ["citizen_id", "title_id", "first_name", "email"];
      const missingFields = requiredFields.filter((field) => !apiData[field]);

      if (missingFields.length > 0) {
        await alertWarning(
          "ข้อมูลไม่ครบถ้วน",
          `กรุณากรอกข้อมูลให้ครบถ้วน:\n\n${missingFields
            .map((field) => {
              const fieldNames = {
                citizen_id: "• เลขบัตรประชาชน",
                title_id: "• คำนำหน้า",
                first_name: "• ชื่อ",
                email: "• อีเมล",
              };
              return fieldNames[field] || `• ${field}`;
            })
            .join("\n")}\n\nกรุณากรอกข้อมูลให้ครบถ้วนแล้วลองใหม่อีกครั้ง`
        );
        return;
      }

      const result = await AddUsers(apiData);

      if (
        result &&
        (result.res_code === "0000" || result.res_code === "0001")
      ) {
        if (onUserUpdated) {
          onUserUpdated();
        }
        await alertSuccess("สำเร็จ", "เพิ่มข้อมูลผู้ใช้งานสำเร็จ");
        resetAllFormFields();
        onClose();
        return;
      } else if (result && result.res_code === "4090") {
        const errorMessage =
          result.res_data?.error ||
          result.error ||
          "ผู้ใช้งานนี้มีอยู่ในระบบแล้ว";
        await alertWarning("ไม่สามารถเพิ่มข้อมูลได้", errorMessage);
        return;
      } else {
        await alertWarning(
          "การดำเนินการไม่สำเร็จ",
          `ได้รับการตอบกลับที่ไม่คาดคิด: ${result?.res_code || "ไม่ทราบ"}`
        );
        return;
      }
    } else {
      // ------- กรณีแก้ไขผู้ใช้งาน -------
      try {
        const apiData = formatDataForAPI(formData);

        if (!formData.password || !formData.password.trim()) {
          delete apiData.password;
        }

        const userId = editingUser.id || editingUser._id || editingUser.user_id;
        if (!userId) throw new Error("ไม่พบ user ID ที่จะใช้แก้ไข");

        await PutUser(userId, apiData);

        if (onUserUpdated) {
          onUserUpdated();
        }
        await alertSuccess("สำเร็จ", "แก้ไขข้อมูลผู้ใช้งานสำเร็จ");
        resetAllFormFields();
        onClose();
      } catch (error) {
        await alertError(
          "เกิดข้อผิดพลาด",
          `เกิดข้อผิดพลาดในการแก้ไขข้อมูล: ${error.message || "ไม่ทราบสาเหตุ"}`
        );
      }
    }
  };

  // Handle modal close with confirmation
  const handleModalClose = async (event, reason) => {
    if (reason === "backdropClick" || reason === "escapeKeyDown") {
      const formData = getValues();
      const hasData = Object.values(formData).some(
        (value) =>
          value !== "" &&
          value !== null &&
          value !== undefined &&
          value !== false
      );

      if (hasData && !editingUser) {
        onClose();
        const isConfirmed = await showConfirm(
          "ปิดหน้าต่าง",
          "คุณมีข้อมูลที่ยังไม่ได้บันทึก ต้องการปิดหน้าต่างใช่หรือไม่?",
          "ปิด",
          "ยกเลิก"
        );
        if (!isConfirmed) {
          if (onReopen) {
            setTimeout(() => onReopen(), 100);
          } else {
            setTimeout(() => window.location.reload(), 100);
          }
          return;
        }
        return;
      } else {
        onClose();
        return;
      }
    }
    onClose();
  };

  // Reset state เมื่อปิด Modal
  useEffect(() => {
    if (!open) {
      setIsFormReset(false);
      setIsPasswordUnlocked(false);
      setShowPassword(false); // reset password visibility
    }
  }, [open]);

  // Sync address effect
  useEffect(() => {
    if (syncAddress) {
      const province = watch("province");
      const district = watch("districts");
      const subdistrict = watch("subdistricts");
      const zipcode = watch("zipcode");
      const address = watch("address");

      setValue("address2", address);
      setValue("province2", province);
      setValue("districts2", district);
      setValue("subdistricts2", subdistrict);
      setValue("zipcode2", zipcode);
    }
  }, [syncAddress, setValue, watch]);

  // ถ้ากำลังโหลดข้อมูล user ให้แสดง loading
  if (editingUser && loadingUserData) {
    return (
      <Dialog
        open={open}
        onClose={handleModalClose}
        maxWidth="lg"
        fullWidth
        sx={{
          "& .MuiBackdrop-root": {
            backgroundColor: "rgba(0, 0, 0, 0.3)",
          },
          "& .MuiDialog-paper": {
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: "bold",
            fontSize: 24,
            textAlign: "center",
            color: "#1120A3",
            backgroundColor: "#ffffff",
          }}
        >
          แก้ไขข้อมูลผู้ใช้งาน
        </DialogTitle>
        <DialogContent
          sx={{
            padding: 4,
            backgroundColor: "#ffffff",
          }}
        >
          <Box
            minHeight={200}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleModalClose}
      maxWidth="lg"
      fullWidth
      sx={{
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(0, 0, 0, 0.3)",
        },
        "& .MuiDialog-paper": {
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: "bold",
          fontSize: { xs: 20, sm: 24 },
          textAlign: "center",
          color: "#1120A3",
          backgroundColor: "#ffffff",
          pb: 1, // ลดระยะห่างด้านล่าง
        }}
      >
        {editingUser ? "แก้ไขข้อมูลผู้ใช้งาน" : "เพิ่มข้อมูลผู้ใช้งาน"}
      </DialogTitle>
      <DialogContent
        sx={{
          padding: { xs: 2, sm: 3 }, // ลดระยะห่าง
          backgroundColor: "#ffffff",
          pt: 1, // ลดระยะห่างด้านบน
        }}
      >
        <form>
          <Grid container spacing={1.5}>
            {" "}
            {/* ลดระยะห่างจาก 2 เป็น 1.5 */}
            {/* Row 1 */}
            <Grid item xs={12} md={4}>
              <Typography
                variant="body2"
                color="#1120A3"
                sx={{ fontWeight: "bold", mb: 0.5 }} // ลดระยะห่าง
              >
                เลขบัตรประชาชน <span style={{ color: "red" }}>*</span>
              </Typography>
              <TextfieldService
                fullWidth
                placeholder="กรุณากรอก เลขบัตรประชาชน"
                onInput={(e) => {
                  e.target.value = e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 13);
                }}
                {...register("citizen_id", {
                  required: true,
                  minLength: 13,
                  maxLength: 13,
                  pattern: /^[0-9]+$/,
                })}
              />

              {errors.citizen_id && (
                <Typography color="error" sx={{ mt: 0.5 }}>
                  {errors.citizen_id.message}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography
                variant="body2"
                color="#1120A3"
                sx={{ fontWeight: "bold", mb: 0.5 }}
              >
                ชื่อผู้ใช้งาน <span style={{ color: "red" }}>*</span>
              </Typography>
              <TextfieldService
                fullWidth
                placeholder="กรุณากรอกชื่อผู้ใช้งาน"
                {...register("full_name")}
              />
              {errors.full_name && (
                <Typography color="error" sx={{ mt: 0.5 }}>
                  {errors.full_name.message}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography
                variant="body2"
                color="#1120A3"
                sx={{ fontWeight: "bold", mb: 0.5 }}
              >
                กลุ่มสิทธิ์ <span style={{ color: "red" }}>*</span>
              </Typography>
              <Controller
                name="group"
                control={control}
                render={({ field: { value, onChange, ...field } }) => {
                  return (
                    <SelectMenuService
                      {...field}
                      value={value || ""}
                      handleChange={(event) => {
                        onChange(event.target.value);
                      }}
                      options={roleOptions}
                      width="100%"
                      name="group"
                    />
                  );
                }}
              />
              {errors.group && (
                <Typography color="error" sx={{ mt: 0.5 }}>
                  {errors.group.message}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography
                variant="body2"
                color="#1120A3"
                sx={{ fontWeight: "bold", mb: 0.5 }}
              >
                ตำแหน่ง
              </Typography>
              <Controller
                name="position_id"
                control={control}
                render={({ field: { value, onChange, ...field } }) => {
                  return (
                    <SelectMenuService
                      {...field}
                      value={value || ""}
                      handleChange={(event) => {
                        onChange(event.target.value);
                      }}
                      options={positionOptions}
                      width="100%"
                      name="position_id"
                    />
                  );
                }}
              />
              {errors.position_id && (
                <Typography color="error" sx={{ mt: 0.5 }}>
                  {errors.position_id.message}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography
                variant="body2"
                color="#1120A3"
                sx={{ fontWeight: "bold", mb: 0.5 }}
              >
                รูปโปรไฟล์
              </Typography>
              <TextfieldService
                fullWidth
                placeholder="เลือกรูปภาพ"
                {...register("profileImage")}
                sx={{
                  "& .MuiInputBase-root": {
                    borderRadius: "10px",
                    border: "1.5px solid #2499FF",
                    fontSize: "16px",
                    padding: "10px 14px",
                    color: "#1120A3",
                    cursor: "pointer",
                    "&:hover": {
                      borderColor: "#2499FF",
                    },
                    "&.Mui-focused": {
                      borderColor: "#2499FF",
                      boxShadow: "0 0 0 2px rgba(36, 153, 255, 0.1)",
                    },
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#2499FF",
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <Add
                      sx={{
                        color: "#2499FF",
                        marginRight: "8px",
                        fontSize: "20px",
                      }}
                    />
                  ),
                  readOnly: true,
                }}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setValue("profileImage", file.name);
                    }
                  };
                  input.click();
                }}
              />
            </Grid>
            {/* Mobile: แบ่งเป็น 2 column, Desktop: แบ่งตาม design เดิม */}
            <Grid item xs={12} lg={7}>
              <Box>
                <Typography className={styles.title} sx={{ mb: 1 }}>
                  {" "}
                  {/* ลดระยะห่าง */}
                  ข้อมูลผู้ใช้เพิ่มเติม
                </Typography>
                <Grid container spacing={1.5}>
                  {" "}
                  {/* ลดระยะห่าง */}
                  <Grid item xs={12}>
                    <Controller
                      name="citizen_id"
                      control={control}
                      render={({ field }) => <IDCardInput {...field} />}
                    />
                  </Grid>
                  {/* แถวคำนำหน้า ชื่อ นามสกุล - Responsive */}
                  <Grid item xs={12} sm={4} lg={2.5}>
                    <Box>
                      <Typography
                        variant="body2"
                        color="#1120A3"
                        sx={{ fontWeight: "bold", mb: 0.5 }}
                      >
                        คำนำหน้า <span style={{ color: "red" }}>*</span>
                      </Typography>
                      <Controller
                        name="title_id"
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => {
                          return (
                            <SelectMenuService
                              {...field}
                              value={String(value || "")}
                              handleChange={(event) => {
                                onChange(event.target.value);
                              }}
                              options={titleOptions}
                              width="100%"
                              name="title_id"
                            />
                          );
                        }}
                      />
                      {errors.title_id && (
                        <Typography color="error" sx={{ mt: 0.5 }}>
                          {errors.title_id.message}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4} lg={4.75}>
                    <InputText
                      label={
                        <>
                          ชื่อ <span style={{ color: "red" }}>*</span>
                        </>
                      }
                      placeholder="ชื่อ"
                      {...register("first_name")}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} lg={4.75}>
                    <InputText
                      label="นามสกุล"
                      placeholder="นามสกุล"
                      {...register("last_name")}
                    />
                  </Grid>
                  {/* ที่อยู่ที่ตามบัตรประชาชน */}
                  <Grid item xs={12}>
                    <InputText
                      label="ที่อยู่ที่ตามบัตรประชาชน"
                      placeholder="ที่อยู่ที่ตามบัตรประชาชน"
                      {...register("address")}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => <InputPhone {...field} />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputText
                      label={
                        <>
                          อีเมล <span style={{ color: "red" }}>*</span>
                        </>
                      }
                      placeholder="อีเมล"
                      {...register("email")}
                    />
                  </Grid>
                  {/* แถวรหัสผ่านและปุ่มแก้ไข - Responsive */}
                  <Grid
                    item
                    xs={12}
                    sm={editingUser ? 8 : 12}
                    lg={editingUser ? 8.5 : 6}
                  >
                    <InputText
                      label={
                        <>
                          รหัสผ่าน <span style={{ color: "red" }}>*</span>
                        </>
                      }
                      placeholder="รหัสผ่าน"
                      type={showPassword ? "text" : "password"} // เปลี่ยน type ตาม state
                      autoComplete="new-password"
                      disabled={editingUser && !isPasswordUnlocked}
                      {...register("password", {
                        required: editingUser ? false : "กรุณากรอกรหัสผ่าน",
                      })}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={() => setShowPassword(!showPassword)}
                              onMouseDown={(event) => event.preventDefault()}
                              edge="end"
                              sx={{
                                color: "#1120A3",
                                "&:hover": {
                                  backgroundColor: "rgba(17, 32, 163, 0.04)",
                                },
                              }}
                            >
                              {showPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    {errors.password && (
                      <Typography color="error" sx={{ mt: 0.5 }}>
                        {errors.password.message}
                      </Typography>
                    )}
                  </Grid>
                  {editingUser && (
                    <Grid item xs={12} sm={4} lg={3.5}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "end",
                          height: "100%",
                          marginTop: { xs: 0, sm: "-16px" },
                        }}
                      >
                        <ButtonService
                          label={isPasswordUnlocked ? "ล็อค" : "แก้ไขรหัสผ่าน"}
                          variant={
                            isPasswordUnlocked ? "contained" : "outlined"
                          }
                          color={isPasswordUnlocked ? "#ff5722" : "#2499FF"}
                          onClick={() => {
                            setIsPasswordUnlocked(!isPasswordUnlocked);
                            if (!isPasswordUnlocked) {
                              setValue("password", "");
                            }
                          }}
                          sx={{
                            borderRadius: "8px",
                            height: "40px",
                            fontSize: { xs: "11px", sm: "12px" },
                            fontWeight: "bold",
                            width: "100%",
                            whiteSpace: "nowrap",
                          }}
                        />
                      </Box>
                    </Grid>
                  )}
                  {/* จังหวัด อำเภอ แบบ 2x2 ตามรูป */}
                  <Grid item xs={12} sm={6} lg={6}>
                    <Controller
                      name="province"
                      control={control}
                      render={({ field }) => (
                        <SelectFieldPAA label="จังหวัด" {...field} />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} lg={6}>
                    <Controller
                      name="districts"
                      control={control}
                      render={({ field }) => (
                        <SelectFieldPAA
                          label="อำเภอ/เขต"
                          provinceCode={provinceCode}
                          {...field}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} lg={6}>
                    <Controller
                      name="subdistricts"
                      control={control}
                      render={({ field }) => (
                        <SelectFieldPAA
                          label="ตำบล/แขวง"
                          amphureCode={amphureCode}
                          {...field}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} lg={6}>
                    <Controller
                      name="zipcode"
                      control={control}
                      render={({ field }) => (
                        <SelectFieldPAA
                          label="รหัสไปรษณีย์"
                          amphureCode={amphureCode}
                          optionMapper={(item) => ({
                            value: item.zip_code,
                            label: String(item.zip_code),
                          })}
                          {...field}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            {/* Divider - Hidden on mobile */}
            <Grid item lg={1} sx={{ display: { xs: "none", lg: "block" } }}>
              <Box
                sx={{
                  height: "100%",
                  width: "1px",
                  backgroundColor: "#ccc",
                  margin: "0 auto",
                }}
              />
            </Grid>
            <Grid
              item
              xs={12}
              lg={4}
              sx={{
                paddingTop: { xs: "8px", lg: "8px" },
                marginTop: { xs: "0px", lg: "40px" }, // ลดระยะห่าง
              }}
            >
              <Grid container spacing={1.5}>
                {" "}
                {/* ลดระยะห่าง */}
                <Grid item xs={12}>
                  <InputText
                    label="ที่อยู่ที่สามารถติดต่อได้"
                    placeholder="ที่อยู่ที่สามารถติดต่อได้"
                    {...register("address2")}
                  />
                  {errors.address2 && (
                    <Typography color="error" sx={{ mt: 0.5 }}>
                      {errors.address2.message}
                    </Typography>
                  )}
                </Grid>
                {/* จังหวัด อำเภอ แบบ 2x2 ตามรูป */}
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="province2"
                    control={control}
                    render={({ field }) => (
                      <SelectFieldPAA label="จังหวัด" {...field} />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="districts2"
                    control={control}
                    render={({ field }) => (
                      <SelectFieldPAA
                        label="อำเภอ/เขต"
                        provinceCode={provinceCode2}
                        {...field}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="subdistricts2"
                    control={control}
                    render={({ field }) => (
                      <SelectFieldPAA
                        label="ตำบล/แขวง"
                        amphureCode={amphureCode2}
                        {...field}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="zipcode2"
                    control={control}
                    render={({ field }) => (
                      <SelectFieldPAA
                        label="รหัสไปรษณีย์"
                        amphureCode={amphureCode2}
                        optionMapper={(item) => ({
                          value: item.zip_code,
                          label: String(item.zip_code),
                        })}
                        {...field}
                      />
                    )}
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 1.5 }}>
                {" "}
                {/* ลดระยะห่าง */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: 14,
                    color: "#1120A3",
                  }}
                >
                  <input
                    type="checkbox"
                    {...register("syncAddress")}
                    style={{ marginRight: 8 }}
                  />
                  ที่อยู่ตรงตามบัตรประชาชน
                </label>
              </Box>
            </Grid>
            {/* Button Section */}
            <Grid item xs={12} sm={6} sx={{ pt: 1.5 }}>
              {" "}
              {/* ลดระยะห่าง */}
              <ButtonService
                label="ยกเลิก"
                variant="outlined"
                color="#2499FF"
                onClick={() => onClose()}
                disabled={isSubmitting}
                sx={{
                  borderRadius: "15px",
                  height: "40px",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ pt: 1.5 }}>
              {" "}
              {/* ลดระยะห่าง */}
              <ButtonService
                label={editingUser ? "บันทึกการแก้ไข" : "บันทึก"}
                color="บันทึก"
                onClick={handleFormSubmit}
                disabled={isSubmitting}
                sx={{
                  borderRadius: "15px",
                  height: "40px",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              />
            </Grid>
          </Grid>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserModal;
