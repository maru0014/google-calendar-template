// @vitest-environment happy-dom
import { beforeEach, describe, it, expect } from 'vitest';
import { load_settings_form, read_settings_form } from './template_settings_form';
import type { Template } from '../types';

const old_template: Template = { id: 'old', name: 'old', title: 'old', description: '', order: 0, createdAt: 1, updatedAt: 2 };
const select = (id: string, value: string): void => {
  (document.getElementById(id) as HTMLSelectElement).value = value;
  document.getElementById(id)!.dispatchEvent(new Event('change', { bubbles: true }));
};
beforeEach(() => { document.body.innerHTML = '<fieldset id="template_settings"></fieldset>'; });

describe('管理フォームでの後方互換性・設定解除', () => {
  it('旧テンプレートの編集で新設定を勝手に追加しない', () => {
    load_settings_form(old_template);
    expect(read_settings_form()).toEqual({ reminders: undefined, event_color: undefined });
    expect((document.getElementById('reminder_minutes_0') as HTMLInputElement).disabled).toBe(true);
  });
  it('設定の読込と再保存・未指定への解除を区別', () => {
    const settings = { reminders: { mode: 'replace' as const, items: [{ method: 'email' as const, minutes: 60 }] }, event_color: { mode: 'explicit' as const, color_key: '#4285F4' } };
    load_settings_form({ ...old_template, ...settings });
    expect(read_settings_form()).toEqual(settings);
    select('reminder_mode', ''); select('event_color', '');
    const saved = { ...old_template, ...settings, ...read_settings_form() };
    expect(saved.reminders).toBeUndefined(); expect(saved.event_color).toBeUndefined();
    expect(JSON.parse(JSON.stringify(saved))).toEqual(old_template);
  });
  it('通知なしと既定色を明示でき、新規作成で前回の値を残さない', () => {
    load_settings_form(old_template);
    select('reminder_mode', 'none'); select('event_color', 'default');
    expect(read_settings_form()).toEqual({ reminders: { mode: 'none' }, event_color: { mode: 'default' } });
    load_settings_form(); expect(read_settings_form()).toEqual({ reminders: undefined, event_color: undefined });
  });
  it('空通知・空の数値を0へ化けさせずエラーにする', () => {
    load_settings_form(); select('reminder_mode', 'append');
    select('reminder_method_0', '');
    expect(() => read_settings_form()).toThrow();
    select('reminder_method_0', 'email');
    (document.getElementById('reminder_minutes_0') as HTMLInputElement).value = '';
    expect(() => read_settings_form()).toThrow();
  });
  it('通知ありは初期1行で、追加時にだけ行を増やし5件で止める', () => {
    load_settings_form();
    const row = (index: number): HTMLElement => document.getElementById(`reminder_row_${index}`)!;
    expect(row(0).hidden).toBe(true);
    select('reminder_mode', 'replace');
    expect(row(0).hidden).toBe(false); expect(row(1).hidden).toBe(true);
    expect(read_settings_form().reminders).toEqual({ mode: 'replace', items: [{ method: 'notification', minutes: 10 }] });
    const add = document.getElementById('add_reminder') as HTMLButtonElement;
    for (let index = 1; index < 5; index++) { add.click(); expect(row(index).hidden).toBe(false); }
    expect(add.disabled).toBe(true);
    expect(document.activeElement?.id).toBe('reminder_method_4');
    select('reminder_mode', 'none'); expect(row(0).hidden).toBe(true); expect(add.hidden).toBe(true);
  });
  it('保存済み複数行を保持し、中間の削除は後続を詰めて隠れた値を保存しない', () => {
    const items = [{ method: 'notification' as const, minutes: 10 }, { method: 'email' as const, minutes: 20 }, { method: 'notification' as const, minutes: 30 }];
    load_settings_form({ ...old_template, reminders: { mode: 'append', items } });
    expect(document.getElementById('reminder_row_2')!.hidden).toBe(false);
    expect(read_settings_form().reminders).toEqual({ mode: 'append', items });
    (document.querySelector('[aria-label="通知2を削除"]') as HTMLButtonElement).click();
    expect(read_settings_form().reminders).toEqual({ mode: 'append', items: [items[0], items[2]] });
    expect(document.getElementById('reminder_row_2')!.hidden).toBe(true);
    load_settings_form(); select('reminder_mode', 'replace');
    expect(read_settings_form().reminders).toEqual({ mode: 'replace', items: [{ method: 'notification', minutes: 10 }] });
  });
  it('最後の1行を削除すると通知なしになり、再選択で初期1行に戻る', () => {
    load_settings_form(); select('reminder_mode', 'replace');
    (document.querySelector('[aria-label="通知1を削除"]') as HTMLButtonElement).click();
    expect(read_settings_form().reminders).toEqual({ mode: 'none' });
    select('reminder_mode', 'replace');
    expect(read_settings_form().reminders).toEqual({ mode: 'replace', items: [{ method: 'notification', minutes: 10 }] });
  });
});
