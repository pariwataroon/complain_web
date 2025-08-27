import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Grid,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import InputText from "@services/InputText/InputText";
import SelectMenuService from "@services/SelectMenu/SelectMenu";
import ButtonService from "@services/ButtonService/ButtonService";
import {
  alertSuccess,
  alertError,
  alertWarning,
  showConfirm,
} from "@utils/Alerts";
import { UpdateOutsideDepartment, GetOutsideDepartmentByID } from "@pages/api/outsideDepartments/outsideDepartments";

const EditDepartments_ExternalModal = ({ open, onClose, editingItem, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
    getValues,
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      is_active: "true",
    },
  });

  const statusOptions = [
    { value: "true", label: "ใช้งาน" },
    { value: "false", label: "ไม่ใช้งาน" },
  ];

  // โหลดข้อมูลจาก API เมื่อเปิด modal และมี editingItem
  useEffect(() => {
    const fetchDepartmentData = async () => {
      if (open && editingItem?.id) {
        setLoading(true);
        try {
          console.log('Fetching department data for ID:', editingItem.id);
          const result = await GetOutsideDepartmentByID(editingItem.id);

          if (result && (result.res_code === "0000" || result.res_code === "0001")) {
            const departmentData = result.res_data;
            console.log('Department data loaded:', departmentData);

            // Set ข้อมูลลงใน form
            setValue("name", departmentData.name || "");
            setValue("description", departmentData.description || "");
            setValue("is_active", departmentData.is_active ? "true" : "false");
          } else {
            console.error('Failed to load department data:', result);
            await alertError(
              "เกิดข้อผิดพลาด",
              "ไม่สามารถโหลดข้อมูลหน่วยงานได้"
            );
            onClose();
          }
        } catch (error) {
          console.error("Error fetching department:", error);
          await alertError("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลได้");
          onClose();
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDepartmentData();
  }, [open, editingItem, setValue, onClose]);

  // รีเซ็ตฟอร์มเมื่อปิด modal
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data) => {
    console.log('Form submitted with data:', data);
    try {
      const isConfirmed = await showConfirm(
        "ยืนยันการแก้ไข",
        "คุณต้องการแก้ไขกลุ่มหน่วยงานนี้ใช่หรือไม่?",
        "ยืนยัน",
        "ยกเลิก"
      );

      if (!isConfirmed) {
        return;
      }

      setIsSubmitting(true);

      // จัดรูปแบบข้อมูลก่อนส่ง API (ตาม body ที่ต้องการ)
      const formattedData = {
        name: data.name.trim(),
        description: data.description.trim(),
        is_active: data.is_active === "true",
      };

      console.log("Updating department ID:", editingItem.id);
      console.log("Sending update data:", formattedData);

      const result = await UpdateOutsideDepartment(editingItem.id, formattedData);

      if (result && (result.res_code === "0000" || result.res_code === "0002")) {
        await alertSuccess("สำเร็จ", "แก้ไขกลุ่มหน่วยงานสำเร็จ");
        reset();
        onSuccess();
      } else if (result && result.res_code === "4090") {
        await alertWarning("ข้อมูลซ้ำ", "ชื่อหน่วยงานนี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น");
      } else {
        console.error("Error updating department:", result?.res_message || result?.res_desc || "Unknown error");
        await alertError(
          "เกิดข้อผิดพลาด",
          result?.res_message || result?.res_desc || "ไม่สามารถแก้ไขกลุ่มหน่วยงานได้"
        );
      }
    } catch (error) {
      console.error("Error updating department:", error);
      await alertError(
        "เกิดข้อผิดพลาด",
        error.message || "ไม่สามารถแก้ไขกลุ่มหน่วยงานได้"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ฟังก์ชันสำหรับปิด Modal
  const handleClose = async () => {
    if (isSubmitting || loading) {
      return;
    }

    const formData = getValues();
    const hasChanges = Object.keys(formData).some(key => {
      const currentValue = formData[key];
      // เปรียบเทียบกับข้อมูลเดิม
      if (editingItem) {
        const originalValue = key === 'is_active'
          ? (editingItem.is_active ? "true" : "false")
          : editingItem[key] || "";
        return currentValue !== originalValue;
      }
      return currentValue && currentValue.toString().trim() !== "" && currentValue !== "true";
    });

    if (hasChanges) {
      const isConfirmed = await showConfirm(
        "ปิดหน้าต่าง",
        "คุณมีการเปลี่ยนแปลงข้อมูลที่ยังไม่ได้บันทึก ต้องการปิดหน้าต่างใช่หรือไม่?",
        "ปิด",
        "ยกเลิก"
      );

      if (!isConfirmed) {
        return;
      }
    }

    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
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
        แก้ไขกลุ่มหน่วยงานภายนอก
      </DialogTitle>

      <DialogContent
        sx={{
          padding: 4,
          backgroundColor: "#ffffff",
        }}
      >
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="200px"
          >
            <Typography>กำลังโหลดข้อมูล...</Typography>
          </Box>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* ชื่อหน่วยงาน */}
              <Grid item xs={12}>
                <Typography
                  variant="body2"
                  color="#1120A3"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  ชื่อหน่วยงาน <span style={{ color: "red" }}>*</span>
                </Typography>
                <InputText
                  placeholder="กรุณากรอกชื่อหน่วยงาน"
                  {...register("name", {
                    required: "กรุณากรอกชื่อหน่วยงาน",
                    minLength: {
                      value: 2,
                      message: "ชื่อหน่วยงานต้องมีความยาวอย่างน้อย 2 ตัวอักษร"
                    }
                  })}
                  error={!!errors.name}
                />
                {errors.name && (
                  <Typography color="error" sx={{ mt: 0.5, fontSize: 14 }}>
                    {errors.name.message}
                  </Typography>
                )}
              </Grid>

              {/* คำอธิบาย */}
              <Grid item xs={12}>
                <Typography
                  variant="body2"
                  color="#1120A3"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  คำอธิบาย
                </Typography>
                <InputText
                  placeholder="กรุณากรอกคำอธิบายหน่วยงาน (ไม่บังคับ)"
                  multiline
                  rows={3}
                  {...register("description", {
                    minLength: {
                      value: 5,
                      message: "คำอธิบายต้องมีความยาวอย่างน้อย 5 ตัวอักษร"
                    }
                  })}
                  error={!!errors.description}
                />
                {errors.description && (
                  <Typography color="error" sx={{ mt: 0.5, fontSize: 14 }}>
                    {errors.description.message}
                  </Typography>
                )}
              </Grid>

              {/* สถานะ */}
              <Grid item xs={12} sm={12}>
                <Typography
                  variant="body2"
                  color="#1120A3"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  สถานะ <span style={{ color: "red" }}>*</span>
                </Typography>
                <Controller
                  name="is_active"
                  control={control}
                  rules={{ required: "กรุณาเลือกสถานะ" }}
                  render={({ field: { value, onChange, ...field } }) => (
                    <SelectMenuService
                      {...field}
                      value={value || ""}
                      handleChange={(event) => {
                        onChange(event.target.value);
                      }}
                      options={statusOptions}
                      width="100%"
                      name="is_active"
                      placeholder="เลือกสถานะ"
                    />
                  )}
                />
                {errors.is_active && (
                  <Typography color="error" sx={{ mt: 0.5, fontSize: 14 }}>
                    {errors.is_active.message}
                  </Typography>
                )}
              </Grid>

              {/* ปุ่มบันทึกและยกเลิก */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <ButtonService
                    label="ยกเลิก"
                    variant="outlined"
                    color="#2499FF"
                    onClick={handleClose}
                    disabled={isSubmitting || loading}
                    sx={{
                      borderRadius: "15px",
                      height: "45px",
                      fontSize: "16px",
                      fontWeight: "bold",
                      minWidth: "120px",
                    }}
                  />
                  <ButtonService
                    label={isSubmitting ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                    color="บันทึก"
                    type="submit"
                    disabled={isSubmitting || loading}
                    sx={{
                      borderRadius: "15px",
                      height: "45px",
                      fontSize: "16px",
                      fontWeight: "bold",
                      minWidth: "120px",
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditDepartments_ExternalModal;