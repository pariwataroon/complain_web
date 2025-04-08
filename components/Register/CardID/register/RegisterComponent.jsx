import React, { useState } from "react";
import { useRouter } from "next/router";
import { useRegisterForm } from "@hooks/login/register/useRegisterForm";
import { IconButton } from "@mui/material";
import { formatCitizenId, formatPhoneNumber } from "@utils/Formats";
import styles from "./RegisterPage.module.scss";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

export default function RegisterPage() {
  const { register, handleSubmit, errors, onSubmit, watch, setValue } =
    useRegisterForm();
  const [citizenIdDisplay, setCitizenIdDisplay] = useState("");
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const prefix = watch("prefix");
  const router = useRouter();

  const handleBackToLogin = () => {
    router.push("/login");
  };

  const handleCitizenIdChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, "").slice(0, 13);
    const formatted = formatCitizenId(rawValue);
    setCitizenIdDisplay(formatted);
    setValue("citizenId", rawValue);
  };

  const handlePhoneChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, "").slice(0, 10);
    const formatted = formatPhoneNumber(rawValue);
    setPhoneDisplay(formatted);
    setValue("phone", rawValue);
  };

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
            {errors.citizenId && (
              <span className={styles.errorText}>
                {errors.citizenId.message}
              </span>
            )}
          </label>
          <input
            type="text"
            placeholder="x-xxxx-xxxxx-xx-x"
            value={citizenIdDisplay}
            onChange={handleCitizenIdChange}
            className={styles.inputField}
          />
          <input
            type="hidden"
            {...register("citizenId", {
              required: "กรุณากรอกเลขบัตรประชาชน",
              pattern: {
                value: /^[0-9]{13}$/,
                message: "กรุณากรอกเลขบัตรประชาชนให้ถูกต้อง (13 หลัก)",
              },
            })}
          />

          {/* Prefix */}
          <label className={styles.inputLabel}>
            คำนำหน้า <span>*</span>
            {errors.prefix && (
              <span className={styles.errorText}>{errors.prefix.message}</span>
            )}
          </label>
          <select
            {...register("prefix", { required: "กรุณาเลือกคำนำหน้า" })}
            className={styles.inputField}
            defaultValue=""
          >
            <option value="" disabled>
              -- กรุณาเลือก --
            </option>
            <option value="นาย">นาย</option>
            <option value="นาง">นาง</option>
            <option value="นางสาว">นางสาว</option>
            <option value="อื่น ๆ">อื่น ๆ</option>
          </select>

          {prefix === "อื่น ๆ" && (
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
                {...register("prefixOther", {
                  required: "กรุณาระบุคำนำหน้า",
                })}
                className={styles.inputField}
              />
            </>
          )}
          {/* Firstname */}
          <label className={styles.inputLabel}>
            ชื่อ <span>*</span>
            {errors.firstName && (
              <span className={styles.errorText}>
                {errors.firstName.message}
              </span>
            )}
          </label>
          <input
            type="text"
            placeholder="กรอกชื่อจริง"
            {...register("firstName", { required: "กรุณากรอกชื่อ" })}
            className={styles.inputField}
          />

          {/* Lastname */}
          <label className={styles.inputLabel}>
            นามสกุล <span>*</span>
            {errors.lastName && (
              <span className={styles.errorText}>
                {errors.lastName.message}
              </span>
            )}
          </label>
          <input
            type="text"
            placeholder="กรอกนามสกุล"
            {...register("lastName", { required: "กรุณากรอกนามสกุล" })}
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
