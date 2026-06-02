/**
 * Content Script
 * Googleカレンダーのページに挿入され、テンプレート適用UIを提供
 */

// 最初のログ（インポート前）
console.log('🔵 [Calendar Templates] Script file loaded');
console.log('🔵 [Calendar Templates] Current URL:', window.location.href);
console.log('🔵 [Calendar Templates] Document ready state:', document.readyState);

import {
  POPUP_SELECTORS,
  FULLPAGE_SELECTORS,
} from '../constants/selectors';
import { waitForElement } from '../utils/dom';
import { loadTemplates } from '../utils/storage';
import { applyTemplate } from '../utils/template-applier';
import type { Template } from '../types';

console.log('📅 [Calendar Templates] Content Script Loaded (after imports)');

/**
 * 予定作成画面のタイプを判定
 */
type EditorType = 'popup' | 'fullpage' | null;

function detectEditorType(): EditorType {
  // ポップアップウィンドウのチェック
  const popupDialog = document.querySelector(POPUP_SELECTORS.dialog);
  if (popupDialog) {
    // ダイアログ内でタイトルフィールドを相対検索
    const titleInDialog = popupDialog.querySelector(POPUP_SELECTORS.titleRelative);
    if (titleInDialog) {
      console.log('🔍 Popup editor detected', popupDialog);
      return 'popup';
    }
  }

  // フルページエディタのチェック
  const fullpageTitle = document.querySelector(FULLPAGE_SELECTORS.title);
  if (fullpageTitle) {
    console.log('🔍 Fullpage editor detected', fullpageTitle);
    return 'fullpage';
  }

  return null;
}

/**
 * テンプレート選択UIを作成
 */
function createTemplateSelector(templates: Template[], editorType: EditorType): HTMLElement {
  const container = document.createElement('div');
  container.id = 'calendar-template-selector';
  container.className = editorType === 'popup'
    ? 'calendar-template-selector-popup'
    : 'calendar-template-selector-fullpage';

  // エディタタイプに応じてスタイルを変更
  const containerStyles = editorType === 'popup'
    ? `
      display: block;
      padding: 12px 0;
      border-bottom: 1px solid rgb(218, 220, 224);
      background: none;
      position: relative;
      z-index: 10000;
      box-sizing: border-box;
      width: 100%;
    `
    : `
      display: block;
      padding: 12px 16px 12px 64px;
      border-bottom: 1px solid rgb(218, 220, 224);
      background: none;
      position: relative;
      z-index: 5;
      box-sizing: border-box;
      width: 100%;
    `;

  container.style.cssText = containerStyles;

  // イベント伝播を防止
  container.addEventListener('mousedown', (e) => e.stopPropagation());
  container.addEventListener('click', (e) => e.stopPropagation());
  container.addEventListener('change', (e) => e.stopPropagation());

  // ラベル
  const label = document.createElement('label');
  label.textContent = 'テンプレート';
  label.setAttribute('for', 'calendar-template-select');
  label.style.cssText = `
    display: block;
    font-size: 11px;
    color: #5f6368;
    margin-bottom: 6px;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  `;

  // セレクトボックス
  const select = document.createElement('select');
  select.id = 'calendar-template-select';
  select.style.cssText = `
    display: block;
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #dadce0;
    border-radius: 4px;
    background: white;
    font-size: 14px;
    color: #3c4043;
    cursor: pointer;
    outline: none;
    font-family: 'Google Sans', Roboto, Arial, sans-serif;
    transition: border-color 0.2s;
    position: relative;
    z-index: 10001;
  `;

  // ホバー効果
  select.addEventListener('mouseenter', () => {
    select.style.borderColor = '#1a73e8';
  });
  select.addEventListener('mouseleave', () => {
    select.style.borderColor = '#dadce0';
  });

  // オプション
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = templates.length === 0
    ? 'テンプレートなし（拡張機能から作成）'
    : 'テンプレートを選択...';
  select.appendChild(defaultOption);

  templates.forEach((template) => {
    const option = document.createElement('option');
    option.value = template.id;
    option.textContent = template.name;
    select.appendChild(option);
  });

  // 変更イベント（イベント伝播を防止）
  select.addEventListener('change', async (e) => {
    e.stopPropagation();
    e.preventDefault();

    const templateId = (e.target as HTMLSelectElement).value;
    if (!templateId) return;

    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    console.log('📋 Applying template:', template.name);

    try {
      const result = await applyTemplate(template);

      if (result.success) {
        console.log('✅ Template applied successfully');
        // 選択を保持（リセットしない）
        // setTimeout(() => {
        //   select.value = '';
        // }, 100);
      } else {
        const fieldLabels: Record<string, string> = {
          title: 'タイトル',
          description: '説明',
          location: '場所',
          calendarName: `登録先カレンダー「${template.calendarName || ''}」`,
          duration: '期間（終了時間）',
          allDay: '終日設定',
        };
        const friendlyNames = result.failedFields?.map((f) => {
          // guest:xxx 形式のフィールド名を変換
          if (f.startsWith('guest:')) return `ゲスト（${f.slice(6)}）`;
          if (f.startsWith('guestPermissions.')) return 'ゲストの権限';
          return fieldLabels[f] || f;
        }) || ['不明'];
        alert(`テンプレートの適用に一部失敗しました。\n対象: ${friendlyNames.join('、')}`);
      }
    } catch (error) {
      console.error('❌ Error applying template:', error);
      alert('テンプレートの適用中にエラーが発生しました。');
    }
  });

  // フォーカスイベントもキャプチャ
  select.addEventListener('focus', (e) => e.stopPropagation());
  select.addEventListener('blur', (e) => e.stopPropagation());
  select.addEventListener('mousedown', (e) => e.stopPropagation());
  select.addEventListener('click', (e) => e.stopPropagation());

  container.appendChild(label);
  container.appendChild(select);

  return container;
}

