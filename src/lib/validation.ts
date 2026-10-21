export function text(f: FormData, key: string, required = false) {
  const value = String(f.get(key) || "").trim();
  if (required && !value) throw new Error(`${key} is required.`);
  if (value.length > 10000) throw new Error(`${key} is too long.`);
  return value;
}
export function choice(f: FormData, key: string, allowed: string[]) {
  const v = text(f, key, true);
  if (!allowed.includes(v)) throw new Error(`Invalid ${key}.`);
  return v;
}
export function date(f: FormData, key: string) {
  const v = text(f, key);
  if (
    v &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(v) ||
      Number.isNaN(Date.parse(v)) ||
      new Date(v).toISOString().slice(0, 10) !== v)
  )
    throw new Error(`Invalid ${key}.`);
  return v;
}
export function id(f: FormData, key = "id") {
  const v = Number(text(f, key, true));
  if (!Number.isSafeInteger(v) || v < 1) throw new Error("Invalid record ID.");
  return v;
}
export function overdue(
  deadline: string,
  status: string,
  today = new Date().toISOString().slice(0, 10),
) {
  return !!deadline && deadline < today && status !== "completed";
}
