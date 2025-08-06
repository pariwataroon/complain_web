import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { IconButton } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { alertSuccess, alertError } from "@utils/Alerts";
import styles from "./ResetPasswordComponents.module.scss";

export default function ResetPasswordComponents() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [accessAllowed, setAccessAllowed] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const { token } = router.query;

    if (typeof token === "string" && token.length > 10) {
      setAccessAllowed(true);
    } else {
      alertError("ไม่สามารถเข้าถึง", "ลิงก์ไม่ถูกต้องหรือหมดอายุ");
      router.replace("/login");
    }
  }, [router.isReady, router.query]);

  const handleBackToLogin = () => {
    router.push("/login");
  };

  const validate = () => {
    const errs = {};
    if (!password) {
      errs.password = "กรุณากรอกรหัสผ่านใหม่";
    } else if (password.length < 6) {
      errs.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    }
    if (!confirm) {
      errs.confirm = "กรุณายืนยันรหัสผ่านใหม่";
    } else if (password !== confirm) {
      errs.confirm = "รหัสผ่านไม่ตรงกัน";
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const { token } = router.query;

      const response = await fetch("https://complain.mof.go.th//api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          new_password: password,
        }),
      });

      const result = await response.json().catch(() => ({})); // เผื่อไม่ใช่ JSON

      if (!response.ok) {
        console.error("❌ Reset failed", response.status, result);
        alertError(
          "ไม่สามารถตั้งรหัสผ่านได้",
          result.message || `รหัสสถานะ: ${response.status}`
        );
      } else {
        alertSuccess("ตั้งรหัสผ่านใหม่สำเร็จ", "สามารถเข้าสู่ระบบด้วยรหัสใหม่ได้แล้ว");
        router.push("/login");
      }
    } catch (err) {
      console.error("🔥 เกิดข้อผิดพลาด:", err);
      alertError("ข้อผิดพลาด", err.message || "ไม่สามารถตั้งรหัสผ่านได้");
    }
    setLoading(false);
  };

  if (!accessAllowed) return null;

  return (
    <div className={styles.container}>
      <div className={styles.logoWrapper}>
        <img src="/Logo_Gold.png" alt="การคลัง" />
      </div>

      <div className={styles.loginBox}>
        <IconButton
          onClick={handleBackToLogin}
          sx={{ position: "absolute", top: 16, right: 16, color: "grey.700" }}
        >
          <ArrowBackIosNewIcon />
        </IconButton>

        <h1 className={styles.loginTitle}>ตั้งค่ารหัสผ่านใหม่</h1>
        <p className={styles.loginSubtitle}>
          กรุณากำหนดรหัสผ่านใหม่ และยืนยันรหัสผ่านใหม่
          <br />
          เพื่อเข้าใช้งานระบบ หากพบปัญหาติดต่อเจ้าหน้าที่ 1689
        </p>

        <form onSubmit={handleSubmit} className={styles.forgotForm}>
          <label className={styles.inputLabel}>
            รหัสผ่านใหม่ <span>*</span>
            {errors.password && (
              <span className={styles.errorText}>{errors.password}</span>
            )}
          </label>
          <input
            type="password"
            placeholder="รหัสผ่านใหม่"
            className={styles.inputField}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <label className={styles.inputLabel}>
            ยืนยันรหัสผ่านใหม่ <span>*</span>
            {errors.confirm && (
              <span className={styles.errorText}>{errors.confirm}</span>
            )}
          </label>
          <input
            type="password"
            placeholder="ยืนยันรหัสผ่านใหม่"
            className={styles.inputField}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
            style={{
              backgroundColor: loading ? "#ccc" : "#1e40af",
              color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "1rem",
            }}
          >
            {loading ? "กำลังตั้งรหัสผ่าน..." : "ยืนยันรหัสผ่านใหม่"}
          </button>
        </form>
      </div>
    </div>
  );
}
