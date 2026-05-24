package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/karanjalal/syncwrite/internal/domain"
	"github.com/karanjalal/syncwrite/internal/middleware"
	"github.com/karanjalal/syncwrite/internal/service"
)

type documentResponse struct {
	ID        string  `json:"id"`
	Title     string  `json:"title"`
	Content   string  `json:"content"`
	Starred   bool    `json:"starred"`
	CreatedAt string  `json:"createdAt"`
	UpdatedAt string  `json:"updatedAt"`
	DeletedAt *string `json:"deletedAt,omitempty"`
}

func toDocumentResponse(doc *domain.Document) documentResponse {
	resp := documentResponse{
		ID:        doc.ID,
		Title:     doc.Title,
		Content:   doc.Content,
		Starred:   doc.Starred,
		CreatedAt: doc.CreatedAt.UTC().Format("2006-01-02T15:04:05Z"),
		UpdatedAt: doc.UpdatedAt.UTC().Format("2006-01-02T15:04:05Z"),
	}
	if doc.DeletedAt != nil {
		formatted := doc.DeletedAt.UTC().Format("2006-01-02T15:04:05Z")
		resp.DeletedAt = &formatted
	}
	return resp
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func mustUserID(w http.ResponseWriter, r *http.Request) (string, bool) {
	userID, ok := middleware.UserIDFromCtx(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
	}
	return userID, ok
}

func CreateDocument(svc *service.DocumentService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := mustUserID(w, r)
		if !ok {
			return
		}
		var body struct {
			Title string `json:"title"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		doc, err := svc.CreateDocument(r.Context(), userID, service.CreateDocumentInput{Title: body.Title})
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to create document")
			return
		}
		writeJSON(w, http.StatusCreated, toDocumentResponse(doc))
	}
}

func ListDocuments(svc *service.DocumentService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := mustUserID(w, r)
		if !ok {
			return
		}
		docs, err := svc.ListDocuments(r.Context(), userID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to list documents")
			return
		}
		resp := make([]documentResponse, 0, len(docs))
		for _, d := range docs {
			resp = append(resp, toDocumentResponse(d))
		}
		writeJSON(w, http.StatusOK, resp)
	}
}

func GetDocument(svc *service.DocumentService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := mustUserID(w, r)
		if !ok {
			return
		}
		id := chi.URLParam(r, "id")
		doc, err := svc.GetDocument(r.Context(), userID, id)
		if errors.Is(err, domain.ErrNotFound) {
			writeError(w, http.StatusNotFound, "document not found")
			return
		}
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to get document")
			return
		}
		writeJSON(w, http.StatusOK, toDocumentResponse(doc))
	}
}

func UpdateDocument(svc *service.DocumentService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := mustUserID(w, r)
		if !ok {
			return
		}
		id := chi.URLParam(r, "id")
		var body struct {
			Title   *string `json:"title"`
			Content *string `json:"content"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		doc, err := svc.UpdateDocument(r.Context(), userID, id, service.UpdateDocumentInput{
			Title:   body.Title,
			Content: body.Content,
		})
		if errors.Is(err, domain.ErrNotFound) {
			writeError(w, http.StatusNotFound, "document not found")
			return
		}
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to update document")
			return
		}
		writeJSON(w, http.StatusOK, toDocumentResponse(doc))
	}
}

func DeleteDocument(svc *service.DocumentService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := mustUserID(w, r)
		if !ok {
			return
		}
		id := chi.URLParam(r, "id")
		err := svc.DeleteDocument(r.Context(), userID, id)
		if errors.Is(err, domain.ErrNotFound) {
			writeError(w, http.StatusNotFound, "document not found")
			return
		}
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to delete document")
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}

func ListTrashedDocuments(svc *service.DocumentService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := mustUserID(w, r)
		if !ok {
			return
		}
		docs, err := svc.ListTrashedDocuments(r.Context(), userID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to list trashed documents")
			return
		}
		resp := make([]documentResponse, 0, len(docs))
		for _, d := range docs {
			resp = append(resp, toDocumentResponse(d))
		}
		writeJSON(w, http.StatusOK, resp)
	}
}

func RestoreDocument(svc *service.DocumentService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := mustUserID(w, r)
		if !ok {
			return
		}
		id := chi.URLParam(r, "id")
		doc, err := svc.RestoreDocument(r.Context(), userID, id)
		if errors.Is(err, domain.ErrNotFound) {
			writeError(w, http.StatusNotFound, "document not found in trash")
			return
		}
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to restore document")
			return
		}
		writeJSON(w, http.StatusOK, toDocumentResponse(doc))
	}
}

func PermanentDeleteDocument(svc *service.DocumentService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := mustUserID(w, r)
		if !ok {
			return
		}
		id := chi.URLParam(r, "id")
		err := svc.PermanentDeleteDocument(r.Context(), userID, id)
		if errors.Is(err, domain.ErrNotFound) {
			writeError(w, http.StatusNotFound, "document not found in trash")
			return
		}
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to permanently delete document")
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}

func StarDocument(svc *service.DocumentService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := mustUserID(w, r)
		if !ok {
			return
		}
		id := chi.URLParam(r, "id")
		var body struct {
			Starred bool `json:"starred"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		doc, err := svc.StarDocument(r.Context(), userID, id, body.Starred)
		if errors.Is(err, domain.ErrNotFound) {
			writeError(w, http.StatusNotFound, "document not found")
			return
		}
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to star document")
			return
		}
		writeJSON(w, http.StatusOK, toDocumentResponse(doc))
	}
}
