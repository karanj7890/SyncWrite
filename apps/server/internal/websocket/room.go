package websocket

import (
	"sync"
)

// Room represents a single document collaboration session.
// The room acts as a pure relay — it broadcasts messages between clients but
// does not attempt to parse or persist Yjs state. Persistence is handled by
// the client via REST endpoints (GET/PUT /api/documents/:id/state).
type Room struct {
	docID   string
	mu      sync.RWMutex
	clients map[*Client]struct{}
}

func newRoom(docID string) *Room {
	return &Room{
		docID:   docID,
		clients: make(map[*Client]struct{}),
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

// ClientCount returns the number of connected clients.
func (r *Room) ClientCount() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.clients)
}
