package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/karanjalal/syncwrite/internal/domain"
)

type userRepo struct {
	pool *pgxpool.Pool
}

func NewUserRepo(pool *pgxpool.Pool) *userRepo {
	return &userRepo{pool: pool}
}

const userColumns = `id, email, name, password_hash, google_id, provider, avatar_url, created_at, updated_at`

func scanUser(row pgx.Row) (*domain.User, error) {
	u := &domain.User{}
	err := row.Scan(
		&u.ID, &u.Email, &u.Name,
		&u.PasswordHash, &u.GoogleID, &u.Provider, &u.AvatarURL,
		&u.CreatedAt, &u.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (r *userRepo) Create(ctx context.Context, email, name, passwordHash, provider string) (*domain.User, error) {
	var ph *string
	if passwordHash != "" {
		ph = &passwordHash
	}
	row := r.pool.QueryRow(ctx,
		`INSERT INTO users (email, name, password_hash, provider)
		 VALUES ($1, $2, $3, $4)
		 RETURNING `+userColumns,
		email, name, ph, provider,
	)
	return scanUser(row)
}

func (r *userRepo) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT `+userColumns+` FROM users WHERE email = $1`,
		email,
	)
	return scanUser(row)
}

func (r *userRepo) FindByGoogleID(ctx context.Context, googleID string) (*domain.User, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT `+userColumns+` FROM users WHERE google_id = $1`,
		googleID,
	)
	return scanUser(row)
}

func (r *userRepo) FindByID(ctx context.Context, id string) (*domain.User, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT `+userColumns+` FROM users WHERE id = $1`,
		id,
	)
	return scanUser(row)
}

func (r *userRepo) UpdateGoogleID(ctx context.Context, userID, googleID, avatarURL string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE users SET google_id = $2, avatar_url = $3, provider = 'google', updated_at = NOW()
		 WHERE id = $1`,
		userID, googleID, avatarURL,
	)
	return err
}
