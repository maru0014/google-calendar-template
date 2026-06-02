/**
 * テンプレート適用ロジック
 * Phase 0 調査結果を統合
 */

import { Template } from './storage';
import { replaceVariables } from './variables';
import { setFieldValue, addGuest, detectCurrentView, getElement, closeFieldDropdown } from './dom';
import { POPUP_SELECTORS, FULLPAGE_SELECTORS, CALENDAR_SELECTORS } from '../constants/selectors';
import type { ApplyResult, FieldSetResult } from '../types';

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
  if (titleElement) {
    const title = replaceVariables(template.title);
    const success = setFieldValue(titleElement, title);
    results.push({ field: 'title', success });
  }

  // 説明
  const descElement = getElement<HTMLElement>(POPUP_SELECTORS.description);
  if (descElement) {
    const description = replaceVariables(template.description);
    const success = setFieldValue(descElement, description);
    results.push({ field: 'description', success });
  }

  // 場所
  if (template.location) {
    const locationElement = getElement<HTMLElement>(POPUP_SELECTORS.location);
    if (locationElement) {
      const location = replaceVariables(template.location);
      const success = setFieldValue(locationElement, location);
      results.push({ field: 'location', success });
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
    }
  }

  // 終日
  if (template.allDay !== undefined) {
    const allDayElement = getElement<HTMLElement>(POPUP_SELECTORS.allDay);
    if (allDayElement) {
      const success = setFieldValue(allDayElement, template.allDay);
      results.push({ field: 'allDay', success });
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
    await setDurationForPopup(template.duration, results);
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
  if (titleElement) {
    const title = replaceVariables(template.title);
    const success = setFieldValue(titleElement, title);
    results.push({ field: 'title', success });
  }

  // 説明
  const descElement = getElement<HTMLElement>(FULLPAGE_SELECTORS.description);
  if (descElement) {
    const description = replaceVariables(template.description);
    const success = setFieldValue(descElement, description);
    results.push({ field: 'description', success });
  }

  // 場所
  if (template.location) {
    const locationElement = getElement<HTMLElement>(FULLPAGE_SELECTORS.location);
    if (locationElement) {
      const location = replaceVariables(template.location);
      const success = setFieldValue(locationElement, location);
      results.push({ field: 'location', success });
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
    }
  }

  // 終日
  if (template.allDay !== undefined) {
    const allDayElement = getElement<HTMLElement>(FULLPAGE_SELECTORS.allDay);
    if (allDayElement) {
      const success = setFieldValue(allDayElement, template.allDay);
      results.push({ field: 'allDay', success });
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
    await setDuration(template.duration, results);
  }
}

import { parseTime } from './time';

/**
 * 時間数から終了時間を設定（フルページ用）
 */
async function setDuration(
  minutes: number,
  results: FieldSetResult[]
): Promise<void> {
  const startTimeElement = getElement<HTMLInputElement>(
    FULLPAGE_SELECTORS.startTime
  );
  const endTimeElement = getElement<HTMLInputElement>(
    FULLPAGE_SELECTORS.endTime
  );

  if (!startTimeElement || !endTimeElement) {
    results.push({ field: 'duration', success: false });
    return;
  }

  try {
    // 現在の開始時刻を取得
    const startTimeStr = startTimeElement.value || '09:00';
    const startTime = parseTime(startTimeStr);

    if (!startTime) {
      console.error(`Failed to parse start time: ${startTimeStr}`);
      results.push({ field: 'duration', success: false });
      return;
    }

    const { hours, minutes: mins } = startTime;

    // 終了時刻を計算（minutesは分数）
    const startMinutes = hours * 60 + mins;
    const endMinutes = startMinutes + minutes;
    const endHours = Math.floor(endMinutes / 60) % 24;
    const endMins = endMinutes % 60;

    // 終了時刻を設定
    // Note: Google Calendar usually expects 24h format for value setting,
    // even if display is 12h. But we should check if we need to format it back to AM/PM
    // based on the input format. However, usually setting value in 24h format works for input[type="text"]
    // or specific calendar inputs.
    // Let's stick to 24h format for now as it's safer for calculation,
    // but if the UI requires AM/PM we might need `formatTime` helper.
    // Given the issue is about *calculation* failing because of parsing,
    // fixing parsing is the first step.
    // The original code set it as HH:mm (24h).

    const endTimeValue = `${String(endHours).padStart(2, '0')}:${String(
      endMins
    ).padStart(2, '0')}`;

    console.log(`⏰ Setting end time: ${endTimeValue} (duration: ${minutes} minutes)`);

    // フォーカスを当ててから値を設定
    endTimeElement.focus();
    await delay(100);

    // React対応の値設定
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(endTimeElement, endTimeValue);
    } else {
      endTimeElement.value = endTimeValue;
    }

    // イベント発火
    endTimeElement.dispatchEvent(new Event('input', { bubbles: true }));
    endTimeElement.dispatchEvent(new Event('change', { bubbles: true }));

    console.log(`⏰ End time set to: ${endTimeElement.value}`);

    // Enterキーを送信して視覚的な更新をトリガー
    await delay(100);
    endTimeElement.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      bubbles: true,
    }));
    console.log(`⏰ Enter key sent`);

    // 値の確定のため待機
    await delay(300);
    console.log(`⏰ End time after 300ms: ${endTimeElement.value}`);

    // 重要: 時刻フィールドのプルダウンは閉じない
    // Escapeを送信すると値が初期値にリセットされるため
    // プルダウンは開いたままになるが、Enterキーで視覚的には反映される

    results.push({ field: 'duration', success: true });
  } catch (error) {
    console.error('Failed to set duration:', error);
    results.push({ field: 'duration', success: false });
  }
}

