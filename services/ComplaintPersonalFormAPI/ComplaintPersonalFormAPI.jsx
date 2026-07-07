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
  const { control, unregister, reset, getValues } = methods || {};

  // ✅ เมื่อ formType เปลี่ยน → unregister field เก่า + reset form
  React.useEffect(() => {
    if (!control || !unregister || !reset || !getValues) return;
    const currentValues = getValues();
    const commonFields = {
      idCard: currentValues.idCard || "",
      address: currentValues.address || "",
      phone: currentValues.phone || "",
      email: currentValues.email || "",
      province: currentValues.province || null,
      districts: currentValues.districts || null,
      subdistricts: currentValues.subdistricts || null,
      zipcode: currentValues.zipcode || null,
    };
    const normalizedName = currentValues.name || currentValues.fullName || currentValues.companyName || currentValues.signatoryName || "";
    // Unregister ทุก name field ก่อน
    ["name", "fullName", "companyName", "signatoryName", "agencyName"].forEach(f => {
      try { unregister(f); } catch(e) {}
    });
    // Reset form ด้วยข้อมูลใหม่ตาม formType
    if (formType === "government") {
      reset({ ...commonFields, fullName: normalizedName, agencyName: currentValues.agencyName || "" });
    } else if (formType === "corporate") {
      reset({ ...commonFields, companyName: normalizedName });
    } else if (formType === "signer") {
      reset({ ...commonFields, signatoryName: normalizedName });
    } else {
      reset({ ...commonFields, name: normalizedName });
    }
  }, [formType]);

  // ถ้ามี data prop แต่ไม่มี form context ให้แสดงแบบ read-only
  const isReadOnly = !control && data && Object.keys(data).length > 0;

  const isCorporate = formType === "corporate";
  const isGovernment = formType === "government";
  const isSigner = formType === "signer";

  const idCardLabel = isCorporate ? "เลขทะเบียนนิติบุคคล" : "เลขบัตรประจำตัวประชาชน";

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
              label={idCardLabel}
            />
          </Grid>

          {isGovernment && (
            <Grid item xs={12} sm={6}>
              <InputText
                label="หน่วยงาน"
                placeholder="หน่วยงาน"
                value={data.agencyName || ""}
                disabled={true}
              />
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <InputText
              label={nameLabel}
              placeholder={nameLabel}
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
  // ✅ ใช้ key={formType} เพื่อบังคับ unmount/remount เมื่อ formType เปลี่ยน
  return (
    <Box>
      <Typography className={styles.title}>{title}</Typography>
      <Grid container spacing={2} key={formType}>
        <Grid item xs={12}>
          <Controller
            name="idCard"
            control={control}
            render={({ field }) => (
              <IDCardInput {...field} required disabled={dis} label={idCardLabel} />
            )}
          />
        </Grid>

        {isGovernment && (
          <Grid item xs={12} sm={6}>
            <Controller
              name="agencyName"
              control={control}
              render={({ field }) => (
                <InputText
                  label="หน่วยงาน"
                  placeholder="หน่วยงาน"
                  {...field}
                  required
                  disabled={dis}
                />
              )}
            />
          </Grid>
        )}

        <Grid item xs={12} sm={6}>
          <Controller
            key={`${formType}-name`}
            name={isGovernment ? "fullName" : isCorporate ? "companyName" : isSigner ? "signatoryName" : "name"}
            control={control}
            render={({ field }) => (
              <InputText
                label={isCorporate ? "ชื่อบริษัท" : isSigner ? "ชื่อผู้มีอำนาจลงนาม" : "ชื่อ - นามสกุล"}
                placeholder={isCorporate ? "ชื่อบริษัท" : isSigner ? "ชื่อผู้มีอำนาจลงนาม" : "ชื่อ - นามสกุล"}
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
                inputLabel="เลือกจังหวัด"
                value={field.value}
                onChange={field.onChange}
                name={field.name}
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
                inputLabel="เลือกอำเภอ/เขต"
                value={field.value}
                onChange={field.onChange}
                name={field.name}
                provinceCode={methods.watch("province")?.code || methods.watch("province")?.value}
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
                inputLabel="เลือกตำบล/แขวง"
                value={field.value}
                onChange={field.onChange}
                name={field.name}
                amphureCode={methods.watch("districts")?.code || methods.watch("districts")?.value}
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
                inputLabel="เลือกรหัสไปรษณีย์"
                value={field.value}
                onChange={field.onChange}
                name={field.name}
                amphureCode={methods.watch("districts")?.code || methods.watch("districts")?.value}
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
