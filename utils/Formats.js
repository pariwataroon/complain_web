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

export function formatPhoneNumber(value) {
  const onlyNums = value.replace(/\D/g, "").slice(0, 10);
  if (onlyNums.length <= 3) return onlyNums;
  if (onlyNums.length <= 6)
    return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3)}`;
  return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 6)}-${onlyNums.slice(6)}`;
}
