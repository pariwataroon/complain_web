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
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="#1120A3" sx={{ fontWeight: "bold" }}>
                Username
              </Typography>
              <TextfieldService
                fullWidth
                placeholder="Username"
                {...register("username", { required: "Username is required" })}
              />
              {errors.username && <Typography color="error">{errors.username.message}</Typography>}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="#1120A3" sx={{ fontWeight: "bold" }}>
                Password
              </Typography>
              <TextfieldService
                fullWidth
                placeholder="Password"
                type="password"
                {...register("password", { required: "Password is required" })}
              />
              {errors.password && <Typography color="error">{errors.password.message}</Typography>}
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="#1120A3" sx={{ fontWeight: "bold" }}>
                รูปโปรไฟล์
              </Typography>
              <Button variant="outlined" fullWidth>
                เพิ่มรูปภาพ
              </Button>
            </Grid>

            {/* Row 2: Full Name, Group, ID Card */}
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="#1120A3" sx={{ fontWeight: "bold" }}>
                ชื่อ - นามสกุล
              </Typography>
              <TextfieldService
                fullWidth
                placeholder="ชื่อ - นามสกุล"
                {...register("fullName", { required: "Full name is required" })}
              />
              {errors.fullName && <Typography color="error">{errors.fullName.message}</Typography>}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="#1120A3" sx={{ fontWeight: "bold" }}>
                กลุ่มสิทธิ์
              </Typography>
              <SelectMenuService
                placeholder="กลุ่มผู้ใช้งาน"
                {...register("group", { required: "Group is required" })}
                options={[
                  { value: "admin", label: "ผู้ดูแลระบบ" },
                  { value: "public", label: "ประชาชน" },
                  { value: "executive", label: "ผู้บริหาร" },
                ]}
              />
              {errors.group && <Typography color="error">{errors.group.message}</Typography>}
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="#1120A3" sx={{ fontWeight: "bold" }}>
                เลขบัตรประชาชน
              </Typography>
              <TextfieldService
                fullWidth
                placeholder="เลขบัตรประชาชน"
                {...register("idCard", { required: "ID Card is required" })}
              />
              {errors.idCard && <Typography color="error">{errors.idCard.message}</Typography>}
            </Grid>

            {/* Row 3: Phone, Email, Address */}
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="#1120A3" sx={{ fontWeight: "bold" }}>
                หมายเลขโทรศัพท์
              </Typography>
              <TextfieldService
                fullWidth
                placeholder="หมายเลขโทรศัพท์"
                {...register("phone", { required: "Phone number is required" })}
              />
              {errors.phone && <Typography color="error">{errors.phone.message}</Typography>}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="#1120A3" sx={{ fontWeight: "bold" }}>
                อีเมล
              </Typography>
              <TextfieldService
                fullWidth
                placeholder="อีเมล"
                {...register("email", { required: "Email is required" })}
              />
              {errors.email && <Typography color="error">{errors.email.message}</Typography>}
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="#1120A3" sx={{ fontWeight: "bold" }}>
                ที่อยู่
              </Typography>
              <TextfieldService
                fullWidth
                placeholder="ที่อยู่"
                {...register("address", { required: "Address is required" })}
              />
              {errors.address && <Typography color="error">{errors.address.message}</Typography>}
            </Grid>

            {/* Row 4: District, Zipcode */}
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="#1120A3" sx={{ fontWeight: "bold" }}>
                อำเภอ/เขต
              </Typography>
              <TextfieldService
                fullWidth
                placeholder="อำเภอ/เขต"
                {...register("district", { required: "District is required" })}
              />
              {errors.district && <Typography color="error">{errors.district.message}</Typography>}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="#1120A3" sx={{ fontWeight: "bold" }}>
                รหัสไปรษณีย์
              </Typography>
              <TextfieldService
                fullWidth
                placeholder="รหัสไปรษณีย์"
                {...register("zipcode", { required: "Zipcode is required" })}
              />
              {errors.zipcode && <Typography color="error">{errors.zipcode.message}</Typography>}
            </Grid>

            {/* Action Buttons */}
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
