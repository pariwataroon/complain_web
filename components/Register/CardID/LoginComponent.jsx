import React, { useState } from "react";
import { useRouter } from "next/router";
import { useLoginForm } from "@hooks/login/useLoginForm";
import { IconButton } from "@mui/material";
import styles from "./LoginPage.module.scss";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";



export default function CardIDLoginPage() {
  const { register, handleSubmit, errors, onSubmit, setValue } = useLoginForm();
  const [showPassword, setShowPassword] = useState(false);
  const [citizenId, setCitizenId] = useState("");
  const router = useRouter();

  const handleCitizenIdChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, "").slice(0, 13);
    setCitizenId(rawValue);
    setValue("citizen_id", rawValue);
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  const handleRegisterClick = () => {
    router.push({
      pathname: "/register",
      query: { method: "Register_CardID" },
    });
  };

  const handleForgetClick = () => {
    router.push({
      pathname: "/register",
      query: { method: "Forget_CardID" },
    });
  };



  return (
    <div className={styles.container}>
      

      <div className={styles.loginBox}>
        <div className={styles.logoWrapper}>
          <img src="/Logo_Gold.png" alt="การคลัง" />
        </div>
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
        <h1 className={styles.loginTitle}>ลงชื่อเข้าสู่ระบบ</h1>
        <p className={styles.loginSubtitle}>สำหรับประชาชน</p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.loginForm}>
          {/* Citizen ID */}
          <label className={styles.inputLabel}>
            เลขบัตรประชาชน <span>*</span>
            {errors.citizen_id && (
              <span className={styles.errorText}>{errors.citizen_id.message}</span>
            )}
          </label>
          <input
            type="text"
            placeholder="กรอกเลขบัตรประชาชน"
            value={citizenId}
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

          


          {/* Password */}
          <label className={styles.inputLabel}>
            รหัสผ่าน <span>*</span>
            {errors.password && (
              <span className={styles.errorText}>{errors.password.message}</span>
            )}
          </label>
          <div className={styles.passwordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="กรอกรหัสผ่าน"
              {...register("password", { required: "กรุณากรอกรหัสผ่าน" })}
              className={styles.inputField}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className={styles.togglePassword}
            >
              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </span>
          </div>

          {/* Remember & Forgot */}
          <div className={styles.formOptions}>
            <label>
              <input type="checkbox" {...register("rememberMe")} />
              จดจำการเข้าสู่ระบบ
            </label>
            <a
              href="#"
              className={styles.forgotPassword}
              onClick={(e) => {
                e.preventDefault();
                handleForgetClick();
              }}
            >
              ลืมรหัสผ่าน
            </a>
          </div>

          {/* Submit */}
          <button type="submit" className={styles.submitButton}>
            เข้าสู่ระบบ
          </button>

          {/* Register */}
          <p className={styles.registerLink}>
            ไม่มีบัญชี?
            <a href="#" className={styles.registerLinkText}
              onClick={(e) => {
                e.preventDefault();
                handleRegisterClick();
              }}>
              ลงทะเบียนเข้าสู่ระบบ
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
