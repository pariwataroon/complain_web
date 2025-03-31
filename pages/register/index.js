import { useEffect } from "react";
import { useRouter } from "next/router";
import LoginComponent_ThaID from "@components/Register/ThaID/LoginComponent";
import LoginComponent_CardID from "@components/Register/CardID/LoginComponent";
import TimeOut_CardID from "@components/Register/CardID/Timeout/TimeOutComponent";
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
      "TimeOut_CardID",
      "HowTo_ThaID",
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
    case "TimeOut_ThaID":
      return <TimeOut_ThaID />;
    case "TimeOut_CardID":
      return <TimeOut_CardID />;
    case "HowTo_ThaID":
      return <HowTo_ThaID />;
  }
}
