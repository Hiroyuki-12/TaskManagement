# 技術スタック

| 分類 | 採用技術 |
|---|---|
| フロントエンド | React + TypeScript（Next.js は使用しない） |
| ビルドツール (FE) | Vite |
| ドラッグ＆ドロップ | @dnd-kit/core |
| スタイリング | Tailwind CSS |
| HTTPクライアント | Axios |
| Lint / Format (FE) | ESLint + Prettier |
| テスト (FE) | Vitest + React Testing Library |
| バックエンド | Java 25 (LTS) + Spring Boot 4.0.x |
| API 形式 | REST（spring-boot-starter-web） |
| バリデーション | spring-boot-starter-validation (Jakarta Bean Validation) |
| ORM | Spring Data JPA (Hibernate) |
| DB マイグレーション | Flyway |
| DB | PostgreSQL 16 |
| ビルドツール (BE) | Gradle (Kotlin DSL) |
| テスト (BE) | JUnit 5 + Spring Boot Test + Testcontainers (PostgreSQL) |
| ローカル実行環境 | Docker Compose（PostgreSQL を起動） |

## 補足
- Java は 2025年9月リリースの最新 LTS である Java 25 を採用。Spring Boot は 2025年11月 GA の最新メジャー 4.0.x を採用。
- DB アクセスのテストは Testcontainers により実 PostgreSQL を立ち上げて検証する。
- マイグレーションは Spring Boot との親和性から Flyway を採用。
