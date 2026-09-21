import { describe, it, expect, afterEach, vi } from 'vitest';
import { getAllVariables } from './variables';

function stub_document(options: {
  profile_label?: string;
  body_text?: string;
  select_text?: string;
}): void {
  const profile = options.profile_label
    ? { getAttribute: () => options.profile_label }
    : null;
  const select = options.select_text
    ? {
        options: [{ text: options.select_text }],
        selectedIndex: 0,
      }
    : null;
  (globalThis as any).document = {
    querySelector: (selector: string) => {
      if (selector.includes('Google アカウント')) return profile;
      if (selector === 'select') return select;
      return null;
    },
    querySelectorAll: () => [],
    body: { innerText: options.body_text ?? '' },
  };
}

afterEach(() => {
  vi.useRealTimers();
  delete (globalThis as any).document;
});

describe('B05: date 変数はローカル日付', () => {
  it('ローカル午前0:30でも date が当日になる（date_calendar と一致）', () => {
    stub_document({});
    vi.useFakeTimers();
    // ローカル時刻で 2026-09-19 00:30（日本時間なら UTC では前日）
    vi.setSystemTime(new Date(2026, 8, 19, 0, 30));
    const v = getAllVariables();
    expect(v.date).toBe('2026-09-19');
    expect(v.date_calendar).toBe('2026年 9月 19日');
    expect(v.time).toBe('00:30');
  });

  it('ローカル23:30でも date が当日になる', () => {
    stub_document({});
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 23, 30));
    expect(getAllVariables().date).toBe('2026-01-01');
  });
});

describe('B06: user_email / user_name', () => {
  it('プロフィールが取れない場合、本文中のゲストのメールを本人として使わない', () => {
    stub_document({ body_text: 'Guest: outsider@company.test' });
    expect(getAllVariables().user_email).toBeNull();
  });

  it('プロフィールの aria-label（日本語・英語）からメールと名前を取得する', () => {
    stub_document({ profile_label: 'Google アカウント: 山田 太郎 (taro@gmail.com)' });
    const v = getAllVariables();
    expect(v.user_email).toBe('taro@gmail.com');
    expect(v.user_name).toBe('山田 太郎');
  });

  it('user_name はページ内の <select>（テンプレート選択等）を使わない', () => {
    stub_document({ select_text: 'テンプレートを選択...' });
    expect(getAllVariables().user_name).toBeNull();
  });
});
