-- +goose Up
ALTER TABLE documents ADD COLUMN deleted_at TIMESTAMPTZ;

-- +goose Down
ALTER TABLE documents DROP COLUMN deleted_at;
