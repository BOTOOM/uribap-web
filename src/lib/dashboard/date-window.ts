import { addDays, toIsoDay } from "@/lib/format";
import { mondayOf } from "@/lib/forecast/window";

export type DashboardDateWindow = {
  today: string;
  tomorrow: string;
  weekStart: string;
  weekEnd: string;
};

export function dashboardDateWindow(today: string): DashboardDateWindow {
  const householdDate = new Date(`${today}T00:00:00Z`);
  const weekStart = toIsoDay(mondayOf(householdDate));

  return {
    today,
    tomorrow: addDays(today, 1),
    weekStart,
    weekEnd: addDays(weekStart, 6),
  };
}
