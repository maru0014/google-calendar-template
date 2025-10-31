## Unreleased

### Features
- Import/Export: テンプレートのJSON入出力を追加（Popupヘッダーのアイコンボタン）
  - エクスポートは並び順を維持して出力
  - インポートはスキーマ検証・正規化・ID重複の自動解消・`order`再採番・既存`updatedAt`維持
- UI: ヘッダーの操作をアイコン化（箱＋矢印）。新規作成をプライマリ色（#0b57d0）に変更

### Fixes
- インポート時にバックアップ用のダウンロードが走り保存ダイアログが出る問題を解消
  - 旧データを `chrome.storage.local` に静音バックアップ（`templates_backup`）する方式に変更
  - バックアップは直近3件をローテーション保存（`templates_backups`）

# 🎉 v0.1.0-beta - 初回ベータリリース

Googleカレンダーに予定作成用のテンプレート機能を追加するChrome拡張機能の初回ベータ版です！

## ✨ 主な機能

### テンプレート管理
- ✅ 予定テンプレートの作成・編集・削除
- ✅ D&Dによるテンプレートの並び替え
- ✅ ローカルストレージに保存（外部送信なし）

### テンプレート適用
- ✅ ポップアップウィンドウでの適用
- ✅ フルページエディタでの適用
- ✅ Google Calendar UIに完璧に馴染む配置

### 変数機能（11種類）
- ✅ 日付変数: `{{date}}`, `{{date_jp}}`, `{{date_calendar}}`
- ✅ 時刻変数: `{{time}}`, `{{datetime}}`
- ✅ カレンダー変数: `{{day_of_week}}`, `{{year}}`, `{{month}}`, `{{day}}`
- ✅ ユーザー変数: `{{user_email}}`, `{{user_name}}`

### フィールド対応
- ✅ タイトル、説明、場所、ゲスト
- ✅ 開始・終了時刻、終日
- ✅ ゲスト権限（編集・招待・リスト表示）

## 📦 インストール方法

### Chrome Web Store（推奨）
[Chrome Web Storeからインストール](https://chromewebstore.google.com/detail/gmgfladmnifefmoggfhgmdkdoelbmeec)

### 開発者モード
1. [リリースページ](https://github.com/maru0014/google-calendar-template/releases/tag/v0.1.0-beta)から `google-calendar-template-v0.1.0-beta.zip` をダウンロード
2. ZIPファイルを解凍
3. Chromeの拡張機能ページ（`chrome://extensions/`）を開く
4. 「デベロッパーモード」を有効化
5. 「パッケージ化されていない拡張機能を読み込む」をクリック
6. 解凍したフォルダを選択

詳細は [インストールガイド](https://github.com/maru0014/google-calendar-template/blob/main/docs/INSTALL_GUIDE.md) をご覧ください。

## ⚠️ ベータ版について

このバージョンは初期リリースです。基本機能は動作していますが、今後のアップデートで機能追加や改善を予定しています。

### フィードバック・バグレポート
- [GitHub Issues](https://github.com/maru0014/google-calendar-template/issues)

## 🔒 プライバシー

本拡張機能は、すべてのデータをローカルに保存し、外部サーバーへの送信は一切行いません。

詳細は[プライバシーポリシー](https://maru0014.github.io/google-calendar-template/docs/PRIVACY_POLICY)をご覧ください。

## 📄 ライセンス

MIT License

## 🗺️ 今後の開発予定

- テンプレート管理の強化（カテゴリ分け、検索、お気に入り）
- インポート/エクスポート機能
- 高度な変数機能（カスタム変数、条件分岐、計算式）
- キーボードショートカット
- 繰り返しイベント対応
- カスタマイズ（イベントカラー、リマインダー）

詳細な変更履歴は [CHANGELOG.md](https://github.com/maru0014/google-calendar-template/blob/main/CHANGELOG.md) をご覧ください。

---

**Google Calendar Template をお楽しみください！** 🎉
