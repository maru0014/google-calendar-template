/**
 * テンプレート適用ロジック
 * Phase 0 調査結果を統合
 */

import { Template } from './storage';
import { replaceVariables } from './variables';
import { setFieldValue, addGuest, detectCurrentView, getElement, closeFieldDropdown } from './dom';
import { POPUP_SELECTORS, FULLPAGE_SELECTORS, CALENDAR_SELECTORS } from '../constants/selectors';
import type { ApplyResult, FieldSetResult, DurationSelectors } from '../types';

/**
 * テンプレートを適用
 */
export async function applyTemplate(template: Template): Promise<ApplyResult> {
  const { isPopup, isFullPage } = detectCurrentView();

  if (!isPopup && !isFullPage) {
    return {
      success: false,
      error: '予定作成画面が見つかりません',
    };
  }

  const results: FieldSetResult[] = [];

  try {
    if (isPopup) {
      await applyToPopup(template, results);
    } else if (isFullPage) {
      await applyToFullPage(template, results);
    }

    const failedFields = results
      .filter((r) => !r.success)
      .map((r) => r.field);

    return {
      success: failedFields.length === 0,
      failedFields: failedFields.length > 0 ? failedFields : undefined,
    };
  } catch (error) {
    console.error('Failed to apply template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラー',
    };
  }
}

/**
 * ポップアップにテンプレートを適用
 */
async function applyToPopup(
  template: Template,
  results: FieldSetResult[]
): Promise<void> {
  // タイトル
  const titleElement = getElement<HTMLElement>(POPUP_SELECTORS.title);
  if (titleElement || template.title) {
    const title = replaceVariables(template.title);
    const success = !!titleElement && setFieldValue(titleElement, title);
    results.push({ field: 'title', success });
  }

  // 説明
  const descElement = getElement<HTMLElement>(POPUP_SELECTORS.description);
  if (descElement || template.description) {
    const description = replaceVariables(template.description);
    const success = !!descElement && setFieldValue(descElement, description);
    results.push({ field: 'description', success });
  }

  // 場所
  if (template.location) {
    const locationElement = getElement<HTMLElement>(POPUP_SELECTORS.location);
    if (locationElement) {
      const location = replaceVariables(template.location);
      const success = setFieldValue(locationElement, location);
      results.push({ field: 'location', success });
    } else {
      results.push({ field: 'location', success: false });
    }
  }

  // ゲスト
  if (template.guests && template.guests.length > 0) {
    const guestElement = getElement<HTMLInputElement>(
      POPUP_SELECTORS.guests
    );
    if (guestElement) {
      for (const email of template.guests) {
        const success = addGuest(guestElement, email);
        results.push({ field: `guest:${email}`, success });
        // 少し待機（UIの反映のため）
        await delay(100);
      }
      // ゲスト入力完了後、ドロップダウンを閉じる
      await delay(200);
      closeFieldDropdown(guestElement);
    } else {
      for (const email of template.guests) {
        results.push({ field: `guest:${email}`, success: false });
      }
    }
  }

  // 終日
  if (template.allDay !== undefined) {
    const allDayElement = getElement<HTMLElement>(POPUP_SELECTORS.allDay);
    if (allDayElement) {
      const success = setFieldValue(allDayElement, template.allDay);
      results.push({ field: 'allDay', success });
    } else {
      results.push({ field: 'allDay', success: false });
    }
  }

  // 登録先カレンダー（durationの前に実行 — カレンダー切替でUIリフレッシュされうるため）
  if (template.calendarName) {
    const success = await selectCalendar(template.calendarName, 'popup');
    results.push({ field: 'calendarName', success });
    await delay(300);
  }

  // 時間数（終了時間を計算）- 最後に実行
  if (template.duration) {
    await set_duration(template.duration, POPUP_SELECTORS, results);
  }
}

/**
 * フルページにテンプレートを適用
 */
