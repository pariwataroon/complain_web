import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Grid,
} from "@mui/material";
import { Controller } from "react-hook-form";
import { Add } from "@mui/icons-material";
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
  showLoading,
  closeAlert,
} from "@utils/Alerts";
import styles from "./AddUserModal.module.scss";
import { AddUsers, GetTitleDetails } from "@pages/api/settinggeneral/users";

// 🧪 Mockup Data - Updated to 2025-06-10 04:11:25 UTC by vampirebeam
const mockupUserData = {
  citizen_id: "1111111111111",
  title_id: 3,
  prefix_other: "นักวิเคราะห์นโยบายและแผน",
  first_name: "ทดสอบ",
  last_name: "ระบบการทำงาน",
  email: "vampirebeam.test@example.com",
  password: "TempPass2025!",
  phone: "0864703371",
  address: "123/45 หมู่ 6 ตำบลบางกรวย อำเภอบางกรวย",
  address2: "123/45 หมู่ 6 ตำบลบางกรวย อำเภอบางกรวย",
  syncAddress: true,
  profileImage: "vampirebeam_profile_20250610041125.jpg",
  group: "officer",
  province: {
    value: "13",
    label: "กรุงเทพมหานคร",
  },
  districts: {
    value: 160,
    label: "เมืองจันทบุรี",
  },
  subdistricts: {
    value: "220103",
    label: "คลองนารายณ์",
  },
  zipcode: {
    value: 22000,
    label: 22000,
  },
  province2: {
    value: "13",
    label: "กรุงเทพมหานคร",
  },
  districts2: {
    value: 160,
    label: "เมืองจันทบุรี",
  },
  subdistricts2: {
    value: "220103",
    label: "คลองนารายณ์",
  },
  zipcode2: {
    value: 22000,
    label: 22000,
  },
  roles: [
    {
      id: "79342847-20ce-411a-8f4e-42cd7aeab407",
    },
  ],
};

