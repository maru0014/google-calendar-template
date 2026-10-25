/** Advance a calendar date without parsing it through the host timezone. */
export function advance_calendar_date(date_value: string, days: number): string | null {
  const numeric = /^(\d{4})([-/])(\d{1,2})\2(\d{1,2})$/.exec(date_value.trim());
  const japanese = /^(\d{4})年(\s*)(\d{1,2})月(\s*)(\d{1,2})日$/.exec(date_value.trim());
  if ((!numeric && !japanese) || !Number.isSafeInteger(days) || days < 0) return null;
  const year = Number(numeric?.[1] ?? japanese?.[1]);
  const month_text = numeric?.[3] ?? japanese![3];
  const day_text = numeric?.[4] ?? japanese![5];
  const month = Number(month_text);
  const day = Number(day_text);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (year < 1000 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  date.setUTCDate(date.getUTCDate() + days);
  if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() > 9999) return null;
  const end_year = date.getUTCFullYear();
  const width = numeric
    ? (month_text.length === 2 && day_text.length === 2 ? 2 : 1)
    : (month_text.startsWith('0') || day_text.startsWith('0') ? 2 : 1);
  const end_month = String(date.getUTCMonth() + 1).padStart(width, '0');
  const end_day = String(date.getUTCDate()).padStart(width, '0');
  return numeric
    ? `${end_year}${numeric[2]}${end_month}${numeric[2]}${end_day}`
    : `${end_year}年${japanese![2]}${end_month}月${japanese![4]}${end_day}日`;
}
