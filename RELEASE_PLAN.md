# リリースプラン（ベータ版 v0.1.0）

## 📋 リリースチェックリスト

### Phase R0: Git/GitHub設定 🔧 ✅
- [x] **Gitリポジトリの初期化**
  - [x] `git init`の実行
  - [x] `.gitignore`の確認・更新
  
- [x] **GitHubリポジトリの作成**
  - [x] GitHubで新規リポジトリ作成
  - [x] リポジトリ名: `google-calendar-template`
  - [x] 公開設定: Public（Chrome Web Storeの要件に対応）
  - [x] READMEは既存のものを使用
  - [x] ライセンス: MIT（既に記載済み）
  
- [x] **初回コミット＆プッシュ**
  - [x] `git add .`
  - [x] `git commit -m "Initial commit: v0.1.0-beta"`
  - [x] リモートリポジトリの追加
  - [x] `git push -u origin main`
  
- [x] **GitHub Pages設定（プライバシーポリシー用）**
  - [x] `docs/`フォルダに`PRIVACY_POLICY.md`配置
  - [x] GitHub Pagesを有効化
  - [x] プライバシーポリシーのURLを確認: https://maru0014.github.io/google-calendar-template/docs/PRIVACY_POLICY

---

### Phase R1: ドキュメント整備 📝 ✅
- [x] **README.mdの最終確認**
  - [x] 機能説明が最新か
  - [ ] スクリーンショットの追加（必要に応じて）
  - [x] インストール方法が明確か
  
- [x] **INSTALL_GUIDE.mdの最終確認**
  - [x] すべての手順が最新か
  - [ ] 画像/スクリーンショットの追加（ユーザー向け）
  
- [x] **CHANGELOG.mdの作成**
  - [x] v0.1.0（ベータ版）の変更内容を記載
  - [x] 今後のバージョン管理方針を明確化
  
- [x] **LICENSEファイルの作成**
  - [x] MITライセンスの正式な記載
  
- [x] **CONTRIBUTINGガイドの作成**（オプション）
  - [x] バグレポートの方法
  - [x] 機能要望の方法

---

### Phase R2: メタデータの整備 🏷️ ✅
- [x] **manifest.jsonの更新**
  - [x] バージョンを`0.1.0`に更新（ベータ版）
  - [x] 名前に「（ベータ版）」を追加
  - [x] `description`を最適化（132文字以内推奨）
  - [x] `default_locale`の設定（不要・日本語のみ）
  
- [x] **package.jsonの更新**
  - [x] バージョンを`0.1.0`に同期
  - [x] `description`を最新化
  - [x] `keywords`を最適化（検索性向上）
  - [x] `homepage`（GitHub Pages URL）を追加
  - [x] `repository`（GitHubリポジトリURL）を追加
  - [x] `bugs`（Issue URL）を追加

---

### Phase R3: Chrome Web Store用資料の準備 🎨 🔄
- [x] **ストア掲載情報の作成**
  - [x] 拡張機能の名前: 「Googleカレンダーテンプレート（ベータ版）」
  - [x] 概要（132文字以内、日本語）
  - [x] 詳細な説明（日本語、機能・使い方・メリット）
  - [x] **ベータ版である旨を明記**（今後の機能拡張予定も記載）
  - [x] GitHubリポジトリへのリンク
  - [x] カテゴリ選択（「生産性」が適切）
  
- [x] **スクリーンショット準備**（必須）✅
  - [x] 1280x800 または 640x400 の PNG/JPEG
  - [x] 4枚作成（推奨3-5枚）
  - [x] 推奨内容：
    - [x] Popup UIでのテンプレート一覧
    - [x] テンプレート作成画面
    - [x] Google Calendar上でのテンプレート選択
    - [x] 適用後のイベント
  
- [ ] **プロモーション用画像**（推奨）
  - [ ] 小: 440x280
  - [ ] 大: 920x680 または 1400x560（マーケット掲載用）
  
- [x] **プライバシーポリシーの作成**
  - [x] `docs/PRIVACY_POLICY.md`を作成（英語・日本語）
  - [x] データの取り扱い方針を明記
  - [x] `storage`権限の使用目的
  - [x] Google Calendar上での動作の説明
  - [x] 外部送信なし（ローカルストレージのみ）を明記
  - [x] GitHub Pagesで公開準備
  - [x] URLをREADMEとストア掲載情報に記載

