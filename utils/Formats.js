import dayjs from "dayjs";
import "dayjs/locale/th";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import buddhistEra from "dayjs/plugin/buddhistEra";

dayjs.locale("th");
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(buddhistEra);

export function formatCitizenId(value) {
  const onlyNums = value.replace(/\D/g, "").slice(0, 13);
  const parts = [
    onlyNums.slice(0, 1),
    onlyNums.slice(1, 5),
    onlyNums.slice(5, 10),
    onlyNums.slice(10, 12),
    onlyNums.slice(12, 13),
  ].filter(Boolean);
  return parts.join("-");
}

export function formatCitizenId_null(value = "") {
  const onlyNums = String(value).replace(/\D/g, "").slice(0, 13);
  const parts = [
    onlyNums.slice(0, 1),
    onlyNums.slice(1, 5),
    onlyNums.slice(5, 10),
    onlyNums.slice(10, 12),
    onlyNums.slice(12, 13),
  ].filter(Boolean);
  return parts.join("-");
}

export function formatPhoneNumber_null(value) {
  const onlyNums = (value || "").toString().replace(/\D/g, "").slice(0, 10);
  if (onlyNums.length <= 3) return onlyNums;
  if (onlyNums.length <= 6)
    return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3)}`;
  return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 6)}-${onlyNums.slice(6)}`;
}

export function formatPhoneNumber(value) {
  const onlyNums = value.replace(/\D/g, "").slice(0, 10);
  if (onlyNums.length <= 3) return onlyNums;
  if (onlyNums.length <= 6)
    return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3)}`;
  return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 6)}-${onlyNums.slice(6)}`;
}

export const handleCitizenIdChange = (e, setCitizenIdDisplay, setValue) => {
  const rawValue = e.target.value.replace(/\D/g, "").slice(0, 13);
  const formatted = formatCitizenId(rawValue);
  setCitizenIdDisplay(formatted);
  setValue("citizen_id", rawValue);
};

export const handlePhoneChange = (e, setPhoneDisplay, setValue) => {
  const rawValue = e.target.value.replace(/\D/g, "").slice(0, 10);
  const formatted = formatPhoneNumber(rawValue);
  setPhoneDisplay(formatted);
  setValue("phone", rawValue);
};

export function formatThaiDate(date = new Date()) {
  const d = dayjs(date);
  return `${d.format("D MMM")} ${d.year() + 543}`;
}

export function formatThaiDateTime(date = new Date()) {
  const d = dayjs(date).tz("Asia/Bangkok");
  return `${d.format("D MMM")} ${d.year() + 543} เวลา ${d.format("HH:mm")} น.`;
}

export function formatElapsedThaiTime(createdAt) {
  if (!createdAt) return "";

  const cleanCreatedAt = createdAt.replace(/(\.\d{3})\d+/, "$1");

  const created = dayjs.utc(cleanCreatedAt).tz("Asia/Bangkok");
  const now = dayjs().tz("Asia/Bangkok");

  const diffMinutes = now.diff(created, "minute");
  const days = Math.floor(diffMinutes / (60 * 24));
  const hours = Math.floor((diffMinutes % (60 * 24)) / 60);
  const minutes = diffMinutes % 60;

  if (days > 0) {
    return `${days} วัน`;
  }
  if (hours > 0) {
    return `${hours} ชม. ${minutes} นาที`;
  }
  return `${minutes} นาที`;
}

export function formatThaiDateRange(start, end) {
  const startD = dayjs(start);
  const endD = dayjs(end);
  const startDay = startD.format("D");
  const endDay = endD.format("D");
  const startMonth = startD.format("MMMM");
  const endMonth = endD.format("MMMM");
  const thaiYear = endD.year() + 543;

  if (startD.month() === endD.month()) {
    return `ตั้งแต่วันที่ ${startDay} - ${endDay} ${startMonth} ${thaiYear}`;
  } else {
    return `ตั้งแต่วันที่ ${startDay} ${startMonth} - ${endDay} ${endMonth} ${thaiYear}`;
  }
}

export function formatDateWithThaiYear(date) {
  const d = dayjs(date);
  const year = d.year() + 543;
  return `${d.format("D MMM")} ${year}`;
}

export function formatThaiBuddhistYear(date) {
  const d = dayjs(date);
  const thaiYear = d.year() + 543;
  return `${d.format("D MMM")} ${thaiYear}`;
}

// แปลง ISO เป็นวันที่ไทยเต็มรูปแบบ
export function formatThaiFullDate(isoString) {
  if (
    !isoString ||
    isoString === null ||
    isoString === undefined ||
    isoString === ""
  ) {
    return null;
  }

  const d = dayjs(isoString).tz("Asia/Bangkok");
  if (!d.isValid()) {
    return null;
  }

  return `วัน${d.format("dddd")}ที่ ${d.format("D MMMM")} พ.ศ. ${
    d.year() + 543
  }`;
}

