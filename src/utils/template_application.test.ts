import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyTemplate } from './template-applier';
import { detectCurrentView, getElement, setFieldValue } from './dom';
import { POPUP_SELECTORS, FULLPAGE_SELECTORS } from '../constants/selectors';
import type { Template } from '../types';

vi.mock('./dom', () => ({
  detectCurrentView: vi.fn(), getElement: vi.fn(),
  setFieldValue: vi.fn(), addGuest: vi.fn(() => true), closeFieldDropdown: vi.fn(),
}));
vi.mock('./variables', () => ({ replaceVariables: (value: string) => value }));

const empty_template: Template = {
  id: 'test', name: 'test', title: '', description: '', order: 0, createdAt: 0, updatedAt: 0,
};
let fields: Record<string, HTMLInputElement>;
const input = (value: string): HTMLInputElement => ({ value, dispatchEvent: vi.fn() } as unknown as HTMLInputElement);

beforeEach(() => {
  vi.useFakeTimers();
  fields = {};
  vi.mocked(getElement).mockImplementation((selector) => fields[selector] ?? null);
  vi.mocked(setFieldValue).mockImplementation((element, value) => {
    (element as HTMLInputElement).value = String(value);
    return true;
  });
  vi.stubGlobal('KeyboardEvent', class {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});

describe.each(['popup', 'fullpage'] as const)('B07/B08: %s', (view_type) => {
  beforeEach(() => {
    vi.mocked(detectCurrentView).mockReturnValue({ isPopup: view_type === 'popup', isFullPage: view_type === 'fullpage' });
  });
  const selectors = view_type === 'popup' ? POPUP_SELECTORS : FULLPAGE_SELECTORS;
  it.each([
    { requested: { title: 'Title' }, failed: ['title'] },
    { requested: { description: 'Details' }, failed: ['description'] },
    { requested: { location: 'Room' }, failed: ['location'] },
    { requested: { guests: ['a@example.test', 'b@example.test'] }, failed: ['guest:a@example.test', 'guest:b@example.test'] },
    { requested: { allDay: false }, failed: ['allDay'] },
  ])('指定された項目が欠落したら失敗: $failed', async ({ requested, failed }) => {
    const result = await applyTemplate({ ...empty_template, ...requested });
    expect(result).toEqual({ success: false, failedFields: failed });
  });
  it('空の任意項目は欠落していても失敗させない', async () => {
    expect((await applyTemplate(empty_template)).success).toBe(true);
  });
  it('存在するタイトルと説明には従来どおり空文字も適用する', async () => {
    fields[selectors.title] = input('Existing title');
    fields[selectors.description] = input('Existing description');
    expect((await applyTemplate(empty_template)).success).toBe(true);
    expect(fields[selectors.title].value).toBe('');
    expect(fields[selectors.description].value).toBe('');
  });
  it('指定項目の書込み失敗を返す', async () => {
    fields[selectors.title] = input('');
    vi.mocked(setFieldValue).mockReturnValue(false);
    expect((await applyTemplate({ ...empty_template, title: 'Title' })).failedFields).toEqual(['title']);
  });

  const seed_dates = (start_date = '2026-10-25', start_time = '09:00'): void => {
    fields[selectors.startDate] = input(start_date);
    fields[selectors.endDate] = input(start_date);
    fields[selectors.startTime] = input(start_time);
    fields[selectors.endTime] = input('10:00');
  };
  const apply_duration = async (duration = 1500) => {
    const pending = applyTemplate({ ...empty_template, duration });
    await vi.runAllTimersAsync();
    return pending;
  };
  it.each([
    { duration: 60, date: '2026-10-25', time: '10:00' },
    { duration: 1440, date: '2026-10-26', time: '09:00' },
    { duration: 1500, date: '2026-10-26', time: '10:00' },
    { duration: 2880, date: '2026-10-27', time: '09:00' },
  ])('$duration 分後の終了日と時刻を設定する', async ({ duration, date, time }) => {
    seed_dates();
    expect((await apply_duration(duration)).success).toBe(true);
    expect(fields[selectors.endDate].value).toBe(date);
    expect(fields[selectors.endTime].value).toBe(time);
  });
  it.each([
    { start_date: '2026/12/31', start_time: '23:30', date: '2027/01/01' },
    { start_date: '2028年 2月 28日', start_time: '11:30 PM', date: '2028年 2月 29日' },
  ])('日付形式と日跨ぎを保つ: $start_date', async ({ start_date, start_time, date }) => {
    seed_dates(start_date, start_time);
    expect((await apply_duration(60)).success).toBe(true);
    expect(fields[selectors.endDate].value).toBe(date);
    expect(fields[selectors.endTime].value).toBe('00:30');
  });
  it('同日内の期間は未対応の日付書式も従来どおり扱う', async () => {
    seed_dates('10/25/2026');
    expect((await apply_duration(60)).success).toBe(true);
    expect(fields[selectors.endDate].value).toBe('10/25/2026');
    expect(fields[selectors.endTime].value).toBe('10:00');
  });
  it('同日内へ短縮する際は開始日の表示値を終了日にコピーする', async () => {
    seed_dates('10/25/2026'); fields[selectors.endDate].value = '10/27/2026';
    expect((await apply_duration(60)).success).toBe(true);
    expect(fields[selectors.endDate].value).toBe('10/25/2026');
  });
  it.each(['startDate', 'endDate', 'startTime', 'endTime'] as const)('日時要素欠落で失敗: %s', async (field) => {
    seed_dates(); delete fields[selectors[field]];
    expect((await apply_duration()).failedFields).toEqual(['duration']);
  });
  it.each([
    { date: 'unsupported', time: '09:00', duration: 1500 },
    { date: '2026-02-30', time: '09:00', duration: 1500 },
    { date: '2026-10-25', time: '', duration: 1500 },
    { date: '2026-10-25', time: '09:00', duration: Infinity },
  ])('不正な日時・期間は成功させない: $date $time $duration', async ({ date, time, duration }) => {
    seed_dates(date, time);
    expect((await apply_duration(duration)).failedFields).toEqual(['duration']);
  });
  it('日付の確定で再生成された時刻フィールドに書き込む', async () => {
    seed_dates();
    const old_time = fields[selectors.endTime];
    const new_time = input('00:00');
    vi.mocked(setFieldValue).mockImplementation((element, value) => {
      (element as HTMLInputElement).value = String(value);
      if (element === fields[selectors.endDate]) fields[selectors.endTime] = new_time;
      return true;
    });
    expect((await apply_duration()).success).toBe(true);
    expect(old_time.value).toBe('10:00');
    expect(new_time.value).toBe('10:00');
    expect(new_time.dispatchEvent).toHaveBeenCalled();
  });
  it('成功を返すsetterでも日付が反映されなければ失敗', async () => {
    seed_dates();
    vi.mocked(setFieldValue).mockImplementation((element, value) => {
      if (element !== fields[selectors.endDate]) (element as HTMLInputElement).value = String(value);
      return true;
    });
    expect((await apply_duration()).failedFields).toEqual(['duration']);
  });
});

describe('B07: fullpage のゲスト権限', () => {
  it.each(['canModify', 'canInviteOthers', 'seeGuestList'] as const)('false指定でも欠落を返す: %s', async (field) => {
    vi.mocked(detectCurrentView).mockReturnValue({ isPopup: false, isFullPage: true });
    expect((await applyTemplate({ ...empty_template, guestPermissions: { [field]: false } })).failedFields)
      .toEqual([`guestPermissions.${field}`]);
  });
});
