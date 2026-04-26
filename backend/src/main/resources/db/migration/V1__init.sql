CREATE TABLE cards (
    id           VARCHAR(36)  PRIMARY KEY,
    title        VARCHAR(100) NOT NULL,
    description  VARCHAR(1000),
    priority     VARCHAR(10)  NOT NULL DEFAULT 'medium',
    due_date     DATE,
    column_id    VARCHAR(10)  NOT NULL,
    order_index  INTEGER      NOT NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cards_column_order ON cards (column_id, order_index);
