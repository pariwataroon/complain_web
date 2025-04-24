import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Button,
  Grid,
} from "@mui/material";
import TextfieldService from "@services/TextfieldService/TextfieldService";
import SelectMenuService from "@services/SelectMenu/SelectMenu";
import useCRUDFormUsers from "@hooks/admin/setting/useCRUDFormUsers";
import ComplaintPersonalForm from "@services/ComplaintPersonal/ComplaintPersonalForm";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";



const AddUserModal = ({ open, onClose }) => {
  const { register, handleSubmit, setValue, errors, onSubmit, isSubmitting } = useCRUDFormUsers();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "16px",
          width: "100%",
          maxWidth: "1200px",
          height: "80%",
          maxHeight: "700px",
          backgroundColor: "#FFFFFF",
        },
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(0, 0, 0, 0.3)",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: "bold",
          fontSize: "24px",
          textAlign: "center",
          mb: 2,
        }}
      >
        เพิ่มข้อมูลผู้ใช้งาน
      </DialogTitle>
      <DialogContent sx={{ padding: "30px" }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            {/* Row 1: Username, Password, Profile Image */}
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="#1120A3" sx={{ fontWeight: "bold" }}>
                Username
              </Typography>
              <TextfieldService
                fullWidth
                placeholder="กรุณากรอกชื่อผู้ใช้งาน"
                {...register("username", { required: "กรุณากรอกชื่อผู้ใช้งาน" })}
              />
              {errors.username && <Typography color="error">{errors.username.message}</Typography>}
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="#1120A3" sx={{ fontWeight: "bold" }}>
                Password
              </Typography>
              <TextfieldService
                fullWidth
                placeholder="กรุณากรอกรหัสผ่าน"
                type="password"
                {...register("password", { required: "กรุณากรอกรหัสผ่าน" })}              
              />
              {errors.password && <Typography color="error">{errors.password.message}</Typography>}
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="#1120A3" sx={{ fontWeight: "bold" }}>
                ชื่อผู้ใช้งาน
              </Typography>
              <TextfieldService
                fullWidth
                placeholder="กรุณากรอกชื่อผู้ใช้งาน"
                {...register("full_name", { required: "กรุณากรอกชื่อผู้ใช้งาน" })}
              />
              {errors.full_name && <Typography color="error">{errors.full_name.message}</Typography>}
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="#1120A3" sx={{ fontWeight: "bold" }}>
                กลุ่มสิทธิ์
              </Typography>
              <SelectMenuService
                placeholder="กลุ่มผู้ใช้งาน"
                {...register("group", { required: "กรุณาเลือกกลุ่มผู้ใช้งาน" })}
                options={[
                  { value: "admin", label: "ผู้ดูแลระบบ" },
                  { value: "public", label: "ประชาชน" },
                  { value: "executive", label: "ผู้บริหาร" },
                ]}
              />
              {errors.group && <Typography color="error">{errors.group.message}</Typography>}
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="#1120A3" sx={{ fontWeight: "bold" }}>
                ตำแหน่ง
              </Typography>
              <TextfieldService
                fullWidth
                placeholder="ตำแหน่ง"
                {...register("role", { required: "กรุณากรอกตำแหน่ง" })}
              />
              {errors.role && <Typography color="error">{errors.role.message}</Typography>}
            </Grid>
            <Grid item xs={4} sm={4}>
              <Typography variant="body2" color="#1120A3" sx={{ fontWeight: "bold" }}>
                รูปโปรไฟล์
              </Typography>
              <Button variant="outlined" fullWidth>
                เพิ่มรูปภาพ
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={8}>
              <ComplaintPersonalForm
                title="ข้อมูลผู้ใช้เพิ่มเติม"
                required
              />
            </Grid>
              <Grid item xs={12} sm={6} md={4} sx={{ paddingTop: "20px", marginTop: "130px" }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <InputText
                    label="ที่อยู่ที่สามารถติดต่อได้"
                    placeholder="ที่อยู่ที่สามารถติดต่อได้"
                    required
                    {...register("address", { required: "กรุณากรอกที่อยู่ที่สามารถติดต่อได้" })}
                  />
                  {errors.address && <Typography color="error">{errors.address.message}</Typography>}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <SelectField
                    label="ตำบล/แขวง"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <SelectField
                    label="อำเภอ/เขต"
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <SelectField
                    label="จังหวัด"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InputText
                    label="รหัสไปรษณีย์"
                    placeholder="รหัสไปรษณีย์"
                    required
                    {...register("postal_code ", { required: "กรุณากรอกรหัสไปรษณีย์" })}
                  />
                  {errors.postal_code && <Typography color="error">{errors.postal_code.message}</Typography>}
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={onClose}
              >
                ยกเลิก
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                type="submit"
                disabled={isSubmitting}
              >
                ยืนยัน
              </Button>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserModal;
