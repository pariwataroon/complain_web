import { useForm } from "react-hook-form";
import { loginCard } from "@pages/api/login/login";
import { alertSuccess, alertError } from "@utils/Alerts";
import { useRouter } from "next/router";

export const useLoginForm = () => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    reset,
    setValue,
  } = useForm();

  const onSubmit = async (data) => {
    console.log("Login Data:", data);

    try {
      const { citizen_id, password } = data;
      const response = await loginCard({ citizen_id, password });
      if (response && response.res_code === "0001" || response.res_code === "0000") {
        alertSuccess("เข้าสู่ระบบสำเร็จ", "ยินดีต้อนรับเข้าสู่ระบบ");
        reset();

        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        alertError(
          "เข้าสู่ระบบไม่สำเร็จ",
          response.res_message || "กรุณาตรวจสอบข้อมูลอีกครั้ง"
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      alertError(
        "เกิดข้อผิดพลาด",
        "ไม่สามารถเข้าสู่ระบบได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง"
      );
    }
  };

  return {
    register,
    handleSubmit,
    errors,
    onSubmit,
    watch,
    setError,
    reset,
    setValue,
  };
};
