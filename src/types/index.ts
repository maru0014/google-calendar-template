/**
 * 型定義
 */

// Re-export from storage
export type { Template } from '../utils/storage';

// Re-export from variables
export type { VariableValues } from '../utils/variables';

// Re-export from selectors
export type {
  PopupSelectors,
  FullPageSelectors,
  DetectionSelectors,
} from '../constants/selectors';

/**
 * 画面タイプ
 */
export type ViewType = 'popup' | 'fullpage' | 'unknown';

export type LatestTask = (is_current: () => boolean) => Promise<void>;

/**
 * テンプレート適用結果
 */
export interface ApplyResult {
  success: boolean;
  failedFields?: string[];
  field_errors?: FieldSetResult[];
  error?: string;
}

export interface ReminderItem {
  method: 'notification' | 'email';
  minutes: number;
}

export type RemindersConfig = { mode: 'none' } | {
  mode: 'replace' | 'append'; items: ReminderItem[];
};

export type EventColorConfig = { mode: 'default' } | {
  mode: 'explicit'; color_key: string;
};

/**
 * フィールド設定の結果
 */
export interface FieldSetResult {
  field: string;
  success: boolean;
  error?: string;
}

export interface DurationSelectors {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}
