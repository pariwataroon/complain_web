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
          </label>
          <input
            type="text"
            placeholder="กรอกเลขบัตรประชาชน"
            {...register("citizenId", { required: "กรุณากรอกเลขบัตรประชาชน" })}
            className={styles.inputField}
          />
          {errors.citizenId && (
            <p className={styles.errorText}>{errors.citizenId.message}</p>
          )}

          {/* Name */}
          <label className={styles.inputLabel}>
            ชื่อ-นามสกุล <span>*</span>
          </label>
          <input
            type="text"
            placeholder="กรอกชื่อและนามสกุล"
            {...register("name", { required: "กรุณากรอกชื่อ-นามสกุล" })}
            className={styles.inputField}
          />
          {errors.name && <p className={styles.errorText}>{errors.name.message}</p>}

          {/* Email */}
          <label className={styles.inputLabel}>
            อีเมล <span>*</span>
          </label>
          <input
            type="email"
            placeholder="กรอกอีเมล"
            {...register("email", { required: "กรุณากรอกอีเมล" })}
            className={styles.inputField}
          />
          {errors.email && <p className={styles.errorText}>{errors.email.message}</p>}

          {/* Phone */}
          <label className={styles.inputLabel}>
            เบอร์โทรศัพท์ <span>*</span>
          </label>
          <input
            type="text"
            placeholder="กรอกเบอร์โทรศัพท์"
            {...register("phone", { required: "กรุณากรอกเบอร์โทรศัพท์" })}
            className={styles.inputField}
          />
          {errors.phone && <p className={styles.errorText}>{errors.phone.message}</p>}

          {/* Password */}
          <label className={styles.inputLabel}>
            รหัสผ่าน <span>*</span>
          </label>
          <input
            type="password"
            placeholder="กรอกรหัสผ่าน"
            {...register("password", { required: "กรุณากรอกรหัสผ่าน" })}
            className={styles.inputField}
          />
          {errors.password && <p className={styles.errorText}>{errors.password.message}</p>}

          {/* Submit */}
          <button type="submit" className={styles.submitButton}>
            ยืนยันข้อมูล
          </button>
        </form>
      </div>
    </div>
  );
}
