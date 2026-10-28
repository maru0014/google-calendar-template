// @vitest-environment happy-dom
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { apply_popup_description, expand_popup_field, get_popup_editor } from './popup_editor';
import { apply_event_settings } from './event_settings';
import { applyTemplate } from './template-applier';
import { SETTINGS_SELECTORS as S } from '../constants/selectors';
import type { Template, FieldSetResult } from '../types';

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '<div role="dialog"><input aria-label="タイトルを追加"></div>';
  vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(function (this: Element) {
    return (this.closest('[hidden]') ? [] : [{}]) as unknown as DOMRectList;
  });
  // happy-domはinnerTextの<br>改行を落とすため、このfixtureではChromeの読戻しを再現する。
  vi.spyOn(HTMLElement.prototype, 'innerText', 'get').mockImplementation(function (this: HTMLElement) {
    return Array.from(this.childNodes).map((node) => node.nodeName === 'BR' ? '\n' : node.textContent ?? '').join('');
  });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

const description_fixture = (): { marker: HTMLElement; attachment: ReturnType<typeof vi.fn> } => {
  const root = get_popup_editor();
  root.insertAdjacentHTML('beforeend', '<button aria-controls="outer"><span data-key="description">説明</span><span>添付</span></button><div id="outer" hidden><button aria-controls="inner">説明を追加</button><div id="inner" hidden><div contenteditable="true" role="textbox" aria-labelledby="description_label"></div></div></div>');
  const outer_button = root.querySelector('button')!;
  const marker = root.querySelector<HTMLElement>('[data-key="description"]')!;
  const attachment = vi.fn();
  // 実UIと同じく親でクリック対象を判別する。バブリングを止めるテスト専用処理は使わない。
  outer_button.onclick = (event) => {
    if ((event.target as Element).closest('[data-key="description"]')) {
      setTimeout(() => { root.querySelector<HTMLElement>('#outer')!.hidden = false; outer_button.hidden = true; }, 150);
    } else attachment();
  };
  root.querySelector<HTMLButtonElement>('#outer > button')!.onclick = () => {
    setTimeout(() => { root.querySelector<HTMLElement>('#inner')!.hidden = false; }, 150);
  };
  return { marker, attachment };
};

