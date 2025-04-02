import React, { useState } from "react";
import { useRouter } from "next/router";
import { useRegisterForm } from "@hooks/login/register/useRegisterForm";
import { IconButton } from "@mui/material";
import styles from "./RegisterPage.module.scss";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

export default function RegisterPage() {
  const { register, handleSubmit, errors, onSubmit } = useRegisterForm();
  const router = useRouter();

  const handleBackToLogin = () => {
    router.push("/login");
  };

  return (
    <div className={styles.container}>
      <div className={styles.logoWrapper}>
        <img src="/Logo_Gold.png" alt="การคลัง" />
      </div>

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
              <span className={styles.errorText}>{errors.citizenId.message}</span>
            )}
          </label>
          <input
            type="text"
            placeholder="กรอกเลขบัตรประชาชน"
            {...register("citizenId", {
              required: "กรุณากรอกเลขบัตรประชาชน",
              pattern: {
                value: /^[0-9]{13}$/,
                message: "กรุณากรอกเลขบัตรประชาชนให้ถูกต้อง (13 หลัก)"
              }
            })}
            className={styles.inputField}
          />
          
          {/* Name */}
          <label className={styles.inputLabel}>
            ชื่อ-นามสกุล <span>*</span>
            {errors.name && (
              <span className={styles.errorText}>{errors.name.message}</span>
            )}
          </label>
          <input
            type="text"
            placeholder="กรอกชื่อและนามสกุล"
            {...register("name", { required: "กรุณากรอกชื่อ-นามสกุล" })}
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
            placeholder="กรอกเบอร์โทรศัพท์"
            {...register("phone", {
              required: "กรุณากรอกเบอร์โทรศัพท์",
              pattern: {
                value: /^[0-9]{10}$/,
                message: "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (10 หลัก)"
              }
            })}
            className={styles.inputField}
          />

          {/* Password */}
          <label className={styles.inputLabel}>
            รหัสผ่าน <span>*</span>
            {errors.password && (
              <span className={styles.errorText}>{errors.password.message}</span>
            )}
          </label>
          <input
            type="password"
            placeholder="กรอกรหัสผ่าน"
            {...register("password", { required: "กรุณากรอกรหัสผ่าน" })}
            className={styles.inputField}
          />
          {/* Submit */}
          <button type="submit" className={styles.submitButton}>
            ยืนยันข้อมูล
          </button>
        </form>
      </div>
    </div>
  );
}