async function applyToFullPage(
  template: Template,
  results: FieldSetResult[]
): Promise<void> {
  // タイトル
  const titleElement = getElement<HTMLElement>(FULLPAGE_SELECTORS.title);
  if (titleElement || template.title) {
    const title = replaceVariables(template.title);
    const success = !!titleElement && setFieldValue(titleElement, title);
    results.push({ field: 'title', success });
  }

  // 説明
  const descElement = getElement<HTMLElement>(FULLPAGE_SELECTORS.description);
  if (descElement || template.description) {
    const description = replaceVariables(template.description);
    const success = !!descElement && setFieldValue(descElement, description);
    results.push({ field: 'description', success });
  }

  // 場所
  if (template.location) {
    const locationElement = getElement<HTMLElement>(FULLPAGE_SELECTORS.location);
    if (locationElement) {
      const location = replaceVariables(template.location);
      const success = setFieldValue(locationElement, location);
      results.push({ field: 'location', success });
    } else {
      results.push({ field: 'location', success: false });
    }
  }

  // ゲスト（時刻設定の前に実行）
  if (template.guests && template.guests.length > 0) {
    const guestElement = getElement<HTMLInputElement>(
      FULLPAGE_SELECTORS.guests
    );
    if (guestElement) {
      for (const email of template.guests) {
        const success = addGuest(guestElement, email);
        results.push({ field: `guest:${email}`, success });
        // 少し待機（UIの反映のため）
        await delay(100);
      }
      // ゲスト入力完了後、ドロップダウンを閉じる
      await delay(200);
      closeFieldDropdown(guestElement);
    } else {
      for (const email of template.guests) {
        results.push({ field: `guest:${email}`, success: false });
      }
    }
  }

  // 終日
  if (template.allDay !== undefined) {
    const allDayElement = getElement<HTMLElement>(FULLPAGE_SELECTORS.allDay);
    if (allDayElement) {
      const success = setFieldValue(allDayElement, template.allDay);
      results.push({ field: 'allDay', success });
    } else {
      results.push({ field: 'allDay', success: false });
    }
  }

  // ゲストの権限
  if (template.guestPermissions) {
    await applyGuestPermissions(template.guestPermissions, results);
  }

  // 登録先カレンダー
  if (template.calendarName) {
    const success = await selectCalendar(template.calendarName, 'fullpage');
    results.push({ field: 'calendarName', success });
    await delay(300);
  }

  // 時間数（終了時間を計算）- 最後に実行
  if (template.duration) {
    await delay(300); // 他のフィールドが確定するまで待機
    await set_duration(template.duration, FULLPAGE_SELECTORS, results);
  }
}

import { parseTime } from './time';
import { advance_calendar_date } from './calendar_date';

/** Set the end date and time together, preserving calendar-day rollover. */
async function set_duration(
  minutes: number,
  selectors: DurationSelectors,
  results: FieldSetResult[]
): Promise<void> {
  try {
    const start_time = getElement<HTMLInputElement>(selectors.startTime);
    const end_time = getElement<HTMLInputElement>(selectors.endTime);
    const start_date = getElement<HTMLInputElement>(selectors.startDate);
    const end_date = getElement<HTMLInputElement>(selectors.endDate);
    const parsed_time = start_time && parseTime(start_time.value);
    if (!start_time || !end_time || !start_date || !end_date || !parsed_time ||
        !Number.isSafeInteger(minutes) || minutes < 0) {
      results.push({ field: 'duration', success: false });
      return;
    }
    const total_minutes = parsed_time.hours * 60 + parsed_time.minutes + minutes;
    const days = Math.floor(total_minutes / 1440);
    // Same-day durations do not need locale-specific date parsing.
    const end_date_value = days === 0 ? start_date.value.trim() : advance_calendar_date(start_date.value, days);
    if (!end_date_value) {
      results.push({ field: 'duration', success: false });
      return;
    }
    const end_time_value = String(Math.floor(total_minutes / 60) % 24).padStart(2, '0') + ':' +
      String(total_minutes % 60).padStart(2, '0');

    if (end_date.value !== end_date_value) {
      if (!setFieldValue(end_date, end_date_value)) {
        results.push({ field: 'duration', success: false });
        return;
      }
      closeFieldDropdown(end_date);
      await delay(100);
    }
    // Date commits can replace the time input. Reacquire it before writing.
    const current_end_time = getElement<HTMLInputElement>(selectors.endTime);
    if (!current_end_time || !setFieldValue(current_end_time, end_time_value)) {
      results.push({ field: 'duration', success: false });
      return;
    }
    await delay(100);
    current_end_time.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true,
    }));
    // Escape resets Calendar's time field, so preserve the existing Enter-only commit.
    await delay(300);
    const confirmed_date = getElement<HTMLInputElement>(selectors.endDate);
    const confirmed_time = getElement<HTMLInputElement>(selectors.endTime);
    const parsed_end_time = confirmed_time && parseTime(confirmed_time.value);
    const success = !!confirmed_date && !!parsed_end_time &&
      (days === 0 ? confirmed_date.value.trim() : advance_calendar_date(confirmed_date.value, 0)) === end_date_value &&
      parsed_end_time.hours === Math.floor(total_minutes / 60) % 24 &&
      parsed_end_time.minutes === total_minutes % 60;
    results.push({ field: 'duration', success });
  } catch (error) {
    console.error('❌ [Error] Failed to set duration:', error);
    results.push({ field: 'duration', success: false });
  }
}

