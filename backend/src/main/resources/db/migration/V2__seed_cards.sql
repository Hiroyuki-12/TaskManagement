INSERT INTO cards (id, title, description, priority, due_date, column_id, order_index)
VALUES
    ('11111111-1111-1111-1111-111111111101', '要件定義レビュー', 'ステークホルダーと要件をすり合わせる', 'high',   '2026-05-10', 'todo',        1),
    ('11111111-1111-1111-1111-111111111102', 'ER図ドラフト作成', 'cards テーブル拡張案を検討',         'medium', '2026-05-12', 'todo',        2),
    ('11111111-1111-1111-1111-111111111103', '環境構築手順の整備', 'README に compose 起動手順を追記', 'low',    NULL,         'todo',        3),
    ('22222222-2222-2222-2222-222222222201', 'Read API 実装',     'GET /api/cards/{id} を追加',         'high',   '2026-04-30', 'doing', 1),
    ('22222222-2222-2222-2222-222222222202', 'サービス層リファクタ', 'Controller→Service→Repository に整える', 'medium', '2026-04-30', 'doing', 2),
    ('33333333-3333-3333-3333-333333333301', 'リポジトリ初期セットアップ', 'Spring Boot 雛形と Hello World', 'medium', NULL, 'done', 1),
    ('33333333-3333-3333-3333-333333333302', 'Card Create API',   'POST /api/cards 実装',               'medium', NULL,         'done',        2)
ON CONFLICT (id) DO NOTHING;
