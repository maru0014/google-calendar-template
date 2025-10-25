/**
 * テンプレート変数の処理
 * Phase 0 調査結果より作成（検証済み: 11/11 成功）
 */

/**
 * 変数の値を取得するインターフェース
 */
export interface VariableValues {
  date: string;           // 2025-10-24
  date_jp: string;        // 2025年10月24日
  date_calendar: string;  // 2025年 10月 24日 (カレンダー入力形式)
  time: string;           // 20:15
  datetime: string;       // 2025/10/24 20:15:34
  day_of_week: string;    // 金曜日
  year: string;           // 2025
  month: string;          // 10
  day: string;            // 24
  user_email: string | null;  // user@example.com
  user_name: string | null;   // username
}

/**
 * 現在の日時を取得
 */
function getDateTime(): Date {
  return new Date();
}

/**
 * 日付 (ISO形式)
 */
function getDate(): string {
  return getDateTime().toISOString().split('T')[0];
}

/**
 * 日付 (日本語形式)
 */
function getDateJP(): string {
  const date = getDateTime();
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 日付 (Googleカレンダー入力形式)
 * 例: "2025年 10月 24日"
 */
function getDateCalendar(): string {
  const date = getDateTime();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年 ${month}月 ${day}日`;
}

/**
 * 時刻 (HH:mm形式)
 */
function getTime(): string {
  const date = getDateTime();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 日時 (日本語形式)
 */
function getDateTimeJP(): string {
  return getDateTime().toLocaleString('ja-JP');
}

/**
 * 曜日 (日本語)
 */
function getDayOfWeek(): string {
  return getDateTime().toLocaleDateString('ja-JP', { weekday: 'long' });
}

/**
 * 年
 */
function getYear(): string {
  return getDateTime().getFullYear().toString();
}

/**
 * 月
 */
function getMonth(): string {
  return (getDateTime().getMonth() + 1).toString();
}

/**
 * 日
 */
function getDay(): string {
  return getDateTime().getDate().toString();
}

/**
 * ユーザーのメールアドレスを取得
 * 複数の方法で取得を試みる
 */
function getUserEmail(): string | null {
  const emailPattern = /[\w\.-]+@[\w\.-]+\.\w+/g;

  // 方法1: プロフィールボタンのaria-label
  const profileButton = document.querySelector("[aria-label*='Google アカウント']");
  if (profileButton) {
    const ariaLabel = profileButton.getAttribute('aria-label');
    const match = ariaLabel?.match(emailPattern);
    if (match) return match[0];
  }

  // 方法2: ページ内のテキストから探す
  const bodyText = document.body.innerText;
  const emails = bodyText.match(emailPattern);
  if (emails && emails.length > 0) {
    // @gmail.com や個人ドメインのメールを優先
    const personalEmails = emails.filter(
      (email) =>
        !email.includes('@google.com') && !email.includes('@example.com')
    );
    if (personalEmails.length > 0) {
      return personalEmails[0];
    }
  }

  // 方法3: カレンダー一覧から取得を試みる
  const calendarInputs = document.querySelectorAll<HTMLInputElement>(
    "input[aria-label*='カレンダー']"
  );
  for (const input of Array.from(calendarInputs)) {
    const match = input.value.match(emailPattern);
    if (match) return match[0];
  }

  return null;
}

/**
 * ユーザー名を取得
 */
function getUserName(): string | null {
  // 方法1: プロフィールボタンのaria-label
  const profileButton = document.querySelector("[aria-label*='Google アカウント']");
  if (profileButton) {
    const ariaLabel = profileButton.getAttribute('aria-label');
    // "Google アカウント: Name (email@example.com)" の形式から名前を抽出
    const match = ariaLabel?.match(/:\s*([^(]+)\s*\(/);
    if (match) return match[1].trim();
  }

  // 方法2: カレンダー選択から取得
  const calendarSelect = document.querySelector('select');
  if (calendarSelect) {
    const selectedOption =
      calendarSelect.options[calendarSelect.selectedIndex];
    if (selectedOption && !selectedOption.text.includes('@')) {
      return selectedOption.text;
    }
  }

  // 方法3: メールアドレスからユーザー名部分を抽出
  const email = getUserEmail();
  if (email) {
    return email.split('@')[0];
  }

  return null;
}

/**
 * すべての変数の値を取得
 */
export function getAllVariables(): VariableValues {
  return {
    date: getDate(),
    date_jp: getDateJP(),
    date_calendar: getDateCalendar(),
    time: getTime(),
    datetime: getDateTimeJP(),
    day_of_week: getDayOfWeek(),
    year: getYear(),
    month: getMonth(),
    day: getDay(),
    user_email: getUserEmail(),
    user_name: getUserName(),
  };
}

/**
 * テンプレート文字列の変数を置換
 *
 * @param template - 変数を含むテンプレート文字列
 * @param customValues - カスタム変数値（オプション）
 * @returns 置換後の文字列
 *
 * @example
 * replaceVariables("ミーティング {{date_jp}} {{time}}")
 * // => "ミーティング 2025年10月24日 20:15"
 */
export function replaceVariables(
  template: string,
  customValues?: Partial<VariableValues>
): string {
  const variables = { ...getAllVariables(), ...customValues };
  let result = template;

  // 各変数を置換
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== null) {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(pattern, value);
    }
  });

  return result;
}

/**
 * 変数が含まれているかチェック
 */
export function hasVariables(text: string): boolean {
  return /\{\{[^}]+\}\}/.test(text);
}

/**
 * テンプレート内の変数を抽出
 */
export function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];

  return matches.map((match) => match.replace(/\{\{|\}\}/g, ''));
}
