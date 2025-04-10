import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { loginThaID } from "@pages/api/login/login";

const OAuthRedirector = () => {
  const router = useRouter();
  const [code, setCode] = useState(null);
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const { code, state } = router.query;

    if (code) {
      setCode(code);
    }
    if (state) {
      setState(state);
    }
  }, [router.query]);

  useEffect(() => {
    if (code && state) {
      setLoading(true); 
      const authenticateUser = async () => {
        try {
          const response = await loginThaID(code);

          setLoading(false);
          router.push("/");
        } catch (err) {
          setError("Login failed. Please try again.");
          setLoading(false);
        }
      };

      authenticateUser();
    }
  }, [code, state]);

  return null;
};

export default OAuthRedirector;