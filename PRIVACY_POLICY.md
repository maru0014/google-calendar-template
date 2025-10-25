# プライバシーポリシー / Privacy Policy

**最終更新日 / Last Updated: 2025-10-25**

---

## 日本語

### 概要

Google Calendar Templates（以下「本拡張機能」）は、Googleカレンダーにテンプレート機能を追加するChrome拡張機能です。本プライバシーポリシーは、本拡張機能がどのようにデータを取り扱うかを説明します。

### 収集する情報

本拡張機能は以下の情報を**ローカルに保存**します：

- **テンプレートデータ**:
  - テンプレート名
  - イベントのタイトル、説明、場所、ゲスト
  - 期間、終日設定、ゲスト権限
  
これらのデータは、Chrome の `chrome.storage.local` APIを使用して**お使いのデバイス内にのみ保存**されます。

### データの使用目的

収集したデータは以下の目的でのみ使用されます：

- Googleカレンダーのイベント作成時に、保存したテンプレートを適用するため
- テンプレートの管理（作成・編集・削除・並び替え）のため

### データの共有

本拡張機能は、**いかなる第三者ともデータを共有しません**。すべてのデータはお使いのデバイス内にのみ保存され、外部サーバーへの送信は一切行いません。

### データの保存期間

テンプレートデータは、以下のいずれかが発生するまで保存されます：

- ユーザーが手動でテンプレートを削除
- ユーザーが本拡張機能をアンインストール
- ユーザーがブラウザのストレージデータを削除

### 権限の使用

本拡張機能は以下の権限を使用します：

| 権限 | 使用目的 |
|------|----------|
| `storage` | テンプレートデータをローカルに保存するため |
| `host_permissions: calendar.google.com` | Googleカレンダー上でテンプレート選択UIを表示し、イベントフィールドに値を設定するため |

### セキュリティ

本拡張機能は、データの安全性を確保するため以下の対策を講じています：

- データはすべてローカルストレージに保存（外部送信なし）
- Chrome の標準APIのみを使用
- サードパーティライブラリは使用せず、セキュリティリスクを最小化

### ユーザーの権利

ユーザーは以下の権利を有します：

- **データの確認**: Popup UIからテンプレート一覧を確認可能
- **データの編集**: テンプレートの編集が可能
- **データの削除**: テンプレートの削除が可能
- **データの完全削除**: 拡張機能をアンインストールすることで、すべてのデータが削除されます

### お問い合わせ

本プライバシーポリシーに関するご質問は、[GitHub Issues](https://github.com/maru0014/google-calendar-template/issues)までお願いします。

### 変更履歴

本プライバシーポリシーは、必要に応じて更新される場合があります。重要な変更がある場合は、拡張機能のアップデート情報でお知らせします。

---

## English

### Overview

Google Calendar Templates (the "Extension") is a Chrome extension that adds template functionality to Google Calendar. This Privacy Policy explains how the Extension handles data.

### Information We Collect

The Extension stores the following information **locally**:

- **Template Data**:
  - Template name
  - Event title, description, location, guests
  - Duration, all-day setting, guest permissions

This data is stored **only on your device** using Chrome's `chrome.storage.local` API.

### How We Use Your Data

Collected data is used only for the following purposes:

- To apply saved templates when creating Google Calendar events
- To manage templates (create, edit, delete, reorder)

### Data Sharing

The Extension **does not share any data with third parties**. All data is stored only on your device and is never transmitted to external servers.

### Data Retention

Template data is retained until one of the following occurs:

- You manually delete a template
- You uninstall the Extension
- You clear browser storage data

### Permissions

The Extension uses the following permissions:

| Permission | Purpose |
|------------|---------|
| `storage` | To store template data locally |
| `host_permissions: calendar.google.com` | To display template selector UI and set values in event fields on Google Calendar |

### Security

The Extension takes the following measures to ensure data security:

- All data is stored in local storage (no external transmission)
- Uses only Chrome's standard APIs
- No third-party libraries used, minimizing security risks

### Your Rights

You have the following rights:

- **View data**: View template list from Popup UI
- **Edit data**: Edit templates
- **Delete data**: Delete templates
- **Complete deletion**: Uninstalling the Extension will delete all data

### Contact

For questions about this Privacy Policy, please contact us via [GitHub Issues](https://github.com/maru0014/google-calendar-template/issues).

### Changes

This Privacy Policy may be updated as necessary. Significant changes will be announced in the Extension's update information.

---

**Version: 1.0**  
**Effective Date: 2025-10-25**