/**
 * 時間数から終了時間を設定（ポップアップ用）
 */
async function setDurationForPopup(
  minutes: number,
  results: FieldSetResult[]
): Promise<void> {
  const startTimeElement = getElement<HTMLInputElement>(
    POPUP_SELECTORS.startTime
  );
  const endTimeElement = getElement<HTMLInputElement>(
    POPUP_SELECTORS.endTime
  );

  if (!startTimeElement || !endTimeElement) {
    results.push({ field: 'duration', success: false });
    return;
  }

  try {
    // 現在の開始時刻を取得
    const startTimeStr = startTimeElement.value || '09:00';
    const startTime = parseTime(startTimeStr);

    if (!startTime) {
      console.error(`Failed to parse start time: ${startTimeStr}`);
      results.push({ field: 'duration', success: false });
      return;
    }

    const { hours, minutes: mins } = startTime;

    // 終了時刻を計算（minutesは分数）
    const startMinutes = hours * 60 + mins;
    const endMinutes = startMinutes + minutes;
    const endHours = Math.floor(endMinutes / 60) % 24;
    const endMins = endMinutes % 60;

    // 終了時刻を設定
    const endTimeValue = `${String(endHours).padStart(2, '0')}:${String(
      endMins
    ).padStart(2, '0')}`;

    console.log(`⏰ [Popup] Setting end time: ${endTimeValue} (duration: ${minutes} minutes)`);

    // フォーカスを当ててから値を設定
    endTimeElement.focus();
    await delay(100);

    // React対応の値設定
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(endTimeElement, endTimeValue);
    } else {
      endTimeElement.value = endTimeValue;
    }

    // イベント発火
    endTimeElement.dispatchEvent(new Event('input', { bubbles: true }));
    endTimeElement.dispatchEvent(new Event('change', { bubbles: true }));

    console.log(`⏰ [Popup] End time set to: ${endTimeElement.value}`);

    // Enterキーを送信して視覚的な更新をトリガー
    await delay(100);
    endTimeElement.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      bubbles: true,
    }));
    console.log(`⏰ [Popup] Enter key sent`);

    // 値の確定のため待機
    await delay(300);
    console.log(`⏰ [Popup] End time after 300ms: ${endTimeElement.value}`);

    results.push({ field: 'duration', success: true });
  } catch (error) {
    console.error('Failed to set duration:', error);
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
    }
  }

  if (permissions.canInviteOthers !== undefined) {
    const element = getElement<HTMLElement>(guestPermissions.canInviteOthers);
    if (element) {
      const success = setFieldValue(element, permissions.canInviteOthers);
      results.push({ field: 'guestPermissions.canInviteOthers', success });
    }
  }

  if (permissions.seeGuestList !== undefined) {
    const element = getElement<HTMLElement>(guestPermissions.seeGuestList);
    if (element) {
      const success = setFieldValue(element, permissions.seeGuestList);
      results.push({ field: 'guestPermissions.seeGuestList', success });
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

  // 完全一致 → 部分一致 の2パスで検索
  // (textContent にはカレンダー色ラベル等の余分なテキストが含まれる場合がある)
  let partialMatch: HTMLElement | null = null;

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as HTMLElement;
    const name = extractCalendarName(item);
    console.log(`   - 選択肢 ${i + 1}: "${name}"`);

    if (name && name === calendarName) {
      console.log(`✅ カレンダーが見つかりました（完全一致）: "${name}"`);
      item.click();
      return true;
    }

    // 部分一致候補（最初の1件のみ記録）
    if (!partialMatch && name && name.includes(calendarName)) {
      partialMatch = item;
    }
  }

  // 完全一致が見つからなかった場合、部分一致でフォールバック
  if (partialMatch) {
    const name = extractCalendarName(partialMatch);
    console.log(`✅ カレンダーが見つかりました（部分一致）: "${name}"`);
    partialMatch.click();
    return true;
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
