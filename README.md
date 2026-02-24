# SyncWrite — Real-Time Collaborative Editor

## 🚀 Overview

**SyncWrite** is a real-time collaborative text editing platform that allows multiple users to edit the same document simultaneously — similar to Google Docs or Notion — with live cursor presence, instant synchronization, and conflict-free editing.

The project is built as a **modern full-stack monorepo** combining a high-performance Go backend with a React + TypeScript frontend, using CRDT-based synchronization powered by **Yjs**.

This project demonstrates production-level frontend and backend architecture, real-time systems design, and scalable collaboration infrastructure.

---

## ✨ What SyncWrite Does

SyncWrite enables:

- 📝 Multiple users editing the same document in real time
- ⚡ Instant updates across all connected clients
- 👥 Live user presence (cursor position & online users)
- 🔄 Conflict-free collaborative editing using CRDTs
- 💾 Automatic persistence of document updates
- 🔐 Authentication-ready architecture
- 📡 WebSocket-based realtime communication

Instead of overwriting content, SyncWrite merges edits safely using distributed synchronization algorithms.

---

## 🧠 Core Idea

Traditional apps send full document updates.

SyncWrite uses **CRDT (Conflict-free Replicated Data Types)**:

```
User types → Yjs generates update → WebSocket sync →
Server relays update → Other clients merge automatically
```

This guarantees:

- No edit conflicts
- No lost changes
- Offline-safe collaboration
- Near-instant synchronization

---

## 🏗️ Architecture

### High-Level System Design

```
React Client(s)
       │
       │ WebSocket (Realtime Updates)
       ▼
Go Realtime Server (Hub + Rooms)
       │
       ├── HTTP API (documents, auth)
       └── PostgreSQL (persistent storage)
```

---

## 📦 Monorepo Structure

```
SyncWrite/
├── apps/
│   ├── web/        # React + Vite frontend
│   └── server/     # Go backend (clean architecture)
│
├── packages/
│   ├── types/      # Shared TypeScript contracts
│   └── config/     # Shared tooling configs
│
├── docker/         # Local development stack
└── docs/           # Architecture decisions
```

---

## 🖥️ Frontend (apps/web)

### Responsibilities

- Editor UI
- Real-time collaboration
- Presence indicators
- Document management
- API communication

### Key Technologies

| Purpose          | Technology                |
| ---------------- | ------------------------- |
| Framework        | React + Vite + TypeScript |
| Collaboration    | Yjs                       |
| WebSocket Sync   | y-websocket               |
| State Management | Zustand                   |
| Data Fetching    | TanStack Query            |
| Routing          | React Router              |
| HTTP Client      | Axios                     |
| Styling          | Tailwind CSS              |

---

## ⚙️ Backend (apps/server)

### Responsibilities

- WebSocket connection management
- Realtime document synchronization
- Room-based collaboration
- Authentication middleware
- Document persistence

### Architecture Style

Clean Architecture:

```
Handler → Service → Repository → Database
```

### Key Technologies

| Purpose     | Package          |
| ----------- | ---------------- |
| HTTP Router | chi              |
| WebSockets  | coder/websocket  |
| Database    | pgx (PostgreSQL) |
| Migrations  | goose            |
| Config      | envconfig        |
| Auth        | JWT              |
| Live Reload | air              |

---

## 🔄 Realtime Collaboration Flow

1. User opens a document.
2. Client connects to WebSocket room.
3. Yjs generates binary updates when editing.
4. Server broadcasts updates to all connected users.
5. Clients merge updates automatically.
6. Periodic snapshots are persisted to the database.

The server acts as a **synchronization relay**, not a document processor.

---

## 👥 Presence System

SyncWrite tracks live collaboration using Yjs Awareness:

- Active users list
- Cursor positions
- User colors
- Online indicators

Presence data is ephemeral and not stored permanently.

---

## 💾 Persistence Strategy

Instead of saving full documents:

- Yjs incremental updates are stored.
- Snapshots are saved periodically.
- Documents can be reconstructed from updates.

Benefits:

- Smaller storage footprint
- Efficient syncing
- Scalable collaboration

---

## 🧪 Testing

- Unit tests (frontend & backend)
- Integration tests for API
- End-to-end collaboration tests using multiple browser sessions

---

## 🐳 Local Development

The project includes Docker configuration for:

- Frontend
- Backend
- PostgreSQL
- Reverse proxy (Nginx)

Run the full stack locally with Docker Compose.

---

## 🎯 Engineering Goals

SyncWrite is designed to demonstrate:

- Real-time distributed systems
- WebSocket architecture
- CRDT-based collaboration
- Monorepo dependency management (pnpm workspaces)
- Clean backend architecture in Go
- Production-grade frontend structure

---

## 🧩 Key Learning Areas Demonstrated

- Realtime synchronization models
- Conflict resolution without locking
- Event broadcasting systems
- Shared type contracts across services
- Scalable WebSocket room design
- Separation of transport and business logic

---

## 🚧 Future Enhancements

- Version history & time travel
- Offline editing support
- Comments & mentions
- Role-based permissions
- Document sharing links
- Horizontal WebSocket scaling (Redis pub/sub)

---

## 📄 License

Private project — educational and portfolio use.

---

## 👨‍💻 Author

Built as a production-style collaborative editor to demonstrate modern frontend and backend engineering skills, realtime architecture, and scalable system design.

---
