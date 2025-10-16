import React from "react";
import {
  Box,
  Grid,
  Typography,
} from "@mui/material";
import { useFormContext, Controller } from "react-hook-form";
import IDCardInput from "@services/IDCardInput/IDCardInput";
import InputText from "@services/InputText/InputText";
import InputPhone from "@services/InputPhone/InputPhone";
import SelectFieldAPI from "@services/SelectFieldAPI/SelectFieldAPI";
import styles from "./ComplaintPersonalFormAPI.module.scss";

const ComplaintPersonalFormAPI = ({
  title = "ข้อมูลผู้ร้องทุกข์",
  dis = false,
  formType = "individual",
  data = {}
}) => {
  const methods = useFormContext();
  const { control } = methods || {};

  // ถ้ามี data prop แต่ไม่มี form context ให้แสดงแบบ read-only
  const isReadOnly = !control && data && Object.keys(data).length > 0;

  console.log('🔍 ComplaintPersonalFormAPI render:', { formType, dataKeys: Object.keys(data), isReadOnly });

  // สำหรับ government form ให้ใช้ fullName แทน name
  const nameFieldKey = formType === "government" ? "fullName" : "name";
  const nameValue = formType === "government" ? data.fullName : data.name;

  console.log('🔍 Name field mapping:', { formType, nameFieldKey, nameValue });

  if (isReadOnly) {
    // แสดงข้อมูลแบบ read-only
    return (
      <Box>
        <Typography className={styles.title}>{title}</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <IDCardInput
              value={data.idCard || ""}
              disabled={true}
              label="เลขบัตรประจำตัวประชาชน"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <InputText
              label="ชื่อ - นามสกุล"
              placeholder="ชื่อ - นามสกุล"
              value={nameValue || ""}
              disabled={true}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <InputText
              label="ที่อยู่ที่สามารถติดต่อได้"
              placeholder="ที่อยู่ที่สามารถติดต่อได้"
              value={data.address || ""}
              disabled={true}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <InputPhone
              label="หมายเลขโทรศัพท์"
              placeholder="หมายเลขโทรศัพท์"
              value={data.phone || ""}
              disabled={true}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <SelectFieldAPI
              label="จังหวัด"
              value={data.province || ""}
              disabled={true}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <SelectFieldAPI
              label="อำเภอ/เขต"
              value={data.districts || ""}
              disabled={true}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <InputText
              label="อีเมล"
              placeholder="อีเมล"
              value={data.email || ""}
              disabled={true}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <SelectFieldAPI
              label="ตำบล/แขวง"
              value={data.subdistricts || ""}
              disabled={true}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <SelectFieldAPI
              label="รหัสไปรษณีย์"
              value={data.zipcode || ""}
              disabled={true}
            />
          </Grid>
        </Grid>
      </Box>
    );
  }

  // แสดงแบบใช้ react-hook-form (สำหรับการแก้ไข)
  return (
    <Box>
      <Typography className={styles.title}>{title}</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Controller
            name="idCard"
            control={control}
            render={({ field }) => (
              <IDCardInput {...field} required disabled={dis} />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name={nameFieldKey}
            control={control}
            render={({ field }) => (
              <InputText
                label="ชื่อ - นามสกุล"
                placeholder="ชื่อ - นามสกุล"
                {...field}
                required
                disabled={dis}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <InputText
                label="ที่อยู่ที่สามารถติดต่อได้"
                placeholder="ที่อยู่ที่สามารถติดต่อได้"
                {...field}
                required
                disabled={dis}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <InputPhone
                label="หมายเลขโทรศัพท์"
                placeholder="หมายเลขโทรศัพท์"
                {...field}
                required
                disabled={dis}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <Controller
            name="province"
            control={control}
            render={({ field }) => (
              <SelectFieldAPI
                label="จังหวัด"
                value={field.value}
                disabled={dis}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <Controller
            name="districts"
            control={control}
            render={({ field }) => (
              <SelectFieldAPI
                label="อำเภอ/เขต"
                value={field.value}
                disabled={dis}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <InputText
                label="อีเมล"
                placeholder="อีเมล"
                {...field}
                required
                disabled={dis}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <Controller
            name="subdistricts"
            control={control}
            render={({ field }) => (
              <SelectFieldAPI
                label="ตำบล/แขวง"
                value={field.value}
                disabled={dis}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <Controller
            name="zipcode"
            control={control}
            render={({ field }) => (
              <SelectFieldAPI
                label="รหัสไปรษณีย์"
                value={field.value}
                disabled={dis}
              />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ComplaintPersonalFormAPI;
