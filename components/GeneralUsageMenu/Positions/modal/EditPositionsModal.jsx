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
import { GetPositionByID, UpdatePosition } from "@pages/api/positions/positions";

const EditPositionsModal = ({ open, onClose, editingItem, onSuccess }) => {
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
      level: "",
      is_active: "true",
    },
  });

  // ตัวเลือกระดับตำแหน่ง
  const levelOptions = [
    { value: "บริหารระดับต้น", label: "บริหารระดับต้น" },
    { value: "บริหารระดับสูง", label: "บริหารระดับสูง" },
    { value: "อำนวยการระดับสูง", label: "อำนวยการระดับสูง" },
    { value: "ชำนาญการ", label: "ชำนาญการ" },
    { value: "ปฏิบัติการ", label: "ปฏิบัติการ" },
    { value: "ชำนาญการพิเศษ", label: "ชำนาญการพิเศษ" },
  ];

  const statusOptions = [
    { value: "true", label: "ใช้งาน" },
    { value: "false", label: "ไม่ใช้งาน" },
  ];

  // โหลดข้อมูลจาก API เมื่อเปิด modal และมี editingItem
  useEffect(() => {
    const fetchPositionData = async () => {
      if (open && editingItem?.id) {
        setLoading(true);
        try {
          console.log('Fetching position data for ID:', editingItem.id);
          const result = await GetPositionByID(editingItem.id);

          if (result && (result.res_code === "0000" || result.res_code === "0001")) {
            const positionData = result.res_data;
            console.log('Position data loaded:', positionData);

            // Set ข้อมูลลงใน form
            setValue("name", positionData.name || "");
            setValue("description", positionData.description || "");
            setValue("level", positionData.level || "");
            setValue("is_active", positionData.is_active ? "true" : "false");
          } else {
            console.error('Failed to load position data:', result);
            await alertError(
              "เกิดข้อผิดพลาด",
              "ไม่สามารถโหลดข้อมูลตำแหน่งได้"
            );
            onClose();
          }
        } catch (error) {
          console.error("Error fetching position:", error);
          await alertError("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลได้");
          onClose();
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPositionData();
  }, [open, editingItem, setValue, onClose]);

  // รีเซ็ตฟอร์มเมื่อปิด modal
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data) => {
    try {
      const isConfirmed = await showConfirm(
        "ยืนยันการแก้ไข",
        "คุณต้องการแก้ไขตำแหน่งนี้ใช่หรือไม่?",
        "ยืนยัน",
        "ยกเลิก"
      );

      if (!isConfirmed) {
        return;
      }

      setIsSubmitting(true);

      // จัดรูปแบบข้อมูลก่อนส่ง API
      const formattedData = {
        name: data.name.trim(),
        description: data.description.trim(),
        level: data.level,
        is_active: data.is_active === "true",
      };


      const result = await UpdatePosition(editingItem.id, formattedData);

      if (result && (result.res_code === "0000" || result.res_code === "0002")) {
        await alertSuccess("สำเร็จ", "แก้ไขตำแหน่งสำเร็จ");
        reset();
        onSuccess();
      } else if (result && result.res_code === "4090") {
        await alertWarning("ข้อมูลซ้ำ", "ชื่อตำแหน่งนี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น");
      } else {
        console.error("Error updating position:", result?.res_message || result?.res_desc || "Unknown error");
        await alertError(
          "เกิดข้อผิดพลาด",
          result?.res_message || result?.res_desc || "ไม่สามารถแก้ไขตำแหน่งได้"
        );
      }
    } catch (error) {
      console.error("Error updating position:", error);
      await alertError(
        "เกิดข้อผิดพลาด",
        error.message || "ไม่สามารถแก้ไขตำแหน่งได้"
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
      return currentValue && currentValue.toString().trim() !== "";
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
        แก้ไขข้อมูลตำแหน่ง
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
              {/* ชื่อตำแหน่ง */}
              <Grid item xs={12}>
                <Typography
                  variant="body2"
                  color="#1120A3"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  ชื่อตำแหน่ง <span style={{ color: "red" }}>*</span>
                </Typography>
                <InputText
                  placeholder="กรุณากรอกชื่อตำแหน่ง"
                  {...register("name", {
                    required: "กรุณากรอกชื่อตำแหน่ง",
                    minLength: {
                      value: 2,
                      message: "ชื่อตำแหน่งต้องมีความยาวอย่างน้อย 2 ตัวอักษร"
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
                  คำอธิบาย <span style={{ color: "red" }}>*</span>
                </Typography>
                <InputText
                  placeholder="กรุณากรอกคำอธิบายตำแหน่ง"
                  multiline
                  rows={3}
                  {...register("description", {
                    required: "กรุณากรอกคำอธิบาย",
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

              {/* ระดับตำแหน่ง */}
              <Grid item xs={12} sm={12}>
                <Typography
                  variant="body2"
                  color="#1120A3"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  ระดับตำแหน่ง <span style={{ color: "red" }}>*</span>
                </Typography>
                <InputText
                  placeholder="กรุณากรอกคำอธิบายตำแหน่ง"
                  multiline
                  rows={3}
                  {...register("level", {
                    required: "กรุณากรอกคำอธิบาย",
                    minLength: {
                      value: 5,
                      message: "คำอธิบายต้องมีความยาวอย่างน้อย 5 ตัวอักษร"
                    }
                  })}
                  error={!!errors.level}
                />
                {errors.level && (
                  <Typography color="error" sx={{ mt: 0.5, fontSize: 14 }}>
                    {errors.level.message}
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

export default EditPositionsModal;