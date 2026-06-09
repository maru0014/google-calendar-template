/**
 * Popup Script
 * テンプレート管理画面
 */

import { loadTemplates, saveTemplates, exportData, importData } from '../utils/storage';
import type { Template } from '../types';

console.log('📋 Google Calendar Template - Popup Loaded');

// DOM要素
let templateList: HTMLUListElement;
let listHint: HTMLDivElement;
let emptyState: HTMLDivElement;
let modal: HTMLDivElement;
let modalTitle: HTMLHeadingElement;
let templateForm: HTMLFormElement;
let createBtn: HTMLButtonElement;
let cancelBtn: HTMLButtonElement;
let modalCloseBtn: HTMLButtonElement;
let exportBtn: HTMLButtonElement;
let importBtn: HTMLButtonElement;
let importFileInput: HTMLInputElement;

// 現在編集中のテンプレートID
let editingTemplateId: string | null = null;

// モーダルを開いた要素（閉じた後にフォーカスを戻す）
let lastFocusedElement: HTMLElement | null = null;

// テンプレート一覧
let templates: Template[] = [];

/**
 * テンプレートに挿入できる変数（チップ表示用）
 */
const TEMPLATE_VARIABLES: { token: string; desc: string }[] = [
  { token: 'date', desc: '日付 (2025-10-24)' },
  { token: 'date_jp', desc: '日付・和式 (2025年10月24日)' },
  { token: 'date_calendar', desc: 'カレンダー入力形式 (2025年 10月 24日)' },
  { token: 'time', desc: '時刻 (20:15)' },
  { token: 'datetime', desc: '日時 (2025/10/24 20:15:34)' },
  { token: 'day_of_week', desc: '曜日 (金曜日)' },
  { token: 'year', desc: '年 (2025)' },
  { token: 'month', desc: '月 (10)' },
  { token: 'day', desc: '日 (24)' },
  { token: 'user_name', desc: 'ユーザー名' },
  { token: 'user_email', desc: 'メールアドレス' },
];

// SVGアイコン（バッジ用・装飾なので aria-hidden）
const ICON_CALENDAR =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V9h14v11z"/></svg>';
const ICON_LOCATION =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>';
const ICON_GUESTS =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>';
const ICON_DURATION =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h-5v-2h3V7h2v6z"/></svg>';
const ICON_EDIT =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
const ICON_DELETE =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';

/**
 * テンプレートの設定内容をバッジHTMLに変換
 */
function buildBadges(template: Template): string {
  const badges: string[] = [];

  if (template.calendarName) {
    badges.push(
      `<span class="badge cal" title="登録先カレンダー">${ICON_CALENDAR}${escapeHtml(template.calendarName)}</span>`
    );
  }
  if (template.location) {
    badges.push(
      `<span class="badge" title="場所">${ICON_LOCATION}${escapeHtml(template.location)}</span>`
    );
  }
  if (template.guests && template.guests.length > 0) {
    badges.push(
      `<span class="badge" title="ゲスト">${ICON_GUESTS}${template.guests.length}名</span>`
    );
  }
  if (template.allDay) {
    badges.push(`<span class="badge" title="期間">${ICON_DURATION}終日</span>`);
  } else if (typeof template.duration === 'number') {
    badges.push(
      `<span class="badge" title="期間">${ICON_DURATION}${template.duration}分</span>`
    );
  }

  // 設定バッジが無い場合はイベントタイトルをプレビュー表示
  if (badges.length === 0 && template.title) {
    badges.push(`<span class="badge">${escapeHtml(template.title)}</span>`);
  }

  return badges.join('');
}

/**
 * テンプレート一覧を表示
 */
