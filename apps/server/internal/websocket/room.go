package websocket

import (
	"context"
	"sync"

	"github.com/karanjalal/syncwrite/internal/store"
)

// Room represents a single document collaboration session.
type Room struct {
	docID   string
	mu      sync.RWMutex
	clients map[*Client]struct{}
	updates [][]byte
}

func newRoom(docID string) *Room {
	return &Room{
		docID:   docID,
		clients: make(map[*Client]struct{}),
	}
}

// SeedPersistedState loads previously persisted updates into the room so new
// edits append to the existing history.
func (r *Room) SeedPersistedState(blob []byte) {
	updates, ok := DecodeSnapshotLog(blob)
	if !ok {
		updates = [][]byte{copyBytes(blob)}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.updates = r.updates[:0]
	for _, update := range updates {
		r.updates = append(r.updates, copyBytes(update))
	}
}

func (r *Room) Register(c *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.clients[c] = struct{}{}
}

func (r *Room) Unregister(c *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.clients[c]; ok {
		delete(r.clients, c)
		// Safely close the channel (recover if already closed)
		defer func() {
			if r := recover(); r != nil {
				// Channel was already closed, which is fine
			}
		}()
		close(c.send)
	}
}

// Broadcast sends msg to all clients in the room except the sender.
func (r *Room) Broadcast(msg []byte, sender *Client) {
	if update, ok := ExtractSyncUpdate(msg); ok {
		r.mu.Lock()
		r.updates = append(r.updates, copyBytes(update))
		r.mu.Unlock()
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	for c := range r.clients {
		if c == sender {
			continue
		}
		select {
		case c.send <- msg:
		default:
			// Slow client — drop message; Yjs CRDT will re-sync on reconnect.
		}
	}
}

// Snapshot returns the room history in the framed format used for persistence.
func (r *Room) Snapshot() []byte {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if len(r.updates) == 0 {
		return nil
	}
	updates := make([][]byte, 0, len(r.updates))
	for _, update := range r.updates {
		updates = append(updates, copyBytes(update))
	}
	return EncodeSnapshotLog(updates)
}

// ClientCount returns the number of connected clients.
func (r *Room) ClientCount() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.clients)
}

func copyBytes(src []byte) []byte {
	if len(src) == 0 {
		return nil
	}
	dst := make([]byte, len(src))
	copy(dst, src)
	return dst
}

func (r *Room) Persist(ctx context.Context, store *store.DocStore) error {
	snapshot := r.Snapshot()
	if len(snapshot) == 0 {
		return nil
	}
	return store.SaveState(ctx, r.docID, snapshot)
}