---

### Phase R4: 最終テスト 🧪 ✅
- [x] **クリーンインストールテスト**
  - [x] 別のChromeプロファイルで拡張機能を読み込み
  - [x] 初回起動時の動作確認
  - [x] すべての機能が正常に動作するか
  
- [x] **ブラウザ互換性確認**
  - [x] Chrome（最新版）
  
- [x] **エラーログの確認**
  - [x] コンソールエラーがないか
  - [x] 不要なログ出力を削除（本番環境用：Vite設定で自動削除）
  
- [x] **パフォーマンステスト**
  - [x] ページ読み込み時の負荷
  - [x] テンプレート適用の速度
  - [x] メモリ使用量

---

### Phase R5: ビルドと検証 🔨 ✅
- [x] **本番ビルドの実行**
  - [x] `npm run build`でエラーなし
  - [x] `dist/`フォルダの内容確認
  - [x] 不要なファイルが含まれていないか
  
- [x] **ZIPファイルの作成**
  - [x] `dist/`フォルダを圧縮
  - [x] ファイル名: `google-calendar-template-v0.1.0-beta.zip`
  - [x] サイズ確認（推奨: 5MB以下）→ 30.5 KB
  
- [x] **GitHubリリースの作成**
  - [x] タグ: `v0.1.0-beta`
  - [x] リリースノート作成
  - [x] ZIPファイルを添付
  - [x] プレリリースとして公開: https://github.com/maru0014/google-calendar-template/releases/tag/v0.1.0-beta
  
- [x] **ZIPの検証**
  - [x] ZIPを展開して内容確認
  - [x] manifest.jsonが正しく含まれているか
  - [x] すべての必須ファイルが含まれているか

---

### Phase R6: Chrome Web Storeへの公開 🚀 ✅
- [x] **Developer Dashboardへのアクセス**
  - [x] https://chrome.google.com/webstore/devconsole
  - [x] Google Developer登録完了
  
- [x] **新しいアイテムの作成**
  - [x] ZIPファイルのアップロード
  - [x] ストア掲載情報の入力
  - [x] スクリーンショット4枚のアップロード
  - [x] プライバシーポリシーのURL入力
  
- [x] **プライバシーへの取り組み設定**
  - [x] 単一用途の説明
  - [x] storage権限の使用理由
  - [x] ホスト権限の使用理由
  - [x] リモートコード不使用の表明
  - [x] データ使用に関する表明
  
- [x] **配布設定**
  - [x] 公開範囲: 公開
  - [x] 地域: 日本
  - [x] 価格: 無料
  
- [x] **審査提出** 🎉
  - [x] すべての必須項目を入力
  - [x] 審査に提出（2025-10-25）
  - [ ] 審査完了を待つ（通常1-3営業日）

---

### Phase R7: リリース後のフォローアップ 📊 🔄
- [x] **審査完了待ち**（現在のステータス）
  - [x] 審査提出完了（2025-10-25）
  - [x] 審査結果待ち（通常1-3営業日）
  - [x] メール通知の確認
  
- [x] **公開確認**（審査承認後）✅
  - [x] ストアでの掲載を確認（2025-10-30）
  - [x] インストールテスト
  - [x] Chrome Web Store URL: https://chromewebstore.google.com/detail/gmgfladmnifefmoggfhgmdkdoelbmeec
  - [x] 現在10ユーザーが利用中
  - [ ] 評価・レビューの監視（継続中）
  
- [x] **ドキュメント更新**（審査承認後）✅
  - [x] READMEにストアリンクを追加
  - [x] GitHubリポジトリにバッジを追加（Stars、License、Version）
  - [x] インストール方法を「ストアからインストール」に更新
  
- [ ] **フィードバック収集**（公開後）
  - [ ] ユーザーレビューの確認
  - [ ] GitHub Issuesでバグレポート受付
  - [ ] 改善要望の収集
  - [ ] Phase 3（今後の開発）の優先順位決定

---

## 🎯 推定所要時間

