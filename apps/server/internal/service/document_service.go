package service

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"

	"github.com/karanjalal/syncwrite/internal/domain"
	"github.com/karanjalal/syncwrite/internal/repository"
)

type CreateDocumentInput struct {
	Title string
}

type DocumentService struct {
	repo      repository.DocumentRepository
	shareRepo repository.DocumentShareRepository
}

type DocumentAccessRole string

const (
	DocumentAccessRoleOwner  DocumentAccessRole = "owner"
	DocumentAccessRoleViewer DocumentAccessRole = "viewer"
	DocumentAccessRoleEditor DocumentAccessRole = "editor"
)

func NewDocumentService(repo repository.DocumentRepository, shareRepo repository.DocumentShareRepository) *DocumentService {
	return &DocumentService{repo: repo, shareRepo: shareRepo}
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

func (s *DocumentService) ResolveDocumentAccess(ctx context.Context, userID, id, shareToken string) (DocumentAccessRole, error) {
	if _, err := s.repo.GetByID(ctx, userID, id); err == nil {
		return DocumentAccessRoleOwner, nil
	} else if !errors.Is(err, domain.ErrNotFound) {
		return "", err
	}

	if shareToken == "" {
		return "", domain.ErrNotFound
	}

	share, err := s.resolveShareAccess(ctx, userID, id, shareToken)
	if err != nil {
		return "", err
	}

	return DocumentAccessRole(share.Role), nil
}

func (s *DocumentService) ResolveDocumentWriteAccess(ctx context.Context, userID, id, shareToken string) (DocumentAccessRole, error) {
	role, err := s.ResolveDocumentAccess(ctx, userID, id, shareToken)
	if err != nil {
		return "", err
	}
	if role == DocumentAccessRoleViewer {
		return "", domain.ErrForbidden
	}
	return role, nil
}

func (s *DocumentService) GetDocumentWithAccess(ctx context.Context, userID, id, shareToken string) (*domain.Document, DocumentAccessRole, error) {
	role, err := s.ResolveDocumentAccess(ctx, userID, id, shareToken)
	if err != nil {
		return nil, "", err
	}

	if role == DocumentAccessRoleOwner {
		doc, err := s.repo.GetByID(ctx, userID, id)
		if err != nil {
			return nil, "", err
		}
		return doc, role, nil
	}

	doc, err := s.repo.GetByIDAny(ctx, id)
	if err != nil {
		return nil, "", err
	}
	return doc, role, nil
}

func (s *DocumentService) ListDocuments(ctx context.Context, userID string) ([]*domain.Document, error) {
	return s.repo.List(ctx, userID)
}

type UpdateDocumentInput struct {
	Title   *string
	Content *string
}

func (s *DocumentService) UpdateDocument(ctx context.Context, userID, id string, input UpdateDocumentInput) (*domain.Document, error) {
	return s.repo.Update(ctx, userID, id, input.Title, input.Content)
}

func (s *DocumentService) UpdateDocumentWithAccess(ctx context.Context, userID, id, shareToken string, input UpdateDocumentInput) (*domain.Document, DocumentAccessRole, error) {
	role, err := s.ResolveDocumentWriteAccess(ctx, userID, id, shareToken)
	if err != nil {
		return nil, "", err
	}

	if role == DocumentAccessRoleOwner {
		updated, err := s.repo.Update(ctx, userID, id, input.Title, input.Content)
		if err != nil {
			return nil, "", err
		}
		return updated, DocumentAccessRoleOwner, nil
	}

	updated, err := s.repo.UpdateByID(ctx, id, input.Title, input.Content)
	if err != nil {
		return nil, "", err
	}
	return updated, DocumentAccessRoleEditor, nil
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

func (s *DocumentService) CreateShare(ctx context.Context, userID, docID, role string) (*domain.DocumentShare, error) {
	if _, err := s.repo.GetByID(ctx, userID, docID); err != nil {
		return nil, err
	}
	if role != string(DocumentAccessRoleViewer) && role != string(DocumentAccessRoleEditor) {
		return nil, domain.ErrForbidden
	}

	token, err := generateShareToken()
	if err != nil {
		return nil, err
	}

	share := &domain.DocumentShare{
		DocumentID:     docID,
		SharedByUserID: userID,
		ShareToken:     token,
		Role:           role,
	}
	return s.shareRepo.CreateShare(ctx, share)
}

func (s *DocumentService) ListShares(ctx context.Context, userID, docID string) ([]*domain.DocumentShare, error) {
	if _, err := s.repo.GetByID(ctx, userID, docID); err != nil {
		return nil, err
	}
	return s.shareRepo.ListSharesByDocumentID(ctx, docID)
}

func (s *DocumentService) RevokeShare(ctx context.Context, userID, docID, shareID string) error {
	if _, err := s.repo.GetByID(ctx, userID, docID); err != nil {
		return err
	}
	shares, err := s.shareRepo.ListSharesByDocumentID(ctx, docID)
	if err != nil {
		return err
	}
	for _, share := range shares {
		if share.ID == shareID {
			return s.shareRepo.RevokeShare(ctx, shareID)
		}
	}
	return domain.ErrNotFound
}

func (s *DocumentService) resolveShareAccess(ctx context.Context, userID, docID, token string) (*domain.DocumentShare, error) {
	share, err := s.shareRepo.GetShareByToken(ctx, token)
	if err != nil {
		return nil, domain.ErrNotFound
	}
	if share.DocumentID != docID {
		return nil, domain.ErrNotFound
	}
	if share.RevokedAt != nil {
		return nil, domain.ErrNotFound
	}
	if share.SharedWithUserID != nil && *share.SharedWithUserID != userID {
		return nil, domain.ErrForbidden
	}
	return share, nil
}

func generateShareToken() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}
