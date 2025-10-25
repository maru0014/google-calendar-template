/**
 * DOM操作ユーティリティ
 * Phase 0 調査結果より作成（検証済み）
 */

/**
 * 要素を取得する
 */
export function getElement<T extends Element = Element>(
  selector: string
): T | null {
  return document.querySelector<T>(selector);
}

/**
 * 複数の要素を取得する
 */
export function getElements<T extends Element = Element>(
  selector: string
): T[] {
  return Array.from(document.querySelectorAll<T>(selector));
}

/**
 * フィールドに値を設定する（React対応版）
 * 要素の種類に応じて適切な方法で値を設定
 */
export function setFieldValue(
  element: HTMLElement,
  value: string | boolean,
  triggerEvents: boolean = true
): boolean {
  try {
    // まずフォーカスを当てる
    element.focus();

    // チェックボックス
    if (element instanceof HTMLInputElement && element.type === 'checkbox') {
      element.checked = Boolean(value);
    }
    // contenteditable（説明フィールド）
    // 重要: innerHTML は TrustedHTML エラーになるため innerText を使用
    else if (element.contentEditable === 'true') {
      element.innerText = String(value);
    }
    // 通常のinput/textarea（React対応）
    else if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      // Reactの内部状態を更新するため、nativeのsetterを使用
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(element, String(value));
      } else {
        element.value = String(value);
      }
    }
    else {
      console.warn('Unknown element type:', element);
      return false;
    }

    // イベントを発火（Reactの状態更新のため複数のイベントを発火）
    if (triggerEvents) {
      // input イベント（Reactが監視）
      element.dispatchEvent(new Event('input', { bubbles: true }));

      // change イベント
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }

    return true;
  } catch (error) {
    console.error('Failed to set field value:', error);
    return false;
  }
}

/**
 * ゲストを追加する
 * Enterキーを送信してゲストリストに追加
 */
export function addGuest(
  guestField: HTMLInputElement,
  email: string
): boolean {
  try {
    guestField.value = email;
    guestField.dispatchEvent(new Event('input', { bubbles: true }));

    // Enterキーを送信
    guestField.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        bubbles: true,
      })
    );

    return true;
  } catch (error) {
    console.error('Failed to add guest:', error);
    return false;
  }
}

/**
 * 現在の画面タイプを判定
 */
export function detectCurrentView(): {
  isPopup: boolean;
  isFullPage: boolean;
} {
  const isPopup = !!document.querySelector("[role='dialog']");

  // フルページの検出（複数の方法で確認）
  const isFullPage = !!(
    document.querySelector("div[aria-label='説明']") ||
    (document.querySelector("input[aria-label='タイトル']") &&
     document.querySelector("input[aria-label='開始日']") &&
     !isPopup) ||
    window.location.href.includes('/eventedit')
  );

  return { isPopup, isFullPage };
}

/**
 * MutationObserverで要素の出現を監視
 */
export function waitForElement<T extends Element = Element>(
  selector: string,
  timeout: number = 5000
): Promise<T | null> {
  return new Promise((resolve) => {
    // 既に存在する場合
    const existing = document.querySelector<T>(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver((_mutations, obs) => {
      const element = document.querySelector<T>(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // タイムアウト
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/**
 * 要素が削除されるまで監視
 */
export function waitForElementRemoved(
  element: Element,
  callback: () => void
): MutationObserver {
  const observer = new MutationObserver(() => {
    if (!document.contains(element)) {
      observer.disconnect();
      callback();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return observer;
}

/**
 * 入力フィールドのドロップダウン/サジェストを閉じる
 * Enterキーとblur()を使用
 *
 * 注意: Escapeキーは親要素に伝播して画面を閉じようとするため使用しない
 */
export function closeFieldDropdown(element: HTMLElement): void {
  try {
    // Enterキーを送信してドロップダウンを閉じる
    element.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        bubbles: true,
      })
    );

    // フォーカスを外す
    element.blur();
  } catch (error) {
    console.error('Failed to close field dropdown:', error);
  }
}
