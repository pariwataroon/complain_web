import { useState } from "react";
import { useForm } from "react-hook-form";

const useCRUDFormUsers = () => {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ฟังก์ชันสำหรับการเพิ่มผู้ใช้งาน
  const addUser = (formData) => {
    setIsSubmitting(true);
    // สมมติว่าคุณมี API หรือฟังก์ชันในการบันทึกข้อมูล
    // ตัวอย่าง: ใช้ฟังก์ชันส่งข้อมูลไปยัง API หรือฐานข้อมูล
    console.log("Adding user:", formData);
    // หลังจากทำการบันทึกข้อมูลเสร็จ
    setIsSubmitting(false);
  };

  // การส่งข้อมูล
  const onSubmit = (data) => {
    addUser(data);
  };

  return {
    register,
    handleSubmit,
    setValue,
    errors,
    onSubmit,
    isSubmitting,
  };
};

export default useCRUDFormUsers;
