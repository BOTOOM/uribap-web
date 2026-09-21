export function mondayOf(date: Date): Date {
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = result.getUTCDay();
  result.setUTCDate(result.getUTCDate() + (day === 0 ? -6 : 1 - day));
  return result;
}

export function toIsoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function shiftWeek(monday: string, weeks: number): string {
  const date = new Date(`${monday}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + weeks * 7);
  return toIsoDay(date);
}

export function weekWindow(week?: string): { fromDate: string; toDate: string } {
  const base = week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? mondayOf(new Date(`${week}T00:00:00Z`)) : mondayOf(new Date());
  const end = new Date(base);
  end.setUTCDate(end.getUTCDate() + 6);
  return { fromDate: toIsoDay(base), toDate: toIsoDay(end) };
}
