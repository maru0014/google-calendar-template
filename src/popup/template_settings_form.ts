import type { Template } from '../types';
import { EVENT_COLORS, MAX_REMINDERS, MAX_REMINDER_MINUTES } from '../constants/template_settings';
import { parse_event_color, parse_reminders } from '../utils/template_settings';

const select_input = (id: string): HTMLSelectElement => document.getElementById(id) as HTMLSelectElement;
const number_input = (id: string): HTMLInputElement => document.getElementById(id) as HTMLInputElement;

export const mount_settings_form = (): void => {
  if (document.getElementById('reminder_mode')) return;
  const container = document.getElementById('template_settings')!;
  const add_select = (label: string, id: string, options: ReadonlyArray<readonly [string, string]>): HTMLSelectElement => {
    const wrapper = document.createElement('label'); wrapper.textContent = label;
    const select = document.createElement('select'); select.id = id; select.setAttribute('aria-label', label);
    wrapper.htmlFor = id;
    for (const [value, text] of options) {
      const option = document.createElement('option'); option.value = value; option.textContent = text;
      select.add(option);
    }
    wrapper.append(select); container.append(wrapper); return select;
  };
  const mode = add_select('通知の適用方法', 'reminder_mode', [
    ['', '未指定（変更しない）'], ['none', '通知なし（既存の通知を削除）'],
    ['replace', '通知あり（既存を置換）'], ['append', '通知あり（既存に追加・重複しない）'],
  ]);
  container.dataset.reminderCount = '1';
  const rows = document.createElement('div'); rows.className = 'reminder_rows'; container.append(rows);
  for (let index = 0; index < MAX_REMINDERS; index++) {
    const group = document.createElement('div'); group.id = `reminder_row_${index}`; group.className = 'reminder_row';
    group.setAttribute('role', 'group'); group.setAttribute('aria-label', `通知${index + 1}`);
    const method = add_select('方式', `reminder_method_${index}`, [['', '使用しない'], ['notification', '通知'], ['email', 'メール']]);
    method.setAttribute('aria-label', `通知${index + 1}の方式`);
    const label = document.createElement('label'); label.textContent = '分前';
    const input = document.createElement('input'); input.id = `reminder_minutes_${index}`;
    label.htmlFor = input.id;
    input.type = 'number'; input.min = '0'; input.max = String(MAX_REMINDER_MINUTES); input.step = '1'; input.value = '10';
    input.setAttribute('aria-label', `通知${index + 1}のタイミング（分前）`);
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '−';
    remove.setAttribute('aria-label', `通知${index + 1}を削除`);
    remove.addEventListener('click', () => {
      const count = Number(container.dataset.reminderCount);
      for (let slot = index; slot < count - 1; slot++) {
        select_input(`reminder_method_${slot}`).value = select_input(`reminder_method_${slot + 1}`).value;
        number_input(`reminder_minutes_${slot}`).value = number_input(`reminder_minutes_${slot + 1}`).value;
      }
      select_input(`reminder_method_${count - 1}`).value = '';
      number_input(`reminder_minutes_${count - 1}`).value = '10';
      if (count === 1) mode.value = 'none';
      container.dataset.reminderCount = String(Math.max(1, count - 1)); sync();
      if (count === 1) mode.focus();
      else select_input(`reminder_method_${Math.min(index, count - 2)}`).focus();
    });
    label.append(input); group.append(method.parentElement!, label, remove); rows.append(group);
  }
  const add = document.createElement('button'); add.type = 'button'; add.id = 'add_reminder'; add.textContent = '＋ 通知を追加';
  container.append(add);
  add.addEventListener('click', () => {
    const count = Number(container.dataset.reminderCount);
    if (count >= MAX_REMINDERS) return;
    select_input(`reminder_method_${count}`).value = 'notification';
    number_input(`reminder_minutes_${count}`).value = '10';
    container.dataset.reminderCount = String(count + 1); sync(); select_input(`reminder_method_${count}`).focus();
  });
  const color = add_select('予定色', 'event_color', [
    ['', '未指定（変更しない）'], ['default', 'カレンダーの既定色'],
    ...EVENT_COLORS.map(([key, name]) => [key, `${name}（${key}）`] as const),
  ]);
  const swatch = document.createElement('span'); swatch.setAttribute('aria-hidden', 'true');
  swatch.style.cssText = 'display:inline-block;width:24px;height:24px;border:1px solid currentColor;vertical-align:middle';
  color.after(swatch);
  const sync = (): void => {
    const active = ['append', 'replace'].includes(mode.value);
    const count = Number(container.dataset.reminderCount);
    rows.hidden = !active;
    for (let index = 0; index < MAX_REMINDERS; index++) {
      document.getElementById(`reminder_row_${index}`)!.hidden = !active || index >= count;
      select_input(`reminder_method_${index}`).disabled = !active || index >= count;
      number_input(`reminder_minutes_${index}`).disabled = !active || index >= count || !select_input(`reminder_method_${index}`).value;
    }
    add.hidden = !active; add.disabled = count >= MAX_REMINDERS;
    swatch.style.backgroundColor = EVENT_COLORS.some(([key]) => key === color.value) ? color.value : 'transparent';
  };
  mode.addEventListener('change', () => {
    if (['append', 'replace'].includes(mode.value) && Number(container.dataset.reminderCount) === 1 && !select_input('reminder_method_0').value) {
      select_input('reminder_method_0').value = 'notification';
    }
  });
  container.addEventListener('change', sync); sync();
};

export const load_settings_form = (template?: Template): void => {
  mount_settings_form();
  const settings_error = document.getElementById('settings_error');
  if (settings_error) { settings_error.textContent = ''; settings_error.hidden = true; }
  select_input('reminder_mode').value = template?.reminders?.mode ?? '';
  const items = template?.reminders && template.reminders.mode !== 'none' ? template.reminders.items : [];
  document.getElementById('template_settings')!.dataset.reminderCount = String(Math.max(1, items.length));
  for (let index = 0; index < MAX_REMINDERS; index++) {
    select_input(`reminder_method_${index}`).value = items[index]?.method ?? (index === 0 ? 'notification' : '');
    number_input(`reminder_minutes_${index}`).value = String(items[index]?.minutes ?? 10);
  }
  const color = template?.event_color;
  select_input('event_color').value = color?.mode === 'explicit' ? color.color_key : color?.mode ?? '';
  select_input('reminder_mode').dispatchEvent(new Event('change', { bubbles: true }));
};

export const read_settings_form = (): Pick<Template, 'reminders' | 'event_color'> => {
  const mode = select_input('reminder_mode').value;
  const items = Array.from({ length: MAX_REMINDERS }, (_, index) => ({
    method: select_input(`reminder_method_${index}`).value,
    minutes: number_input(`reminder_minutes_${index}`).value.trim() === '' ? NaN : Number(number_input(`reminder_minutes_${index}`).value),
  })).filter((item) => item.method !== '');
  const color = select_input('event_color').value;
  return {
    reminders: parse_reminders(mode === '' ? undefined : mode === 'none' ? { mode } : { mode, items }),
    event_color: parse_event_color(color === '' ? undefined : color === 'default' ? { mode: 'default' } : { mode: 'explicit', color_key: color }),
  };
};
