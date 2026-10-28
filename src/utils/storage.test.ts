import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTemplates, importData, saveTemplate, deleteTemplate, exportData } from './storage';

type Store = Record<string, unknown>;

let store: Store;
let set_calls: number;
let fail_next_get: boolean;

beforeEach(() => {
  store = {};
  set_calls = 0;
  fail_next_get = false;
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  (globalThis as any).chrome = {
    storage: {
      local: {
        get: async (key: string) => {
          if (fail_next_get) {
            fail_next_get = false;
            throw new Error('storage read failed');
          }
          return key in store ? { [key]: store[key] } : {};
        },
        set: async (items: Store) => {
          set_calls++;
          Object.assign(store, items);
        },
      },
    },
  };
});

const seed = [
  { id: 'a', name: 'A', title: 'A', description: '', order: 0, createdAt: 1, updatedAt: 1 },
];

describe('通知・色のJSON互換性', () => {
  it('旧形式の既存項目と出力配列を維持する', async () => {
    await importData(JSON.stringify(seed));
    const [saved] = JSON.parse(await exportData());
    expect(saved).toEqual(seed[0]);
    expect(saved).not.toHaveProperty('reminders');
    expect(saved).not.toHaveProperty('event_color');
  });
  it('新設定をJSON往復しても保持する', async () => {
    const template = { ...seed[0], reminders: { mode: 'replace', items: [{ method: 'email', minutes: 60 }] }, event_color: { mode: 'explicit', color_key: '#4285F4' } };
    await importData(JSON.stringify([template]));
    const exported = await exportData();
    store = {};
    await importData(exported);
    expect(JSON.parse(await exportData())).toEqual([template]);
  });
  it('後ろのレコードが不正でも既存データとバックアップを変更しない', async () => {
    store.templates = seed;
    store.templates_backups = [{ templates: seed, backedUpAt: 1 }];
    const before = JSON.stringify(store);
    await expect(importData(JSON.stringify([seed[0], { ...seed[0], reminders: null }]))).rejects.toThrow();
    expect(set_calls).toBe(0);
    expect(JSON.stringify(store)).toBe(before);
  });
});

describe('B03: 読み込み失敗時に既存データを上書きしない', () => {
  it('getTemplates は読み込み失敗を空配列にせず例外を投げる', async () => {
    fail_next_get = true;
    await expect(getTemplates()).rejects.toThrow('storage read failed');
  });

  it('importData は読み込み失敗後に書き込みを行わない', async () => {
    store.templates = seed;
    fail_next_get = true;
    const json = JSON.stringify([{ name: 'N', title: 'T' }]);
    await expect(importData(json)).rejects.toThrow();
    expect(set_calls).toBe(0);
    expect(store.templates).toEqual(seed);
  });

  it('saveTemplate / deleteTemplate も読み込み失敗後に書き込みを行わない', async () => {
    store.templates = seed;
    fail_next_get = true;
    await expect(
      saveTemplate({ name: 'N', title: 'T', description: '' })
    ).rejects.toThrow();
    fail_next_get = true;
    await expect(deleteTemplate('a')).rejects.toThrow();
    expect(set_calls).toBe(0);
    expect(store.templates).toEqual(seed);
  });
});

describe('B04: インポートファイル内のID重複', () => {
  it('同じIDを持つ2件は一意なIDで保存され、1件だけ削除できる', async () => {
    const json = JSON.stringify([
      { id: 'dup', name: 'N1', title: 'T1' },
      { id: 'dup', name: 'N2', title: 'T2' },
    ]);
    await importData(json);
    const saved = (store.templates as { id: string; name: string }[]) ?? [];
    expect(saved).toHaveLength(2);
    expect(new Set(saved.map((t) => t.id)).size).toBe(2);
    expect(saved[0].id).toBe('dup');

    await deleteTemplate(saved[1].id);
    const after = store.templates as { name: string }[];
    expect(after.map((t) => t.name)).toEqual(['N1']);
  });
});
