package store

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// DocStore persists Yjs document state as binary blobs in PostgreSQL.
type DocStore struct {
	pool *pgxpool.Pool
}

func NewDocStore(pool *pgxpool.Pool) *DocStore {
	return &DocStore{pool: pool}
}

// LoadState returns the persisted Yjs binary state for docID.
// Returns nil, nil if no state exists yet (new document).
func (s *DocStore) LoadState(ctx context.Context, docID string) ([]byte, error) {
	var state []byte
	err := s.pool.QueryRow(ctx,
		`SELECT state FROM yjs_states WHERE doc_id = $1`, docID,
	).Scan(&state)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return state, nil
}

// SaveState upserts the Yjs binary state for docID.
func (s *DocStore) SaveState(ctx context.Context, docID string, state []byte) error {
	_, err := s.pool.Exec(ctx,
		`INSERT INTO yjs_states (doc_id, state, updated_at)
		 VALUES ($1, $2, NOW())
		 ON CONFLICT (doc_id) DO UPDATE
		 SET state = EXCLUDED.state, updated_at = NOW()`,
		docID, state,
	)
	return err
}
