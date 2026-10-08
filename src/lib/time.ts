// All scheduling happens in India Standard Time regardless of server timezone.
const IST_OFFSET_MIN = 330;

export function nowInIST() {
  const d = new Date(Date.now() + IST_OFFSET_MIN * 60_000);
  const date = d.toISOString().slice(0, 10);
  const time = d.toISOString().slice(11, 16);
  return { date, time };
}

export function addDays(date: string, days: number) {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isValidDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date));
}

export function formatDate(date: string) {
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export const BOOKING_WINDOW_DAYS = 30;
