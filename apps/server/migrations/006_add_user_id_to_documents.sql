-- +goose Up
ALTER TABLE documents
  ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- +goose Down
ALTER TABLE documents
  DROP COLUMN user_id;
