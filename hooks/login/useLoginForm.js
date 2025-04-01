import { useForm } from 'react-hook-form';

export const useLoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    reset,
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
  };
};
