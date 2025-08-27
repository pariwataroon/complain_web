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
import { CreateOutsideDepartment } from "@pages/api/outsideDepartments/outsideDepartments";

const AddDepartments_ExternalModal = ({ open, onClose, onSuccess }) => {
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
      is_active: "true", // default เป็น active
    },
  });

  const statusOptions = [
    { value: "true", label: "ใช้งาน" },
    { value: "false", label: "ไม่ใช้งาน" },
  ];

  const onSubmit = async (data) => {
    try {
      const isConfirmed = await showConfirm(
        "ยืนยันการเพิ่มข้อมูล",
        "คุณต้องการเพิ่มกลุ่มหน่วยงานภายนอกใหม่นี้ใช่หรือไม่?",
        "ยืนยัน",
        "ยกเลิก"
      );

      if (!isConfirmed) {
        return;
      }

      setIsSubmitting(true);

      // จัดรูปแบบข้อมูลตาม API body ที่ต้องการ
      const formattedData = {
        name: data.name.trim(),
        description: data.description.trim(),
        is_active: data.is_active === "true",
      };

      console.log("Sending data to API:", formattedData);

      const result = await CreateOutsideDepartment(formattedData);

      if (result && (result.res_code === "0000" || result.res_code === "0001")) {
        await alertSuccess("สำเร็จ", "เพิ่มกลุ่มหน่วยงานภายนอกสำเร็จ");
        reset();
        onSuccess();
      } else if (result && result.res_code === "4090") {
        await alertWarning("ข้อมูลซ้ำ", "กลุ่มหน่วยงานนี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น");
      } else {
        console.error("Error submitting the data", result?.res_message || result?.res_desc || "Unknown error");
        await alertError(
          "เกิดข้อผิดพลาด",
          result?.res_message || result?.res_desc || "ไม่สามารถเพิ่มกลุ่มหน่วยงานได้"
        );
      }
    } catch (error) {
      console.error("Error adding department:", error);
      await alertError(
        "เกิดข้อผิดพลาด",
        error.message || "ไม่สามารถเพิ่มกลุ่มหน่วยงานได้"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ฟังก์ชันสำหรับปิด Modal
  const handleClose = async () => {
    if (isSubmitting) {
      return;
    }

    const formData = getValues();
    const hasData = Object.values(formData).some(
      (value) => value && value.toString().trim() !== "" && value !== "true"
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
        เพิ่มกลุ่มหน่วยงานภายนอก
      </DialogTitle>

      <DialogContent
        sx={{
          padding: 4,
          backgroundColor: "#ffffff",
        }}
      >
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
                  label={isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
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

export default AddDepartments_ExternalModal;