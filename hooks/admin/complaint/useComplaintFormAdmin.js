import { useForm } from "react-hook-form";
import { useEffect } from "react";

const useComplaintFormAdmin = (defaultValues = {}) => {
  const methods = useForm({
    defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      methods.reset(defaultValues);
    }
  }, [defaultValues]);

  return methods;
};

export default useComplaintFormAdmin;