function renderTemplates(): void {
  templateList.innerHTML = '';

  if (templates.length === 0) {
    templateList.style.display = 'none';
    listHint.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  templateList.style.display = 'flex';
  listHint.style.display = templates.length > 1 ? 'block' : 'none';
  emptyState.style.display = 'none';

  templates.forEach((template, index) => {
    const li = document.createElement('li');
    li.className = 'template-item';
    li.draggable = true;
    li.dataset.index = index.toString();
    li.dataset.id = template.id;

    li.innerHTML = `
      <span class="drag-handle" aria-hidden="true">⠿</span>
      <div class="template-info">
        <div class="template-name">${escapeHtml(template.name)}</div>
        <div class="badges">${buildBadges(template)}</div>
      </div>
      <div class="template-actions">
        <button type="button" class="mini edit" title="編集">${ICON_EDIT}</button>
        <button type="button" class="mini delete" title="削除">${ICON_DELETE}</button>
      </div>
    `;

    // ドラッグイベント
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('drop', handleDrop);
    li.addEventListener('dragend', handleDragEnd);

    // 編集・削除ボタン
    const editBtn = li.querySelector('.edit') as HTMLButtonElement;
    const deleteBtn = li.querySelector('.delete') as HTMLButtonElement;

    // aria-label はユーザー入力を含むため setAttribute で安全に設定（属性文字列結合を避ける）
    editBtn.setAttribute('aria-label', `編集: ${template.name}`);
    deleteBtn.setAttribute('aria-label', `削除: ${template.name}`);

    editBtn.addEventListener('click', () => openEditModal(template));
    deleteBtn.addEventListener('click', () => deleteTemplate(template.id));

    templateList.appendChild(li);
  });
}

/**
 * モーダルを表示し、初期フォーカスを設定する
 */
function showModal(): void {
  lastFocusedElement = document.activeElement as HTMLElement | null;
  modal.classList.add('show');
  syncAllDayState();
  // 先頭の入力欄にフォーカス
  (document.getElementById('template-name') as HTMLInputElement).focus();
}

/**
 * モーダルを開く（新規作成）
 */
function openCreateModal(): void {
  editingTemplateId = null;
  modalTitle.textContent = 'テンプレートを作成';
  templateForm.reset();
  showModal();
}

/**
 * モーダルを開く（編集）
 */
function openEditModal(template: Template): void {
  editingTemplateId = template.id;
  modalTitle.textContent = 'テンプレートを編集';

  // フォームに値を設定
  (document.getElementById('template-name') as HTMLInputElement).value = template.name;
  (document.getElementById('template-title') as HTMLInputElement).value = template.title;
  (document.getElementById('template-description') as HTMLTextAreaElement).value = template.description || '';
  (document.getElementById('template-location') as HTMLInputElement).value = template.location || '';
  (document.getElementById('template-calendarName') as HTMLInputElement).value = template.calendarName || '';
  (document.getElementById('template-guests') as HTMLInputElement).value = template.guests?.join(', ') || '';
  (document.getElementById('template-duration') as HTMLInputElement).value = template.duration?.toString() || '';
  (document.getElementById('template-allDay') as HTMLInputElement).checked = template.allDay ?? false;

  showModal();
}

/**
 * モーダルを閉じる
 */
function closeModal(): void {
  modal.classList.remove('show');
  templateForm.reset();
  editingTemplateId = null;
  // モーダルを開いた要素へフォーカスを戻す
  lastFocusedElement?.focus();
  lastFocusedElement = null;
}

/**
 * 終日イベントON時は期間入力を無効化する
 */
function syncAllDayState(): void {
  const allDay = (document.getElementById('template-allDay') as HTMLInputElement).checked;
  const durationInput = document.getElementById('template-duration') as HTMLInputElement;
  durationInput.disabled = allDay;
  durationInput.parentElement?.parentElement
    ?.querySelectorAll<HTMLButtonElement>('.quick button')
    .forEach((btn) => {
      btn.disabled = allDay;
    });
}

/**
 * モーダル内でTabキーのフォーカスを閉じ込める
 */
function trapFocus(e: KeyboardEvent): void {
  if (e.key !== 'Tab' || !modal.classList.contains('show')) return;

  const focusable = modal.querySelectorAll<HTMLElement>(
    'button, input, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const visible = Array.from(focusable).filter(
    (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
  );
  if (visible.length === 0) return;

  const first = visible[0];
  const last = visible[visible.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

/**
 * テンプレートを保存
 */
async function saveTemplate(e: Event): Promise<void> {
  e.preventDefault();

  const name = (document.getElementById('template-name') as HTMLInputElement).value.trim();
  const title = (document.getElementById('template-title') as HTMLInputElement).value.trim();
  const description = (document.getElementById('template-description') as HTMLTextAreaElement).value.trim();
  const location = (document.getElementById('template-location') as HTMLInputElement).value.trim();
  const calendarName = (document.getElementById('template-calendarName') as HTMLInputElement).value.trim();
  const guestsStr = (document.getElementById('template-guests') as HTMLInputElement).value.trim();
  const durationStr = (document.getElementById('template-duration') as HTMLInputElement).value.trim();
  const allDay = (document.getElementById('template-allDay') as HTMLInputElement).checked;

  if (!name || !title) {
    alert('テンプレート名とタイトルは必須です');
    return;
  }

  const now = Date.now();

  // 編集時は既存テンプレートの createdAt と order を保持する
  const existingTemplate = editingTemplateId
    ? templates.find((t) => t.id === editingTemplateId)
    : null;

  const template: Template = {
    id: editingTemplateId || `template_${Date.now()}`,
    name,
    title,
    description: description || '',
    location: location || undefined,
    calendarName: calendarName || undefined,
    guests: guestsStr ? guestsStr.split(',').map((g) => g.trim()).filter(Boolean) : undefined,
    // 終日イベント時は期間（分）を持たない
    duration: allDay || !durationStr ? undefined : parseFloat(durationStr),
    // 未チェック時も false を明示的に保存し、適用時に終日を確実に解除できるようにする
    allDay,
    order: existingTemplate?.order ?? templates.length,
    createdAt: existingTemplate?.createdAt ?? now,
    updatedAt: now,
  };

  if (editingTemplateId) {
    // 編集
    const index = templates.findIndex((t) => t.id === editingTemplateId);
    if (index !== -1) {
      templates[index] = template;
    }
  } else {
    // 新規作成
    templates.push(template);
  }

  await saveTemplates(templates);
  closeModal();
  renderTemplates();
}

/**
 * テンプレートを削除
 */
async function deleteTemplate(id: string): Promise<void> {
  if (!confirm('このテンプレートを削除してもよろしいですか？')) {
    return;
  }

  templates = templates.filter((t) => t.id !== id);
  await saveTemplates(templates);
  renderTemplates();
}

/**
 * ドラッグ開始
 */
let draggedElement: HTMLElement | null = null;
let draggedIndex: number = -1;

function handleDragStart(e: DragEvent): void {
  draggedElement = e.currentTarget as HTMLElement;
  draggedIndex = parseInt(draggedElement.dataset.index || '0', 10);
  draggedElement.classList.add('dragging');
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedElement.dataset.id || '');
  }
}

/**
 * ドラッグオーバー
 */
function handleDragOver(e: DragEvent): void {
  e.preventDefault();
  const target = e.currentTarget as HTMLElement;

  if (target !== draggedElement) {
    const targetIndex = parseInt(target.dataset.index || '0', 10);

    if (draggedIndex < targetIndex) {
      target.parentNode?.insertBefore(draggedElement!, target.nextSibling);
    } else {
      target.parentNode?.insertBefore(draggedElement!, target);
    }

    // インデックスを更新
    updateIndices();
  }
}

/**
 * ドロップ
 */
async function handleDrop(e: DragEvent): Promise<void> {
  e.preventDefault();

  // 新しい順序でテンプレートを並び替え
  const newOrder: Template[] = [];
  const items = templateList.querySelectorAll('.template-item');

  items.forEach((item, index) => {
    const id = (item as HTMLElement).dataset.id;
    const template = templates.find((t) => t.id === id);
    if (template) {
      // order をDOM順で振り直し（保存配列順と order を一致させる）
      template.order = index;
      newOrder.push(template);
    }
  });

  templates = newOrder;
  await saveTemplates(templates);
}

/**
 * ドラッグ終了
 */
function handleDragEnd(): void {
  if (draggedElement) {
    draggedElement.classList.remove('dragging');
  }
  draggedElement = null;
  draggedIndex = -1;
}

/**
 * インデックスを更新
 */
function updateIndices(): void {
  const items = templateList.querySelectorAll('.template-item');
  items.forEach((item, index) => {
    (item as HTMLElement).dataset.index = index.toString();
  });
  draggedIndex = parseInt(draggedElement?.dataset.index || '0', 10);
}

/**
 * HTML エスケープ
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 入力欄のカーソル位置に変数を挿入し、フォーカスを維持する
 */
function insertVariable(
  field: HTMLInputElement | HTMLTextAreaElement,
  token: string
): void {
  const snippet = `{{${token}}}`;
  const start = field.selectionStart ?? field.value.length;
  const end = field.selectionEnd ?? field.value.length;

  field.value = field.value.slice(0, start) + snippet + field.value.slice(end);

  const caret = start + snippet.length;
  field.focus();
  field.setSelectionRange(caret, caret);
  // バリデーション等が input を監視している場合に備えて通知
  field.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * 変数チップを生成して各入力欄に紐付ける
 */
function setupVariableChips(): void {
  const containers =
    document.querySelectorAll<HTMLDivElement>('.vars[data-target]');

  containers.forEach((container) => {
    const targetId = container.dataset.target;
    if (!targetId) return;

    const field = document.getElementById(targetId) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | null;
    if (!field) return;

    // 再実行されてもチップが重複しないようにクリア
    container.replaceChildren();

    TEMPLATE_VARIABLES.forEach(({ token, desc }) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'var-chip';
      chip.textContent = `{{${token}}}`;
      chip.title = desc;
      chip.setAttribute('aria-label', `${token} を挿入: ${desc}`);
      chip.addEventListener('click', () => insertVariable(field, token));
      container.appendChild(chip);
    });
  });
}

/**
 * 期間クイックボタンの設定
 */
function setupDurationQuickButtons(): void {
  const durationInput = document.getElementById(
    'template-duration'
  ) as HTMLInputElement;

  document
    .querySelectorAll<HTMLButtonElement>('.quick button[data-duration]')
    .forEach((btn) => {
      btn.addEventListener('click', () => {
        durationInput.value = btn.dataset.duration || '';
      });
    });
}

/**
 * 初期化
 */
async function init(): Promise<void> {
  // DOM要素を取得
  templateList = document.getElementById('template-list') as HTMLUListElement;
  listHint = document.getElementById('list-hint') as HTMLDivElement;
  emptyState = document.getElementById('empty-state') as HTMLDivElement;
  modal = document.getElementById('modal') as HTMLDivElement;
  modalTitle = document.getElementById('modal-title') as HTMLHeadingElement;
  templateForm = document.getElementById('template-form') as HTMLFormElement;
  createBtn = document.getElementById('create-btn') as HTMLButtonElement;
  cancelBtn = document.getElementById('cancel-btn') as HTMLButtonElement;
  modalCloseBtn = document.getElementById('modal-close-btn') as HTMLButtonElement;
  exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
  importBtn = document.getElementById('import-btn') as HTMLButtonElement;
  importFileInput = document.getElementById('import-file') as HTMLInputElement;

  // 変数チップ・期間クイックボタンを構築
  setupVariableChips();
  setupDurationQuickButtons();

  // 終日イベントのトグルで期間入力を切替
  (document.getElementById('template-allDay') as HTMLInputElement).addEventListener(
    'change',
    syncAllDayState
  );

  // モーダル内のフォーカストラップ
  document.addEventListener('keydown', trapFocus);

  // イベントリスナー
  createBtn.addEventListener('click', openCreateModal);
  cancelBtn.addEventListener('click', closeModal);
  modalCloseBtn.addEventListener('click', closeModal);
  templateForm.addEventListener('submit', saveTemplate);
  exportBtn.addEventListener('click', handleExportClick);
  importBtn.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', handleImportFile);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  // Escキーでモーダルを閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      closeModal();
    }
  });

  // テンプレートを読み込み
  templates = await loadTemplates();
  renderTemplates();

  console.log('✅ Popup initialized');
}

