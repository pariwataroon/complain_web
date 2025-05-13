import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Button,
  Grid,
} from "@mui/material";
import { Controller } from "react-hook-form";
import TextfieldService from "@services/TextfieldService/TextfieldService";
import SelectMenuService from "@services/SelectMenu/SelectMenu";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import IDCardInput from "@services/IDCardInput/IDCardInput";
import InputPhone from "@services/InputPhone/InputPhone";
import useCRUDFormUsers from "@hooks/admin/setting/useCRUDFormUsers";
import styles from "./AddUserModal.module.scss";


const AddUserModal = ({ open, onClose }) => {
  const {
    register,
    handleSubmit,
    control,
    errors,
    onSubmit,
    watch,
    isSubmitting,
    setValue,
  } = useCRUDFormUsers();

  const provinceCode = watch("province")?.value;
  const amphureCode = watch("districts")?.value;

  const provinceCode2 = watch("province2")?.value;
  const amphureCode2 = watch("districts2")?.value;

  const syncAddress = watch("syncAddress");

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
  }, [syncAddress]);
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold", fontSize: 24, textAlign: "center", mb: 2 }}>
        เพิ่มข้อมูลผู้ใช้งาน
      </DialogTitle>
      <DialogContent sx={{ padding: 4 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            {/* Row 1 */}
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="#1120A3" sx={{ fontWeight: "bold" }}>Username</Typography>
              <TextfieldService fullWidth placeholder="กรุณากรอกชื่อผู้ใช้งาน" {...register("username", { required: "กรุณากรอกชื่อผู้ใช้งาน" })} />
              {errors.username && <Typography color="error">{errors.username.message}</Typography>}
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="#1120A3" sx={{ fontWeight: "bold" }}>Password</Typography>
              <TextfieldService fullWidth type="password" placeholder="กรุณากรอกรหัสผ่าน" {...register("password", { required: "กรุณากรอกรหัสผ่าน" })} />
              {errors.password && <Typography color="error">{errors.password.message}</Typography>}
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="#1120A3" sx={{ fontWeight: "bold" }}>ชื่อผู้ใช้งาน</Typography>
              <TextfieldService fullWidth placeholder="กรุณากรอกชื่อผู้ใช้งาน" {...register("full_name", { required: "กรุณากรอกชื่อผู้ใช้งาน" })} />
              {errors.full_name && <Typography color="error">{errors.full_name.message}</Typography>}
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="#1120A3" sx={{ fontWeight: "bold" }}>กลุ่มสิทธิ์</Typography>
              <Controller
                name="group"
                control={control}
                rules={{ required: "กรุณาเลือกกลุ่มผู้ใช้งาน" }}
                render={({ field }) => (
                  <SelectMenuService
                    {...field}
                    placeholder="กลุ่มผู้ใช้งาน"
                    options={[
                      { value: "admin", label: "ผู้ดูแลระบบ" },
                      { value: "public", label: "ประชาชน" },
                      { value: "executive", label: "ผู้บริหาร" },
                    ]}
                  />
                )}
              />
              {errors.group && <Typography color="error">{errors.group.message}</Typography>}
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="#1120A3" sx={{ fontWeight: "bold" }}>ตำแหน่ง</Typography>
              <TextfieldService fullWidth placeholder="ตำแหน่ง" {...register("role", { required: "กรุณากรอกตำแหน่ง" })} />
              {errors.role && <Typography color="error">{errors.role.message}</Typography>}
            </Grid>

            <Grid item xs={4} sm={4}>
              <Typography variant="body2" color="#1120A3" sx={{ fontWeight: "bold" }}>รูปโปรไฟล์</Typography>
              <Button variant="outlined" fullWidth>
                เพิ่มรูปภาพ
              </Button>
            </Grid>

            <Grid item xs={12} sm={6} md={7}>
              <Box>
                <Typography className={styles.title}>ข้อมูลผู้ใช้เพิ่มเติม</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller name="idCard" control={control} render={({ field }) => <IDCardInput {...field} />} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputText label="ชื่อ - นามสกุล" placeholder="ชื่อ - นามสกุล" {...register("name", { required: "กรุณากรอกชื่อ - นามสกุล" })} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputText label="ที่อยู่ที่ตามบัตรประชาชน" placeholder="ที่อยู่ที่ตามบัตรประชาชน" {...register("address", { required: "กรุณากรอกที่อยู่" })} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller name="phone" control={control} render={({ field }) => <InputPhone {...field} />} />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Controller name="province" control={control} render={({ field }) => <SelectField label="จังหวัด" {...field} />} />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Controller
                      name="districts"
                      control={control}
                      render={({ field }) => (
                        <SelectField
                          label="อำเภอ/เขต"
                          provinceCode={provinceCode}
                          {...field}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputText label="อีเมล" placeholder="อีเมล" {...register("email", { required: "กรุณากรอกอีเมล" })} />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Controller
                      name="subdistricts"
                      control={control}
                      render={({ field }) => (
                        <SelectField
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
                        <SelectField
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
              <Box sx={{ height: "100%", width: "1px", backgroundColor: "#ccc", margin: "0 auto" }} />
            </Grid>
            
            <Grid item xs={12} sm={6} md={4} sx={{ paddingTop: "20px", marginTop: "130px" }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <InputText label="ที่อยู่ที่สามารถติดต่อได้" placeholder="ที่อยู่ที่สามารถติดต่อได้" {...register("address2", { required: "กรุณากรอกที่อยู่" })} />
                  {errors.address2 && <Typography color="error">{errors.address2.message}</Typography>}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="province2" control={control} render={({ field }) => <SelectField label="จังหวัด" {...field} />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="districts2"
                    control={control}
                    render={({ field }) => (
                      <SelectField
                        label="อำเภอ/เขต"
                        provinceCode={provinceCode2}
                        {...field}
                      />
                    )}
                  />                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="subdistricts2"
                    control={control}
                    render={({ field }) => (
                      <SelectField
                        label="ตำบล/แขวง"
                        amphureCode={amphureCode2}
                        {...field}
                      />
                    )}
                  />                  </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="zipcode2"
                    control={control}
                    render={({ field }) => (
                      <SelectField
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
                <label style={{ display: "flex", alignItems: "center", fontSize: 14, color: "#1120A3" }}>
                  <input type="checkbox" {...register("syncAddress")} style={{ marginRight: 8 }} />
                  ที่อยู่ตรงตามบัตรประชาชน
                </label>
              </Box>
            </Grid>
           
            <Grid item xs={12} sm={6}>
              <Button variant="outlined" color="primary" fullWidth onClick={onClose}>
                ยกเลิก
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button variant="contained" color="primary" fullWidth type="submit" disabled={isSubmitting}>
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