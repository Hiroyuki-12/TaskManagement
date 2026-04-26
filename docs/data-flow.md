# データフロー

## 全体構成

```mermaid
flowchart LR
    User[ユーザー]
    UI[フロントエンド<br/>React + TypeScript]
    API[バックエンドAPI]
    DB[(リレーショナルDB)]

    User -->|操作| UI
    UI -->|HTTPリクエスト| API
    API -->|SQL| DB
    DB -->|結果| API
    API -->|JSONレスポンス| UI
    UI -->|表示更新| User
```

## API エンドポイント（案）

| メソッド | パス | 用途 |
|---|---|---|
| GET | /api/cards | カード一覧取得 |
| POST | /api/cards | カード新規作成 |
| PATCH | /api/cards/:id | カード更新（編集・移動・並び替え共通） |
| DELETE | /api/cards/:id | カード削除 |

## 代表的なデータフロー例

### カード作成時
```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as フロント
    participant A as API
    participant D as DB

    U->>F: 保存ボタン押下
    F->>F: バリデーション
    F->>A: POST /api/cards
    A->>D: INSERT
    D-->>A: 作成結果
    A-->>F: 201 Created + Card
    F->>F: 状態更新・モーダル閉じる
    F-->>U: 画面にカード表示
```

### カードのドラッグ移動時（楽観的更新）
```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as フロント
    participant A as API
    participant D as DB

    U->>F: ドラッグ＆ドロップ
    F->>F: 画面を即時更新
    F->>A: PATCH /api/cards/:id
    A->>D: UPDATE
    alt 成功
        D-->>A: OK
        A-->>F: 200 OK
    else 失敗
        A-->>F: エラー
        F->>F: 画面を元に戻す
        F-->>U: エラー表示
    end
```
