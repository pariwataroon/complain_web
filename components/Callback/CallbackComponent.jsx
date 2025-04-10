import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

const OAuthRedirector = () => {
  const router = useRouter();
  const [state, setState] = useState("login");
  const [authData, setAuthData] = useState({ code: null, state: null });
  const [base64Auth, setBase64Auth] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [error, setError] = useState("");

  const clientId = "M2NlTDRmT1JrMVdJdGRtbHR0OVJOMHdlQVJjbEo4eFo";
  const clientSecret = "bUp0N0kzalRPaTUxSFBQN1J0M1p2VUU1RTdsM3dwQVdpaFRMN3Iyeg";
  const redirectUri = "https://ff3p4flc-3000.asse.devtunnels.ms/callback";

  useEffect(() => {
    if (router.isReady) {
      const { code, state } = router.query;

      if (code) {
        setAuthData({
          code,
          state: state || null,
        });

        const raw = `${clientId}:${clientSecret}`;
        const encoded =
          typeof window !== "undefined"
            ? window.btoa(raw)
            : Buffer.from(raw).toString("base64");

        const basicAuth = `Basic ${encoded}`;
        setBase64Auth(basicAuth);

        fetchToken(code, basicAuth);
      }
    }
  }, [router.isReady, router.query]);

  const fetchToken = async (code, authHeader) => {
    try {
      const res = await fetch("https://imauthsbx.bora.dopa.go.th/api/v2/oauth2/token/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: authHeader,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: redirectUri,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setAccessToken(data.access_token || "No token returned");
      } else {
        setError(data.error_description || "Unknown error");
      }
    } catch (err) {
      setError("Request failed: " + err.message);
    }
  };

  const handleRedirect = () => {
    const baseUrl = "https://imauthsbx.bora.dopa.go.th/api/v2/oauth2/auth/";
  
  
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      state: state || "login",
    });
  
    const redirectUrl = `${baseUrl}?${params.toString()}&scope=pid given_name address family_name gender title house_address`;
    window.location.href = redirectUrl;
  };
  

  return (
    <div style={{ padding: "2rem" }}>
      <h2>🔐 OAuth Flow</h2>

      {authData.code && (
        <div>
          <p><strong>✅ Code:</strong> {authData.code}</p>
          <p><strong>🔑 Base64:</strong> {base64Auth}</p>
        </div>
      )}

      {accessToken && (
        <div style={{ marginTop: "1rem", color: "green" }}>
          <strong>🎉 Access Token:</strong> {accessToken}
        </div>
      )}

      {error && (
        <div style={{ marginTop: "1rem", color: "red" }}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {!authData.code && (
        <>
          <p>ใส่ state ที่ต้องการ (optional):</p>
          <input
            type="text"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="login หรืออย่างอื่นก็ได้"
            style={{ padding: "0.5rem", marginRight: "1rem", width: "200px" }}
          />
          <button
            onClick={handleRedirect}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            ไปยังระบบ Auth
          </button>
        </>
      )}
    </div>
  );
};

export default OAuthRedirector;