describe('小さい予定画面の展開', () => {
  it('テンプレート適用の入口から折畳み説明を展開・反映する', async () => {
    description_fixture();
    const pending = applyTemplate({ id: 't', name: 't', title: '確認用タイトル', description: '確認用の説明', order: 0, createdAt: 1, updatedAt: 1 });
    await vi.runAllTimersAsync();
    expect(await pending).toEqual({ success: true, failedFields: undefined });
    expect((get_popup_editor().querySelector(S.popup_title) as HTMLInputElement).value).toBe('確認用タイトル');
    expect(get_popup_editor().querySelector<HTMLElement>(S.popup_description)!.innerText).toBe('確認用の説明');
  });
  it('説明専用クリックで2段階展開し、改行・HTML文字列を安全に入力する', async () => {
    const { attachment } = description_fixture();
    const pending = apply_popup_description('会議の説明\n<b>文字として入力</b>');
    await vi.runAllTimersAsync();
    expect(await pending).toEqual({ field: 'description', success: true });
    expect(attachment).not.toHaveBeenCalled();
    const field = get_popup_editor().querySelector<HTMLElement>(S.popup_description)!;
    expect(field.innerText).toBe('会議の説明\n<b>文字として入力</b>');
    expect(field.querySelector('b')).toBeNull();
  });
  it('既に展開済みなら展開ボタンを押さない', async () => {
    const { marker } = description_fixture();
    document.getElementById('outer')!.hidden = false; document.getElementById('inner')!.hidden = false;
    const clicked = vi.spyOn(marker, 'click');
    const pending = apply_popup_description('説明'); await vi.runAllTimersAsync();
    expect((await pending).success).toBe(true); expect(clicked).not.toHaveBeenCalled();
  });
  it('展開されなければ有界待機後に失敗する', async () => {
    const { marker } = description_fixture(); marker.parentElement!.onclick = () => {};
    const pending = apply_popup_description('説明'); await vi.runAllTimersAsync();
    expect((await pending).success).toBe(false);
  });
  it('別の予定領域のパネルを展開しない', async () => {
    const root = get_popup_editor();
    root.insertAdjacentHTML('beforeend', '<button aria-controls="foreign">展開</button>');
    document.body.insertAdjacentHTML('beforeend', '<div id="foreign" hidden><div contenteditable="true" role="textbox"></div></div>');
    const click = vi.spyOn(root.querySelector('button')!, 'click');
    const pending = expand_popup_field(root, S.popup_description).catch(() => null);
    await vi.runAllTimersAsync(); expect(await pending).toBeNull(); expect(click).not.toHaveBeenCalled();
  });
  it('待機中に予定画面が閉じられたら入力しない', async () => {
    description_fixture(); const root = get_popup_editor();
    const pending = apply_popup_description('説明'); setTimeout(() => root.remove(), 75);
    await vi.runAllTimersAsync(); expect((await pending).success).toBe(false);
  });
  it('色の未指定は設定欄を展開せず、指定色は展開後に選択確認する', async () => {
    const root = get_popup_editor();
    root.insertAdjacentHTML('beforeend', '<button aria-controls="settings">カレンダー設定</button><div id="settings" hidden><button aria-label="カレンダーの色、予定の色" aria-expanded="false"></button></div>');
    const expand = root.querySelector('button')!;
    expand.onclick = () => { document.getElementById('settings')!.hidden = false; expand.hidden = true; };
    const clicked = vi.spyOn(expand, 'click');
    const template: Template = { id: 't', name: 't', title: '', description: '', order: 0, createdAt: 1, updatedAt: 1 };
    const result: FieldSetResult[] = [];
    await apply_event_settings(template, false, result); expect(clicked).not.toHaveBeenCalled();
    const trigger = root.querySelector<HTMLElement>(S.color_trigger)!;
    const menu = document.createElement('div'); menu.setAttribute('role', 'menu');
    menu.innerHTML = '<button role="menuitemradio" aria-label="デフォルトの色" aria-checked="true"></button><button role="menuitemradio" data-color="#4285F4" aria-checked="false"></button>';
    trigger.onclick = () => {
      const open = trigger.getAttribute('aria-expanded') === 'true'; trigger.setAttribute('aria-expanded', String(!open));
      if (open) menu.remove(); else document.body.append(menu);
    };
    menu.querySelectorAll<HTMLElement>('button').forEach((button) => button.onclick = () => {
      menu.querySelectorAll('button').forEach((other) => other.setAttribute('aria-checked', String(other === button)));
      trigger.setAttribute('aria-label', button.hasAttribute('data-color') ? 'コバルト、予定の色' : 'カレンダーの色、予定の色');
      trigger.click();
    });
    const pending = apply_event_settings({ ...template, event_color: { mode: 'explicit', color_key: '#4285F4' } }, false, result);
    await vi.runAllTimersAsync(); await pending;
    expect(result).toEqual([{ field: 'event_color', success: true }]); expect(clicked).toHaveBeenCalledOnce();
    // 実UIは選択後にボタン名が変わる。同色反復→既定色→指定色でも展開/選択に失敗しない。
    for (const event_color of [
      { mode: 'explicit' as const, color_key: '#4285F4' },
      { mode: 'default' as const },
      { mode: 'explicit' as const, color_key: '#4285F4' },
    ]) {
      const next: FieldSetResult[] = [];
      const applied = apply_event_settings({ ...template, event_color }, false, next);
      await vi.runAllTimersAsync(); await applied;
      expect(next).toEqual([{ field: 'event_color', success: true }]);
    }
    expect(clicked).toHaveBeenCalledOnce();
  });
});
