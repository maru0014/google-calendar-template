/**
 * テンプレート適用ロジック
 * Phase 0 調査結果を統合
 */

import { Template } from './storage';
import { replaceVariables } from './variables';
import { setFieldValue, addGuest, detectCurrentView, getElement, closeFieldDropdown } from './dom';
import { POPUP_SELECTORS, FULLPAGE_SELECTORS } from '../constants/selectors';
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

  // 時間数（終了時間を計算）
  if (template.duration) {
    await setDurationForPopup(template.duration, results);
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

  // 時間数（終了時間を計算）- 最後に実行
  if (template.duration) {
    await delay(300); // 他のフィールドが確定するまで待機
    await setDuration(template.duration, results);
  }
}

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
    const startTime = startTimeElement.value || '09:00';
    const [hours, mins] = startTime.split(':').map(Number);

    // 終了時刻を計算（minutesは分数）
    const startMinutes = hours * 60 + mins;
    const endMinutes = startMinutes + minutes;
    const endHours = Math.floor(endMinutes / 60) % 24;
    const endMins = endMinutes % 60;

    // 終了時刻を設定
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
    const startTime = startTimeElement.value || '09:00';
    const [hours, mins] = startTime.split(':').map(Number);

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
