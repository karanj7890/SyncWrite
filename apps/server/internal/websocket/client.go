package websocket

import (
	"log"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512 * 1024 // 512 KB — large enough for a full Yjs state vector
)

// Client represents a single WebSocket connection attached to a Room.
type Client struct {
	hub    *Hub
	room   *Room
	conn   *websocket.Conn
	send   chan []byte
	userID string
	docID  string
	role   string
}

// ServeClient constructs a Client, registers it in the room, and launches
// the read and write goroutines. Call this from the HTTP handler after upgrade.
func ServeClient(hub *Hub, room *Room, conn *websocket.Conn, userID, docID, role string) *Client {
	c := &Client{
		hub:    hub,
		room:   room,
		conn:   conn,
		send:   make(chan []byte, 256),
		userID: userID,
		docID:  docID,
		role:   role,
	}
	room.Register(c)
	go c.writePump()
	go c.readPump()
	return c
}

// readPump blocks reading messages from the WebSocket connection.
// Each message is broadcast to all other clients in the room.
func (c *Client) readPump() {
	defer func() {
		c.room.Unregister(c)
		c.hub.RemoveIfEmpty(c.docID)
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	log.Printf("ws: readPump started for user=%s doc=%s", c.userID, c.docID)

	for {
		_, msg, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("ws read error user=%s doc=%s: %v", c.userID, c.docID, err)
			}
			break
		}
		if c.role == "viewer" {
			if _, ok := ExtractSyncUpdate(msg); ok {
				continue
			}
		}
		c.room.Broadcast(msg, c)
	}
}

// writePump drains the send channel and writes binary frames to the WebSocket.
// It also sends periodic ping frames to keep the connection alive.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	log.Printf("ws: writePump started for user=%s doc=%s", c.userID, c.docID)

	for {
		select {
		case msg, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Channel was closed by Unregister.
				log.Printf("ws: writePump closing for user=%s doc=%s (channel closed)", c.userID, c.docID)
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.BinaryMessage, msg); err != nil {
				log.Printf("ws: writePump write error user=%s doc=%s: %v", c.userID, c.docID, err)
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				log.Printf("ws: writePump ping error user=%s doc=%s: %v", c.userID, c.docID, err)
				return
			}
		}
	}
}
