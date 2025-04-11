import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { registerCard } from "@pages/api/register/register";
import { showAlert, alertSuccess, alertError } from "@utils/Alerts";

export const useRegisterForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    reset,
    setValue,
  } = useForm();
  const router = useRouter();

  const onSubmit = async (data) => {
    console.log("Registration Data:", data);
    try {
      const response = await registerCard(data);
      if (response && response.res_code === "0001") {
        alertSuccess("สมัครสมาชิกสำเร็จ", "คุณได้ลงทะเบียนเรียบร้อยแล้ว");
        reset();
        setTimeout(() => {
          router.push("/register?method=CardID");
        }, 1500);
      } else {
        alertError(
          "สมัครสมาชิกไม่สำเร็จ",
          response.res_message || "กรุณาลองใหม่อีกครั้ง"
        );
      }
    } catch (error) {
      console.error("Error during registration:", error);
      alertError(
        "เกิดข้อผิดพลาด",
        "ไม่สามารถสมัครสมาชิกได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง"
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
