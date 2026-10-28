import { SETTINGS_SELECTORS as S, POPUP_SELECTORS } from '../constants/selectors';
import { setFieldValue, waitForElement } from './dom';
import type { FieldSetResult } from '../types';

const visible = (element: Element): boolean => element.getClientRects().length > 0;

export const get_popup_editor = (): HTMLElement => {
  const titles = Array.from(document.querySelectorAll<HTMLElement>(S.popup_title)).filter(visible);
  if (titles.length !== 1) throw new Error('小さい予定画面を一意に特定できません');
  const root = titles[0].closest<HTMLElement>(S.popup_root);
  if (!root) throw new Error('小さい予定画面が見つかりません');
  return root;
};

/** 対象予定に属する折畳みパネルだけを、外側から最大3段まで展開する。 */
export const expand_popup_field = async (root: HTMLElement, selector: string): Promise<HTMLElement> => {
  const clicked = new Set<HTMLElement>();
  for (let level = 0; level < 4; level++) {
    // 各展開後は入力欄または次のトリガーが描画されるまで有界待機する。
    for (let attempt = 0; attempt < 40; attempt++) {
      const ready = Array.from(root.querySelectorAll<HTMLElement>(selector)).some(visible) ||
        Array.from(root.querySelectorAll<HTMLElement>(S.expandable_button)).some((button) => {
          const panel = document.getElementById(button.getAttribute('aria-controls') ?? '');
          return !clicked.has(button) && visible(button) && panel && root.contains(panel) && panel.querySelector(selector);
        });
      if (ready) break;
      if (!root.isConnected) throw new Error('予定画面が閉じられました');
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (!root.isConnected || get_popup_editor() !== root) throw new Error('予定画面が変わったため適用を中止しました');
    const fields = Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(visible);
    if (fields.length === 1) return fields[0];
    if (fields.length > 1) throw new Error('対象の入力欄を一意に特定できません');
    const triggers = Array.from(root.querySelectorAll<HTMLElement>(S.expandable_button)).filter((button) => {
      const panel = document.getElementById(button.getAttribute('aria-controls') ?? '');
      return !clicked.has(button) && visible(button) && panel && root.contains(panel) && panel.querySelector(selector);
    });
    if (triggers.length !== 1 || level === 3) throw new Error('入力欄を展開するボタンが見つからないか曖昧です');
    // 複合ボタンの全体clickは添付ファイル側が選ばれるため、説明だけを選ぶ。
    const description = triggers[0].querySelector<HTMLElement>(S.description_key);
    clicked.add(triggers[0]);
    (description ?? triggers[0]).click();
  }
  throw new Error('入力欄を展開できませんでした');
};

export const apply_popup_description = async (value: string): Promise<FieldSetResult> => {
  if (typeof document === 'undefined') return { field: 'description', success: false };
  try {
    await waitForElement(POPUP_SELECTORS.title, 2000);
    const root = get_popup_editor();
    const field = await expand_popup_field(root, S.popup_description);
    if (!setFieldValue(field, value)) throw new Error('説明を入力できません');
    field.blur();
    for (let attempt = 0; attempt < 40; attempt++) {
      if (!root.isConnected || get_popup_editor() !== root) throw new Error('予定画面が変わりました');
      const fields = Array.from(root.querySelectorAll<HTMLElement>(S.popup_description)).filter(visible);
      if (fields.length === 1 && fields[0].innerText.replace(/\r\n/g, '\n') === value.replace(/\r\n/g, '\n')) {
        return { field: 'description', success: true };
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error('説明の反映を確認できませんでした');
  } catch (error) {
    console.error('❌ [Error] 小さい予定画面の説明適用に失敗しました', error);
    return { field: 'description', success: false, error: error instanceof Error ? error.message : '説明の適用に失敗しました' };
  }
};