const AddUserModal = ({ open, onClose, editingUser, onUserUpdated }) => {
  const [titleOptions, setTitleOptions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(open);

  const {
    register,
    handleSubmit,
    control,
    errors,
    onSubmit: originalOnSubmit,
    watch,
    isSubmitting,
    setValue,
    reset,
    getValues,
  } = useCRUDFormUsers(editingUser, onUserUpdated);

  const provinceCode = watch("province")?.value;
  const amphureCode = watch("districts")?.value;

  const provinceCode2 = watch("province2")?.value;
  const amphureCode2 = watch("districts2")?.value;

  const syncAddress = watch("syncAddress");

  // Sync modal state
  useEffect(() => {
    setIsModalOpen(open);
  }, [open]);

  // Function to close modal
  const closeModal = () => {
    setIsModalOpen(false);
    onClose();
  };

  // Function to reopen modal
  const reopenModal = () => {
    setIsModalOpen(true);
  };

  // 🧪 ฟังก์ชันกรอกข้อมูลทดสอบ
  const fillMockupData = async () => {
    // Map API structure to form fields
    setValue("citizen_id", mockupUserData.citizen_id);
    setValue("email", mockupUserData.email);
    setValue("first_name", mockupUserData.first_name);
    setValue("last_name", mockupUserData.last_name);
    setValue("password", mockupUserData.password);
    setValue("phone", mockupUserData.phone);
    setValue("prefix_other", mockupUserData.prefix_other);
    setValue("title_id", mockupUserData.title_id);

    // Additional form fields
    setValue(
      "full_name",
      `${mockupUserData.first_name} ${mockupUserData.last_name}`
    );
    setValue("group", mockupUserData.group);
    setValue("profileImage", mockupUserData.profileImage);
    setValue("address", mockupUserData.address);
    setValue("province", mockupUserData.province);
    setValue("districts", mockupUserData.districts);
    setValue("subdistricts", mockupUserData.subdistricts);
    setValue("zipcode", mockupUserData.zipcode);
    setValue("address2", mockupUserData.address2);
    setValue("province2", mockupUserData.province2);
    setValue("districts2", mockupUserData.districts2);
    setValue("subdistricts2", mockupUserData.subdistricts2);
    setValue("zipcode2", mockupUserData.zipcode2);
    setValue("syncAddress", mockupUserData.syncAddress);
  };

  // Fetch title options when modal opens
  useEffect(() => {
    const fetchTitleOptions = async () => {
      if (open) {
        try {
          showLoading("กำลังโหลดข้อมูลคำนำหน้า...");

          const titleData = await GetTitleDetails();
          closeAlert(); // ปิด loading

          if (
            titleData &&
            titleData.res_data &&
            Array.isArray(titleData.res_data)
          ) {
            const formattedOptions = titleData.res_data.map((item) => ({
              value: item.title_id,
              label: item.title_name || item.short_name,
            }));
            setTitleOptions(formattedOptions);
          }
        } catch (error) {
          closeAlert(); // ปิด loading

          // 🚪 ปิด Modal ก่อนแจ้งเตือน warning
          closeModal();

          await alertWarning(
            "ไม่สามารถโหลดข้อมูลคำนำหน้าได้",
            "ระบบจะใช้ข้อมูลค่าเริ่มต้น"
          );

          // ⚠️ กรณี Warning: เปิด Modal กลับมา
          reopenModal();

          setTitleOptions([
            { value: 1, label: "อื่น ๆ" },
            { value: 2, label: "นาย" },
            { value: 3, label: "นาง" },
            { value: 4, label: "นางสาว" },
          ]);
        }
      }
    };

    fetchTitleOptions();
  }, [open]);

  // ฟังก์ชันสำหรับจัดรูปแบบข้อมูลก่อนส่ง API - Updated for new format
  const formatDataForAPI = (formData) => {
    // Clean citizen_id: remove dashes and keep only numbers
    const cleanCitizenId = formData.citizen_id
      ? formData.citizen_id.replace(/-/g, "")
      : "";

    // Clean phone: remove dashes and keep only numbers
    const cleanPhone = formData.phone ? formData.phone.replace(/-/g, "") : "";

    // เตรียม roles array ตาม group ที่เลือก
    const roleMapping = {
      admin: "79342847-20ce-411a-8f4e-42cd7aeab407",
      people: "79342847-20ce-411a-8f4e-42cd7aeab408",
      executive: "79342847-20ce-411a-8f4e-42cd7aeab409",
      agency: "79342847-20ce-411a-8f4e-42cd7aeab410",
      officer: "79342847-20ce-411a-8f4e-42cd7aeab407", // Default to officer role
    };

    const roleId = roleMapping[formData.group] || roleMapping.officer;

    const apiData = {
      citizen_id: cleanCitizenId,
      title_id: parseInt(formData.title_id) || 3,
      prefix_other: formData.prefix_other || "นักวิเคราะห์นโยบายและแผน",
      first_name: formData.first_name || "",
      last_name: formData.last_name || "",
      email: formData.email || "",
      password: formData.password || "TempPass2025!",
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
          id: roleId,
        },
      ],
    };

    return apiData;
  };

  // แก้ไขฟังก์ชัน handleFormSubmit
  const handleFormSubmit = async () => {
    try {
      // 🚪 ปิด Modal ก่อนแสดง confirmation dialog
      closeModal();

      // แสดง confirmation dialog หลังปิด Modal
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
        // ℹ️ กรณี Info: เปิด Modal กลับมา
        reopenModal();
        return;
      }

      const formData = getValues();

      if (!editingUser) {
        showLoading("กำลังเพิ่มข้อมูลผู้ใช้งาน...");

        const apiData = formatDataForAPI(formData);

        // Validate required fields before API call
        const requiredFields = [
          "citizen_id",
          "title_id",
          "first_name",
          "email",
        ];
        const missingFields = requiredFields.filter((field) => !apiData[field]);

        if (missingFields.length > 0) {
          closeAlert(); // ปิด loading

          const result = await showConfirm(
            "ข้อมูลไม่ครบถ้วน",
            `กรุณากรอกข้อมูลให้ครบถ้วน:\n\n${missingFields
              .map((field) => {
                const fieldNames = {
                  citizen_id: "• Username",
                  title_id: "• คำนำหน้า",
                  first_name: "• ชื่อ",
                  email: "• อีเมล",
                };
                return fieldNames[field] || `• ${field}`;
              })
              .join("\n")}\n\nกรุณากรอกข้อมูลให้ครบถ้วนแล้วลองใหม่อีกครั้ง`,
            "ตกลง",
            "ปิด"
          );

          // ✅ เปิด Modal กลับมาเสมอ
          reopenModal();
          return;
        }

        const result = await AddUsers(apiData);
        closeAlert(); // ปิด loading

        // Check API response status
        if (
          result &&
          (result.res_code === "0000" || result.res_code === "0001")
        ) {
          if (onUserUpdated) {
            onUserUpdated();
          }

          await alertSuccess("สำเร็จ", "เพิ่มข้อมูลผู้ใช้งานสำเร็จ");
          // ✅ กรณีสำเร็จ: ไม่เปิด Modal กลับมา
          return;
        } else if (result && result.res_code === "4090") {
          // Handle duplicate user error
          const errorMessage =
            result.res_data?.error ||
            result.error ||
            "ผู้ใช้งานนี้มีอยู่ในระบบแล้ว";

          await alertWarning("ไม่สามารถเพิ่มข้อมูลได้", errorMessage);

          // ⚠️ กรณี Warning: เปิด Modal กลับมา
          reopenModal();
          return;
        } else {
          await alertWarning(
            "การดำเนินการไม่สำเร็จ",
            `ได้รับการตอบกลับที่ไม่คาดคิด: ${result?.res_code || "ไม่ทราบ"}`
          );

          // ⚠️ กรณี Warning: เปิด Modal กลับมา
          reopenModal();
          return;
        }
      } else {
        showLoading("กำลังแก้ไขข้อมูลผู้ใช้งาน...");

        await originalOnSubmit(formData);
        closeAlert(); // ปิด loading

        if (onUserUpdated) {
          onUserUpdated();
        }

        await alertSuccess("สำเร็จ", "แก้ไขข้อมูลผู้ใช้งานสำเร็จ");
        // ✅ กรณีสำเร็จ: ไม่เปิด Modal กลับมา
      }
    } catch (error) {
      closeAlert(); // ปิด loading ในกรณี error

      await alertError(
        "เกิดข้อผิดพลาด",
        editingUser
          ? `เกิดข้อผิดพลาดในการแก้ไขข้อมูล: ${
              error.message || "ไม่ทราบสาเหตุ"
            }`
          : `เกิดข้อผิดพลาดในการเพิ่มข้อมูล: ${
              error.message || "ไม่ทราบสาเหตุ"
            }`
      );

      // ❌ กรณี Error: เปิด Modal กลับมา
      reopenModal();
    }
  };

  // Helper function to clear form
  const clearForm = async () => {
    // แสดง confirmation dialog ก่อนล้างข้อมูล
    const isConfirmed = await showConfirm(
      "ล้างข้อมูลฟอร์ม",
      "คุณต้องการล้างข้อมูลทั้งหมดในฟอร์มใช่หรือไม่?",
      "ล้างข้อมูล",
      "ยกเลิก"
    );

    if (!isConfirmed) {
      return;
    }

    const fieldsToReset = [
      "citizen_id",
      "email",
      "first_name",
      "last_name",
      "password",
      "phone",
      "prefix_other",
      "title_id",
      "full_name",
      "group",
      "profileImage",
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

    // 🚪 ปิด Modal ก่อนแจ้งเตือนสำเร็จ
    closeModal();

    await alertSuccess("สำเร็จ", "ล้างข้อมูลฟอร์มเรียบร้อยแล้ว");
    // ✅ กรณีสำเร็จ: ไม่เปิด Modal กลับมา
  };

  // Handle modal close with confirmation
  const handleModalClose = async () => {
    const formData = getValues();
    const hasData = Object.values(formData).some(
      (value) =>
        value !== "" && value !== null && value !== undefined && value !== false
    );

    if (hasData && !editingUser) {
      const isConfirmed = await showConfirm(
        "ปิดหน้าต่าง",
        "คุณมีข้อมูลที่ยังไม่ได้บันทึก ต้องการปิดหน้าต่างใช่หรือไม่?",
        "ปิด",
        "ยกเลิก"
      );

      if (!isConfirmed) {
        return;
      }
    }

    closeModal();
  };

  // Function to map role_name to our option values
  const mapRoleNameToValue = (roleName) => {
    const roleMapping = {
      admin: "admin",
      people: "people",
      executive: "executive",
      agency: "agency",
      officer: "officer",
      admin_home: "admin",
      staff: "officer",
      supervisor: "executive",
      department: "agency",
      ผู้ดูแลระบบ: "admin",
      ประชาชน: "people",
      ผู้บริหาร: "executive",
      หน่วยงานในสังกัด: "agency",
      เจ้าหน้าที่: "officer",
      ผู้ดูแลหน้าหลัก: "admin",
      "เจ้าหน้าที่ สรร.": "officer",
      "ผู้บริหาร / ผู้สั่งงาน": "executive",
      admin_mof: "admin",
      public_mof: "people",
      executive_mof: "executive",
      agency_mof: "agency",
      officer_mof: "officer",
    };

    const result = roleMapping[roleName] || "people";
    return result;
  };

  // Pre-fill form when editing user
  useEffect(() => {
    if (editingUser && open) {
      const mappedGroup = mapRoleNameToValue(editingUser.role_name);

      setValue("citizen_id", editingUser.citizen_id || "");
      setValue("full_name", editingUser.full_name || "");
      setValue("group", mappedGroup);
      setValue("prefix_other", editingUser.position || "ไม่ระบุ");
      setValue("title_id", editingUser.title_id?.toString() || "");
      setValue("first_name", editingUser.first_name || "");
      setValue("last_name", editingUser.last_name || "");
      setValue("phone", editingUser.phone || "");
      setValue("email", editingUser.email || "");
      setValue("password", "TempPass2025!");
      setValue(
        "address",
        editingUser.address || editingUser.address_card || ""
      );
      setValue(
        "address2",
        editingUser.contact_address || editingUser.address_contact || ""
      );
      setValue("profileImage", editingUser.profile_image || "");

      setTimeout(() => {
        setValue("group", mappedGroup, { shouldValidate: true });
        setValue("prefix_other", editingUser.position || "ไม่ระบุ", {
          shouldValidate: true,
        });
        setValue("title_id", editingUser.title_id?.toString() || "", {
          shouldValidate: true,
        });
      }, 100);
    } else if (!editingUser && open) {
      // ไม่เรียก clearForm() เพราะจะมี confirmation dialog
      const fieldsToReset = [
        "citizen_id",
        "email",
        "first_name",
        "last_name",
        "password",
        "phone",
        "prefix_other",
        "title_id",
        "full_name",
        "group",
        "profileImage",
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
    }
  }, [editingUser, setValue, open]);

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
  }, [syncAddress, setValue]);

  return (
    <Dialog
      open={isModalOpen}
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
          mb: 2,
          color: "#1120A3",
          backgroundColor: "#ffffff",
        }}
      >
        {editingUser ? "แก้ไขข้อมูลผู้ใช้งาน" : "เพิ่มข้อมูลผู้ใช้งาน"}
      </DialogTitle>
      <DialogContent
        sx={{
          padding: 4,
          backgroundColor: "#ffffff",
        }}
      >
        <form>
          <Grid container spacing={2}>
            {/* Row 1 */}
            <Grid item xs={12} sm={4}>
              <Typography
                variant="body2"
                color="#1120A3"
                sx={{ fontWeight: "bold" }}
              >
                Username
              </Typography>
              <TextfieldService
                fullWidth
                placeholder="กรุณากรอกชื่อผู้ใช้งาน"
                {...register("citizen_id")}
              />
              {!editingUser && (
                <Typography
                  variant="caption"
                  color="#2499FF"
                  sx={{ fontSize: "12px", mt: 0.5 }}
                >
                  แนะนำ: ใช้เลขบัตรประชาชน (ไม่มีขีด) หรือชื่อผู้ใช้ที่ต้องการ
                </Typography>
              )}
              {errors.citizen_id && (
                <Typography color="error">
                  {errors.citizen_id.message}
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography
                variant="body2"
                color="#1120A3"
                sx={{ fontWeight: "bold" }}
              >
                ชื่อผู้ใช้งาน
              </Typography>
              <TextfieldService
                fullWidth
                placeholder="กรุณากรอกชื่อผู้ใช้งาน"
                {...register("full_name")}
              />
              {errors.full_name && (
                <Typography color="error">
                  {errors.full_name.message}
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography
                variant="body2"
                color="#1120A3"
                sx={{ fontWeight: "bold" }}
              >
                กลุ่มสิทธิ์
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
                      options={[
                        { value: "admin", label: "ผู้ดูแลระบบ" },
                        { value: "people", label: "ประชาชน" },
                        { value: "executive", label: "ผู้บริหาร" },
                        { value: "agency", label: "หน่วยงานในสังกัด" },
                        { value: "officer", label: "เจ้าหน้าที่" },
                      ]}
                      width="100%"
                      name="group"
                    />
                  );
                }}
              />
              {errors.group && (
                <Typography color="error">{errors.group.message}</Typography>
              )}
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography
                variant="body2"
                color="#1120A3"
                sx={{ fontWeight: "bold" }}
              >
                ตำแหน่ง
              </Typography>
              <TextfieldService
                fullWidth
                placeholder="ตำแหน่ง"
                {...register("prefix_other")}
              />
              {errors.prefix_other && (
                <Typography color="error">
                  {errors.prefix_other.message}
                </Typography>
              )}
            </Grid>

            <Grid item xs={4} sm={4}>
              <Typography
                variant="body2"
                color="#1120A3"
                sx={{ fontWeight: "bold" }}
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

            <Grid item xs={12} sm={6} md={7}>
              <Box>
                <Typography className={styles.title}>
                  ข้อมูลผู้ใช้เพิ่มเติม
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="citizen_id"
                      control={control}
                      render={({ field }) => <IDCardInput {...field} />}
                    />
                  </Grid>
                  {/* เพิ่ม Title Select Field */}
                  <Grid item xs={12} sm={3}>
                    <Typography
                      variant="body2"
                      color="#1120A3"
                      sx={{ fontWeight: "bold", mb: 1 }}
                    >
                      คำนำหน้า
                    </Typography>
                    <Controller
                      name="title_id"
                      control={control}
                      render={({ field: { value, onChange, ...field } }) => (
                        <SelectMenuService
                          {...field}
                          value={value || ""}
                          handleChange={(event) => {
                            onChange(event.target.value);
                          }}
                          options={titleOptions}
                          width="100%"
                          name="title_id"
                          placeholder="เลือกคำนำหน้า"
                        />
                      )}
                    />
                    {errors.title_id && (
                      <Typography color="error">
                        {errors.title_id.message}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={9}>
                    <InputText
                      label="ชื่อ"
                      placeholder="ชื่อ"
                      {...register("first_name")}
                    />
                  </Grid>
                  <Grid item xs={12} sm={9}>
                    <InputText
                      label="นามสกุล"
                      placeholder="นามสกุล"
                      {...register("last_name")}
                    />
                  </Grid>
                  {/* ย้าย ที่อยู่ที่ตามบัตรประชาชน ไว้อีกบรรทัด */}
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
                      label="อีเมล"
                      placeholder="อีเมล"
                      {...register("email")}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputText
                      label="รหัสผ่าน"
                      placeholder="รหัสผ่าน"
                      type="password"
                      {...register("password")}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Controller
                      name="province"
                      control={control}
                      render={({ field }) => (
                        <SelectFieldPAA label="จังหวัด" {...field} />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
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
                  <Grid item xs={12} sm={3}>
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
                  <Grid item xs={12} sm={3}>
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
            <Grid item md={1} sx={{ display: { xs: "none", md: "block" } }}>
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
              sm={6}
              md={4}
              sx={{ paddingTop: "20px", marginTop: "130px" }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <InputText
                    label="ที่อยู่ที่สามารถติดต่อได้"
                    placeholder="ที่อยู่ที่สามารถติดต่อได้"
                    {...register("address2")}
                  />
                  {errors.address2 && (
                    <Typography color="error">
                      {errors.address2.message}
                    </Typography>
                  )}
                </Grid>
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
              <Box>
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
            <Grid item xs={12} sm={6}>
              <ButtonService
                label="ยกเลิก"
                variant="outlined"
                color="#2499FF"
                onClick={handleModalClose}
                disabled={isSubmitting}
                sx={{
                  borderRadius: "15px",
                  height: "45px",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ButtonService
                label={editingUser ? "บันทึกการแก้ไข" : "บันทึก"}
                color="บันทึก"
                onClick={handleFormSubmit}
                disabled={isSubmitting}
                sx={{
                  borderRadius: "15px",
                  height: "45px",
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
