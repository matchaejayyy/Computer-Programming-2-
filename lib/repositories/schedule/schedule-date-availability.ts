/** Pure date rules shared by API and student UI (no server-only imports). */

export type ScheduleDateRules = {
  blockedDates: string[];
  dateOverrides: Array<{ date: string; available: boolean }>;
};

export function isDateAvailableForSchedule(dateIso: string, schedule: ScheduleDateRules): boolean {
  if (schedule.blockedDates.includes(dateIso)) return false;
  const override = schedule.dateOverrides.find((entry) => entry.date === dateIso);
  if (override) return override.available;
  const d = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const day = d.getDay();
  return day >= 1 && day <= 5;
}
