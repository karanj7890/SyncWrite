package postgres

import (
	"context"
	"database/sql"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/karanjalal/syncwrite/internal/domain"
)

type documentShareRepo struct {
	pool *pgxpool.Pool
}

func NewDocumentShareRepo(pool *pgxpool.Pool) *documentShareRepo {
	return &documentShareRepo{pool: pool}
}

func (r *documentShareRepo) CreateShare(ctx context.Context, share *domain.DocumentShare) (*domain.DocumentShare, error) {
	row := r.pool.QueryRow(ctx,
		`INSERT INTO document_shares (
			document_id, shared_by_user_id, shared_with_user_id, share_token, role
		) VALUES ($1, $2, $3, $4, $5)
		RETURNING id, document_id, shared_by_user_id, shared_with_user_id, share_token, role, created_at, revoked_at`,
		share.DocumentID, share.SharedByUserID, share.SharedWithUserID, share.ShareToken, share.Role,
	)
	return scanDocumentShare(row)
}

func (r *documentShareRepo) GetShareByToken(ctx context.Context, token string) (*domain.DocumentShare, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT id, document_id, shared_by_user_id, shared_with_user_id, share_token, role, created_at, revoked_at
		 FROM document_shares WHERE share_token = $1`,
		token,
	)
	return scanDocumentShare(row)
}

func (r *documentShareRepo) ListSharesByDocumentID(ctx context.Context, documentID string) ([]*domain.DocumentShare, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, document_id, shared_by_user_id, shared_with_user_id, share_token, role, created_at, revoked_at
		 FROM document_shares WHERE document_id = $1 ORDER BY created_at DESC`,
		documentID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var shares []*domain.DocumentShare
	for rows.Next() {
		share, err := scanDocumentShareRow(rows)
		if err != nil {
			return nil, err
		}
		shares = append(shares, share)
	}
	return shares, rows.Err()
}

func (r *documentShareRepo) RevokeShare(ctx context.Context, shareID string) error {
	result, err := r.pool.Exec(ctx,
		`UPDATE document_shares SET revoked_at = NOW()
		 WHERE id = $1 AND revoked_at IS NULL`,
		shareID,
	)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func scanDocumentShare(row pgx.Row) (*domain.DocumentShare, error) {
	share := &domain.DocumentShare{}
	var sharedWith sql.NullString
	var revokedAt sql.NullTime
	err := row.Scan(
		&share.ID,
		&share.DocumentID,
		&share.SharedByUserID,
		&sharedWith,
		&share.ShareToken,
		&share.Role,
		&share.CreatedAt,
		&revokedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if sharedWith.Valid {
		share.SharedWithUserID = &sharedWith.String
	}
	if revokedAt.Valid {
		share.RevokedAt = &revokedAt.Time
	}
	return share, nil
}

func scanDocumentShareRow(rows pgx.Rows) (*domain.DocumentShare, error) {
	share := &domain.DocumentShare{}
	var sharedWith sql.NullString
	var revokedAt sql.NullTime
	err := rows.Scan(
		&share.ID,
		&share.DocumentID,
		&share.SharedByUserID,
		&sharedWith,
		&share.ShareToken,
		&share.Role,
		&share.CreatedAt,
		&revokedAt,
	)
	if err != nil {
		return nil, err
	}
	if sharedWith.Valid {
		share.SharedWithUserID = &sharedWith.String
	}
	if revokedAt.Valid {
		share.RevokedAt = &revokedAt.Time
	}
	return share, nil
}
