export function DecodeJWT(token) {
  const [header, payload, signature] = token.split(".");

  function base64UrlDecode(str) {
    const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);
    const decoded = atob(padded);
    try {
      return decodeURIComponent(
        decoded
          .split("")
          .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join("")
      );
    } catch (e) {
      return decoded;
    }
  }

  try {
    return {
      header: JSON.parse(base64UrlDecode(header)),
      payload: JSON.parse(base64UrlDecode(payload)),
      signature,
    };
  } catch (err) {
    console.error("Invalid JWT:", err);
    return null;
  }
}
