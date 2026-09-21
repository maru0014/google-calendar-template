import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyTemplate } from './template-applier';
import { detectCurrentView } from './dom';
import { CALENDAR_SELECTORS } from '../constants/selectors';

vi.mock('./dom', () => ({
  detectCurrentView: vi.fn(),
  getElement: vi.fn(() => null),
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe.each(['popup', 'fullpage'] as const)('カレンダー選択: %s', (view_type) => {
  it.each([
    { names: ['Work External'], expected_index: -1 },
    { names: ['Work External', 'Work Private'], expected_index: -1 },
    { names: ['Personal'], expected_index: -1 },
    { names: [], expected_index: -1 },
    { names: ['Work External', 'Work'], expected_index: 1 },
    { names: ['Work'], expected_index: 0 },
  ])('候補 $names では選択位置 $expected_index', async ({ names, expected_index }) => {
    vi.mocked(detectCurrentView).mockReturnValue({
      isPopup: view_type === 'popup', isFullPage: view_type === 'fullpage',
    });
    const items = names.map((name) => ({
      textContent: name,
      querySelector: () => null,
      click: vi.fn(),
    }));
    vi.stubGlobal('document', {
      querySelector: (selector: string) =>
        selector === CALENDAR_SELECTORS.list[0] ? { querySelectorAll: () => items } : null,
    });
    const pending = applyTemplate({
      id: 'test', name: 'test', title: '', description: '', calendarName: 'Work',
      order: 0, createdAt: 0, updatedAt: 0,
    });
    await vi.runAllTimersAsync();
    const result = await pending;
    expect(result.success).toBe(expected_index >= 0);
    expect(result.failedFields).toEqual(expected_index < 0 ? ['calendarName'] : undefined);
    items.forEach((item, index) => {
      expect(item.click).toHaveBeenCalledTimes(index === expected_index ? 1 : 0);
    });
  });
});
