import type { RemindersConfig, ReminderItem, EventColorConfig } from '../types';
import { EVENT_COLORS, MAX_REMINDERS, MAX_REMINDER_MINUTES } from '../constants/template_settings';

const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('設定形式が不正です');
  return value as Record<string, unknown>;
};

export const unique_reminders = (items: ReminderItem[]): ReminderItem[] =>
  items.filter((item, index) => items.findIndex((other) =>
    other.method === item.method && other.minutes === item.minutes) === index);

// 入力欄だけでなく、Calendarが更新した通知行の表示も確認する。
export const parse_reminder_label = (label: string | null): number | undefined => {
  if (!label) return undefined;
  const text = label.trim();
  if (text === '予定の開始時刻' || text === 'At time of event') return 0;
  const match = /^(\d+)\s*(分|時間|日|週間?|minutes?|hours?|days?|weeks?)\s*(前|before)$/i.exec(text);
  if (!match) return undefined;
  const unit = match[2].toLowerCase();
  const multiplier = unit === '分' || unit.startsWith('minute') ? 1 :
    unit === '時間' || unit.startsWith('hour') ? 60 : unit === '日' || unit.startsWith('day') ? 1440 : 10080;
  const minutes = Number(match[1]) * multiplier;
  return Number.isSafeInteger(minutes) ? minutes : undefined;
};

export const parse_reminders = (value: unknown): RemindersConfig | undefined => {
  if (value === undefined) return undefined;
  const config = record(value);
  if (config.mode === 'none' && !('items' in config)) return { mode: 'none' };
  if (config.mode !== 'replace' && config.mode !== 'append') throw new Error('通知の適用方法が不正です');
  if (!Array.isArray(config.items) || config.items.length === 0 || config.items.length > MAX_REMINDERS) {
    throw new Error('通知は1〜5件で指定してください');
  }
  const items = config.items.map((raw): ReminderItem => {
    const item = record(raw);
    if (item.method !== 'notification' && item.method !== 'email') throw new Error('通知方式が不正です');
    if (typeof item.minutes !== 'number' || !Number.isSafeInteger(item.minutes) ||
        item.minutes < 0 || item.minutes > MAX_REMINDER_MINUTES) throw new Error('通知は0〜40320分前の整数で指定してください');
    return { method: item.method, minutes: item.minutes };
  });
  return { mode: config.mode, items: unique_reminders(items) };
};

export const parse_event_color = (value: unknown): EventColorConfig | undefined => {
  if (value === undefined) return undefined;
  const config = record(value);
  if (config.mode === 'default' && !('color_key' in config)) return { mode: 'default' };
  const color_key = typeof config.color_key === 'string' ? config.color_key.toUpperCase() : '';
  if (config.mode !== 'explicit' || !EVENT_COLORS.some(([key]) => key === color_key)) throw new Error('予定色の設定が不正です');
  return { mode: 'explicit', color_key };
};
