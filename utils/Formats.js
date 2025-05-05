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
