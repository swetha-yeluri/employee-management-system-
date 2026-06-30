
export function toLocalDate(value) {
  if (!value) return null;
  let s = value;
  if (typeof s === "string" && !/([zZ]|[+-]\d{2}:?\d{2})$/.test(s)) {
    s = `${s}Z`;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function formatTime(value) {
  const d = toLocalDate(value);
  return d ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
}

export function formatDateTime(value) {
  const d = toLocalDate(value);
  return d ? d.toLocaleString() : "—";
}
