import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useRegisterForm } from "@hooks/login/register/useRegisterForm";
import { IconButton } from "@mui/material";
import { formatCitizenId, formatPhoneNumber } from "@utils/Formats";
import styles from "./RegisterPage.module.scss";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { GetAllSelect } from "@pages/api/allselect/allselect";

export default function RegisterPage() {
  const { register, handleSubmit, errors, onSubmit, watch, setValue } =
    useRegisterForm();
  const [citizenIdDisplay, setCitizenIdDisplay] = useState("");
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [prefixOptions, setPrefixOptions] = useState([]);
  const prefix = watch("title_id"); // เปลี่ยนเป็น title_id เพื่อให้ตรงกับ API
  const router = useRouter();

  const handleBackToLogin = () => {
    router.push("/login");
  };

  const handleCitizenIdChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, "").slice(0, 13);
    const formatted = formatCitizenId(rawValue);
    setCitizenIdDisplay(formatted);
    setValue("citizen_id", rawValue);
  };

  const handlePhoneChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, "").slice(0, 10);
    const formatted = formatPhoneNumber(rawValue);
    setPhoneDisplay(formatted);
    setValue("phone", rawValue);
  };

  useEffect(() => {
    const fetchPrefixOptions = async () => {
      try {
        const response = await GetAllSelect();
        if (response && response.res_code === "0000") {
          setPrefixOptions(response.res_data);
        }
      } catch (error) {
        console.error("Error fetching prefix options:", error);
      }
    };

    fetchPrefixOptions();
  }, []);

  return (
    <div className={styles.container}>
      {/* Registration Form */}
      <div className={styles.registerBox}>
        <IconButton
          onClick={handleBackToLogin}
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            color: "grey.700",
          }}
        >
          <ArrowBackIosNewIcon />
        </IconButton>
        <h1 className={styles.registerTitle}>ลงทะเบียนเข้าสู่ระบบ</h1>
        <p className={styles.registerSubtitle}>สำหรับประชาชน</p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.registerForm}>
          {/* Citizen ID */}
          <label className={styles.inputLabel}>
            เลขบัตรประชาชน <span>*</span>
            {errors.citizen_id && (
              <span className={styles.errorText}>
                {errors.citizen_id.message}
              </span>
            )}
          </label>
          <input
            type="text"
            placeholder="x-xxxx-xxxxx-xx-x"
            value={citizenIdDisplay}
            onChange={handleCitizenIdChange}
            className={styles.inputField}
            autoComplete="off"
          />
          <input
            type="hidden"
            {...register("citizen_id", {
              required: "กรุณากรอกเลขบัตรประชาชน",
              pattern: {
                value: /^[0-9]{13}$/,
                message: "กรุณากรอกเลขบัตรประชาชนให้ถูกต้อง (13 หลัก)",
              },
            })}
          />

          {/* Prefix (Title) */}
          <label className={styles.inputLabel}>
            คำนำหน้า <span>*</span>
            {errors.title_id && (
              <span className={styles.errorText}>{errors.title_id.message}</span>
            )}
          </label>
          <select
            {...register("title_id", { required: "กรุณากรอกคำนำหน้า" })}
            className={styles.inputField}
            defaultValue=""
          >
            <option value="" disabled>
              -- กรุณาเลือก --
            </option>
            {prefixOptions.length > 0 &&
              prefixOptions.map((option) => (
                <option key={option.title_id} value={option.title_id}>
                  {option.title_name}
                </option>
              ))}
          </select>

          {prefix === "1" && (
            <>
              <label className={styles.inputLabel}>
                โปรดระบุคำนำหน้า <span>*</span>
                {errors.prefixOther && (
                  <span className={styles.errorText}>
                    {errors.prefixOther.message}
                  </span>
                )}
              </label>
              <input
                type="text"
                placeholder="กรอกคำนำหน้า"
                {...register("prefix_other", {
                  required: "กรุณาระบุคำนำหน้า",
                })}
                className={styles.inputField}
              />
            </>
          )}

          {/* First Name */}
          <label className={styles.inputLabel}>
            ชื่อ <span>*</span>
            {errors.first_name && (
              <span className={styles.errorText}>
                {errors.first_name.message}
              </span>
            )}
          </label>
          <input
            type="text"
            placeholder="กรอกชื่อจริง"
            {...register("first_name", { required: "กรุณากรอกชื่อ" })}
            className={styles.inputField}
          />

          {/* Last Name */}
          <label className={styles.inputLabel}>
            นามสกุล <span>*</span>
            {errors.last_name && (
              <span className={styles.errorText}>
                {errors.last_name.message}
              </span>
            )}
          </label>
          <input
            type="text"
            placeholder="กรอกนามสกุล"
            {...register("last_name", { required: "กรุณากรอกนามสกุล" })}
            className={styles.inputField}
          />

          {/* Email */}
          <label className={styles.inputLabel}>
            อีเมล <span>*</span>
            {errors.email && (
              <span className={styles.errorText}>{errors.email.message}</span>
            )}
          </label>
          <input
            type="email"
            placeholder="กรอกอีเมล"
            {...register("email", { required: "กรุณากรอกอีเมล" })}
            className={styles.inputField}
          />

          {/* Phone */}
          <label className={styles.inputLabel}>
            เบอร์โทรศัพท์ <span>*</span>
            {errors.phone && (
              <span className={styles.errorText}>{errors.phone.message}</span>
            )}
          </label>
          <input
            type="text"
            placeholder="xxx-xxx-xxxx"
            value={phoneDisplay}
            onChange={handlePhoneChange}
            className={styles.inputField}
            autoComplete="tel"
          />
          <input
            type="hidden"
            {...register("phone", {
              required: "กรุณากรอกเบอร์โทรศัพท์",
              pattern: {
                value: /^[0-9]{10}$/,
                message: "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (10 หลัก)",
              },
            })}
          />

          {/* Password */}
          <label className={styles.inputLabel}>
            รหัสผ่าน <span>*</span>
            {errors.password && (
              <span className={styles.errorText}>
                {errors.password.message}
              </span>
            )}
          </label>
          <div className={styles.passwordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="กรอกรหัสผ่าน"
              {...register("password", {
                required: "กรุณากรอกรหัสผ่าน",
                minLength: {
                  value: 8,
                  message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
                },
                validate: {
                  hasUpperCase: (value) =>
                    /[A-Z]/.test(value) || "ต้องมีอักษรตัวใหญ่ อย่างน้อย 1 ตัว",
                  hasSpecialChar: (value) =>
                    /[!@#$%^&*(),.?":{}|<>]/.test(value) ||
                    "ต้องมีอักขระพิเศษ อย่างน้อย 1 ตัว",
                },
              })}
              className={styles.inputField}
              autoComplete="password"
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className={styles.togglePassword}
            >
              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </span>
          </div>

          {/* Confirm Password */}
          <label className={styles.inputLabel}>
            ยืนยันรหัสผ่าน <span>*</span>
            {errors.confirmPassword && (
              <span className={styles.errorText}>
                {errors.confirmPassword.message}
              </span>
            )}
          </label>
          <div className={styles.passwordWrapper}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              {...register("confirmPassword", {
                required: "กรุณากรอกยืนยันรหัสผ่าน",
                validate: (value) =>
                  value === watch("password") || "รหัสผ่านไม่ตรงกัน",
              })}
              className={styles.inputField}
              autoComplete="password"
            />
            <span
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className={styles.togglePassword}
            >
              {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </span>
          </div>

          {/* Submit */}
          <button type="submit" className={styles.submitButton}>
            ยืนยันข้อมูล
          </button>
        </form>
      </div>
    </div>
  );
}
