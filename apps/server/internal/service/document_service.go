package service

import (
	"context"

	"github.com/karanjalal/syncwrite/internal/domain"
	"github.com/karanjalal/syncwrite/internal/repository"
)

type CreateDocumentInput struct {
	Title string
}

type DocumentService struct {
	repo repository.DocumentRepository
}

func NewDocumentService(repo repository.DocumentRepository) *DocumentService {
	return &DocumentService{repo: repo}
}

func (s *DocumentService) CreateDocument(ctx context.Context, userID string, input CreateDocumentInput) (*domain.Document, error) {
	title := input.Title
	if title == "" {
		title = "Untitled"
	}
	return s.repo.Create(ctx, userID, title, "")
}

func (s *DocumentService) GetDocument(ctx context.Context, userID, id string) (*domain.Document, error) {
	return s.repo.GetByID(ctx, userID, id)
}

func (s *DocumentService) ListDocuments(ctx context.Context, userID string) ([]*domain.Document, error) {
	return s.repo.List(ctx, userID)
}

type UpdateDocumentInput struct {
	Title   string
	Content string
}

func (s *DocumentService) UpdateDocument(ctx context.Context, userID, id string, input UpdateDocumentInput) (*domain.Document, error) {
	return s.repo.Update(ctx, userID, id, input.Title, input.Content)
}

func (s *DocumentService) DeleteDocument(ctx context.Context, userID, id string) error {
	return s.repo.Delete(ctx, userID, id)
}

func (s *DocumentService) StarDocument(ctx context.Context, userID, id string, starred bool) (*domain.Document, error) {
	return s.repo.Star(ctx, userID, id, starred)
}

func (s *DocumentService) ListTrashedDocuments(ctx context.Context, userID string) ([]*domain.Document, error) {
	return s.repo.ListDeleted(ctx, userID)
}

func (s *DocumentService) RestoreDocument(ctx context.Context, userID, id string) (*domain.Document, error) {
	return s.repo.Restore(ctx, userID, id)
}

func (s *DocumentService) PermanentDeleteDocument(ctx context.Context, userID, id string) error {
	return s.repo.PermanentDelete(ctx, userID, id)
}

func (s *DocumentService) CleanupExpiredDocuments(ctx context.Context) (int64, error) {
	return s.repo.CleanupExpired(ctx)
}
