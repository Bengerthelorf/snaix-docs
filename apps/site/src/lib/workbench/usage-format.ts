const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function dayLabel(date: Date): string {
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

// Explicit English labels keep SSR and browser text identical across ICU versions.
// Inputs are the example dataset's ISO timestamps or generated YYYY-MM-DD dates.
export function formatUsageDay(timestamp: string): string {
  return dayLabel(new Date(timestamp));
}

export function formatUsageSessionTime(timestamp: string): string {
  const date = new Date(timestamp);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${dayLabel(date)}, ${hours}:${minutes}`;
}

export function formatUsageRange(start: string, end: string): string {
  const startDate = new Date(start), endDate = new Date(end);
  const endLabel = `${dayLabel(endDate)}, ${endDate.getUTCFullYear()}`;
  if (startDate.toISOString().slice(0, 10) === endDate.toISOString().slice(0, 10)) return endLabel;
  const startLabel = startDate.getUTCFullYear() === endDate.getUTCFullYear()
    ? dayLabel(startDate)
    : `${dayLabel(startDate)}, ${startDate.getUTCFullYear()}`;
  return `${startLabel}–${endLabel}`;
}
