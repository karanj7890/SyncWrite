-- +goose Up
ALTER TABLE documents ADD COLUMN starred BOOLEAN NOT NULL DEFAULT false;

-- +goose Down
ALTER TABLE documents DROP COLUMN starred;
