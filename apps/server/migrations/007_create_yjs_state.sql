-- +goose Up
CREATE TABLE yjs_states (
    doc_id     UUID        PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
    state      BYTEA       NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS yjs_states;
