package handler

import (
	"errors"
	"io"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"
	"github.com/karanjalal/syncwrite/internal/domain"
	"github.com/karanjalal/syncwrite/internal/service"
	"github.com/karanjalal/syncwrite/internal/store"
	appws "github.com/karanjalal/syncwrite/internal/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  4096,
	WriteBufferSize: 4096,
	// Allow all origins in development. Restrict this in production.
	CheckOrigin: func(r *http.Request) bool { return true },
}

// ServeWS handles GET /ws/{room}?token=<jwt>&share=<token>.
// It validates the JWT from the query string (browsers cannot set custom headers
// on WebSocket connections), upgrades the HTTP connection, sends the persisted
// Yjs snapshot if one exists, and then starts the client read/write goroutines.
func ServeWS(hub *appws.Hub, authSvc *service.AuthService, docStore *store.DocStore, docSvc *service.DocumentService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Authenticate via query param — WS handshake cannot carry custom headers.
		token := r.URL.Query().Get("token")
		if token == "" {
			http.Error(w, "missing token", http.StatusUnauthorized)
			return
		}
		claims, err := authSvc.ValidateJWT(token)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		docID := chi.URLParam(r, "room")
		if docID == "" {
			http.Error(w, "missing room", http.StatusBadRequest)
			return
		}

		shareToken := r.URL.Query().Get("share")
		_, role, err := docSvc.GetDocumentWithAccess(r.Context(), claims.UserID, docID, shareToken)
		if err != nil {
			if errors.Is(err, domain.ErrForbidden) {
				http.Error(w, "forbidden", http.StatusForbidden)
				return
			}
			http.Error(w, "document not found", http.StatusNotFound)
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			// upgrader already wrote an error response.
			return
		}

		room, created := hub.GetOrCreateRoom(docID)
		if created {
			if savedState, err := docStore.LoadState(r.Context(), docID); err == nil && len(savedState) > 0 {
				room.SeedPersistedState(savedState)
				if updates, ok := appws.DecodeSnapshotLog(savedState); ok {
					for _, update := range updates {
						if err := conn.WriteMessage(websocket.BinaryMessage, appws.EncodeSyncUpdate(update)); err != nil {
							_ = conn.Close()
							return
						}
					}
				} else if err := conn.WriteMessage(websocket.BinaryMessage, appws.EncodeSyncStep2(savedState)); err != nil {
					_ = conn.Close()
					return
				}
			}
		}

		appws.ServeClient(hub, room, conn, claims.UserID, docID, string(role))
	}
}

// GetYjsState handles GET /api/documents/{id}/state
// Returns the persisted Yjs binary state for a document.
func GetYjsState(docStore *store.DocStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		state, err := docStore.LoadState(r.Context(), id)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to load state")
			return
		}
		if state == nil {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		w.Header().Set("Content-Type", "application/octet-stream")
		w.Write(state)
	}
}

// SaveYjsState handles PUT /api/documents/{id}/state
// Saves the full Yjs binary state for a document (sent by the client).
func SaveYjsState(docStore *store.DocStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		body, err := io.ReadAll(io.LimitReader(r.Body, 5<<20)) // 5 MB limit
		if err != nil {
			writeError(w, http.StatusBadRequest, "failed to read body")
			return
		}
		if len(body) == 0 {
			writeError(w, http.StatusBadRequest, "empty state")
			return
		}
		if err := docStore.SaveState(r.Context(), id, body); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to save state")
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}
