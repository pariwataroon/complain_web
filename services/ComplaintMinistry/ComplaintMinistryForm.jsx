import React from "react";
import {
    Box,
    Grid,
    Typography,
} from "@mui/material";
import IDCardInput from "@services/IDCardInput/IDCardInput";
import InputText from "@services/InputText/InputText";
import InputPhone from "@services/InputPhone/InputPhone";
import SelectField from "@services/SelectField/SelectField";
import InputZipcode from "@services/InputZipcode/InputZipcode";
import styles from "./ComplaintMinistryForm.module.scss";

const districts = ["อำเภอ/เขต A", "อำเภอ/เขต B"];
const subdistricts = ["ตำบล/แขวง A", "ตำบล/แขวง B"];
const provinces = ["กรุงเทพมหานคร", "เชียงใหม่", "ภูเก็ต"];

const ComplaintMinistryForm = ({ data = {}, onChange, title = "ข้อมูลผู้ร้องทุกข์" }) => {
    const handleChange = (field) => (e) => {
        onChange(field, e.target.value);
    };

    return (
        <Box>
            <Typography className={styles.title}>{title}</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <IDCardInput
                        value={data.idCard || ""}
                        onChange={(val) => onChange("idCard", val)}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <InputText
                        label="หน่วยงาน"
                        value={data.agencyName}
                        onChange={handleChange("agencyName")}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <InputText
                        label="ชื่อ - นามสกุล"
                        value={data.fullName}
                        onChange={handleChange("fullName")}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <InputText
                        label="ที่อยู่ที่สามารถติดต่อได้"
                        value={data.address}
                        onChange={handleChange("address")}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <InputPhone
                        label="หมายเลขโทรศัพท์"
                        value={data.phone}
                        onChange={handleChange("phone")}
                    />
                </Grid>

                <Grid item xs={12} sm={3}>
                    <SelectField
                        label="ตำบล/แขวง"
                        value={data.subdistricts}
                        onChange={handleChange("subdistricts")}
                        options={subdistricts}
                    />
                </Grid>

                <Grid item xs={12} sm={3}>
                    <SelectField
                        label="อำเภอ/เขต"
                        value={data.districts}
                        onChange={handleChange("districts")}
                        options={districts}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <InputText
                        label="อีเมล"
                        value={data.email}
                        onChange={handleChange("email")}
                    />
                </Grid>

                <Grid item xs={12} sm={3}>
                    <SelectField
                        label="จังหวัด"
                        value={data.province}
                        onChange={handleChange("province")}
                        options={provinces}
                    />
                </Grid>

                <Grid item xs={12} sm={3}>
                    <InputZipcode
                        label="รหัสไปรษณีย์"
                        value={data.zipcode}
                        onChange={handleChange("zipcode")}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default ComplaintMinistryForm;