// แปลง ISO เป็นรูปแบบสั้น (DD/MM/YYYY)
export function formatThaiShortDate(isoString) {
  if (
    !isoString ||
    isoString === null ||
    isoString === undefined ||
    isoString === ""
  ) {
    return null;
  }
  const d = dayjs(isoString).tz("Asia/Bangkok");
  if (!d.isValid()) {
    return null;
  }

  return `${d.format("DD/MM/")}${d.year() + 543}`;
}

// แปลง ISO เป็นรูปแบบราชการไทย
export function formatThaiOfficialDate(isoString) {
  if (
    !isoString ||
    isoString === null ||
    isoString === undefined ||
    isoString === ""
  ) {
    return null;
  }
  const d = dayjs(isoString).tz("Asia/Bangkok");
  if (!d.isValid()) {
    return null;
  }

  return `${d.format("D MMMM")} พ.ศ. ${d.year() + 543}`;
}

// แปลง ISO เป็นวันที่และเวลาไทยเต็มรูปแบบ
export function formatThaiFullDateTime(isoString) {
  if (
    !isoString ||
    isoString === null ||
    isoString === undefined ||
    isoString === ""
  ) {
    return null;
  }

  const d = dayjs(isoString).tz("Asia/Bangkok");
  if (!d.isValid()) {
    return null;
  }

  return `วัน${d.format("dddd")}ที่ ${d.format("D MMMM")} พ.ศ. ${
    d.year() + 543
  } เวลา ${d.format("HH:mm")} น.`;
}

// แปลง ISO เป็นรูปแบบสั้นพร้อมเวลา (DD/MM/YYYY HH:MM)
export function formatThaiShortDateTime(isoString) {
  if (
    !isoString ||
    isoString === null ||
    isoString === undefined ||
    isoString === ""
  ) {
    return null;
  }

  const d = dayjs(isoString).tz("Asia/Bangkok");
  if (!d.isValid()) {
    return null;
  }

  return `${d.format("DD/MM/")}${d.year() + 543} ${d.format("HH:mm")}`;
}

// แปลง ISO เป็นรูปแบบราชการไทยพร้อมเวลา
export function formatThaiOfficialDateTime(isoString) {
  if (
    !isoString ||
    isoString === null ||
    isoString === undefined ||
    isoString === ""
  ) {
    return null;
  }

  const d = dayjs.utc(isoString).tz("Asia/Bangkok");
  if (!d.isValid()) {
    return null;
  }

  return `${d.format("D MMMM")} พ.ศ. ${d.year() + 543} เวลา ${d.format(
    "HH:mm"
  )} น.`;
}

export function formatThaiOfficialDateTimeTimeseven(isoString) {
  if (
    !isoString ||
    isoString === null ||
    isoString === undefined ||
    isoString === ""
  ) {
    return null;
  }

  const d = dayjs.utc(isoString).tz("Asia/Bangkok");
  if (!d.isValid()) {
    return null;
  }

  return `${d.format("D MMMM")} พ.ศ. ${d.year() + 543} เวลา ${d.format(
    "HH:mm"
  )} น.`;
}

// แปลงเป็นแค่เวลา (HH:MM น.)
export function formatThaiTime(isoString) {
  if (
    !isoString ||
    isoString === null ||
    isoString === undefined ||
    isoString === ""
  ) {
    return null;
  }

  const d = dayjs(isoString).tz("Asia/Bangkok");
  if (!d.isValid()) {
    return null;
  }

  return `${d.format("HH:mm")} น.`;
}

// แปลงเป็นเวลาแบบ 12 ชั่วโมง (เช้า/บ่าย)
export function formatThaiTime12Hour(isoString) {
  if (
    !isoString ||
    isoString === null ||
    isoString === undefined ||
    isoString === ""
  ) {
    return null;
  }

  const d = dayjs(isoString).tz("Asia/Bangkok");
  if (!d.isValid()) {
    return null;
  }

  const hour = d.hour();
  const minute = d.format("mm");
  const period = hour < 12 ? "เช้า" : "บ่าย";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  return `${displayHour}:${minute} ${period}`;
}

export function formatTableDate(isoString) {
  if (
    !isoString ||
    isoString === null ||
    isoString === undefined ||
    isoString === ""
  ) {
    return "-";
  }

  const d = dayjs(isoString).tz("Asia/Bangkok");
  if (!d.isValid()) {
    return "-";
  }

  return `${d.format("DD/MM/")}${d.year() + 543}`;
}

// แปลงรูปแบบวันที่สำหรับการแสดงสถานะ
export function formatStatusDate(isoString) {
  if (
    !isoString ||
    isoString === null ||
    isoString === undefined ||
    isoString === ""
  ) {
    return "-";
  }

  const d = dayjs(isoString).tz("Asia/Bangkok");
  if (!d.isValid()) {
    return "-";
  }

  return `${d.format("D MMM")} ${d.year() + 543}`;
}

