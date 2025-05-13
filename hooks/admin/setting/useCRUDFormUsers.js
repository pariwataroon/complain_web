import { useState } from "react";
import { useForm } from "react-hook-form";

const useCRUDFormUsers = () => {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    control,
    formState: { errors },
  } = useForm();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const addUser = (formData) => {
    setIsSubmitting(true);
    console.log("✅ Submitted user:", formData);
    setTimeout(() => {
      setIsSubmitting(false);
    }, 1000);
  };

  const onSubmit = (data) => {
    addUser(data);
  };

  return {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    control,
    errors,
    onSubmit,
    isSubmitting,
  };
};

export default useCRUDFormUsers;
