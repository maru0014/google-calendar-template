import type { Template, FieldSetResult, ReminderItem, RemindersConfig, EventColorConfig } from '../types';
import { SETTINGS_SELECTORS as S } from '../constants/selectors';
import { MAX_REMINDERS } from '../constants/template_settings';
import { parse_reminders, parse_event_color, unique_reminders, parse_reminder_label } from './template_settings';
import { setFieldValue } from './dom';
import { get_popup_editor, expand_popup_field } from './popup_editor';

const visible = (element: Element): boolean => element.getClientRects().length > 0;
const one = <T extends Element = HTMLElement>(root: ParentNode, selector: string): T => {
  const matches = Array.from(root.querySelectorAll<T>(selector)).filter(visible);
  if (matches.length !== 1) throw new Error('設定コントロールが見つからないか、一意に特定できません');
  return matches[0];
};
const wait_until = async (check: () => boolean | Promise<boolean>, validate?: () => void): Promise<void> => {
  for (let attempt = 0; attempt < 40; attempt++) {
    // 編集対象の消失・差し替えは再試行可能なコントロール欠落と区別する。
    validate?.();
    let result: boolean | Promise<boolean> = false;
    try { result = check(); } catch { /* 再描画中の欠落は有界で待機する */ }
    // 非同期の子操作自体が失敗した場合は、その待機を最初から繰り返さない。
    if (await result) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('画面の反映を確認できませんでした');
};
const editor = (): HTMLElement => {
  const title = one(document, S.title);
  const root = title.closest<HTMLElement>(S.root);
  if (!root) throw new Error('詳細画面を開いてから適用してください');
  return root;
};
const controlled_list = (control: HTMLElement): HTMLElement => {
  const id = control.getAttribute('aria-controls');
  const list = id && document.getElementById(id);
  if (!list) throw new Error('選択肢を確認できません');
  return list;
};
const selected_value = (control: HTMLElement): string => {
  const options = controlled_list(control).querySelectorAll<HTMLElement>(S.selected_option);
  if (options.length !== 1) throw new Error('現在の通知設定を解釈できません');
  return options[0].getAttribute('data-value') ?? '';
};
const select_value = async (get_control: () => HTMLElement, value: string): Promise<void> => {
  const control = get_control();
  if (selected_value(control) === value) return;
  control.click();
  await wait_until(() => control.getAttribute('aria-expanded') === 'true');
  const candidates = Array.from(controlled_list(control).querySelectorAll<HTMLElement>(S.option))
    .filter((option) => option.getAttribute('data-value') === value && visible(option));
  if (candidates.length !== 1) throw new Error('通知の選択肢が利用できません');
  candidates[0].click();
  await wait_until(() => selected_value(get_control()) === value);
};

const rows = (get_root: () => HTMLElement): HTMLElement[] => Array.from(one(get_root(), S.notification_list).querySelectorAll<HTMLElement>(S.row));
const read_row = (row: HTMLElement): ReminderItem => {
  const method_value = selected_value(one(row, S.method));
  const seconds = Number(selected_value(one(row, S.unit)));
  const input = one<HTMLInputElement>(row, S.timing);
  const amount = Number(input.value);
  if (!['1', '3'].includes(method_value) || ![60, 3600, 86400, 604800].includes(seconds) ||
      input.value.trim() === '' || !Number.isSafeInteger(amount) || amount < 0 ||
      row.getAttribute('data-is-all-day') !== 'false') throw new Error('現在の通知を安全に解釈できません');
  const minutes = amount * seconds / 60;
  if (!Number.isSafeInteger(minutes)) throw new Error('通知の時間が不正です');
  return { method: method_value === '1' ? 'email' : 'notification', minutes };
};
const same = (a: ReminderItem[], b: ReminderItem[]): boolean =>
  JSON.stringify(a.map((x) => `${x.method}:${x.minutes}`).sort()) ===
  JSON.stringify(b.map((x) => `${x.method}:${x.minutes}`).sort());

const apply_reminders = async (config: RemindersConfig, get_root: () => HTMLElement): Promise<void> => {
  const root = get_root();
  const all_day = one<HTMLInputElement>(root, S.all_day);
  if (all_day.checked) throw new Error('終日予定の通知設定は未対応です（通知は変更していません）');
  const before = rows(get_root).map(read_row);
  const target = config.mode === 'none' ? [] : config.mode === 'append'
    ? unique_reminders([...before, ...config.items]) : config.items;
  if (target.length > MAX_REMINDERS) throw new Error('追加後の通知が5件を超えるため変更しません');
  // appendは既存行を削除しない。既存に重複がある場合もそのまま保持する。
  const additions = config.mode === 'append'
    ? target.filter((item) => !before.some((old) => same([item], [old]))) : target;
  if (config.mode === 'append' && before.length + additions.length > MAX_REMINDERS) {
    throw new Error('追加後の通知が5件を超えるため変更しません');
  }
  if (same(before, target)) return;
  // 途中で変更してから操作不能と分かることを避けるため、必要な操作を先に検査する。
  if ((config.mode === 'append' && additions.length > 0) || target.length > before.length) one(root, S.add);
  if (config.mode !== 'append') rows(get_root).slice(target.length).forEach((row) => one(row, S.remove));
  let changed = false;
  try {
    const writes = config.mode === 'append' ? additions : target;
    for (const [index, item] of writes.entries()) {
      const count = rows(get_root).length;
      const slot = config.mode === 'append' ? count : index;
      if (slot >= count) {
        one(get_root(), S.add).click(); changed = true;
        await wait_until(() => rows(get_root).length === count + 1);
      }
      let row = rows(get_root)[slot];
      if (same([read_row(row)], [item])) continue;
      changed = true;
      await select_value(() => one(rows(get_root)[slot], S.method), item.method === 'email' ? '1' : '3');
      row = rows(get_root)[slot];
      await select_value(() => one(rows(get_root)[slot], S.unit), '60');
      row = rows(get_root)[slot];
      const input = one<HTMLInputElement>(row, S.timing);
      if (!setFieldValue(input, String(item.minutes))) throw new Error('通知時間を書き込めません');
      input.blur();
      await wait_until(() => same([read_row(rows(get_root)[slot])], [item]) &&
        parse_reminder_label(rows(get_root)[slot].getAttribute('aria-label')) === item.minutes &&
        one<HTMLInputElement>(rows(get_root)[slot], S.timing).getAttribute('aria-invalid') !== 'true');
    }
    if (config.mode !== 'append') {
      for (let remaining = before.length; remaining > target.length; remaining--) {
        one(rows(get_root)[remaining - 1], S.remove).click(); changed = true;
        await wait_until(() => rows(get_root).length === remaining - 1);
      }
    }
    const expected = config.mode === 'append' ? [...before, ...additions] : target;
    await wait_until(() => same(rows(get_root).map(read_row), expected));
  } catch (error) {
    throw new Error(`${changed ? '通知が部分的に変更された可能性があります。保存前に確認してください。' : ''}${error instanceof Error ? error.message : '通知の適用に失敗しました'}`);
  }
};

const apply_color = async (config: EventColorConfig, get_root: () => HTMLElement): Promise<void> => {
  const root = get_root();
  const get_trigger = (): HTMLElement => one(get_root(), S.color_trigger);
  const owned_menus = new Set<HTMLElement>();
  const get_palette = (): HTMLElement => {
    get_root();
    const menus = Array.from(document.querySelectorAll<HTMLElement>(S.menu)).filter((menu) =>
      visible(menu) && menu.querySelectorAll(S.color_default).length === 1 && menu.querySelector(S.color_options));
    if (menus.length !== 1) throw new Error('予定色のパレットを特定できません');
    owned_menus.add(menus[0]);
    return menus[0];
  };
  const wait_closed = async (): Promise<void> => {
    await wait_until(() => get_trigger().getAttribute('aria-expanded') !== 'true' &&
      Array.from(owned_menus).every((menu) => !menu.isConnected || !visible(menu)), get_root);
  };
  const open_palette = async (): Promise<HTMLElement> => {
    if (get_trigger().getAttribute('aria-expanded') !== 'true') get_trigger().click();
    await wait_until(() => get_trigger().getAttribute('aria-expanded') === 'true', get_root);
    return get_palette();
  };
  const matching_options = (menu: HTMLElement): HTMLElement[] =>
    config.mode === 'default' ? Array.from(menu.querySelectorAll<HTMLElement>(S.color_default)) :
      Array.from(menu.querySelectorAll<HTMLElement>(S.color_options)).filter((option) =>
        option.getAttribute('data-color')?.toUpperCase() === config.color_key);
  let application_error: unknown;
  let application_failed = false;
  try {
    const menu = await open_palette();
    const candidates = matching_options(menu);
    if (candidates.length !== 1) throw new Error('指定した予定色はこのカレンダーでは利用できません');
    if (candidates[0].getAttribute('aria-checked') !== 'true') {
      candidates[0].click();
      // 閉じるアニメーション・スクロールの捕捉が終わる前に再オープンしない。
      await wait_closed();
      // 閉じたパレットがDOMに残る場合は、その確定状態を読み、余分に開き直さない。
      let verification_menu = menu;
      await wait_until(async () => {
        // 非表示の後で切断される場合も、次の確認で現在のパレットを取得し直す。
        if (!verification_menu.isConnected) verification_menu = await open_palette();
        const options = matching_options(verification_menu);
        return options.length === 1 && options[0].getAttribute('aria-checked') === 'true';
      }, get_root);
    }
  } catch (error) {
    application_failed = true;
    application_error = error;
  }
  try {
    try {
      if (root.isConnected) {
        const cleanup_trigger = get_trigger();
        // 選択後にトリガーが再生成されても、古い参照を使わず取得し直して閉じる。
        if (cleanup_trigger.getAttribute('aria-expanded') === 'true') cleanup_trigger.click();
        await wait_closed();
      }
    } catch (error) {
      console.warn('⚠️ [Warning] 予定色の通常クローズに失敗したため代替操作を試します', error);
    }
    // 他の予定のボタンやbodyは操作せず、所有を確認したパレットだけに閉じる操作を送る。
    for (const menu of owned_menus) {
      if (menu.isConnected && visible(menu)) menu.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape', code: 'Escape', bubbles: true, cancelable: true,
      }));
    }
    await wait_until(() => Array.from(owned_menus).every((menu) => !menu.isConnected || !visible(menu)));
    if (!application_failed) await wait_closed();
  } catch (error) {
    // 後処理の失敗は記録するが、先に発生した適用失敗の理由を隠さない。
    console.error('❌ [Error] 予定色パレットの後処理に失敗しました', error);
    if (!application_failed) throw error;
  }
  if (application_failed) throw application_error;
};
export const apply_event_settings = async (template: Template, is_fullpage: boolean, results: FieldSetResult[]): Promise<void> => {
  let original_root: HTMLElement | undefined;
  let original_title: HTMLElement | undefined;
  const get_root = (): HTMLElement => {
    const root = is_fullpage ? editor() : get_popup_editor();
    const title = one(root, is_fullpage ? S.title : S.popup_title);
    if (original_root && (root !== original_root || title !== original_title)) throw new Error('予定画面が変わったため適用を中止しました');
    original_root = root; original_title = title;
    return root;
  };
  for (const field of ['reminders', 'event_color'] as const) {
    if (template[field] === undefined) continue;
    try {
      if (!is_fullpage && field === 'reminders') throw new Error('通知は詳細画面（その他のオプション）で適用してください');
      if (results.some((result) => !result.success && ['calendarName', 'allDay', 'duration'].includes(result.field))) {
        throw new Error('カレンダー・日時設定に失敗したため適用を中止しました');
      }
      get_root();
      if (!is_fullpage) await expand_popup_field(get_root(), S.color_trigger);
      if (template.calendarName) {
        await wait_until(() => one(get_root(), S.calendar).textContent?.trim() === template.calendarName);
      }
      if (field === 'reminders') await apply_reminders(parse_reminders(template.reminders)!, get_root);
      else await apply_color(parse_event_color(template.event_color)!, get_root);
      results.push({ field, success: true });
    } catch (error) {
      console.error('❌ [Error] 予定設定の適用に失敗しました', field, error);
      results.push({ field, success: false, error: error instanceof Error ? error.message : '設定の適用に失敗しました' });
    }
  }
};
