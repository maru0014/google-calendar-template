/**
 * Popup Script
 * テンプレート管理画面
 */

import { loadTemplates, saveTemplates } from '../utils/storage';
import type { Template } from '../types';

console.log('📋 Google Calendar Templates - Popup Loaded');

// DOM要素
let templateList: HTMLUListElement;
let emptyState: HTMLDivElement;
let modal: HTMLDivElement;
let modalTitle: HTMLDivElement;
let templateForm: HTMLFormElement;
let createBtn: HTMLButtonElement;
let cancelBtn: HTMLButtonElement;

// 現在編集中のテンプレートID
let editingTemplateId: string | null = null;

// テンプレート一覧
let templates: Template[] = [];

/**
 * テンプレート一覧を表示
 */
function renderTemplates(): void {
  templateList.innerHTML = '';

  if (templates.length === 0) {
    templateList.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  templateList.style.display = 'block';
  emptyState.style.display = 'none';

  templates.forEach((template, index) => {
    const li = document.createElement('li');
    li.className = 'template-item';
    li.draggable = true;
    li.dataset.index = index.toString();
    li.dataset.id = template.id;

    // プレビュー文字列
    const preview = template.title + (template.description ? ` - ${template.description}` : '');

    li.innerHTML = `
      <span class="drag-handle">⋮⋮</span>
      <div class="template-info">
        <div class="template-name">${escapeHtml(template.name)}</div>
        <div class="template-preview">${escapeHtml(preview)}</div>
      </div>
      <div class="template-actions">
        <button class="edit" data-id="${template.id}">編集</button>
        <button class="delete" data-id="${template.id}">削除</button>
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

    editBtn.addEventListener('click', () => openEditModal(template));
    deleteBtn.addEventListener('click', () => deleteTemplate(template.id));

    templateList.appendChild(li);
  });
}

/**
 * モーダルを開く（新規作成）
 */
function openCreateModal(): void {
  editingTemplateId = null;
  modalTitle.textContent = 'テンプレートを作成';
  templateForm.reset();
  modal.classList.add('show');
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
  (document.getElementById('template-guests') as HTMLInputElement).value = template.guests?.join(', ') || '';
  (document.getElementById('template-duration') as HTMLInputElement).value = template.duration?.toString() || '';

  modal.classList.add('show');
}

/**
 * モーダルを閉じる
 */
function closeModal(): void {
  modal.classList.remove('show');
  templateForm.reset();
  editingTemplateId = null;
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
  const guestsStr = (document.getElementById('template-guests') as HTMLInputElement).value.trim();
  const durationStr = (document.getElementById('template-duration') as HTMLInputElement).value.trim();

  if (!name || !title) {
    alert('テンプレート名とタイトルは必須です');
    return;
  }

  const template: Template = {
    id: editingTemplateId || `template_${Date.now()}`,
    name,
    title,
    description: description || '',
    location: location || undefined,
    guests: guestsStr ? guestsStr.split(',').map((g) => g.trim()).filter(Boolean) : undefined,
    duration: durationStr ? parseFloat(durationStr) : undefined,
    order: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
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

  items.forEach((item) => {
    const id = (item as HTMLElement).dataset.id;
    const template = templates.find((t) => t.id === id);
    if (template) {
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
 * 初期化
 */
async function init(): Promise<void> {
  // DOM要素を取得
  templateList = document.getElementById('template-list') as HTMLUListElement;
  emptyState = document.getElementById('empty-state') as HTMLDivElement;
  modal = document.getElementById('modal') as HTMLDivElement;
  modalTitle = document.getElementById('modal-title') as HTMLDivElement;
  templateForm = document.getElementById('template-form') as HTMLFormElement;
  createBtn = document.getElementById('create-btn') as HTMLButtonElement;
  cancelBtn = document.getElementById('cancel-btn') as HTMLButtonElement;

  // イベントリスナー
  createBtn.addEventListener('click', openCreateModal);
  cancelBtn.addEventListener('click', closeModal);
  templateForm.addEventListener('submit', saveTemplate);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
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
