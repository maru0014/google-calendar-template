import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadTemplates, onStorageChange } from '../utils/storage';
import { applyTemplate } from '../utils/template-applier';
import { POPUP_SELECTORS, FULLPAGE_SELECTORS } from '../constants/selectors';
import type { Template } from '../types';

vi.mock('../utils/storage', () => ({ loadTemplates: vi.fn(), onStorageChange: vi.fn() }));
vi.mock('../utils/template-applier', () => ({ applyTemplate: vi.fn(async () => ({ success: true })) }));
vi.mock('../utils/dom', () => ({ waitForElement: vi.fn(async () => ({})) }));

class MockElement {
  id = ''; value = ''; textContent = ''; className = '';
  style: Record<string, string> = {};
  children: MockElement[] = [];
  parentElement: MockElement | null = null;
  nextElementSibling: MockElement | null = null;
  events: Record<string, (event: Event) => unknown> = {};
  constructor(public tagName: string) {}
  appendChild(child: MockElement) { this.children.push(child); child.parentElement = this; return child; }
  insertBefore(child: MockElement) { return this.appendChild(child); }
  replaceChildren() { this.children = []; this.value = ''; }
  setAttribute() {}
  addEventListener(name: string, handler: (event: Event) => unknown) { this.events[name] = handler; }
}
const seed: Template = { id: 'a', name: 'Original', title: 'Old title', description: '', order: 0, createdAt: 0, updatedAt: 0 };
let templates: Template[];
let storage_changed: Parameters<typeof onStorageChange>[0];
let mutation: () => Promise<void>;
let document_mock: { getElementById: (id: string) => MockElement | undefined };

beforeEach(() => {
  vi.resetModules(); vi.useFakeTimers(); vi.clearAllMocks();
  templates = [{ ...seed }];
  vi.mocked(loadTemplates).mockImplementation(async () => structuredClone(templates));
  vi.mocked(onStorageChange).mockImplementation((callback) => { storage_changed = callback; });
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('alert', vi.fn());
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

async function open_editor(view_type: 'popup' | 'fullpage', inject = true) {
  const body = new MockElement('BODY');
  const title = new MockElement('INPUT');
  const grandparent = body.appendChild(new MockElement('DIV'));
  grandparent.appendChild(new MockElement('DIV')).appendChild(title);
  const header = new MockElement('H2'); header.textContent = '予定の詳細';
  header.nextElementSibling = body.appendChild(new MockElement('DIV'));
  const find = (element: MockElement, id: string): MockElement | undefined =>
    element.id === id ? element : element.children.map((child) => find(child, id)).find(Boolean);
  document_mock = {
    getElementById: (id) => find(body, id),
  };
  vi.stubGlobal('document', {
    ...document_mock, body, readyState: 'complete', createElement: (tag: string) => new MockElement(tag.toUpperCase()),
    querySelector: (selector: string) => {
      if (selector === POPUP_SELECTORS.dialog && view_type === 'popup') return { querySelector: () => title };
      if (selector === FULLPAGE_SELECTORS.title && view_type === 'fullpage') return title;
      if (selector === POPUP_SELECTORS.titleRelative) return title;
      return null;
    },
    querySelectorAll: (selector: string) => selector === 'h2' ? [header] : [],
  });
  vi.stubGlobal('window', { location: { href: 'https://calendar.google.com/' } });
  vi.stubGlobal('location', { hostname: 'calendar.google.com' });
  vi.stubGlobal('getComputedStyle', () => ({ backgroundColor: 'rgb(255,255,255)' }));
  vi.stubGlobal('MutationObserver', class { constructor(callback: () => Promise<void>) { mutation = callback; } observe() {} });
  await import('./index');
  if (inject) {
    const pending = mutation(); await vi.runAllTimersAsync(); await pending;
  }
}
const selector = () => document_mock.getElementById('calendar-template-select')!;
const labels = () => selector().children.map((option) => option.textContent);
async function choose(id: string) {
  const select = selector(); select.value = id;
  await select.events.change({ target: select, stopPropagation() {}, preventDefault() {} } as unknown as Event);
}
function publish(next: Template[]) {
  templates = next;
  storage_changed({ templates: { newValue: structuredClone(next) } });
}

describe.each(['popup', 'fullpage'] as const)('B09: %s の開いたエディタ', (view_type) => {
  it('追加・編集・並べ替えを反映し、存続する選択IDを保つ', async () => {
    await open_editor(view_type); selector().value = 'a';
    publish([{ ...seed, id: 'b', name: 'Added' }, { ...seed, name: 'Edited', title: 'New title' }]);
    expect(labels().slice(1)).toEqual(['Added', 'Edited']);
    expect(selector().value).toBe('a');
    await choose('a');
    expect(applyTemplate).toHaveBeenCalledWith(expect.objectContaining({ title: 'New title' }));
  });
  it('削除後は選択を解除し、古いIDを適用しない', async () => {
    await open_editor(view_type); selector().value = 'a'; publish([]);
    expect(selector().value).toBe('');
    expect(labels()).toEqual(['テンプレートなし（拡張機能から作成）']);
    await choose('a'); expect(applyTemplate).toHaveBeenCalledTimes(0);
  });
  it('変更通知前でも適用時に最新データを読み、削除を検出する', async () => {
    await open_editor(view_type); templates = [];
    await choose('a'); expect(applyTemplate).toHaveBeenCalledTimes(0);
  });
  it('変更通知前でも編集された最新値を適用する', async () => {
    await open_editor(view_type); templates = [{ ...seed, title: 'Fresh title' }];
    await choose('a');
    expect(applyTemplate).toHaveBeenCalledWith(expect.objectContaining({ title: 'Fresh title' }));
  });
  it('読み込み失敗時に古いデータを適用しない', async () => {
    await open_editor(view_type); vi.mocked(loadTemplates).mockRejectedValueOnce(new Error('read failed'));
    await choose('a'); expect(applyTemplate).toHaveBeenCalledTimes(0); expect(alert).toHaveBeenCalled();
  });
  it('0件から追加でき、短時間の連続変更は最後の一覧を表示する', async () => {
    templates = []; await open_editor(view_type);
    publish([{ ...seed }]); publish([{ ...seed, name: 'Latest' }]);
    expect(labels().slice(1)).toEqual(['Latest']);
    storage_changed({ selectedTemplateId: { newValue: 'a' } });
    expect(labels().slice(1)).toEqual(['Latest']);
  });
  it('初回読込中の変更通知を古い応答で上書きしない', async () => {
    let resolve_read!: (value: Template[]) => void;
    vi.mocked(loadTemplates).mockImplementationOnce(() => new Promise((resolve) => { resolve_read = resolve; }));
    await open_editor(view_type, false);
    const pending = mutation(); await vi.runAllTimersAsync();
    publish([{ ...seed, name: 'Newest' }]); resolve_read([{ ...seed }]); await pending;
    expect(labels().slice(1)).toEqual(['Newest']);
  });
  it('適用の読込中に削除された項目を適用しない', async () => {
    await open_editor(view_type);
    let resolve_read!: (value: Template[]) => void;
    vi.mocked(loadTemplates).mockImplementationOnce(() => new Promise((resolve) => { resolve_read = resolve; }));
    const pending = choose('a'); publish([]); resolve_read([{ ...seed }]); await pending;
    expect(applyTemplate).toHaveBeenCalledTimes(0);
  });
});
