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

export function getElapsedTimeTH(inputDate) {
  if (!inputDate) return "";
  const thNow = dayjs().tz("Asia/Bangkok");
  const thDate = dayjs(inputDate).tz("Asia/Bangkok");
  const diffSec = thNow.diff(thDate, "second");

  if (diffSec < 60) return "ไม่กี่วินาทีที่แล้ว";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} นาทีที่แล้ว`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(diffSec / 86400)} วันที่แล้ว`;
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

  return `วัน${d.format("dddd")}ที่ ${d.format("D MMMM")} พ.ศ. ${d.year() + 543
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

  return `วัน${d.format("dddd")}ที่ ${d.format("D MMMM")} พ.ศ. ${d.year() + 543
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
  if (!isoString) return null;

  const d = dayjs(isoString).tz("Asia/Bangkok");

  if (!d.isValid()) return null;

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

// แยกคำนำหน้า ชื่อ และนามสกุลจากข้อความภาษาไทยแบบยืดหยุ่น
// รองรับกรณีคำนำหน้าเขียนติดกับชื่อ (เช่น "นายต่อพงษ์ วรกุล") หรือมีช่องว่างหลายแบบ
export function parseThaiName(fullNameInput) {
  const text = (fullNameInput || "").toString().trim().replace(/\s+/g, " ");
  if (!text) return { title: "", firstName: "", lastName: "" };

  // เรียงจากยาวไปสั้นเพื่อ match ที่ถูกต้องกว่า
  const titles = [
    "ว่าที่ ร้อยตำรวจเอก", "ว่าที่ ร้อยตำรวจโท", "ว่าที่ ร้อยตำรวจตรี",
    "ว่าที่ พันตำรวจเอก", "ว่าที่ พันตำรวจโท", "ว่าที่ พันตำรวจตรี",
    "ว่าที่ ร้อยเอก", "ว่าที่ ร้อยโท", "ว่าที่ ร้อยตรี",
    "ว่าที่ ร.ต.อ.", "ว่าที่ ร.ต.ท.", "ว่าที่ ร.ต.ต.",
    "ว่าที่ ร.อ.", "ว่าที่ ร.ท.", "ว่าที่ ร.ต.",
    "ศาสตราจารย์ ดร.", "รองศาสตราจารย์ ดร.", "ผู้ช่วยศาสตราจารย์ ดร.",
    "ศาสตราจารย์", "รองศาสตราจารย์", "ผู้ช่วยศาสตราจารย์",
    "ดร.",
    "พลตำรวจเอก", "พลตำรวจโท", "พลตำรวจตรี",
    "พันตำรวจเอก", "พันตำรวจโท", "พันตำรวจตรี",
    "ร้อยตำรวจเอก", "ร้อยตำรวจโท", "ร้อยตำรวจตรี",
    "ร้อยเอก", "ร้อยโท", "ร้อยตรี",
    "คุณ", "นาย", "นาง", "นางสาว", "ด.ช.", "ด.ญ.",
  ];

  // ทำเวอร์ชันไม่มีช่องวรรคของบางคำนำหน้าที่พบบ่อย เพื่อรองรับแบบเขียนติด
  const compactTitles = new Set(
    titles
      .concat(["ว่าที่ร้อยเอก", "ว่าที่ร้อยโท", "ว่าที่ร้อยตรี", "ว่าที่ร.ต.", "ว่าที่ร.อ.", "ว่าที่ร.ท."])
      .map((t) => t.replace(/\s+/g, ""))
  );

  // helper สำหรับคืนผล
  const pack = (t, f, l) => ({ title: t || "", firstName: f || "", lastName: l || "" });

  const parts = text.split(" ");

  // 1) ถ้าเริ่มด้วยคำนำหน้าชัดเจน (ตรง ๆ)
  if (titles.includes(parts[0])) {
    if (parts.length >= 3) return pack(parts[0], parts[1], parts.slice(2).join(" "));
    if (parts.length === 2) return pack(parts[0], parts[1], "");
    return pack(parts[0], "", "");
  }

  // 2) ถ้าคำนำหน้าเขียนติดกับชื่อ เช่น "นายต่อพงษ์ วรกุล" หรือ "ด.ช.ปริญญา เหลิมศักดิ์"
  //    ลองหา title แบบไม่มีช่องวรรคที่ขึ้นต้น string
  const firstToken = parts[0];
  const firstCompact = firstToken.replace(/\s+/g, "");
  // หา candidate titles ที่เป็น prefix ของ firstCompact โดยเลือกตัวที่ยาวที่สุด
  let best = "";
  for (const t of compactTitles) {
    if (firstCompact.startsWith(t) && t.length > best.length) best = t;
  }
  if (best && firstCompact.length > best.length) {
    const titleExpanded = titles.find((t) => t.replace(/\s+/g, "") === best) || best;
    const restFirst = firstCompact.slice(best.length);
    const firstName = restFirst; // ส่วนที่เหลือของ token แรกหลังตัดคำนำหน้า
    const lastName = parts.slice(1).join(" ");
    return pack(titleExpanded, firstName, lastName);
  }

  // 3) เคสทั่วไปที่ไม่มีคำนำหน้า: แยกเป็นชื่อ/นามสกุล
  if (parts.length >= 2) return pack("", parts[0], parts.slice(1).join(" "));
  return pack("", text, "");
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

export const formatDateForAPI = (dateObj) => {
  if (!dateObj) return null;
  const year = dateObj.year;
  const month = String(dateObj.month).padStart(2, "0");
  const day = String(dateObj.day).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatThaiDateMonths = (dateObj) => {
  if (
    !dateObj ||
    typeof dateObj.day !== "number" ||
    typeof dateObj.month !== "number" ||
    typeof dateObj.year !== "number"
  )
    return "-";

  const thaiMonths = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const buddhistYear = dateObj.year + 543;
  return `${dateObj.day} ${thaiMonths[dateObj.month - 1]} พ.ศ. ${buddhistYear}`;
};

export const parseDateStringToObj = (value) => {
  if (typeof value === "string") {
    const d = new Date(value);
    return {
      day: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    };
  }
  return value;
};

export const chunkArray = (array, chunkSize = 5) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks.length > 0 ? chunks : [[]];
};

// แปลง title_id/prefix_other ให้เป็นคำนำหน้าสำหรับแสดงผล โดยอาศัยรายการคำนำหน้าจาก API
// titlesList รูปแบบ [{ title_id, short_name, title_name }, ...]
export function resolveTitleFromList(titleId, prefixOther, titlesList = []) {
  if (titleId === null || titleId === undefined || titleId === "") {
    // ไม่มี titleId ให้ใช้ prefixOther ถ้ามี ไม่งั้นคืนค่าว่าง
    const other = (prefixOther || "").toString().trim();
    return other || "";
  }

  const idNum = Number(titleId);
  const list = Array.isArray(titlesList) ? titlesList : [];
  const found = list.find((t) => Number(t.title_id) === idNum);

  // title_id = 1 หมายถึง "อื่น ๆ" หาก prefix_other ไม่ว่างให้ใช้ prefix_other แทน
  if (idNum === 1) {
    const other = (prefixOther || "").toString().trim();
    if (other) return other;
    return found?.short_name || found?.title_name || "อื่น ๆ";
  }

  // กรณีทั่วไป ใช้ short_name เป็นหลัก รองลงมา title_name
  if (found) {
    return found.short_name || found.title_name || "";
  }

  // ไม่พบในรายการ: fallback เป็น prefixOther ถ้ามี หรือค่าว่าง
  const other = (prefixOther || "").toString().trim();
  return other || "";
}

// สร้างชื่อเต็มจากส่วนประกอบ title_id/prefix_other + first_name + last_name
export function formatFullNameFromParts(
  { title_id, prefix_other, first_name, last_name } = {},
  titlesList = []
) {
  const title = resolveTitleFromList(title_id, prefix_other, titlesList);
  const first = (first_name || "").toString().trim();
  const last = (last_name || "").toString().trim();
  return [title, first, last].filter(Boolean).join(" ").trim();
}