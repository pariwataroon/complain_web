import React, { useState } from "react";
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
import { CreatePosition } from "@pages/api/positions/positions";

const AddPositionsModal = ({ open, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    getValues,
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      level: "",
      is_active: "true", // default เป็น active
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

  const onSubmit = async (data) => {
    try {
      const isConfirmed = await showConfirm(
        "ยืนยันการเพิ่มข้อมูล",
        "คุณต้องการเพิ่มตำแหน่งใหม่นี้ใช่หรือไม่?",
        "ยืนยัน",
        "ยกเลิก"
      );

      if (!isConfirmed) {
        return;
      }

      setIsSubmitting(true);

      const formattedData = {
        name: data.name.trim(),
        description: data.description.trim(),
        level: data.level,
        is_active: data.is_active === "true",
      };


      const result = await CreatePosition(formattedData);

      if (result && (result.res_code === "0000" || result.res_code === "0001")) {
        await alertSuccess("สำเร็จ", "เพิ่มตำแหน่งใหม่สำเร็จ");
        reset();
        onSuccess();
      } else if (result && result.res_code === "4090") {
        await alertWarning("ข้อมูลซ้ำ", "ตำแหน่งนี้มีอยู่ในระบบแล้ว");
      } else {
        console.error("Error submitting the data", result?.res_message || result?.res_desc || "Unknown error");
        await alertError(
          "เกิดข้อผิดพลาด",
          result?.res_message || result?.res_desc || "ไม่สามารถเพิ่มตำแหน่งได้"
        );
      }
    } catch (error) {
      console.error("Error adding position:", error);
      await alertError(
        "เกิดข้อผิดพลาด",
        error.message || "ไม่สามารถเพิ่มตำแหน่งได้"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ฟังก์ชันสำหรับปิด Modal
  const handleClose = async () => {
    const formData = getValues();
    const hasData = Object.values(formData).some(
      (value) => value && value.toString().trim() !== ""
    );

    if (hasData) {
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
        เพิ่มตำแหน่งใหม่
      </DialogTitle>

      <DialogContent
        sx={{
          padding: 4,
          backgroundColor: "#ffffff",
        }}
      >
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
                  disabled={isSubmitting}
                  sx={{
                    borderRadius: "15px",
                    height: "45px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    minWidth: "120px",
                  }}
                />
                <ButtonService
                  label="บันทึก"
                  color="บันทึก"
                  type="submit"
                  disabled={isSubmitting}
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
      </DialogContent>
    </Dialog>
  );
};

export default AddPositionsModal;