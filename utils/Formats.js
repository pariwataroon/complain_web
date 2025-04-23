import dayjs from "dayjs";
import "dayjs/locale/th";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.locale("th");
dayjs.extend(utc);
dayjs.extend(timezone);

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