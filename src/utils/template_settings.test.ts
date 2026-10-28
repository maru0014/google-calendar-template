import { describe, it, expect } from 'vitest';
import { parse_reminders, parse_event_color, parse_reminder_label } from './template_settings';

describe('通知・色の保存形式', () => {
  it('通知の表示を分へ換算し、未知の表示を推測しない', () => {
    expect(parse_reminder_label('予定の開始時刻')).toBe(0);
    expect(parse_reminder_label('1 時間前')).toBe(60);
    expect(parse_reminder_label('2 日前')).toBe(2880);
    expect(parse_reminder_label('1 week before')).toBe(10080);
    expect(parse_reminder_label('4 週間前')).toBe(40320);
    expect(parse_reminder_label('明日')).toBeUndefined();
  });
  it('有効な小文字HEXは正規化する', () => {
    expect(parse_event_color({ mode: 'explicit', color_key: '#4285f4' })).toEqual({ mode: 'explicit', color_key: '#4285F4' });
  });
  it('欠落は未指定で、明示なし・既定色とは区別する', () => {
    expect(parse_reminders(undefined)).toBeUndefined();
    expect(parse_event_color(undefined)).toBeUndefined();
    expect(parse_reminders({ mode: 'none' })).toEqual({ mode: 'none' });
    expect(parse_event_color({ mode: 'default' })).toEqual({ mode: 'default' });
  });
  it.each([null, {}, { mode: 'none', items: [] }, { mode: 'append', items: [] },
    ...[-1, 0.5, Infinity, NaN, 40321, '10'].map((minutes) => ({ mode: 'replace', items: [{ method: 'email', minutes }] })),
    { mode: 'append', items: [{ method: 'sms', minutes: 10 }] },
  ])('不正な通知を黙って未指定にしない: %j', (value) => {
    expect(() => parse_reminders(value)).toThrow();
  });
  it('方式を区別し同じ通知の重複だけ除く', () => {
    expect(parse_reminders({ mode: 'append', items: [
      { method: 'email', minutes: 0 }, { method: 'email', minutes: 0 }, { method: 'notification', minutes: 0 },
    ] })).toEqual({ mode: 'append', items: [{ method: 'email', minutes: 0 }, { method: 'notification', minutes: 0 }] });
  });
  it.each([null, { mode: 'default', color_key: '#4285F4' }, { mode: 'explicit', color_key: 'blue' }, { mode: 'explicit', color_key: '#000000' }])('無効な色は拒否: %j', (value) => {
    expect(() => parse_event_color(value)).toThrow();
  });
});
