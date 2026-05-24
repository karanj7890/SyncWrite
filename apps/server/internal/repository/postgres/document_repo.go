package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/karanjalal/syncwrite/internal/domain"
)

type documentRepo struct {
	pool *pgxpool.Pool
}

func NewDocumentRepo(pool *pgxpool.Pool) *documentRepo {
	return &documentRepo{pool: pool}
}

func (r *documentRepo) Create(ctx context.Context, userID, title, content string) (*domain.Document, error) {
	doc := &domain.Document{}
	row := r.pool.QueryRow(ctx,
		`INSERT INTO documents (user_id, title, content)
		 VALUES ($1, $2, $3)
		 RETURNING id, title, content, starred, created_at, updated_at`,
		userID, title, content,
	)
	err := row.Scan(&doc.ID, &doc.Title, &doc.Content, &doc.Starred, &doc.CreatedAt, &doc.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return doc, nil
}

func (r *documentRepo) GetByID(ctx context.Context, userID, id string) (*domain.Document, error) {
	doc := &domain.Document{}
	row := r.pool.QueryRow(ctx,
		`SELECT id, title, content, starred, created_at, updated_at
		 FROM documents WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
		id, userID,
	)
	err := row.Scan(&doc.ID, &doc.Title, &doc.Content, &doc.Starred, &doc.CreatedAt, &doc.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return doc, nil
}

func (r *documentRepo) Update(ctx context.Context, userID, id string, title, content *string) (*domain.Document, error) {
	doc := &domain.Document{}
	row := r.pool.QueryRow(ctx,
		`UPDATE documents
		 SET title = COALESCE($3, title),
		     content = COALESCE($4, content),
		     updated_at = NOW()
		 WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
		 RETURNING id, title, content, starred, created_at, updated_at`,
		id, userID, title, content,
	)
	err := row.Scan(&doc.ID, &doc.Title, &doc.Content, &doc.Starred, &doc.CreatedAt, &doc.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return doc, nil
}

func (r *documentRepo) Delete(ctx context.Context, userID, id string) error {
	result, err := r.pool.Exec(ctx,
		`UPDATE documents SET deleted_at = NOW()
		 WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
		id, userID,
	)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *documentRepo) Star(ctx context.Context, userID, id string, starred bool) (*domain.Document, error) {
	doc := &domain.Document{}
	row := r.pool.QueryRow(ctx,
		`UPDATE documents SET starred = $3, updated_at = NOW()
		 WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
		 RETURNING id, title, content, starred, created_at, updated_at`,
		id, userID, starred,
	)
	err := row.Scan(&doc.ID, &doc.Title, &doc.Content, &doc.Starred, &doc.CreatedAt, &doc.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return doc, nil
}

func (r *documentRepo) List(ctx context.Context, userID string) ([]*domain.Document, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, title, content, starred, created_at, updated_at
		 FROM documents WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var docs []*domain.Document
	for rows.Next() {
		doc := &domain.Document{}
		if err := rows.Scan(&doc.ID, &doc.Title, &doc.Content, &doc.Starred, &doc.CreatedAt, &doc.UpdatedAt); err != nil {
			return nil, err
		}
		docs = append(docs, doc)
	}
	return docs, rows.Err()
}

func (r *documentRepo) ListDeleted(ctx context.Context, userID string) ([]*domain.Document, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, title, content, starred, created_at, updated_at, deleted_at
		 FROM documents WHERE user_id = $1 AND deleted_at IS NOT NULL ORDER BY deleted_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var docs []*domain.Document
	for rows.Next() {
		doc := &domain.Document{}
		if err := rows.Scan(&doc.ID, &doc.Title, &doc.Content, &doc.Starred, &doc.CreatedAt, &doc.UpdatedAt, &doc.DeletedAt); err != nil {
			return nil, err
		}
		docs = append(docs, doc)
	}
	return docs, rows.Err()
}

func (r *documentRepo) Restore(ctx context.Context, userID, id string) (*domain.Document, error) {
	doc := &domain.Document{}
	row := r.pool.QueryRow(ctx,
		`UPDATE documents SET deleted_at = NULL, updated_at = NOW()
		 WHERE id = $1 AND user_id = $2 AND deleted_at IS NOT NULL
		 RETURNING id, title, content, starred, created_at, updated_at`,
		id, userID,
	)
	err := row.Scan(&doc.ID, &doc.Title, &doc.Content, &doc.Starred, &doc.CreatedAt, &doc.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return doc, nil
}

func (r *documentRepo) PermanentDelete(ctx context.Context, userID, id string) error {
	result, err := r.pool.Exec(ctx,
		`DELETE FROM documents WHERE id = $1 AND user_id = $2 AND deleted_at IS NOT NULL`,
		id, userID,
	)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *documentRepo) CleanupExpired(ctx context.Context) (int64, error) {
	result, err := r.pool.Exec(ctx,
		`DELETE FROM documents WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days'`,
	)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected(), nil
}
