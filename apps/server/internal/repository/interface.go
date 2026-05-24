package repository

import (
	"context"

	"github.com/karanjalal/syncwrite/internal/domain"
)

type DocumentRepository interface {
	Create(ctx context.Context, userID, title, content string) (*domain.Document, error)
	GetByID(ctx context.Context, userID, id string) (*domain.Document, error)
	GetByIDAny(ctx context.Context, id string) (*domain.Document, error)
	List(ctx context.Context, userID string) ([]*domain.Document, error)
	ListDeleted(ctx context.Context, userID string) ([]*domain.Document, error)
	Update(ctx context.Context, userID, id string, title, content *string) (*domain.Document, error)
	UpdateByID(ctx context.Context, id string, title, content *string) (*domain.Document, error)
	Delete(ctx context.Context, userID, id string) error
	Restore(ctx context.Context, userID, id string) (*domain.Document, error)
	PermanentDelete(ctx context.Context, userID, id string) error
	CleanupExpired(ctx context.Context) (int64, error)
	Star(ctx context.Context, userID, id string, starred bool) (*domain.Document, error)
}

type DocumentShareRepository interface {
	CreateShare(ctx context.Context, share *domain.DocumentShare) (*domain.DocumentShare, error)
	GetShareByToken(ctx context.Context, token string) (*domain.DocumentShare, error)
	ListSharesByDocumentID(ctx context.Context, documentID string) ([]*domain.DocumentShare, error)
	RevokeShare(ctx context.Context, shareID string) error
}

type UserRepository interface {
	Create(ctx context.Context, email, name, passwordHash, provider string) (*domain.User, error)
	FindByEmail(ctx context.Context, email string) (*domain.User, error)
	FindByGoogleID(ctx context.Context, googleID string) (*domain.User, error)
	FindByID(ctx context.Context, id string) (*domain.User, error)
	UpdateGoogleID(ctx context.Context, userID, googleID, avatarURL string) error
}
