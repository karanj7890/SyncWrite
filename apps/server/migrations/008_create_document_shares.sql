-- +goose Up
CREATE TABLE document_shares (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id         UUID        NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    shared_by_user_id   UUID        NOT NULL REFERENCES users(id),
    shared_with_user_id UUID        NULL REFERENCES users(id),
    share_token         TEXT        NOT NULL UNIQUE,
    role                TEXT        NOT NULL CHECK (role IN ('viewer', 'editor')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at          TIMESTAMPTZ NULL
);

CREATE INDEX idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX idx_document_shares_shared_with_user_id ON document_shares(shared_with_user_id);
CREATE INDEX idx_document_shares_share_token ON document_shares(share_token);

-- +goose Down
DROP TABLE IF EXISTS document_shares;
