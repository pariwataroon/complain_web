import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { registerCard } from "@pages/api/register/register";
import { showAlert, alertSuccess, alertError, alertInfo } from "@utils/Alerts";
import { forgotPassword } from "@pages/api/register/register";

export const useForgetForm = () => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
    getValues,
  } = useForm();

  const onSubmit = async (data) => {
    try {
      console.log("ส่งอีเมลรีเซ็ตรหัสผ่าน:", data);

      const payload = {
        email: data.email,
      };

      const response = await forgotPassword(payload);

      if (
        response?.success ||
        response?.status === "success" ||
        response?.res_code === "0000"
      ) {
        alertSuccess(
          "ส่งอีเมลรีเซ็ตรหัสผ่านสำเร็จ",
          "กรุณาตรวจสอบอีเมลของคุณเพื่อรีเซ็ตรหัสผ่าน"
        );
        return { success: true };
      } else {
        const errorMessage =
          response?.message ||
          response?.res_message ||
          response?.error?.message ||
          "ไม่สามารถส่งอีเมลรีเซ็ตรหัสผ่านได้";

        alertError("เกิดข้อผิดพลาด", errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      let errorMessage = "เกิดข้อผิดพลาดในการส่งอีเมล";

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data?.res_message) {
        errorMessage = error.response.data.res_message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      if (error?.response?.status === 404) {
        errorMessage = "ไม่พบอีเมลนี้ในระบบ";
      } else if (error?.response?.status === 400) {
        errorMessage = "ข้อมูลที่ส่งไม่ถูกต้อง";
      } else if (error?.response?.status === 500) {
        errorMessage = "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง";
      }

      alertError("เกิดข้อผิดพลาด", errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const handleResend = async () => {
    try {
      // ดึง email จาก form values
      const currentValues = getValues();

      if (currentValues && currentValues.email) {
        const payload = {
          email: currentValues.email,
        };

        const response = await forgotPassword(payload);

        if (
          response?.success ||
          response?.status === "success" ||
          response?.res_code === "0000"
        ) {
          alertSuccess("ส่งอีเมลซ้ำสำเร็จ", "กรุณาตรวจสอบอีเมลของคุณ");
          return { success: true };
        } else {
          const errorMessage =
            response?.message ||
            response?.res_message ||
            response?.error?.message ||
            "ไม่สามารถส่งอีเมลซ้ำได้";
          alertError("เกิดข้อผิดพลาด", errorMessage);
          return { success: false };
        }
      } else {
        alertError("เกิดข้อผิดพลาด", "กรุณากรอกอีเมลก่อนขอรหัสใหม่");
        return { success: false };
      }
    } catch (error) {
      console.error("Error in handleResend:", error);

      let errorMessage = "ไม่สามารถส่งอีเมลซ้ำได้";

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.status === 404) {
        errorMessage = "ไม่พบอีเมลนี้ในระบบ";
      } else if (error?.response?.status === 400) {
        errorMessage = "ข้อมูลที่ส่งไม่ถูกต้อง";
      }

      alertError("เกิดข้อผิดพลาด", errorMessage);
      return { success: false };
    }
  };

  return {
    register,
    handleSubmit,
    errors,
    onSubmit,
    handleResend,
    reset,
    setError,
    getValues,
  };
};
