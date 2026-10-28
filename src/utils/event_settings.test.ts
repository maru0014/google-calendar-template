// @vitest-environment happy-dom
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { apply_event_settings } from './event_settings';
import type { Template, FieldSetResult } from '../types';

const template: Template = { id: 'test', name: 'test', title: '', description: '', order: 0, createdAt: 1, updatedAt: 1 };
const base = '<main role="main"><input aria-label="タイトル"><input type="checkbox" aria-label="終日"><ul aria-label="通知"></ul><button aria-label="通知を追加"></button></main>';
const row_html = (minutes = 30, method = '3', unit = '60'): string => `<li data-is-all-day="false"><div role="combobox" aria-label="通知方法" aria-controls="method_${minutes}"></div><ul id="method_${minutes}"><li role="option" aria-selected="true" data-value="${method}"></li></ul><div role="combobox" aria-label="時間の選択単位" aria-controls="unit_${minutes}"></div><ul id="unit_${minutes}"><li role="option" aria-selected="true" data-value="${unit}"></li></ul><input type="number" value="${minutes}"><button aria-label="通知を削除"></button></li>`;
const setup_rows = (html: string): void => {
  document.querySelector('ul[aria-label="通知"]')!.innerHTML = html;
  document.querySelectorAll<HTMLButtonElement>('[aria-label="通知を削除"]').forEach((button) => button.onclick = () => button.parentElement!.remove());
};
const apply = async (settings: Partial<Template>, fullpage = true, initial: FieldSetResult[] = []): Promise<FieldSetResult[]> => {
  await apply_event_settings({ ...template, ...settings }, fullpage, initial); return initial;
};
beforeEach(() => {
  document.body.innerHTML = base;
  vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('既存通知・未指定の保護', () => {
  const interactive_rows = (): void => {
    let serial = 100;
    const make_row = (minutes: number): HTMLElement => {
      const row = document.createElement('li'); row.setAttribute('data-is-all-day', 'false');
      const add_control = (label: string, choices: string[], selected: string): void => {
        const control = document.createElement('div'); control.setAttribute('role', 'combobox'); control.setAttribute('aria-label', label);
        const list = document.createElement('ul'); list.id = `choices_${serial++}`; control.setAttribute('aria-controls', list.id);
        control.setAttribute('aria-expanded', 'false'); control.onclick = () => control.setAttribute('aria-expanded', 'true');
        for (const choice of choices) {
          const option = document.createElement('li'); option.setAttribute('role', 'option'); option.setAttribute('data-value', choice);
          option.setAttribute('aria-selected', String(choice === selected));
          option.onclick = () => {
            list.querySelectorAll('li').forEach((other) => other.setAttribute('aria-selected', String(other === option)));
            control.setAttribute('aria-expanded', 'false');
          }; list.append(option);
        }
        row.append(control, list);
      };
      add_control('通知方法', ['1', '3'], '3'); add_control('時間の選択単位', ['60', '3600'], '60');
      const input = document.createElement('input'); input.type = 'number'; input.value = String(minutes);
      row.setAttribute('aria-label', `${minutes} 分前`);
      input.onchange = () => row.setAttribute('aria-label', Number(input.value) === 0 ? '予定の開始時刻' : `${input.value} 分前`);
      const remove = document.createElement('button'); remove.setAttribute('aria-label', '通知を削除'); remove.onclick = () => row.remove();
      row.append(input, remove); return row;
    };
    const list = document.querySelector('ul[aria-label="通知"]')!;
    list.append(make_row(30));
    (document.querySelector('[aria-label="通知を追加"]') as HTMLButtonElement).onclick = () => list.append(make_row(10));
  };
  it('既存行を再利用して置換し、異なる方式を追加し、反復で増やさない', async () => {
    interactive_rows();
    expect((await apply({ reminders: { mode: 'replace', items: [{ method: 'email', minutes: 60 }] } }))[0].success).toBe(true);
    const append = { reminders: { mode: 'append' as const, items: [{ method: 'notification' as const, minutes: 60 }] } };
    expect((await apply(append))[0].success).toBe(true);
    expect((await apply(append))[0].success).toBe(true);
    expect(document.querySelectorAll('ul[aria-label="通知"] > li')).toHaveLength(2);
    expect((await apply({ reminders: { mode: 'replace', items: [{ method: 'notification', minutes: 0 }] } }))[0].success).toBe(true);
    expect(document.querySelectorAll('ul[aria-label="通知"] > li')).toHaveLength(1);
    expect((document.querySelector('input[type="number"]') as HTMLInputElement).value).toBe('0');
  });
  it('旧テンプレートはDOMを探索すらしない', async () => {
    const spy = vi.spyOn(document, 'querySelectorAll');
    expect(await apply({})).toEqual([]); expect(spy).not.toHaveBeenCalled();
  });
  it('小さい画面は成功扱いせず案内', async () => {
    expect(await apply({ reminders: { mode: 'none' }, event_color: { mode: 'default' } }, false)).toEqual([
      expect.objectContaining({ field: 'reminders', success: false }), expect.objectContaining({ field: 'event_color', success: false }),
    ]);
  });
  it('終日は既存通知を変更しない', async () => {
    setup_rows(row_html()); (document.querySelector('[aria-label="終日"]') as HTMLInputElement).checked = true;
    expect((await apply({ reminders: { mode: 'none' } }))[0].success).toBe(false);
    expect(document.querySelectorAll('ul[aria-label="通知"] > li')).toHaveLength(1);
  });
  it('通知なしは全行削除し、再適用しても成功する', async () => {
    setup_rows(row_html(10) + row_html(30));
    expect((await apply({ reminders: { mode: 'none' } }))[0].success).toBe(true);
    expect(document.querySelectorAll('ul[aria-label="通知"] > li')).toHaveLength(0);
    expect((await apply({ reminders: { mode: 'none' } }))[0].success).toBe(true);
  });
  it('単位を分へ正規化しappendを繰り返しても追加しない', async () => {
    setup_rows(row_html(1, '1', '3600'));
    const click = vi.spyOn(document.querySelector('[aria-label="通知を追加"]') as HTMLElement, 'click');
    const settings = { reminders: { mode: 'append' as const, items: [{ method: 'email' as const, minutes: 60 }] } };
    expect((await apply(settings))[0].success).toBe(true);
    expect((await apply(settings))[0].success).toBe(true); expect(click).not.toHaveBeenCalled();
  });
  it('上限超過、壊れた通知、前提失敗では既存行を消さない', async () => {
    setup_rows([1, 2, 3, 4, 5].map((m) => row_html(m)).join(''));
    expect((await apply({ reminders: { mode: 'append', items: [{ method: 'email', minutes: 10 }] } }))[0].success).toBe(false);
    expect(document.querySelectorAll('ul[aria-label="通知"] > li')).toHaveLength(5);
    document.querySelector('input[type="number"]')!.remove();
    expect((await apply({ reminders: { mode: 'none' } }))[0].success).toBe(false);
    const result = await apply({ reminders: { mode: 'none' } }, true, [{ field: 'calendarName', success: false }]);
    expect(result[1].success).toBe(false);
  });
  it('通知更新途中の失敗は部分適用と伝える', async () => {
    setup_rows(row_html());
    vi.useFakeTimers();
    const pending = apply({ reminders: { mode: 'replace', items: [{ method: 'email', minutes: 20 }] } });
    await vi.runAllTimersAsync();
    const result = await pending; vi.useRealTimers();
    expect(result[0].success).toBe(false); expect(result[0].error).toContain('部分的');
  });
});

describe('予定色', () => {
  it('閉じたパレットがDOMに残る場合は再オープンせず選択を確認する', async () => {
    vi.mocked(Element.prototype.getClientRects).mockImplementation(function (this: Element) {
      return (this.closest('[hidden]') ? [] : [{}]) as unknown as DOMRectList;
    });
    const trigger = document.createElement('button');
    trigger.setAttribute('aria-label', 'カレンダーの色、予定の色'); trigger.setAttribute('aria-expanded', 'false');
    document.querySelector('main')!.append(trigger);
    const menu = document.createElement('div'); menu.setAttribute('role', 'menu'); menu.hidden = true;
    menu.innerHTML = '<button role="menuitemradio" aria-label="デフォルトの色" aria-checked="true"></button><button role="menuitemradio" data-color="#4285F4" aria-checked="false"></button>';
    document.body.append(menu);
    trigger.onclick = () => {
      menu.hidden = !menu.hidden; trigger.setAttribute('aria-expanded', String(!menu.hidden));
    };
    const click = vi.spyOn(trigger, 'click');
    const color = menu.querySelector<HTMLElement>('[data-color]')!;
    color.onclick = () => { color.setAttribute('aria-checked', 'true'); trigger.click(); };
    expect((await apply({ event_color: { mode: 'explicit', color_key: '#4285F4' } }))[0].success).toBe(true);
    expect(click).toHaveBeenCalledTimes(2); expect(menu.hidden).toBe(true);
  });
  it('タイトルが消え編集画面の再取得に失敗しても所有するパレットをEscapeで閉じる', async () => {
    vi.useFakeTimers();
    const trigger = document.createElement('button');
    trigger.setAttribute('aria-label', 'カレンダーの色、予定の色'); trigger.setAttribute('aria-expanded', 'false');
    const root = document.querySelector('main')!; root.append(trigger);
    const menu = document.createElement('div'); menu.setAttribute('role', 'menu');
    menu.innerHTML = '<button role="menuitemradio" aria-label="デフォルトの色" aria-checked="true"></button><button role="menuitemradio" data-color="#4285F4" aria-checked="false"></button>';
    trigger.onclick = () => { trigger.setAttribute('aria-expanded', 'true'); document.body.append(menu); };
    menu.querySelector<HTMLElement>('[data-color]')!.onclick = () => root.querySelector('input')!.remove();
    const escape = vi.fn((event: KeyboardEvent) => { if (event.key === 'Escape') menu.remove(); });
    menu.addEventListener('keydown', escape);
    const started = Date.now();
    const pending = apply({ event_color: { mode: 'explicit', color_key: '#4285F4' } });
    await vi.runAllTimersAsync();
    expect((await pending)[0].success).toBe(false);
    expect(escape).toHaveBeenCalledTimes(1); expect(menu.isConnected).toBe(false);
    expect(Date.now() - started).toBeLessThan(50);
  });
  it('トリガー再生成と遅延クローズでもパレットが閉じ終わってから完了する', async () => {
    vi.useFakeTimers();
    let trigger = document.createElement('button');
    trigger.setAttribute('aria-label', 'カレンダーの色、予定の色'); trigger.setAttribute('aria-expanded', 'false');
    document.querySelector('main')!.append(trigger);
    const menu = document.createElement('div'); menu.setAttribute('role', 'menu');
    menu.innerHTML = '<button role="menuitemradio" aria-label="デフォルトの色" aria-checked="true"></button><button role="menuitemradio" data-color="#4285F4" aria-checked="false"></button>';
    const toggle = (): void => {
      const open = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!open));
      if (open) setTimeout(() => menu.remove(), 150); else document.body.append(menu);
    };
    trigger.onclick = toggle;
    menu.querySelectorAll<HTMLElement>('button').forEach((button) => button.onclick = () => {
      menu.querySelectorAll('button').forEach((other) => other.setAttribute('aria-checked', String(other === button)));
      toggle();
      const fresh = trigger.cloneNode(true) as HTMLButtonElement;
      fresh.setAttribute('aria-label', 'コバルト、予定の色'); fresh.onclick = toggle;
      trigger.replaceWith(fresh); trigger = fresh;
    });
    let completed = false;
    const pending = apply({ event_color: { mode: 'explicit', color_key: '#4285F4' } });
    const tracked = (async () => { const result = await pending; completed = true; return result; })();
    await vi.advanceTimersByTimeAsync(50);
    expect(completed).toBe(false); expect(menu.isConnected).toBe(true);
    await vi.runAllTimersAsync();
    expect((await tracked)[0].success).toBe(true);
    expect(menu.isConnected).toBe(false); expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
  const palette = (): void => {
    const trigger = document.createElement('button'); trigger.setAttribute('aria-label', 'カレンダーの色、予定の色'); trigger.setAttribute('aria-expanded', 'false');
    document.querySelector('main')!.append(trigger);
    const menu = document.createElement('div'); menu.setAttribute('role', 'menu');
    menu.innerHTML = '<button role="menuitemradio" aria-label="デフォルトの色" aria-checked="true"></button><button role="menuitemradio" data-color="#4285F4" aria-checked="false"></button>';
    trigger.onclick = () => {
      const open = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!open)); if (open) menu.remove(); else document.body.append(menu);
    };
    menu.querySelectorAll<HTMLElement>('button').forEach((button) => button.onclick = () => {
      menu.querySelectorAll('button').forEach((other) => other.setAttribute('aria-checked', String(other === button)));
      trigger.setAttribute('aria-label', button.hasAttribute('data-color') ? 'コバルト、予定の色' : 'カレンダーの色、予定の色');
      trigger.click();
    });
  };
  it.each([false, true])('非表示後の反映遅延とDOM切断=%sでも現在の選択状態を確認する', async (detach) => {
    vi.useFakeTimers();
    vi.mocked(Element.prototype.getClientRects).mockImplementation(function (this: Element) {
      return (this.closest('[hidden]') ? [] : [{}]) as unknown as DOMRectList;
    });
    palette();
    const trigger = document.querySelector<HTMLElement>('[aria-label="カレンダーの色、予定の色"]')!;
    trigger.click();
    const menu = document.querySelector<HTMLElement>('[role="menu"]')!;
    const color = menu.querySelector<HTMLElement>('[data-color]')!;
    const toggle = trigger.onclick!;
    trigger.onclick = (event) => { menu.hidden = false; toggle.call(trigger, event); };
    color.onclick = () => {
      trigger.setAttribute('aria-expanded', 'false'); menu.hidden = true;
      setTimeout(() => {
        color.setAttribute('aria-checked', 'true');
        if (detach) menu.remove();
      }, 100);
    };
    let completed = false;
    const pending = apply({ event_color: { mode: 'explicit', color_key: '#4285F4' } });
    const tracked = (async () => { const result = await pending; completed = true; return result; })();
    await vi.advanceTimersByTimeAsync(50); expect(completed).toBe(false);
    await vi.runAllTimersAsync();
    expect((await tracked)[0].success).toBe(true);
    expect(menu.isConnected && !menu.hidden).toBe(false);
  });
  it('通常クローズが例外でもEscapeで閉じれば適用成功を維持する', async () => {
    palette();
    const trigger = document.querySelector<HTMLElement>('[aria-label="カレンダーの色、予定の色"]')!;
    trigger.click();
    const menu = document.querySelector<HTMLElement>('[role="menu"]')!;
    trigger.onclick = () => { throw new Error('close failed'); };
    menu.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') { menu.remove(); trigger.setAttribute('aria-expanded', 'false'); }
    });
    expect((await apply({ event_color: { mode: 'default' } }))[0].success).toBe(true);
    expect(menu.isConnected).toBe(false);
  });
  it.each([false, true])('後処理も失敗した場合は元の適用失敗=%sを優先し成功扱いしない', async (missing_color) => {
    vi.useFakeTimers(); palette();
    const trigger = document.querySelector<HTMLElement>('[aria-label="カレンダーの色、予定の色"]')!;
    trigger.click(); trigger.onclick = () => { throw new Error('close failed'); };
    const pending = apply({ event_color: missing_color ? { mode: 'explicit', color_key: '#D50000' } : { mode: 'default' } });
    await vi.runAllTimersAsync();
    const result = (await pending)[0];
    expect(result.success).toBe(false);
    expect(result.error).toContain(missing_color ? '指定した予定色' : '画面の反映');
  });
  it('指定色・既定色を区別して選択状態を読戻す', async () => {
    palette();
    expect((await apply({ event_color: { mode: 'explicit', color_key: '#4285F4' } }))[0].success).toBe(true);
    expect((await apply({ event_color: { mode: 'default' } }))[0].success).toBe(true);
  });
  it('候補がない色は誤選択しない', async () => {
    palette(); expect((await apply({ event_color: { mode: 'explicit', color_key: '#D50000' } }))[0].success).toBe(false);
    expect(document.querySelector('[aria-expanded="false"]')).not.toBeNull();
  });
  it('カレンダー自体の色ボタンは予定色ボタンと取り違えない', async () => {
    const calendar_color = document.createElement('button');
    calendar_color.setAttribute('aria-label', 'ローズ、カレンダーの色');
    document.querySelector('main')!.append(calendar_color);
    const click = vi.spyOn(calendar_color, 'click');
    expect((await apply({ event_color: { mode: 'default' } }))[0].success).toBe(false);
    expect(click).not.toHaveBeenCalled();
  });
  it('クリックできても選択状態が変わらなければ成功にしない', async () => {
    palette();
    const trigger = document.querySelector('[aria-label="カレンダーの色、予定の色"]') as HTMLElement;
    trigger.click();
    (document.querySelector('[data-color]') as HTMLElement).onclick = () => trigger.click();
    trigger.click();
    expect((await apply({ event_color: { mode: 'explicit', color_key: '#4285F4' } }))[0].success).toBe(false);
  });
});