/**
 * UIを挿入
 */
async function injectTemplateSelector(editorType: EditorType): Promise<void> {
  if (!editorType) return;

  // 既に挿入済みか確認
  if (document.getElementById('calendar-template-selector')) {
    console.log('⏭️ Template selector already exists, skipping injection');
    return;
  }

  // テンプレートを読み込み
  const templates = await loadTemplates();

  // UI要素を作成
  const selector = createTemplateSelector(templates, editorType);

  // 挿入位置を決定
  if (editorType === 'popup') {
    // ポップアップの場合、タイトルフィールドの親の親の後ろに挿入
    const titleInput = document.querySelector("input[aria-label='タイトルを追加']") as HTMLElement;
    if (!titleInput) {
      console.warn('⚠ Title input not found');
      return;
    }

    console.log('📍 Found title input:', titleInput);

    // 親の親を取得
    const grandparent = titleInput.parentElement?.parentElement;

    if (!grandparent) {
      console.warn('⚠ Grandparent element not found');
      return;
    }

    console.log('📍 Found grandparent element:', grandparent);

    // grandparent の次の兄弟要素として挿入
    const nextSibling = grandparent.nextElementSibling;
    if (nextSibling) {
      grandparent.parentElement?.insertBefore(selector, nextSibling);
      console.log('📍 Injected after grandparent (before next sibling)');
    } else {
      grandparent.parentElement?.appendChild(selector);
      console.log('📍 Appended after grandparent (no next sibling)');
    }

    console.log('✅ Template selector injected (popup)');
  } else {
    // フルページの場合、h2タブの次の兄弟divの先頭に挿入
    console.log('🔍 Searching for h2 tab header...');

    // 方法1: h2タグで「予定の詳細」を含むものを探す
    const h2Elements = document.querySelectorAll('h2');
    console.log('📊 Found h2 elements:', h2Elements.length);

    let injected = false;

    for (let i = 0; i < h2Elements.length; i++) {
      const h2 = h2Elements[i];
      const text = h2.textContent || '';

      if (text.includes('予定の詳細')) {
        console.log(`✅ Found target h2 at index ${i}:`, h2);

        // h2の次の兄弟要素（div）を取得
        const nextSibling = h2.nextElementSibling;
        console.log('   Next sibling:', nextSibling);

        if (nextSibling && nextSibling.tagName === 'DIV') {
          console.log('   ✅ Next sibling is a DIV');

          // そのdivの先頭に挿入
          const firstChild = nextSibling.firstElementChild;
          if (firstChild) {
            nextSibling.insertBefore(selector, firstChild);
            console.log('✅ Injected at the beginning of sibling div');
          } else {
            nextSibling.appendChild(selector);
            console.log('✅ Appended to empty sibling div');
          }

          injected = true;
          break;
        }
      }
    }

    // 方法2（フォールバック）: [role="tab"]を含む要素から親のh2を探す
    if (!injected) {
      console.log('📍 Fallback: Searching via role="tab"...');
      const tabs = document.querySelectorAll('[role="tab"]');

      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        if (tab.textContent?.includes('予定の詳細')) {
          console.log('   ✅ Found "予定の詳細" tab');

          // 親のh2を探す
          let h2Parent: HTMLElement | null = tab.parentElement as HTMLElement;
          for (let j = 0; j < 5 && h2Parent; j++) {
            if (h2Parent.tagName === 'H2') {
              console.log('   ✅ Found parent h2');

              const nextSibling = h2Parent.nextElementSibling;
              if (nextSibling && nextSibling.tagName === 'DIV') {
                const firstChild = nextSibling.firstElementChild;
                if (firstChild) {
                  nextSibling.insertBefore(selector, firstChild);
                } else {
                  nextSibling.appendChild(selector);
                }
                console.log('✅ Injected via fallback method');

                injected = true;
                break;
              }
            }
            h2Parent = h2Parent.parentElement as HTMLElement;
          }

          if (injected) break;
        }
      }
    }

    if (!injected) {
      console.warn('⚠ Could not find h2 tab header');
      return;
    }

    console.log('✅ Template selector injected (fullpage)');
  }
}

