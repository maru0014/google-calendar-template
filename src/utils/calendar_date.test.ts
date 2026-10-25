import { describe, expect, it } from 'vitest';
import { advance_calendar_date } from './calendar_date';

describe('終了日の繰越', () => {
  it.each([
    ['2026-10-25', 1, '2026-10-26'],
    ['2026/10/25', 2, '2026/10/27'],
    ['2026年 12月 31日', 1, '2027年 1月 1日'],
    ['2028-02-28', 1, '2028-02-29'],
    ['2026-02-28', 1, '2026-03-01'],
    ['2026/1/31', 1, '2026/2/1'],
    ['2026年01月31日', 1, '2026年02月01日'],
  ] as const)('%s + %s 日', (value, days, expected) => {
    expect(advance_calendar_date(value, days)).toBe(expected);
  });
  it.each(['2026-02-30', '2026-13-01', '10/25/2026', '', 'invalid'])('不明形式・不正日付を拒否: %s', (value) => {
    expect(advance_calendar_date(value, 1)).toBeNull();
  });
});
