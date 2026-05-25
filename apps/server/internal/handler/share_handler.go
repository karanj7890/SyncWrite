package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/karanjalal/syncwrite/internal/domain"
	"github.com/karanjalal/syncwrite/internal/service"
)

type shareResponse struct {
	ID        string  `json:"id"`
	Role      string  `json:"role"`
	Token     string  `json:"token"`
	CreatedAt string  `json:"createdAt"`
	RevokedAt *string `json:"revokedAt,omitempty"`
}

func toShareResponse(share *domain.DocumentShare) shareResponse {
	resp := shareResponse{
		ID:        share.ID,
		Role:      share.Role,
		Token:     share.ShareToken,
		CreatedAt: share.CreatedAt.UTC().Format("2006-01-02T15:04:05Z"),
	}
	if share.RevokedAt != nil {
		formatted := share.RevokedAt.UTC().Format("2006-01-02T15:04:05Z")
		resp.RevokedAt = &formatted
	}
	return resp
}

func CreateShare(svc *service.DocumentService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := mustUserID(w, r)
		if !ok {
			return
		}
		id := chi.URLParam(r, "id")
		var body struct {
			Role string `json:"role"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		share, err := svc.CreateShare(r.Context(), userID, id, body.Role)
		if errors.Is(err, domain.ErrNotFound) {
			writeError(w, http.StatusNotFound, "document not found")
			return
		}
		if errors.Is(err, domain.ErrForbidden) {
			writeError(w, http.StatusForbidden, "forbidden")
			return
		}
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to create share")
			return
		}
		writeJSON(w, http.StatusCreated, toShareResponse(share))
	}
}

func ListShares(svc *service.DocumentService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := mustUserID(w, r)
		if !ok {
			return
		}
		id := chi.URLParam(r, "id")
		shares, err := svc.ListShares(r.Context(), userID, id)
		if errors.Is(err, domain.ErrNotFound) {
			writeError(w, http.StatusNotFound, "document not found")
			return
		}
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to list shares")
			return
		}
		resp := make([]shareResponse, 0, len(shares))
		for _, share := range shares {
			resp = append(resp, toShareResponse(share))
		}
		writeJSON(w, http.StatusOK, resp)
	}
}

func RevokeShare(svc *service.DocumentService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := mustUserID(w, r)
		if !ok {
			return
		}
		docID := chi.URLParam(r, "id")
		shareID := chi.URLParam(r, "shareId")
		err := svc.RevokeShare(r.Context(), userID, docID, shareID)
		if errors.Is(err, domain.ErrNotFound) {
			writeError(w, http.StatusNotFound, "share not found")
			return
		}
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to revoke share")
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}
