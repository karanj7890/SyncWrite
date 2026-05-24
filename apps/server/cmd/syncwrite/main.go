package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/karanjalal/syncwrite/internal/config"
	"github.com/karanjalal/syncwrite/internal/handler"
	appmiddleware "github.com/karanjalal/syncwrite/internal/middleware"
	"github.com/karanjalal/syncwrite/internal/repository/postgres"
	"github.com/karanjalal/syncwrite/internal/service"
	"github.com/karanjalal/syncwrite/internal/store"
	appws "github.com/karanjalal/syncwrite/internal/websocket"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, reading from environment")
	}

	cfg := config.Load()

	pool, err := pgxpool.New(context.Background(), cfg.DBUrl)
	if err != nil {
		log.Fatalf("unable to connect to database: %v", err)
	}
	defer pool.Close()

	userRepo := postgres.NewUserRepo(pool)
	docRepo := postgres.NewDocumentRepo(pool)

	authService := service.NewAuthService(userRepo, cfg.JWTSecret, cfg.GoogleClientID)
	docService := service.NewDocumentService(docRepo)
	docStore := store.NewDocStore(pool)
	hub := appws.NewHub(docStore)

	// Background cleanup: permanently delete documents trashed for 30+ days
	go func() {
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			n, err := docService.CleanupExpiredDocuments(context.Background())
			if err != nil {
				log.Printf("cleanup error: %v", err)
			} else if n > 0 {
				log.Printf("auto-cleanup: permanently deleted %d expired document(s)", n)
			}
		}
	}()

	r := chi.NewRouter()
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(corsMiddleware)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	// WebSocket — auth is done inside the handler via ?token= query param.
	// Must be outside the RequireAuth middleware group (which reads the Authorization header).
	r.Get("/ws/{room}", handler.ServeWS(hub, authService, docStore))

	// Public auth routes
	r.Post("/api/auth/register", handler.Register(authService))
	r.Post("/api/auth/login", handler.Login(authService))
	r.Post("/api/auth/google", handler.GoogleAuth(authService))

	// Protected document routes
	r.Group(func(r chi.Router) {
		r.Use(appmiddleware.RequireAuth(authService))
		r.Route("/api/documents", func(r chi.Router) {
			r.Post("/", handler.CreateDocument(docService))
			r.Get("/", handler.ListDocuments(docService))
			// Static sub-routes before parameterized {id} routes
			r.Get("/trash", handler.ListTrashedDocuments(docService))
			r.Get("/{id}", handler.GetDocument(docService))
			r.Patch("/{id}", handler.UpdateDocument(docService))
			r.Delete("/{id}", handler.DeleteDocument(docService))
			r.Patch("/{id}/star", handler.StarDocument(docService))
			r.Post("/{id}/restore", handler.RestoreDocument(docService))
			r.Delete("/{id}/permanent", handler.PermanentDeleteDocument(docService))
			// Yjs state persistence (binary blobs saved/loaded by the client)
			r.Get("/{id}/state", handler.GetYjsState(docStore))
			r.Put("/{id}/state", handler.SaveYjsState(docStore))
		})
	})

	log.Printf("server listening on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
