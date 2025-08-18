// แผนที่ res_code -> ข้อความภาษาไทย
export const RES_CODE_THAI_MESSAGES = {
  // Success (2xx equivalent)
  "0000": "ดึงข้อมูลสำเร็จ",
  "0001": "สร้างข้อมูลสำเร็จ",
  "0002": "ปรับปรุงข้อมูลสำเร็จ",
  "0003": "ลบข้อมูลสำเร็จ",

  // Client errors
  4000: "คำขอไม่ถูกต้อง",
  4001: "ข้อมูลไม่ผ่านการตรวจสอบ",
  4010: "ยังไม่ได้รับอนุญาต (โปรดเข้าสู่ระบบ)",
  4030: "ไม่มีสิทธิ์เข้าถึง",
  4040: "ไม่พบข้อมูลที่ต้องการ",
  4090: "ข้อมูลขัดแย้ง / มีอยู่แล้ว",
  4290: "มีการร้องขอมากเกินไป โปรดลองใหม่ภายหลัง",

  // Server errors
  5000: "เกิดข้อผิดพลาดภายในระบบ",
  5030: "บริการไม่พร้อมใช้งานชั่วคราว",
  5040: "หมดเวลารอการตอบสนอง (Gateway Timeout)",
};

/**
 * ตรวจว่าเป็นรหัสสำเร็จหรือไม่ (ขึ้นต้น 000)
 */
export const isSuccessResCode = (code) => /^000[0-3]$/.test(code || "");

/**
 * แปล res_code เป็นข้อความภาษาไทย
 * @param {string} code
 * @param {string} backendMessage ข้อความที่ backend ส่งมา (res_message) ถ้ามี
 * @param {boolean} appendBackend ต่อท้ายข้อความ backend หรือไม่ (เฉพาะ error)
 */
export const translateResCode = (
  code,
  backendMessage = "",
  appendBackend = true
) => {
  const base = RES_CODE_THAI_MESSAGES[code];
  if (!base) {
    // ไม่มีใน mapping
    return backendMessage || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
  }
  if (isSuccessResCode(code)) {
    // success ไม่ต้องต่อข้อความ backend (เว้นแต่คุณอยากแสดง)
    return base;
  }
  if (appendBackend && backendMessage && backendMessage !== base) {
    return `${base} : ${backendMessage}`;
  }
  return base;
};
