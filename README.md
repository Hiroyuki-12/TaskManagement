# TaskManagement

タスク管理アプリの開発リポジトリ（AI Engineer Course 課題）。

## 構成

- `backend/` — Spring Boot 4.0 + Java 25 (REST API)
- `frontend/` — React + TypeScript + Vite + Tailwind CSS
- `compose.yaml` — PostgreSQL（ローカル開発用）

## ローカル起動

### 1. データベース

```bash
docker compose up -d
```

### 2. バックエンド (port 8080)

```bash
cd backend
./gradlew bootRun
```

### 3. フロントエンド (port 5173)

```bash
cd frontend
npm install
npm run dev
```

ブラウザで <http://localhost:5173> を開く。
Vite dev server が `/api` を `http://localhost:8080` にプロキシするため CORS 設定は不要。
