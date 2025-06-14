import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { registerCard } from "@pages/api/register/register";
import { showAlert, alertSuccess, alertError, alertInfo } from "@utils/Alerts";

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
    try {
      const response = await registerCard(data);
      if (response) {
        if (response.res_code === "0001") {
          await alertSuccess(
            "สมัครสมาชิกสำเร็จ",
            "คุณได้ลงทะเบียนเรียบร้อยแล้ว กรุณาตรวจสอบอีเมล"
          );
          reset();
          setTimeout(() => {
            router.push("/register?method=CardID");
          }, 1500);
        } else if (response.res_code === "0000") {
          await alertInfo(
            "สมัครสมาชิกไม่สำเร็จ",
            "กรุณายืนยันอีเมลของคุณ เพื่อเปิดใช้งานบัญชีผู้ใช้"
          );
        } else if (response.res_code === "4090") {
          await alertInfo(
            'อีเมลหรือรหัสบัตรประชาชน<br>มีการใช้งานแล้ว',
            `หากลืมรหัสผ่านโปรดคลิก <a href="/register?method=Forget_CardID">ลืมรหัสผ่าน</a>`,
            true
          );
        } else {
          await alertError(
            "สมัครสมาชิกไม่สำเร็จ", 
            "โปรดตรวจสอบข้อมูลและลองใหม่อีกครั้ง"
          );
        }
      }
    } catch (error) {
      console.error("Error during registration:", error);
      await alertError(
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
