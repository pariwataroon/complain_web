import { useEffect } from "react";
import { useRouter } from "next/router";
import LoginComponent_ThaID from "@components/Register/ThaID/LoginComponent";
import LoginComponent_CardID from "@components/Register/CardID/LoginComponent";
import Forget_CardID from "@components/Register/CardID/forget/ForgetComponent";
import Register_CardID from "@components/Register/CardID/register/RegisterComponent";
import TimeOut_ThaID from "@components/Register/ThaID/Timeout/TimeOutComponent";
import HowTo_ThaID from "@components/Register/ThaID/Howto/HowToComponent";

export default function Register() {
  const router = useRouter();
  const { method } = router.query;

  useEffect(() => {
    const validMethods = [
      "ThaID",
      "CardID",
      "TimeOut_ThaID",
      "HowTo_ThaID",
      "Forget_CardID",
      "Register_CardID",
    ];
    if (router.isReady && !validMethods.includes(method)) {
      router.replace("/login");
    }
  }, [method, router]);

  if (!router.isReady) return null;

  switch (method) {
    case "ThaID":
      return <LoginComponent_ThaID />;
    case "CardID":
      return <LoginComponent_CardID />;
    case "Forget_CardID":
      return <Forget_CardID />;
    case "Register_CardID":
      return <Register_CardID />;
    case "TimeOut_ThaID":
      return <TimeOut_ThaID />;
    case "HowTo_ThaID":
      return <HowTo_ThaID />;
  }
}