| Phase | タスク | 所要時間 |
|-------|--------|----------|
| R0 | Git/GitHub設定 | 30分-1時間 |
| R1 | ドキュメント整備 | 1-2時間 |
| R2 | メタデータ整備 | 30分 |
| R3 | ストア資料準備 | 2-3時間 |
| R4 | 最終テスト | 1-2時間 |
| R5 | ビルドと検証 | 30分 |
| R6 | ストア公開 | 1-2時間 |
| R7 | リリース後対応 | 継続的 |

**合計: 7-12時間** （審査待ち時間を除く）

---

## 📌 重要な注意事項

### プライバシーポリシーについて
Chrome Web Storeの要件により、以下の権限を使用する場合はプライバシーポリシーが**必須**です：
- ✅ `storage`（使用中）
- `host_permissions`（Google Calendar）

**対応方法:**
1. GitHubリポジトリに`PRIVACY_POLICY.md`を作成
2. GitHub Pagesで公開、またはGistで公開
3. そのURLをストア掲載情報に記載

### ベータ版リリース時のチェックポイント
- バージョンは`0.1.0`から開始（ベータ版）
- 次回の正式版は`1.0.0`を予定
- スクリーンショットは**必須**（最低1枚）
- **ベータ版であることを明記**（今後の改善予定を記載）
- 説明文は明確かつ簡潔に（ユーザーが理解しやすいように）
- GitHubリポジトリを公開し、Issue/PRを受け付ける体制
- 審査で拒否される可能性のある要因：
  - 不明瞭な権限の使用目的
  - プライバシーポリシーの欠如
  - 著作権侵害の可能性
  - 不適切なスクリーンショット

---

## 🚦 リリース判定基準

### 現在の状況 🎯
- ✅ GitHubリポジトリが公開済み
- ✅ すべての機能テスト成功済み（Phase 2完了）
- ✅ ドキュメントが完備
- ✅ プライバシーポリシーが公開済み（GitHub Pages）
- ✅ スクリーンショットが4枚準備済み
- ✅ ビルドがエラーなく完了
- ✅ クリーンインストールテスト完了
- ✅ ベータ版であることが明記されている
- ✅ 本番ビルドでデバッグログ削除（パフォーマンス向上）

### 🎉 Chrome Web Store公開準備完了！

すべての準備が整いました。次は**Phase R6: Chrome Web Store公開**です。

---

## 📝 次のアクション

### 完了済み ✅
- Phase R0: Git/GitHub設定
- Phase R1: ドキュメント整備
- Phase R2: メタデータの整備
- Phase R3: Chrome Web Store用資料の準備
- Phase R4: 最終テスト
- Phase R5: ビルドと検証
- Phase R6: Chrome Web Store公開（審査提出完了）

### 現在のステータス 🎉

**Phase R7: リリース後のフォローアップ - 公開完了！**

Chrome Web Storeでの公開が完了しました！（2025-10-30確認）

#### 公開情報
- **ストアURL**: https://chromewebstore.google.com/detail/gmgfladmnifefmoggfhgmdkdoelbmeec
- **バージョン**: 0.1.1
- **審査提出日**: 2025-10-25
- **公開確認日**: 2025-10-30
- **現在のユーザー数**: 10人

#### 次のアクション（継続的タスク）
1. **フィードバック収集**
   - ユーザーレビューの確認
   - GitHub Issuesでバグレポート受付
   - 改善要望の収集
   - Phase 3以降の優先順位決定

2. **今後の開発**
   - ユーザーフィードバックに基づく改善
   - 新機能の追加検討
   - バージョン0.2.0以降の計画

#### リンク
- Developer Dashboard: https://chrome.google.com/webstore/devconsole
- GitHubリポジトリ: https://github.com/maru0014/google-calendar-template
- プライバシーポリシー: https://maru0014.github.io/google-calendar-template/docs/PRIVACY_POLICY

---

## 🌐 GitHub公開のメリット

- プライバシーポリシーをGitHub Pagesで公開可能
- バグレポート・機能要望をIssueで管理
- コミュニティからのフィードバック収集
- 将来的な貢献者の受け入れ
- 透明性の確保（ユーザーの信頼向上）
