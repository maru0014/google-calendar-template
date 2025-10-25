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

/**
 * テンプレート適用結果
 */
export interface ApplyResult {
  success: boolean;
  failedFields?: string[];
  error?: string;
}

/**
 * フィールド設定の結果
 */
export interface FieldSetResult {
  field: string;
  success: boolean;
  error?: string;
}
