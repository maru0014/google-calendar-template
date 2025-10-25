# 🐛 v0.1.1 - バグ修正リリース

Googleカレンダーテンプレート拡張機能の v0.1.1 リリースです。

## 🐛 バグ修正

### ゲスト設定時のダイアログ表示問題を修正

テンプレート適用時にゲストを設定すると「保存されていない変更を破棄しますか？」というダイアログが表示される問題を修正しました。

**問題の原因**:
- `closeFieldDropdown()`関数がゲストのドロップダウンを閉じるために`Escapeキー`を送信していた
- このEscapeキーイベントが親要素に伝播し、イベント作成画面を閉じようとしていた
- その結果、確認ダイアログが表示されていた

**修正内容**:
- Escapeキーの代わりに`Enterキー`を使用するように変更
- これによりドロップダウンは正常に閉じ、ダイアログも表示されなくなった

## 📦 インストール方法

### Chrome Web Store（推奨）
[Chrome Web Storeからインストール](https://chromewebstore.google.com/detail/gmgfladmnifefmoggfhgmdkdoelbmeec)

既にインストール済みの場合、自動的にv0.1.1に更新されます。

### 開発者モード
1. [リリースページ](https://github.com/maru0014/google-calendar-template/releases/tag/v0.1.1)から `google-calendar-template-v0.1.1.zip` をダウンロード
2. ZIPファイルを解凍
3. Chromeの拡張機能ページ（`chrome://extensions/`）を開く
4. 「デベロッパーモード」を有効化
5. 「パッケージ化されていない拡張機能を読み込む」をクリック
6. 解凍した`dist`フォルダを選択

## 🔄 アップグレード方法

既に v0.1.0-beta をご利用の方：
1. 新しいバージョンのZIPファイルをダウンロードして解凍
2. Chromeの拡張機能ページで既存の拡張機能を削除
3. 新しいバージョンをインストール

※ テンプレートデータは`chrome.storage.local`に保存されています。再インストールする場合は、事前にテンプレートをバックアップすることをお勧めします

## 📝 詳細な変更履歴

詳細は [CHANGELOG.md](https://github.com/maru0014/google-calendar-template/blob/main/CHANGELOG.md) をご覧ください。

## 🐛 フィードバック・バグレポート

問題や改善案がありましたら [GitHub Issues](https://github.com/maru0014/google-calendar-template/issues) でお知らせください。

---

**Google Calendar Template をお楽しみください！** 🎉