// 初期化を実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};

/**
 * エクスポート処理
 */
async function handleExportClick(): Promise<void> {
  try {
    const json = await exportData();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    const ts = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const fileName = `calendar-templates-${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.json`;
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export:', error);
    alert('エクスポートに失敗しました。');
  }
}

/**
 * インポート処理
 */
async function handleImportFile(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement;
  const file = input.files && input.files[0];
  if (!file) return;

  try {
    if (file.size > 1024 * 1024) {
      alert('ファイルサイズが大きすぎます（最大1MB）');
      input.value = '';
      return;
    }

    const text = await file.text();

    // 解析段階のエラーを明示
    try {
      JSON.parse(text);
    } catch (syntaxErr) {
      alert('JSONの解析に失敗しました（ファイルが壊れている可能性があります）');
      input.value = '';
      return;
    }

    // インポート
    const ok = await importData(text);
    if (ok) {
      templates = await loadTemplates();
      renderTemplates();
      alert('インポートが完了しました。');
    }
  } catch (error) {
    console.error('Failed to import:', error);
    const message = (error as Error)?.message || '';
    if (message.includes('Invalid data format')) {
      alert('インポートに失敗しました（データ形式が不正です）。');
    } else if (message.includes('Invalid template')) {
      alert('インポートに失敗しました（必須項目が不足しています: name/title）。');
    } else {
      alert('インポートに失敗しました。ファイルの内容をご確認ください。');
    }
  } finally {
    input.value = '';
  }
}
