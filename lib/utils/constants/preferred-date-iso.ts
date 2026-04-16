/** Normalize stored `preferredDate` (ISO or long form) to `YYYY-MM-DD` for comparisons. */

const MONTHS: Record<string, string> = {
  January: "01",
  February: "02",
  March: "03",
  April: "04",
  May: "05",
  June: "06",
  July: "07",
  August: "08",
  September: "09",
  October: "10",
  November: "11",
  December: "12",
};

export function preferredDateToIso(preferredDate: string): string | null {
  const t = preferredDate.trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (iso) {
    const y = iso[1];
    const mo = String(Number(iso[2])).padStart(2, "0");
    const d = String(Number(iso[3])).padStart(2, "0");
    return `${y}-${mo}-${d}`;
  }

  const withWeekday = t.match(/^[^,]+,\s*(\w+)\s+(\d+),\s*(\d{4})$/);
  if (withWeekday) {
    const monthName = withWeekday[1];
    const day = withWeekday[2];
    const year = withWeekday[3];
    const month = MONTHS[monthName];
    if (!month) return null;
    return `${year}-${month}-${day.padStart(2, "0")}`;
  }

  const noWeekday = t.match(/^(\w+)\s+(\d{1,2}),\s*(\d{4})$/);
  if (noWeekday) {
    const monthName = noWeekday[1];
    const day = noWeekday[2];
    const year = noWeekday[3];
    const month = MONTHS[monthName];
    if (!month) return null;
    return `${year}-${month}-${day.padStart(2, "0")}`;
  }

  return null;
}
