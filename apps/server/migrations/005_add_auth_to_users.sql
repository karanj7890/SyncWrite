-- +goose Up
ALTER TABLE users
  ADD COLUMN password_hash TEXT,
  ADD COLUMN google_id     TEXT UNIQUE,
  ADD COLUMN provider      TEXT NOT NULL DEFAULT 'email',
  ADD COLUMN avatar_url    TEXT;

-- +goose Down
ALTER TABLE users
  DROP COLUMN password_hash,
  DROP COLUMN google_id,
  DROP COLUMN provider,
  DROP COLUMN avatar_url;
