import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { loginThaID } from "@pages/api/login/login";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

const OAuthRedirector = () => {
  const router = useRouter();
  const [code, setCode] = useState(null);
  const [state, setState] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
          await loginThaID(code);
          setLoading(false);
          router.push("/");

          setOpen(true);
        } catch (err) {
          setLoading(false);
          router.push("/");
        }
      };

      authenticateUser();
    }
  }, [code, state]);

  const handleCloseSnackbar = () => {
    setOpen(false);
  };

  return (
    <>
      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert onClose={handleCloseSnackbar} severity="success" sx={{ width: "100%" }}>
          เข้าสู่ระบบสำเร็จ!
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default OAuthRedirector;