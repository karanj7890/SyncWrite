package websocket

import (
	"context"
	"sync"

	"github.com/karanjalal/syncwrite/internal/store"
)

// Hub manages all active document rooms.
type Hub struct {
	mu    sync.RWMutex
	rooms map[string]*Room
	store *store.DocStore
}

func NewHub(store *store.DocStore) *Hub {
	return &Hub{
		rooms: make(map[string]*Room),
		store: store,
	}
}

// GetOrCreateRoom returns the Room for docID, creating it if absent.
func (h *Hub) GetOrCreateRoom(docID string) (*Room, bool) {
	h.mu.Lock()
	defer h.mu.Unlock()
	r, ok := h.rooms[docID]
	if !ok {
		r = newRoom(docID)
		h.rooms[docID] = r
	}
	return r, !ok
}

// RemoveIfEmpty deletes the room when the last client disconnects.
func (h *Hub) RemoveIfEmpty(docID string) {
	h.mu.Lock()
	r, ok := h.rooms[docID]
	if ok && r.ClientCount() == 0 {
		delete(h.rooms, docID)
		h.mu.Unlock()
		if h.store != nil {
			if err := r.Persist(context.Background(), h.store); err != nil {
				// Persistence failure should not crash the websocket path.
				// The client-side fallback can still restore the document.
			}
		}
		return
	}
	h.mu.Unlock()
}
