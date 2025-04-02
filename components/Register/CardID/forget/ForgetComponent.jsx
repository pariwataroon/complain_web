import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useForgetForm } from "@hooks/login/forget/useForgetForm";
import { IconButton } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import styles from "./ForgetPage.module.scss";

export default function ForgetPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, errors, onSubmit, handleResend } = useForgetForm();

  const handleBackToLogin = () => {
    router.push("/login");
  };

  const handleClick = (data) => {
    if (!submitted) {
      onSubmit(data); // กดครั้งแรก = ส่ง form
      setSubmitted(true);
    } else {
      handleResend(); // ครั้งถัดไป = ส่งใหม่
    }
    setCountdown(10);
  };

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  return (
    <div className={styles.container}>
      <div className={styles.logoWrapper}>
        <img src="/Logo_Gold.png" alt="การคลัง" />
      </div>

      <div className={styles.loginBox}>
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

        <h1 className={styles.loginTitle}>ลืมรหัสผ่าน</h1>
        <p className={styles.loginSubtitle}>
          ตรวจสอบรหัสผ่านใหม่ในอีเมลของท่านหรือกรอกอีเมลใหม่
          <br />
          เพื่อรับรหัสผ่านอีกครั้ง หากต้องการความช่วยเหลือเพิ่มเติม
          <br />
          ติดต่อเจ้าหน้าที่ได้ที่สายด่วน 1689
        </p>

        <form
          onSubmit={handleSubmit(handleClick)}
          className={styles.forgotForm}
        >
          <label className={styles.inputLabel}>
            อีเมล <span>*</span>
          </label>
          <input
            type="email"
            placeholder="example@email.com"
            {...register("email", {
              required: "กรุณากรอกอีเมล",
              pattern: {
                value: /^\S+@\S+$/i,
                message: "รูปแบบอีเมลไม่ถูกต้อง",
              },
            })}
            className={styles.inputField}
          />
          {errors.email && (
            <p className={styles.errorText}>{errors.email.message}</p>
          )}

          <button
            type="submit"
            disabled={countdown > 0}
            className={styles.submitButton}
            style={{
              backgroundColor: countdown > 0 ? "#ccc" : "#1e40af",
              color: "#fff",
              cursor: countdown > 0 ? "not-allowed" : "pointer",
              marginTop: "1rem",
            }}
          >
            {countdown > 0
              ? `กรุณารอเพื่อส่งซ้ำ (${countdown})`
              : submitted
              ? "รับรหัสอีกครั้ง"
              : "ยืนยัน"}
          </button>
        </form>
      </div>
    </div>
  );
}
