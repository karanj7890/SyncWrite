package websocket

import (
	"sync"
)

// Hub manages all active document rooms.
type Hub struct {
	mu    sync.RWMutex
	rooms map[string]*Room
}

func NewHub() *Hub {
	return &Hub{
		rooms: make(map[string]*Room),
	}
}

// GetOrCreateRoom returns the Room for docID, creating it if absent.
func (h *Hub) GetOrCreateRoom(docID string) *Room {
	h.mu.Lock()
	defer h.mu.Unlock()
	r, ok := h.rooms[docID]
	if !ok {
		r = newRoom(docID)
		h.rooms[docID] = r
	}
	return r
}

// RemoveIfEmpty deletes the room when the last client disconnects.
func (h *Hub) RemoveIfEmpty(docID string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	r, ok := h.rooms[docID]
	if ok && r.ClientCount() == 0 {
		delete(h.rooms, docID)
	}
}