// ฟังก์ชันสำหรับแปลงข้อความสถานะวันที่แบบผสม
export function formatMixedStatusDate(dateString) {
  if (!dateString) return "-";

  try {
    // กรณีที่มีรูปแบบ "รอการยืนยัน (16 Jun 2025)"
    if (dateString.includes("(") && dateString.includes(")")) {
      const statusPart = dateString.split("(")[0].trim();
      const datePart = dateString.match(/\((.*?)\)/)?.[1];

      if (datePart) {
        const thaiDate = formatStatusDate(new Date(datePart));
        return `${statusPart} (${thaiDate})`;
      }
      return dateString;
    }

    // กรณีวันที่ปกติ
    return formatTableDate(dateString);
  } catch (error) {
    console.error("Error formatting mixed status date:", error);
    return dateString;
  }
}

// ฟังก์ชันตรวจสอบและแปลงเลขเอกสาร
export function formatDocumentNumber(number) {
  if (!number || number === null || number === undefined || number === "") {
    return "-";
  }
  return String(number);
}

// ฟังก์ชันตัดข้อความยาวให้สั้นลง
export function truncateText(text, maxLength = 50) {
  if (!text) return "-";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

// ฟังก์ชันจัดรูปแบบชื่อคน
export function formatPersonName(title = "", firstName = "", lastName = "") {
  const fullName = `${title} ${firstName} ${lastName}`.trim();
  return fullName || "ไม่ระบุชื่อ";
}

export function formatComplaintReceiveDate(dateString) {
  if (!dateString) return "-";

  try {
    if (dateString.includes("(") && dateString.includes(")")) {
      const statusPart = dateString.split("(")[0].trim();
      const datePart = dateString.match(/\((.*?)\)/)?.[1];

      if (datePart) {
        const date = dayjs(datePart).tz("Asia/Bangkok");
        if (date.isValid()) {
          const thaiDate = formatThaiOfficialDate(date.toISOString());
          const result = `${statusPart} (${thaiDate})`;
          return result;
        }
      }
      return dateString;
    }

    const date = dayjs(dateString).tz("Asia/Bangkok");
    if (date.isValid()) {
      return formatThaiOfficialDate(dateString);
    }

    return dateString;
  } catch (error) {
    return dateString;
  }
}

// ฟังก์ชันสำหรับจัดรูปแบบชื่อผู้ร้องเรียน
export function formatComplainantName(complainant, fallbackName = null) {
  if (complainant && typeof complainant === "object") {
    const { title = "", first_name = "", last_name = "" } = complainant;
    const fullName = `${title} ${first_name} ${last_name}`.trim();

    if (fullName) {
      return fullName;
    }
  }

  if (fallbackName && fallbackName.trim()) {
    return fallbackName.trim();
  }

  return "ไม่ระบุชื่อ";
}

// ฟังก์ชันสำหรับจัดรูปแบบหมายเลขเรื่องร้องเรียน
export function formatComplaintNumber(number) {
  if (!number || number === null || number === undefined || number === "") {
    return "-";
  }

  const formatted = String(number).toUpperCase();

  return formatted;
}

// ฟังก์ชันสำหรับจัดรูปแบบชื่อหน่วยงาน
export function formatAgencyName(agencyName) {
  if (
    !agencyName ||
    agencyName === null ||
    agencyName === undefined ||
    agencyName === ""
  ) {
    return "ยังไม่ได้มอบหมาย";
  }

  const formatted = String(agencyName).trim();

  return formatted;
}

// ฟังก์ชันสำหรับจัดรูปแบบประเภทเรื่องร้องเรียน
export function formatComplaintType(type) {
  if (!type || type === null || type === undefined || type === "") {
    return "ไม่ระบุประเภท";
  }

  const formatted = String(type).trim();
  return formatted;
}

// ฟังก์ชันสำหรับจัดรูปแบบหัวข้อเรื่องร้องเรียน
export function formatComplaintSubject(subject, maxLength = 100) {
  if (!subject || subject === null || subject === undefined || subject === "") {
    return "ไม่ระบุหัวข้อ";
  }

  let formatted = String(subject).trim();
  if (formatted.length > maxLength) {
    formatted = formatted.substring(0, maxLength) + "...";
  }

  return formatted;
}

// ฟังก์ชันสำหรับจัดรูปแบบสถานะการยืนยัน
export function formatConfirmationStatus(status, statusText = null) {
  if (statusText && statusText.trim()) {
    return statusText.trim();
  }

  const statusMap = {
    confirmed: "ยืนยันรับงานแล้ว",
    rejected: "ปฏิเสธรับงาน",
    pending: "รอการยืนยัน",
    not_assigned: "ยังไม่ได้มอบหมาย",
    sent_to_agency: "ส่งให้หน่วยงาน",
  };

  const result = statusMap[status] || status || "ไม่ระบุสถานะ";

  return result;
}
