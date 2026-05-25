package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"regexp"
	"strings"

	"github.com/karanjalal/syncwrite/internal/domain"
	"github.com/karanjalal/syncwrite/internal/service"
)

var emailRegex = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)

type userResponse struct {
	ID        string  `json:"id"`
	Email     string  `json:"email"`
	Name      string  `json:"name"`
	AvatarURL *string `json:"avatarUrl,omitempty"`
}

type authResponse struct {
	Token string       `json:"token"`
	User  userResponse `json:"user"`
}

func toUserResponse(u *domain.User) userResponse {
	return userResponse{ID: u.ID, Email: u.Email, Name: u.Name, AvatarURL: u.AvatarURL}
}

func Register(authSvc *service.AuthService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Email    string `json:"email"`
			Name     string `json:"name"`
			Password string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		body.Email = strings.TrimSpace(body.Email)
		if body.Email == "" || body.Password == "" || body.Name == "" {
			writeError(w, http.StatusBadRequest, "email, name and password are required")
			return
		}
		if !emailRegex.MatchString(body.Email) {
			writeError(w, http.StatusBadRequest, "invalid email format")
			return
		}
		result, err := authSvc.Register(r.Context(), body.Email, body.Name, body.Password)
		if errors.Is(err, domain.ErrEmailInUse) {
			writeError(w, http.StatusConflict, "email already in use")
			return
		}
		if err != nil {
			writeError(w, http.StatusInternalServerError, "registration failed")
			return
		}
		writeJSON(w, http.StatusCreated, authResponse{Token: result.Token, User: toUserResponse(result.User)})
	}
}

func Login(authSvc *service.AuthService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		body.Email = strings.TrimSpace(body.Email)
		if body.Email == "" || body.Password == "" {
			writeError(w, http.StatusBadRequest, "email and password are required")
			return
		}
		if !emailRegex.MatchString(body.Email) {
			writeError(w, http.StatusBadRequest, "invalid email format")
			return
		}
		result, err := authSvc.Login(r.Context(), body.Email, body.Password)
		if errors.Is(err, domain.ErrInvalidCredentials) {
			writeError(w, http.StatusUnauthorized, "invalid email or password")
			return
		}
		if err != nil {
			writeError(w, http.StatusInternalServerError, "login failed")
			return
		}
		writeJSON(w, http.StatusOK, authResponse{Token: result.Token, User: toUserResponse(result.User)})
	}
}

func GoogleAuth(authSvc *service.AuthService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			IDToken string `json:"idToken"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		if body.IDToken == "" {
			writeError(w, http.StatusBadRequest, "idToken is required")
			return
		}
		result, err := authSvc.GoogleAuth(r.Context(), body.IDToken)
		if errors.Is(err, domain.ErrUnauthorized) {
			writeError(w, http.StatusUnauthorized, "invalid google token")
			return
		}
		if err != nil {
			writeError(w, http.StatusInternalServerError, "google auth failed")
			return
		}
		writeJSON(w, http.StatusOK, authResponse{Token: result.Token, User: toUserResponse(result.User)})
	}
}
