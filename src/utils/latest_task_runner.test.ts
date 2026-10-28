import { describe, it, expect, vi } from 'vitest';
import { create_latest_task_runner } from './latest_task_runner';

describe('高速切替の直列化', () => {
  it('進行中は完了を待ち、待機中の中間要求を捨てて最後だけ実行する', async () => {
    const schedule = create_latest_task_runner();
    const calls: string[] = [];
    let finish!: () => void;
    let current!: () => boolean;
    const first = schedule(async (is_current) => {
      calls.push('first:start'); current = is_current;
      await new Promise<void>((resolve) => { finish = resolve; }); calls.push('first:end');
    });
    await Promise.resolve();
    const skipped = vi.fn(async () => {});
    const middle = schedule(skipped);
    const last = schedule(async () => { calls.push('last'); });
    expect(current()).toBe(false); expect(calls).toEqual(['first:start']);
    finish(); await Promise.all([first, middle, last]);
    expect(skipped).not.toHaveBeenCalled();
    expect(calls).toEqual(['first:start', 'first:end', 'last']);
  });
  it('失敗しても次の要求の実行を妨げない', async () => {
    const schedule = create_latest_task_runner();
    const first = schedule(async () => { throw new Error('failed'); });
    await expect(first).rejects.toThrow('failed');
    const next = vi.fn(async () => {}); await schedule(next); expect(next).toHaveBeenCalledOnce();
  });
});
