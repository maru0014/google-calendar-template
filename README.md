# Google Calendar Template

Googleカレンダーで予定を作成する際に、事前に保存したテンプレートを適用できるChrome拡張機能。

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Available-brightgreen)](https://chromewebstore.google.com/detail/gmgfladmnifefmoggfhgmdkdoelbmeec)
[![Version](https://img.shields.io/badge/version-0.1.1-blue)](https://github.com/maru0014/google-calendar-template/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 📦 インストール

### Chrome Web Store（推奨）
[Chrome Web Storeからインストール](https://chromewebstore.google.com/detail/gmgfladmnifefmoggfhgmdkdoelbmeec)

### 開発者モード
詳細は[インストールガイド](docs/INSTALL_GUIDE.md)をご覧ください。

## ✨ 機能

### テンプレート管理
- ✅ 予定テンプレートの作成・編集・削除
- ✅ D&Dによるテンプレートの並び替え
- ✅ ローカルストレージに保存

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

## 🎯 開発状況

- ✅ **Phase 0**: DOM調査・セレクタ設計 完了
- ✅ **Phase 1**: 基本機能実装 完了
- ✅ **Phase 2**: UX改善・実環境テスト 完了
  - ✅ ポップアップ・フルページ対応
  - ✅ 期間設定の実装（分単位、1分刻み）
  - ✅ 時刻の視覚的反映（Enterキー）
  - ✅ UI配置の最適化
  - ✅ テンプレート選択の保持
  - ✅ 変数置換テスト（11種類すべて）
  - ✅ エッジケーステスト（7項目）

## 開発

### セットアップ

```bash
npm install
```

### 開発モード

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

ビルド後、`dist/`フォルダをChromeの拡張機能ページで読み込んでください。

## プロジェクト構造

```
google-calendar-template/
├── src/
│   ├── constants/        # セレクタ定義
│   ├── utils/            # ユーティリティ関数
│   ├── types/            # 型定義
│   ├── content/          # Content Script
│   └── popup/            # Popup UI
├── docs/                 # ドキュメント
│   ├── INSTALL_GUIDE.md  # インストール・使用方法
│   └── PRIVACY_POLICY.md # プライバシーポリシー
├── dist/                 # ビルド出力
├── icons/                # アイコン
├── scripts/              # ビルドスクリプト
├── manifest.json         # Chrome拡張のマニフェスト
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 📚 ドキュメント

- **README.md**: プロジェクト概要と開発状況
- **[docs/INSTALL_GUIDE.md](docs/INSTALL_GUIDE.md)**: インストール手順と使用方法の詳細ガイド
- **[docs/PRIVACY_POLICY.md](docs/PRIVACY_POLICY.md)**: プライバシーポリシー
- **manifest.json**: Chrome拡張機能の設定
- **src/constants/selectors.ts**: GoogleカレンダーのDOMセレクタ定義

## ✅ Phase 2 検証結果

### セレクタ検証（Phase 0）
- ✅ ポップアップ: 9個のフィールド（100%）
- ✅ フルページ: 12個のフィールド（100%）
- ✅ 変数取得: 11種類（100%）

### 機能テスト（Phase 2）
- ✅ ポップアップでのテンプレート適用: タイトル、説明、場所、ゲスト、期間
- ✅ フルページでのテンプレート適用: 全フィールド対応
- ✅ 時刻設定: React対応の値設定 + Enterキーによる視覚的反映
- ✅ ゲスト入力後の自動クローズ
- ✅ UI配置: ポップアップ・フルページ両方で最適化
- ✅ テンプレート選択の保持（UX改善）
- ✅ z-index調整: 時刻プルダウンとの競合解決
- ✅ 変数置換: 11種類すべて動作確認済み
- ✅ エッジケース: 最小限・長文・特殊文字・複数ゲスト・無効な変数・極端な期間・テンプレート0件

## 🗺️ 今後の開発予定（Phase 3以降）

### テンプレート管理の強化 🗂️
- カテゴリ分け（仕事/プライベート/会議など）
- テンプレート検索機能
- お気に入り機能

### インポート/エクスポート 💾
- ✅ テンプレートのバックアップ（JSON）
- ✅ JSON形式での共有
- 他のユーザーとのテンプレート共有

### 使い方（インポート/エクスポート）
1. 拡張機能のポップアップを開く
2. 右上のアイコンボタンを使用
   - ⬆（箱＋上矢印）: エクスポート（JSONをダウンロード）
   - ⬇（箱＋下矢印）: インポート（JSONファイルを選択）
3. インポート時の挙動
   - 既存データは `chrome.storage.local` にサイレントバックアップ（`templates_backup`）として保存
   - 直近バックアップはローテーションで最大3件保持（`templates_backups`）
   - JSONのスキーマを検証・正規化してマージ（ID重複は新規ID採番）
   - 並び順（`order`）は再採番（エクスポート→即インポートでも順序は維持されます）
   - 失敗時は理由をダイアログで通知

注意事項
- ファイルサイズ: 最大 1MB
- 必須: `name`, `title`（欠落時はインポート失敗）
- `guests` は文字列配列として解釈されます
 - `updatedAt` は既存テンプレートは維持します（新規/未設定のみ現在時刻）
 - `name` の重複は許容され、別テンプレートとして追加されます（上書きは行いません）

エラー例
- 壊れたJSON: 「JSONの解析に失敗しました」
- 形式不正: 「データ形式が不正です」
- 必須不足: 「必須項目が不足しています（name/title）」

### 高度な変数機能 🔧
- カスタム変数（自分で定義可能）
- 条件分岐（例: 平日なら9:00、週末なら10:00）
- 計算式（例: `{{date+7}}`で1週間後）

### キーボードショートカット ⌨️
- テンプレート選択をキーボードで操作
- お気に入りテンプレートへの即座アクセス

### 繰り返しイベント対応 🔄
- 毎週・毎月などの繰り返し設定にも対応

### カスタマイズ 🎨
- イベントカラーの設定
- リマインダーの設定

### 複数カレンダー対応 📅
- テンプレート毎に保存先カレンダーを指定

## 🤝 コントリビューション

バグレポート、機能要望、プルリクエストを歓迎します！

- **バグ報告**: [GitHub Issues](https://github.com/maru0014/google-calendar-template/issues)
- **機能要望**: [GitHub Issues](https://github.com/maru0014/google-calendar-template/issues)
- **プルリクエスト**: [CONTRIBUTING.md](CONTRIBUTING.md)をご確認ください

詳細は[コントリビューションガイド](CONTRIBUTING.md)をご覧ください。

## 📄 ライセンス

MIT License - 詳細は[LICENSE](LICENSE)をご覧ください。

## 🔒 プライバシー

本拡張機能は、すべてのデータをローカルに保存し、外部サーバーへの送信は一切行いません。

詳細は[プライバシーポリシー](https://maru0014.github.io/google-calendar-template/docs/PRIVACY_POLICY)をご覧ください。
