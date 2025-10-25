/**
 * Googleカレンダーのセレクタ定義
 * Phase 0 調査結果より作成（検証済み）
 */

/**
 * ポップアップウィンドウのセレクタ
 * 予定作成の小さいポップアップ画面用
 */
export const POPUP_SELECTORS = {
  // ルート要素
  dialog: "[role='dialog']",

  // 入力フィールド（絶対セレクタ）
  title: "[role='dialog'] input[aria-label='タイトルを追加']",
  description: "[role='dialog'] div[aria-label='説明を追加']",
  location: "[role='dialog'] input[aria-label='場所を追加']",
  guests: "[role='dialog'] input[aria-label='ゲスト']",

  // 日時フィールド
  startDate: "[role='dialog'] input[aria-label='開始日']",
  startTime: "[role='dialog'] input[aria-label='開始時間']",
  endDate: "[role='dialog'] input[aria-label='終了日']",
  endTime: "[role='dialog'] input[aria-label='終了時間']",

  // チェックボックス
  allDay: "[role='dialog'] input[type='checkbox'][aria-label='終日']",

  // 相対セレクタ（dialog内で使用）
  titleRelative: "input[aria-label='タイトルを追加']",
  descriptionRelative: "div[aria-label='説明を追加']",

  // UI挿入ポイント
  footer: "[role='dialog'] .pw1uU",
  buttonContainer: ".VfPpkd-dgl2Hf-ppHlrf-sM5MNb",
} as const;

/**
 * フルページエディタのセレクタ
 * 予定作成のフルページ画面用
 */
export const FULLPAGE_SELECTORS = {
  // ルート要素
  dialog: "div[data-draggable-id]",

  // 入力フィールド
  title: "input[aria-label='タイトル']",
  description: "div[aria-label='説明']",

  // 日時フィールド（type="text" であることに注意）
  startDate: "input[aria-label='開始日']",
  startTime: "input[aria-label='開始時間']",
  endDate: "input[aria-label='終了日']",
  endTime: "input[aria-label='終了時間']",

  // その他のフィールド
  guests: "input[aria-label='ゲスト']",
  location: "input[aria-label='場所を追加']",

  // チェックボックス
  allDay: "input[type='checkbox'][aria-label='終日']",

  // ゲストの権限
  guestPermissions: {
    canModify: "input[aria-label='ゲストに予定の編集を許可する']",
    canInviteOthers: "input[aria-label='他のユーザーをこの予定に招待することをゲストに許可する']",
    seeGuestList: "input[aria-label='ゲストにゲストリストの表示を許可する。']",
  },
} as const;

/**
 * 画面検出用のセレクタ
 */
export const DETECTION_SELECTORS = {
  popup: "[role='dialog']",
  fullPage: "div[aria-label='説明']",
  fullPageTitle: "input[aria-label='タイトル']",
} as const;

/**
 * UI挿入ポイント
 */
export const INJECTION_POINTS = {
  popup: {
    beforeTitle: "[role='dialog'] input[aria-label='タイトルを追加']",
  },
  fullpage: {
    beforeTitle: "input[aria-label='タイトル']",
  },
} as const;

/**
 * セレクタの型定義
 */
export type PopupSelectors = typeof POPUP_SELECTORS;
export type FullPageSelectors = typeof FULLPAGE_SELECTORS;
export type DetectionSelectors = typeof DETECTION_SELECTORS;
export type InjectionPoints = typeof INJECTION_POINTS;
