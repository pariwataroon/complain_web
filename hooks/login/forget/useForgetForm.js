import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { registerCard } from "@pages/api/register/register";
import { showAlert, alertSuccess, alertError, alertInfo } from "@utils/Alerts";

export const useForgetForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm();

  const onSubmit = (data) => {
    console.log("ส่งอีเมลรีเซ็ตรหัสผ่าน:", data);
    // TODO: call API เพื่อส่ง reset link หรือรหัสใหม่
  };

  const handleResend = () => {
    console.log("🔁 ขอรหัสใหม่อีกครั้ง");
    // TODO: call API resend code
  };

  return {
    register,
    handleSubmit,
    errors,
    onSubmit,
    handleResend,
    reset,
    setError,
  };
};
