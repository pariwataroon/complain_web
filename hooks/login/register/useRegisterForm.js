import { useForm } from 'react-hook-form';

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

  const onSubmit = (data) => {
    console.log("✅ Login Data:", data);
    // TODO: call API login
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
