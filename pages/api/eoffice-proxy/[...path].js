/**
 * EOffice API Proxy — /api/eoffice-proxy/[...path]
 *
 * Proxy ทุก request ไปที่ eofficer API (172.29.34.216)
 * เพื่อเลี่ยง SSL cert invalid (IP address ไม่ตรงกับ certificate)
 *
 * Browser → /api/eoffice-proxy/v1/rongtook/SOAP/General
 *         → proxy → https://172.29.34.216/api/v1/rongtook/SOAP/General
 */

import https from "https";
import axios from "axios";

// HTTPS agent ที่ skip SSL verification (สำหรับ internal IP)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const EOFFICE_BASE = process.env.NEXT_PUBLIC_EOFFICE_API_BASE_URL || "https://172.29.34.216/api";

// axios instance สำหรับ server-side proxy
const proxyInstance = axios.create({
  baseURL: EOFFICE_BASE,
  httpsAgent,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 120000,
  // ส่ง error response body กลับไปด้วย
  validateStatus: () => true,
});

export default async function handler(req, res) {
  // เฉพาะ POST และ GET
  if (!["GET", "POST", "PUT", "DELETE"].includes(req.method)) {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { path } = req.query;
    const apiPath = Array.isArray(path) ? path.join("/") : path;

    let response;

    if (req.method === "GET") {
      // GET: ส่ง query params ต่อท้าย (เอา path ออก — มันคือ URL path ไม่ใช่ query param)
      const { path: _, ...queryParams } = req.query;
      response = await proxyInstance.get(apiPath, {
        params: queryParams,
      });
    } else if (req.method === "POST") {
      // POST: ส่ง body
      response = await proxyInstance.post(apiPath, req.body);
    } else {
      return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    // ส่ง response กลับไปที่ browser
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("[EOffice Proxy] error:", error.message);
    res.status(502).json({
      success: false,
      message: "Proxy error — ไม่สามารถเชื่อมต่อ EOffice API",
      detail: error.message,
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};
