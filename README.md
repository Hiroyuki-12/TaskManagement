# TaskManagement

Trello 風のカンバン方式で個人のタスクを管理する Web アプリケーション。AI Engineer Course の学習課題として、要件定義から実装までの一連の開発プロセスを経験することを目的に開発している。

「未着手 / 作業中 / 完了」の 3 カラムで個人のタスクを視覚的に管理する、単一ユーザー前提・認証なしの SPA。

## 目次

- [プロジェクト構成](#プロジェクト構成)
- [技術スタック](#技術スタック)
- [ローカル開発環境のセットアップ](#ローカル開発環境のセットアップ)
- [ポート運用ルール](#ポート運用ルール)
- [ドキュメント一覧](#ドキュメント一覧)
- [開発フロー](#開発フロー)

## プロジェクト構成

```
TaskManagement/
├── backend/        Spring Boot 4.0 + Java 25 (REST API)
├── frontend/       React 19 + TypeScript + Vite + Tailwind CSS (SPA)
├── compose.yaml    PostgreSQL 16 (ローカル開発用)
├── docs/           設計・要件ドキュメント
├── mocks/          モックデータ / 画面モック
├── 要件定義書.md    要件定義のエントリポイント
├── CLAUDE.md       Claude Code 用の運用ルール
└── README.md
```

## 技術スタック

主要なバージョンの抜粋。詳細は [docs/tech-stack.md](docs/tech-stack.md) を参照。

### フロントエンド

- React 19.2 / React DOM 19.2
- TypeScript 6.0
- Vite 8.0
- Tailwind CSS 4.2
- Axios 1.15
- ESLint 9 / Prettier 3

### バックエンド

- Java 25 (LTS)
- Spring Boot 4.0.0
- Spring Data JPA (Hibernate)
- Flyway
- Gradle 9.3.1 (Kotlin DSL, Wrapper 同梱)

### データベース / インフラ

- PostgreSQL 16 (Docker Compose)

## ローカル開発環境のセットアップ

### 前提

- Java 25 (Gradle Toolchain により自動取得される場合あり)
- Node.js (Vite 8 / React 19 が動作するバージョン)
- Docker Desktop（Compose v2）

### 1. データベース起動 (port 5432)

```bash
docker compose up -d
```

`taskmanagement` データベースが `task_user` / `task_pass` で作成される。スキーマは Flyway がバックエンド起動時に適用する。

### 2. バックエンド起動 (port 8080)

```bash
cd backend
./gradlew bootRun
```

REST API が `http://localhost:8080` で待ち受ける。

### 3. フロントエンド起動 (port 5173)

```bash
cd frontend
npm install
npm run dev
```

ブラウザで <http://localhost:5173> を開く。Vite dev server が `/api` を `http://localhost:8080` にプロキシするため、CORS 設定は不要。

### 主要コマンド

| 場所 | コマンド | 用途 |
|---|---|---|
| `frontend/` | `npm run dev` | 開発サーバ起動 |
| `frontend/` | `npm run build` | 型チェック + プロダクションビルド |
| `frontend/` | `npm run lint` | ESLint 実行 |
| `frontend/` | `npm run typecheck` | TypeScript 型チェック (`tsc -b --noEmit`) |
| `frontend/` | `npm run format` | Prettier 整形 |
| `backend/` | `./gradlew bootRun` | アプリ起動 |
| `backend/` | `./gradlew test` | テスト実行 |
| `backend/` | `./gradlew spotlessCheck` | コードフォーマット検査 (Spotless / google-java-format) |
| `backend/` | `./gradlew spotlessApply` | コードフォーマット自動修正 |
| `backend/` | `./gradlew build` | ビルド (Spotless / テスト含む) |
| ルート | `docker compose up -d` | PostgreSQL 起動 |
| ルート | `docker compose down` | PostgreSQL 停止 |

## ポート運用ルール

このプロジェクトで使用するポートは以下に固定する。**別ポートでの代替起動は禁止**（プロキシ設定や URL 前提が崩れて動作確認にならないため）。

| サービス | ポート |
|---|---|
| フロントエンド (Vite) | 5173 |
| バックエンド (Spring Boot) | 8080 |
| PostgreSQL | 5432 |

ポートが競合した場合は、`lsof -i :<port>` で占有プロセスを特定して停止し、本来のポートで起動し直す。詳細は [CLAUDE.md](CLAUDE.md#ポート運用ルール厳守) を参照。

## ドキュメント一覧

| 種別 | ドキュメント |
|---|---|
| 要件定義のエントリポイント | [要件定義書.md](要件定義書.md) |
| ユースケース / 操作フロー | [docs/use-cases.md](docs/use-cases.md) |
| 機能要件 | [docs/functional-requirements.md](docs/functional-requirements.md) |
| 画面設計・画面遷移 | [docs/screen-design.md](docs/screen-design.md) |
| ER 図 / DB 設計 | [docs/er-diagram.md](docs/er-diagram.md) |
| データフロー / API | [docs/data-flow.md](docs/data-flow.md) |
| 非機能要件 | [docs/non-functional-requirements.md](docs/non-functional-requirements.md) |
| 技術スタック | [docs/tech-stack.md](docs/tech-stack.md) |
| 対象外機能（スコープ外） | [docs/out-of-scope.md](docs/out-of-scope.md) |
| 運用ルール (Claude Code 用) | [CLAUDE.md](CLAUDE.md) |

## 開発フロー

`main` への直接 push は禁止。すべて Issue → ブランチ → PR の流れで進める。

1. GitHub の Issue テンプレート（Feature / Bug / Task / Docs）から Issue を起票
2. `<type>/#<issue>-<slug>` 形式（例: `feat/#12-add-login-form`）でブランチを作成
3. 変更をコミット・push
4. PR を作成し、本文に `Closes #<issue>` を含める
5. レビューコメントを全解決した上で squash / rebase でマージ

詳細なルール（ブランチ命名、PR 規約、main ブランチ保護設定）は [CLAUDE.md](CLAUDE.md) を参照。
