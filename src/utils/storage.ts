/**
 * Chrome Storage API ラッパー
 * テンプレートデータの保存・取得を管理
 */

/**
 * テンプレートのデータ構造
 */
export interface Template {
  id: string;
  name: string;
  title: string;
  description: string;
  location?: string;
  guests?: string[];
  duration?: number; // 分単位
  allDay?: boolean;
  visibility?: 'default' | 'public' | 'private';
  guestPermissions?: {
    canModify?: boolean;
    canInviteOthers?: boolean;
    seeGuestList?: boolean;
  };
  order: number; // 並び順
  createdAt: number;
  updatedAt: number;
}

/**
 * ストレージのキー
 */
const STORAGE_KEYS = {
  TEMPLATES: 'templates',
  SELECTED_TEMPLATE_ID: 'selectedTemplateId',
  BACKUP_TEMPLATES: 'templates_backup',
  BACKUP_TEMPLATES_HISTORY: 'templates_backups',
} as const;

/**
 * テンプレート一覧を取得
 */
export async function getTemplates(): Promise<Template[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.TEMPLATES);
    return result[STORAGE_KEYS.TEMPLATES] || [];
  } catch (error) {
    console.error('Failed to get templates:', error);
    return [];
  }
}

/**
 * テンプレート一覧を取得（エイリアス）
 */
export const loadTemplates = getTemplates;

/**
 * テンプレート一覧を保存
 */
export async function saveTemplates(templates: Template[]): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.TEMPLATES]: templates });
  } catch (error) {
    console.error('Failed to save templates:', error);
    throw error;
  }
}

/**
 * テンプレートを保存（新規作成）
 */
export async function saveTemplate(
  template: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'order'>
): Promise<Template> {
  try {
    const templates = await getTemplates();

    const newTemplate: Template = {
      ...template,
      id: generateId(),
      order: templates.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    templates.push(newTemplate);
    await chrome.storage.local.set({ [STORAGE_KEYS.TEMPLATES]: templates });

    return newTemplate;
  } catch (error) {
    console.error('Failed to save template:', error);
    throw error;
  }
}

/**
 * テンプレートを更新
 */
export async function updateTemplate(
  id: string,
  updates: Partial<Omit<Template, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Template | null> {
  try {
    const templates = await getTemplates();
    const index = templates.findIndex((t) => t.id === id);

    if (index === -1) {
      console.error('Template not found:', id);
      return null;
    }

    templates[index] = {
      ...templates[index],
      ...updates,
      updatedAt: Date.now(),
    };

    await chrome.storage.local.set({ [STORAGE_KEYS.TEMPLATES]: templates });

    return templates[index];
  } catch (error) {
    console.error('Failed to update template:', error);
    throw error;
  }
}

/**
 * テンプレートを削除
 */
export async function deleteTemplate(id: string): Promise<boolean> {
  try {
    const templates = await getTemplates();
    const filtered = templates.filter((t) => t.id !== id);

    if (filtered.length === templates.length) {
      console.error('Template not found:', id);
      return false;
    }

    // orderを再計算
    filtered.forEach((t, index) => {
      t.order = index;
    });

    await chrome.storage.local.set({ [STORAGE_KEYS.TEMPLATES]: filtered });

    return true;
  } catch (error) {
    console.error('Failed to delete template:', error);
    throw error;
  }
}

/**
 * テンプレートをIDで取得
 */
export async function getTemplateById(id: string): Promise<Template | null> {
  try {
    const templates = await getTemplates();
    return templates.find((t) => t.id === id) || null;
  } catch (error) {
    console.error('Failed to get template by id:', error);
    return null;
  }
}

/**
 * テンプレートの並び順を更新
 */
export async function reorderTemplates(
  templateIds: string[]
): Promise<boolean> {
  try {
    const templates = await getTemplates();

    // IDの順序に基づいてテンプレートを並び替え
    const reordered = templateIds
      .map((id) => templates.find((t) => t.id === id))
      .filter((t): t is Template => t !== undefined);

    // orderを更新
    reordered.forEach((t, index) => {
      t.order = index;
      t.updatedAt = Date.now();
    });

    await chrome.storage.local.set({ [STORAGE_KEYS.TEMPLATES]: reordered });

    return true;
  } catch (error) {
    console.error('Failed to reorder templates:', error);
    throw error;
  }
}

/**
 * 選択中のテンプレートIDを保存
 */
export async function setSelectedTemplateId(
  id: string | null
): Promise<void> {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.SELECTED_TEMPLATE_ID]: id,
    });
  } catch (error) {
    console.error('Failed to set selected template id:', error);
    throw error;
  }
}

/**
 * 選択中のテンプレートIDを取得
 */
export async function getSelectedTemplateId(): Promise<string | null> {
  try {
    const result = await chrome.storage.local.get(
      STORAGE_KEYS.SELECTED_TEMPLATE_ID
    );
    return result[STORAGE_KEYS.SELECTED_TEMPLATE_ID] || null;
  } catch (error) {
    console.error('Failed to get selected template id:', error);
    return null;
  }
}

