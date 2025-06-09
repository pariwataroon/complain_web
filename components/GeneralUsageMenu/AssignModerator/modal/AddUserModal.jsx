import React, { useEffect } from "react";
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
import { alertSuccess } from "@utils/Alerts";
import styles from "./AddUserModal.module.scss";

const AddUserModal = ({ open, onClose, editingUser, onUserUpdated }) => {
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
    getValues, // เพิ่ม getValues เพื่อดึงข้อมูลฟอร์ม
  } = useCRUDFormUsers(editingUser, onUserUpdated);

  const provinceCode = watch("province")?.value;
  const amphureCode = watch("districts")?.value;

  const provinceCode2 = watch("province2")?.value;
  const amphureCode2 = watch("districts2")?.value;

  const syncAddress = watch("syncAddress");

  // ← แก้ไข handleFormSubmit ให้ไม่ต้องรับ parameter จาก react-hook-form
  const handleFormSubmit = async () => {
    try {
      console.log("🚀 Form submit started...");

      // ดึงข้อมูลจากฟอร์มด้วย getValues()
      const formData = getValues();
      console.log("📋 Form data:", formData);

      // เรียก originalOnSubmit จาก hook
      console.log("📤 Calling originalOnSubmit...");
      await originalOnSubmit(formData);

      console.log("✅ Submit successful!");

      // ปิด Modal
      console.log("🚪 Closing modal...");
      onClose();
      console.log("🔔 Showing success alert...");
      alertSuccess(
        editingUser
          ? "แก้ไขข้อมูลผู้ใช้งานสำเร็จ"
          : "เพิ่มข้อมูลผู้ใช้งานสำเร็จ"
      );
    } catch (error) {
      console.error("❌ Error submitting form:", error);
      // หากต้องการแจ้งเตือนข้อผิดพลาดด้วย สามารถเพิ่ม alertError ได้
    }
  };

  // Helper function to clear form
  const clearForm = () => {
    setValue("username", "");
    setValue("full_name", "");
    setValue("group", "");
    setValue("role", "");
    setValue("idCard", "");
    setValue("name", "");
    setValue("phone", "");
    setValue("email", "");
    setValue("address", "");
    setValue("address2", "");
    setValue("province", "");
    setValue("districts", "");
    setValue("subdistricts", "");
    setValue("zipcode", "");
    setValue("province2", "");
    setValue("districts2", "");
    setValue("subdistricts2", "");
    setValue("zipcode2", "");
    setValue("syncAddress", false);
    setValue("profileImage", "");
  };

  // Function to map role_name to our option values
  const mapRoleNameToValue = (roleName) => {
    const roleMapping = {
      // API values ที่มาจาก section.role_name
      admin: "admin",
      people: "people",
      executive: "executive",
      agency: "agency",
      officer: "officer",
      admin_home: "admin", // แมปเป็น admin
      staff: "officer", // แมปเป็น officer
      supervisor: "executive", // แมปเป็น executive
      department: "agency", // แมปเป็น agency

      // Thai labels (สำหรับกรณีที่ส่งมาเป็นภาษาไทย)
      ผู้ดูแลระบบ: "admin",
      ประชาชน: "people",
      ผู้บริหาร: "executive",
      หน่วยงานในสังกัด: "agency",
      เจ้าหน้าที่: "officer",
      ผู้ดูแลหน้าหลัก: "admin",
      "เจ้าหน้าที่ สรร.": "officer",
      "ผู้บริหาร / ผู้สั่งงาน": "executive",

      // Possible API variations
      admin_mof: "admin",
      public_mof: "people",
      executive_mof: "executive",
      agency_mof: "agency",
      officer_mof: "officer",
    };

    const result = roleMapping[roleName] || "people"; // default เป็น people

    return result;
  };

  // Pre-fill form when editing user
  useEffect(() => {
    if (editingUser && open) {
      // Username
      const citizenIdForUsername = editingUser.citizen_id
        ? editingUser.citizen_id.replace(/-/g, "")
        : editingUser.username || "";

      // แมป role_name สำหรับ dropdown
      const mappedGroup = mapRoleNameToValue(editingUser.role_name);

      // ตำแหน่ง
      const userPosition = editingUser.position || "ไม่ระบุ";

      // Set all values with logging
      console.log("📝 Setting form values...");
      setValue("username", citizenIdForUsername);
      setValue("full_name", editingUser.full_name || "");
      setValue("group", mappedGroup);
      setValue("role", userPosition);
      setValue("idCard", editingUser.citizen_id || "");
      setValue(
        "name",
        editingUser.full_name_with_title || editingUser.full_name || ""
      );
      setValue("phone", editingUser.phone || "");
      setValue("email", editingUser.email || "");
      setValue(
        "address",
        editingUser.address || editingUser.address_card || ""
      );
      setValue(
        "address2",
        editingUser.contact_address || editingUser.address_contact || ""
      );
      setValue("profileImage", editingUser.profile_image || "");

      // Force re-render
      setTimeout(() => {
        console.log("🔄 Force refresh form values...");
        setValue("group", mappedGroup, { shouldValidate: true });
        setValue("role", userPosition, { shouldValidate: true });
      }, 100);
    } else if (!editingUser && open) {
      console.log("🆕 Add mode - clearing form");
      clearForm();
    }
  }, [editingUser, setValue, open]);

  // Additional effect to watch current values
  useEffect(() => {
    const currentGroup = watch("group");
    const currentRole = watch("role");
    console.log(
      "👀 Current watched values - Group:",
      currentGroup,
      "Role:",
      currentRole
    );
  }, [watch("group"), watch("role")]);

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
      open={open}
      onClose={onClose}
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
        {/* ← ลบ onSubmit ออกจาก form element */}
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
                {...register("username")}
              />
              {editingUser && (
                <Typography
                  variant="caption"
                  color="#2499FF"
                  sx={{ fontSize: "12px", mt: 0.5 }}
                >
                  แนะนำ: ใช้เลขบัตรประชาชน (ไม่มีขีด) หรือชื่อผู้ใช้ที่ต้องการ
                </Typography>
              )}
              {errors.username && (
                <Typography color="error">{errors.username.message}</Typography>
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
                  console.log(
                    "🎛️ SelectMenuService render - Current value:",
                    value
                  );
                  return (
                    <SelectMenuService
                      {...field}
                      value={value || ""}
                      handleChange={(event) => {
                        console.log("📝 Group changed to:", event.target.value);
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
                {...register("role")}
              />
              {errors.role && (
                <Typography color="error">{errors.role.message}</Typography>
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
                      name="idCard"
                      control={control}
                      render={({ field }) => <IDCardInput {...field} />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputText
                      label="ชื่อ - นามสกุล"
                      placeholder="ชื่อ - นามสกุล"
                      {...register("name")}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
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
                  <Grid item xs={12} sm={6}>
                    <InputText
                      label="อีเมล"
                      placeholder="อีเมล"
                      {...register("email")}
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
                onClick={onClose}
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
              {/* ← เปลี่ยนจาก type="submit" เป็น onClick={handleFormSubmit} */}
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
