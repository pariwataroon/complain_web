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
import styles from "./ComplaintCustomerForm.module.scss";


const ComplaintCustomerForm = ({ data = {}, onChange, title = "ข้อมูลผู้ร้องทุกข์" }) => {
    const handleChange = (field) => (e) => {
        onChange(field, e.target.value);
    };

    return (
        <Box>
            <Typography className={styles.title}>{title}</Typography>
            <Grid container spacing={2}>
               

                <Grid item xs={12} sm={6}>
                    <InputText
                        label="ชื่อบริษัท"
                        value={data.companyName}
                        onChange={handleChange("companyName")}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <InputText
                        label="ชื่อผู้มีอำนาจลงนาม"
                        value={data.signatoryName}
                        onChange={handleChange("signatoryName")}
                    />
                </Grid>


                <Grid item xs={12} sm={6}>
                    <InputText
                        label="ที่อยู่บริษัท"
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
                        label="จังหวัด"
                        value={data.province}
                        onChange={handleChange("province")}
                        required
                    />
                </Grid>

                <Grid item xs={12} sm={3}>
                    <SelectField
                        label="อำเภอ/เขต"
                        value={data.districts}
                        provinceCode={data.province?.value}
                        onChange={handleChange("districts")}
                        required
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
                        label="ตำบล/แขวง"
                        value={data.subdistricts}
                        amphureCode={data.districts?.value}
                        onChange={handleChange("subdistricts")}
                        required
                    />
                </Grid>

                <Grid item xs={12} sm={3}>
                    <SelectField
                        label="รหัสไปรษณีย์"
                        value={data.zipcode}
                        amphureCode={data.districts?.value}
                        onChange={handleChange("zipcode")}
                        optionMapper={(item) => ({
                            value: item.zip_code,
                            label: String(item.zip_code),
                        })}
                        required
                    />
                </Grid>
            </Grid>
        </Box>
    );
};


export default ComplaintCustomerForm;
