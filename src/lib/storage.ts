export function todayISO() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

export function todayName() {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}