/**
 * ストレージの変更を監視
 */
export function onStorageChange(
  callback: (changes: {
    templates?: { oldValue?: Template[]; newValue?: Template[] };
    selectedTemplateId?: { oldValue?: string; newValue?: string };
  }) => void
): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      callback(changes);
    }
  });
}

/**
 * ユニークIDを生成
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * すべてのデータをエクスポート（将来の機能用）
 */
export async function exportData(): Promise<string> {
  try {
    const templates = await getTemplates();
    const sorted = [...templates].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return JSON.stringify(sorted, null, 2);
  } catch (error) {
    console.error('Failed to export data:', error);
    throw error;
  }
}

/**
 * データをインポート（将来の機能用）
 */
export async function importData(jsonString: string): Promise<boolean> {
  try {
    const parsed = JSON.parse(jsonString);

    if (!Array.isArray(parsed)) {
      throw new Error('Invalid data format: expected an array');
    }

    const now = Date.now();
    const existing = await getTemplates();
    // サイレントバックアップ（ダウンロードしない）
    try {
      // 互換: 単一バックアップを維持
      await chrome.storage.local.set({
        [STORAGE_KEYS.BACKUP_TEMPLATES]: {
          templates: existing,
          backedUpAt: now,
        },
      });
      // 新: 直近3件のローテーション
      const historyGet = await chrome.storage.local.get(
        STORAGE_KEYS.BACKUP_TEMPLATES_HISTORY
      );
      const history: { templates: Template[]; backedUpAt: number }[] =
        historyGet[STORAGE_KEYS.BACKUP_TEMPLATES_HISTORY] || [];
      history.push({ templates: existing, backedUpAt: now });
      const rotated = history.slice(-3);
      await chrome.storage.local.set({
        [STORAGE_KEYS.BACKUP_TEMPLATES_HISTORY]: rotated,
      });
    } catch (e) {
      console.warn('Failed to save silent backup:', e);
    }
    const existingIds = new Set(existing.map((t) => t.id));

    const normalized: Template[] = parsed.map((item: any, idx: number) => {
      const normalizedGuests: string[] | undefined = Array.isArray(item?.guests)
        ? item.guests.filter((g: any) => typeof g === 'string')
        : undefined;

      let id: string = typeof item?.id === 'string' && item.id.trim() ? item.id : generateId();
      if (existingIds.has(id)) {
        id = generateId();
      }

      const name: string = typeof item?.name === 'string' ? item.name : '';
      const title: string = typeof item?.title === 'string' ? item.title : '';
      const description: string = typeof item?.description === 'string' ? item.description : '';
      const location: string | undefined = typeof item?.location === 'string' && item.location.trim() ? item.location : undefined;
      const duration: number | undefined = typeof item?.duration === 'number' && isFinite(item.duration) && item.duration >= 0
        ? Math.floor(item.duration)
        : undefined;

      if (!name || !title) {
        throw new Error('Invalid template: name and title are required');
      }

      const createdAt: number = typeof item?.createdAt === 'number' ? item.createdAt : now;
      const updatedAt: number = typeof item?.updatedAt === 'number' ? item.updatedAt : now;

      return {
        id,
        name,
        title,
        description,
        location,
        guests: normalizedGuests,
        duration,
        allDay: typeof item?.allDay === 'boolean' ? item.allDay : undefined,
        visibility: item?.visibility === 'default' || item?.visibility === 'public' || item?.visibility === 'private'
          ? item.visibility
          : undefined,
        guestPermissions: typeof item?.guestPermissions === 'object' && item?.guestPermissions
          ? {
              canModify: typeof item.guestPermissions.canModify === 'boolean' ? item.guestPermissions.canModify : undefined,
              canInviteOthers: typeof item.guestPermissions.canInviteOthers === 'boolean' ? item.guestPermissions.canInviteOthers : undefined,
              seeGuestList: typeof item.guestPermissions.seeGuestList === 'boolean' ? item.guestPermissions.seeGuestList : undefined,
            }
          : undefined,
        order: idx,
        createdAt,
        updatedAt,
      } as Template;
    });

    // マージ（既存 + インポート）し、orderを振り直し
    // updatedAt は既存は維持、新規/インポート元が未設定なら now
    const mergedSource: Template[] = [...existing, ...normalized];
    const merged: Template[] = mergedSource.map((t, index) => ({
      ...t,
      order: index,
      updatedAt: typeof t.updatedAt === 'number' ? t.updatedAt : now,
    }));

    await chrome.storage.local.set({ [STORAGE_KEYS.TEMPLATES]: merged });
    return true;
  } catch (error) {
    console.error('Failed to import data:', error);
    throw error;
  }
}

/**
 * 直近バックアップを取得（存在しない場合は null）
 */
export async function getLastBackup(): Promise<{
  templates: Template[];
  backedUpAt: number;
} | null> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.BACKUP_TEMPLATES);
    return result[STORAGE_KEYS.BACKUP_TEMPLATES] || null;
  } catch (error) {
    console.error('Failed to get last backup:', error);
    return null;
  }
}
