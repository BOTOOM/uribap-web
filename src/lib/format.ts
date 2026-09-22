const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const DAY_SHORT = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MONTH_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function asDate(isoDay: string): Date {
  return new Date(`${isoDay}T00:00:00Z`);
}

/** "lunes 7 de septiembre" */
export function formatDayLong(isoDay: string): string {
  const date = asDate(isoDay);
  return `${DAY_NAMES[date.getUTCDay()]} ${date.getUTCDate()} de ${monthName(date.getUTCMonth())}`;
}

const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function monthName(index: number): string {
  return MONTH_NAMES[index];
}

/** "lun 7" style short label */
export function formatDayShort(isoDay: string): string {
  const date = asDate(isoDay);
  return `${DAY_SHORT[date.getUTCDay()]} ${date.getUTCDate()}`;
}

/** "7 sep." */
export function formatDayMonth(isoDay: string): string {
  const date = asDate(isoDay);
  return `${date.getUTCDate()} ${MONTH_SHORT[date.getUTCMonth()]}.`;
}

/** "7-13 sep." week range */
export function formatWeekRange(weekStart: string): string {
  const start = asDate(weekStart);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  if (start.getUTCMonth() === end.getUTCMonth()) {
    return `${start.getUTCDate()}-${end.getUTCDate()} ${MONTH_SHORT[start.getUTCMonth()]}.`;
  }
  return `${formatDayMonth(weekStart)}-${formatDayMonth(toIsoDay(end))}`;
}

/** "7-13 de septiembre" long week range */
export function formatWeekRangeLong(weekStart: string): string {
  const start = asDate(weekStart);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  if (start.getUTCMonth() === end.getUTCMonth()) {
    return `${start.getUTCDate()}-${end.getUTCDate()} de ${monthName(start.getUTCMonth())}`;
  }
  return `${start.getUTCDate()} de ${monthName(start.getUTCMonth())}-${end.getUTCDate()} de ${monthName(end.getUTCMonth())}`;
}

export function toIsoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(isoDay: string, days: number): string {
  const date = asDate(isoDay);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function dayName(isoDay: string): string {
  return DAY_NAMES[asDate(isoDay).getUTCDay()];
}

export function dayInitial(isoDay: string): string {
  const initials = ["D", "L", "M", "X", "J", "V", "S"];
  return initials[asDate(isoDay).getUTCDay()];
}

/** Relative hint like "hoy", "mañana", "en 3 d" or formatted date. */
export function relativeDay(isoDay: string, todayIso?: string): string {
  const today = todayIso ?? toIsoDay(new Date());
  const diff = Math.round(
    (asDate(isoDay).getTime() - asDate(today).getTime()) / 86_400_000,
  );
  if (diff === 0) return "hoy";
  if (diff === 1) return "mañana";
  if (diff === -1) return "ayer";
  if (diff > 1 && diff <= 7) return `en ${diff} d`;
  return formatDayMonth(isoDay);
}

/** "21:00" local HH:mm from an ISO datetime. */
export function formatTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return isoDateTime;
  return new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" }).format(date);
}

/** "mar · 21:00" from ISO datetime */
export function formatDueLabel(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return isoDateTime;
  const day = `${DAY_SHORT[date.getDay()]} ${date.getDate()} ${MONTH_SHORT[date.getMonth()]}.`;
  return `${day} · ${formatTime(isoDateTime)}`;
}

/** "300 g" from "300.000000" — trims insignificant decimals. */
export function formatQuantity(amount: string | number, unit?: string): string {
  const value = typeof amount === "number" ? amount : Number(amount);
  const text = Number.isFinite(value)
    ? new Intl.NumberFormat("es", { maximumFractionDigits: 3 }).format(value)
    : String(amount);
  return unit ? `${text} ${unit}` : text;
}
