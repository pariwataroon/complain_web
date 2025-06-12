export const validateEmail = (email) => {
  const errors = [];

  // ตรวจสอบว่าว่างหรือไม่
  if (!email || email.trim() === "") {
    return ["กรุณากรอกอีเมล"];
  }

  const trimmedEmail = email.trim();

  // ตรวจสอบภาษาไทย
  const thaiPattern = /[\u0E00-\u0E7F]/;
  if (thaiPattern.test(trimmedEmail)) {
    errors.push("อีเมลต้องเป็นภาษาอังกฤษเท่านั้น ไม่สามารถใช้ภาษาไทยได้");
  }

  // ตรวจสอบรูปแบบ email
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailPattern.test(trimmedEmail)) {
    errors.push("รูปแบบอีเมลไม่ถูกต้อง กรุณากรอกในรูปแบบ example@domain.com");
  }

  // ตรวจสอบความยาว
  if (trimmedEmail.length > 254) {
    errors.push("อีเมลยาวเกินไป (ไม่เกิน 254 ตัวอักษร)");
  }

  // ตรวจสอบ domain ที่ถูกต้อง
  if (trimmedEmail.includes("@")) {
    const domain = trimmedEmail.split("@")[1];
    if (domain && domain.includes("..")) {
      errors.push("โดเมนในอีเมลไม่ถูกต้อง");
    }
  }

  return errors;
};

// สำหรับ real-time validation
export const validateEmailRealtime = (email) => {
  if (!email || email.trim() === "") return null;

  const trimmedEmail = email.trim();

  // ตรวจสอบภาษาไทยทันที
  const thaiPattern = /[\u0E00-\u0E7F]/;
  if (thaiPattern.test(trimmedEmail)) {
    return "อีเมลต้องเป็นภาษาอังกฤษเท่านั้น";
  }

  // ถ้ามี @ แล้วให้ตรวจสอบรูปแบบ
  if (trimmedEmail.includes("@")) {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(trimmedEmail)) {
      return "รูปแบบอีเมลไม่ถูกต้อง";
    }
  }

  return null;
};