/**
 * ゲストの権限を設定
 */
async function applyGuestPermissions(
  permissions: NonNullable<Template['guestPermissions']>,
  results: FieldSetResult[]
): Promise<void> {
  const { guestPermissions } = FULLPAGE_SELECTORS;

  if (permissions.canModify !== undefined) {
    const element = getElement<HTMLElement>(guestPermissions.canModify);
    if (element) {
      const success = setFieldValue(element, permissions.canModify);
      results.push({ field: 'guestPermissions.canModify', success });
    } else {
      results.push({ field: 'guestPermissions.canModify', success: false });
    }
  }

  if (permissions.canInviteOthers !== undefined) {
    const element = getElement<HTMLElement>(guestPermissions.canInviteOthers);
    if (element) {
      const success = setFieldValue(element, permissions.canInviteOthers);
      results.push({ field: 'guestPermissions.canInviteOthers', success });
    } else {
      results.push({ field: 'guestPermissions.canInviteOthers', success: false });
    }
  }

  if (permissions.seeGuestList !== undefined) {
    const element = getElement<HTMLElement>(guestPermissions.seeGuestList);
    if (element) {
      const success = setFieldValue(element, permissions.seeGuestList);
      results.push({ field: 'guestPermissions.seeGuestList', success });
    } else {
      results.push({ field: 'guestPermissions.seeGuestList', success: false });
    }
  }
}

/**
 * 待機用のユーティリティ
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 登録先カレンダーを切り替える
 * @param calendarName 選択するカレンダー名
 * @param viewType 現在の画面タイプ（popup / fullpage）
 */
async function selectCalendar(
  calendarName: string,
  viewType: 'popup' | 'fullpage'
): Promise<boolean> {
  console.log(`🔍 登録先カレンダーを切り替えます: ${calendarName} (view: ${viewType})`);

  const triggerSelectors = CALENDAR_SELECTORS.triggers[viewType];

  // 1. すでにカレンダーリストのDOMが表示されているか確認
  let listbox: Element | null = null;
  for (const selector of CALENDAR_SELECTORS.list) {
    listbox = document.querySelector(selector);
    if (listbox) {
      console.log(`🎯 表示済みのリストが見つかりました: ${selector}`);
      break;
    }
  }

  if (!listbox) {
    // 2. 表示されていない場合、ドロップダウンボタンを探してクリックする
    let calendarTrigger: HTMLElement | null = null;

    for (const selector of triggerSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        calendarTrigger = el as HTMLElement;
        console.log(`🎯 トリガーが見つかりました: ${selector}`);
        break;
      }
    }

    if (calendarTrigger) {
      console.log('🎯 カレンダーのドロップダウンボタンをクリックします。');
      calendarTrigger.click();
      // ドロップダウンがDOMに描画されるのを少し待つ
      await delay(300);

      // 再度リストボックスを検索
      for (const selector of CALENDAR_SELECTORS.list) {
        listbox = document.querySelector(selector);
        if (listbox) break;
      }
    }
  }

  if (!listbox) {
    console.warn('⚠ カレンダーのリストDOMが見つかりませんでした。');
    return false;
  }

  // 3. リスト内のカレンダー名を解析して一致するものをクリック
  const items = Array.from(
    listbox.querySelectorAll(CALENDAR_SELECTORS.listItem)
  );
  console.log(`📊 カレンダーの選択肢を解析中: ${items.length}件`);

  // 部分一致では別カレンダーを選ぶ恐れがあるため、名前の完全一致のみ許可する。

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as HTMLElement;
    const name = extractCalendarName(item);
    console.log(`   - 選択肢 ${i + 1}: "${name}"`);

    if (name && name === calendarName) {
      console.log(`✅ カレンダーが見つかりました（完全一致）: "${name}"`);
      item.click();
      return true;
    }

  }

  console.warn(`⚠ カレンダー "${calendarName}" が見つかりませんでした。`);
  return false;
}

/**
 * カレンダーリストアイテムからカレンダー名を抽出する
 * jsname 属性のスパンを優先し、なければ textContent にフォールバック
 */
function extractCalendarName(item: HTMLElement): string | undefined {
  // Google Calendar 内部の名前表示用 span を優先的に取得
  // jsname は内部属性のため変更される可能性があるが、
  // textContent より正確な名前を取得できる
  const nameSpan = item.querySelector('[jsname="K4r5Ff"]');
  if (nameSpan?.textContent?.trim()) {
    return nameSpan.textContent.trim();
  }

  // フォールバック: textContent 全体から取得
  // 余分なテキスト（色名など）が含まれる可能性があるため trim のみ
  return item.textContent?.trim();
}
