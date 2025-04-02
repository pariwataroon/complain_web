import { useForm } from "react-hook-form";

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