/**
 * 予定作成画面を監視
 */
function watchForEventEditors(): void {
  console.log('🟢 [Calendar Templates] watchForEventEditors() called');
  let currentEditorType: EditorType = null;
  let mutationCount = 0;

  const observer = new MutationObserver(async () => {
    mutationCount++;
    if (mutationCount % 50 === 0) {
      console.log(`🔄 [Calendar Templates] Mutations detected: ${mutationCount}`);
    }
    const newEditorType = detectEditorType();

    // 状態が変わった場合のみ処理
    if (newEditorType !== currentEditorType) {
      currentEditorType = newEditorType;

      if (newEditorType) {
        console.log(`📝 Editor detected: ${newEditorType}`);

        // タイトルフィールドが表示されるまで待機
        const titleSelector =
          newEditorType === 'popup'
            ? POPUP_SELECTORS.title
            : FULLPAGE_SELECTORS.title;

        try {
          await waitForElement(titleSelector, 5000);
          console.log('✅ Title field ready');

          // 少し待機してDOMが安定するのを待つ
          await new Promise(resolve => setTimeout(resolve, 100));

          // UIを挿入
          await injectTemplateSelector(newEditorType);
        } catch (error) {
          console.error('❌ Failed to wait for title field:', error);
        }
      } else {
        console.log('🔍 No editor detected');
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log('👀 [Calendar Templates] MutationObserver started on document.body');
}

/**
 * 初期化
 */
function init(): void {
  console.log('🟡 [Calendar Templates] init() called');
  console.log('🟡 [Calendar Templates] Current hostname:', location.hostname);

  // Google Calendarのページか確認
  if (!location.hostname.includes('calendar.google.com')) {
    console.warn('⚠️ [Calendar Templates] Not a Google Calendar page, exiting');
    return;
  }

  console.log('🚀 [Calendar Templates] Initializing Calendar Templates extension...');

  // 画面の監視を開始
  watchForEventEditors();

  console.log('✅ [Calendar Templates] Initialization complete');
}

// 初期化を実行
console.log('🟣 [Calendar Templates] Registering initialization...');
console.log('🟣 [Calendar Templates] Document readyState:', document.readyState);

if (document.readyState === 'loading') {
  console.log('🟣 [Calendar Templates] Document loading, adding DOMContentLoaded listener');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🟣 [Calendar Templates] DOMContentLoaded fired');
    init();
  });
} else {
  console.log('🟣 [Calendar Templates] Document already ready, initializing immediately');
  init();
}

console.log('🟣 [Calendar Templates] Script execution finished');

export {};
