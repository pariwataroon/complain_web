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
import styles from "./ComplaintPersonalForm.module.scss";

const districts = ["อำเภอ/เขต A", "อำเภอ/เขต B"];
const subdistricts = ["ตำบล/แขวง A", "ตำบล/แขวง B"];
const provinces = ["กรุงเทพมหานคร", "เชียงใหม่", "ภูเก็ต"];

const ComplaintPersonalForm = ({ data = {}, onChange, title = "ข้อมูลผู้ร้องทุกข์" }) => {
    const handleChange = (field) => (e) => {
        onChange(field, e.target.value);
    };

    return (
        <Box>
            <Typography className={styles.title}>{title}</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <IDCardInput
                        value={data.idCard}
                        onChange={(val) => onChange("idCard", val)}
                        required
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <InputText
                        label="ชื่อ - นามสกุล"
                        placeholder="ชื่อ - นามสกุล"
                        value={data.name}
                        onChange={handleChange("name")}
                        required
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <InputText
                        label="ที่อยู่ที่สามารถติดต่อได้"
                        placeholder="ที่อยู่ที่สามารถติดต่อได้"
                        value={data.address}
                        onChange={handleChange("address")}
                        required
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <InputPhone
                        label="หมายเลขโทรศัพท์"
                        placeholder="หมายเลขโทรศัพท์"
                        value={data.phone}
                        onChange={handleChange("phone")}
                        required
                    />
                </Grid>

                <Grid item xs={12} sm={3}>
                    <SelectField
                        label="ตำบล/แขวง"
                        value={data.subdistricts}
                        onChange={handleChange("subdistricts")}
                        options={subdistricts}
                        required
                    />
                </Grid>

                <Grid item xs={12} sm={3}>
                    <SelectField
                        label="อำเภอ/เขต"
                        value={data.districts}
                        onChange={handleChange("districts")}
                        options={districts}
                        required
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <InputText
                        label="อีเมล"
                        placeholder="อีเมล"
                        value={data.email}
                        onChange={handleChange("email")}
                        required
                    />
                </Grid>

                <Grid item xs={12} sm={3}>
                    <SelectField
                        label="จังหวัด"
                        value={data.province}
                        onChange={handleChange("province")}
                        options={provinces}
                        required
                    />
                </Grid>

                <Grid item xs={12} sm={3}>
                    <InputZipcode
                        label="รหัสไปรษณีย์"
                        placeholder="รหัสไปรษณีย์"
                        value={data.zipcode}
                        onChange={handleChange("zipcode")}
                        required
                    />
                </Grid>
            </Grid>
        </Box>
    );
};


export default ComplaintPersonalForm;
