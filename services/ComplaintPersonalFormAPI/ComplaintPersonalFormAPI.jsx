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

const ComplaintPersonalFormAPI = ({ title = "ข้อมูลผู้ร้องทุกข์", dis = false }) => {
  const { control } = useFormContext();

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
            name="name"
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
