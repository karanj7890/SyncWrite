package memory

import (
	"context"

	"github.com/karanjalal/syncwrite/internal/domain"
)

type documentRepo struct{}

func NewDocumentRepo() *documentRepo {
	return &documentRepo{}
}

func (r *documentRepo) Create(_ context.Context, _, _, _ string) (*domain.Document, error) {
	return nil, domain.ErrNotFound
}

func (r *documentRepo) GetByID(_ context.Context, _, _ string) (*domain.Document, error) {
	return nil, domain.ErrNotFound
}

func (r *documentRepo) GetByIDAny(_ context.Context, _ string) (*domain.Document, error) {
	return nil, domain.ErrNotFound
}

func (r *documentRepo) List(_ context.Context, _ string) ([]*domain.Document, error) {
	return nil, nil
}

func (r *documentRepo) ListDeleted(_ context.Context, _ string) ([]*domain.Document, error) {
	return nil, nil
}

func (r *documentRepo) Update(_ context.Context, _, _, _, _ string) (*domain.Document, error) {
	return nil, domain.ErrNotFound
}

func (r *documentRepo) UpdateByID(_ context.Context, _ string, _, _ *string) (*domain.Document, error) {
	return nil, domain.ErrNotFound
}

func (r *documentRepo) Delete(_ context.Context, _, _ string) error {
	return domain.ErrNotFound
}

func (r *documentRepo) Restore(_ context.Context, _, _ string) (*domain.Document, error) {
	return nil, domain.ErrNotFound
}

func (r *documentRepo) PermanentDelete(_ context.Context, _, _ string) error {
	return domain.ErrNotFound
}

func (r *documentRepo) CleanupExpired(_ context.Context) (int64, error) {
	return 0, nil
}

func (r *documentRepo) Star(_ context.Context, _, _ string, _ bool) (*domain.Document, error) {
	return nil, domain.ErrNotFound
}
