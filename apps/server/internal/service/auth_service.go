package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/karanjalal/syncwrite/internal/domain"
	"github.com/karanjalal/syncwrite/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type Claims struct {
	UserID string `json:"userId"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

type AuthService struct {
	userRepo       repository.UserRepository
	jwtSecret      []byte
	googleClientID string
}

func NewAuthService(userRepo repository.UserRepository, jwtSecret, googleClientID string) *AuthService {
	return &AuthService{
		userRepo:       userRepo,
		jwtSecret:      []byte(jwtSecret),
		googleClientID: googleClientID,
	}
}

type AuthResult struct {
	Token string
	User  *domain.User
}

func (s *AuthService) Register(ctx context.Context, email, name, password string) (*AuthResult, error) {
	_, err := s.userRepo.FindByEmail(ctx, email)
	if err == nil {
		return nil, domain.ErrEmailInUse
	}
	if !errors.Is(err, domain.ErrNotFound) {
		return nil, err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	user, err := s.userRepo.Create(ctx, email, name, string(hash), "email")
	if err != nil {
		return nil, err
	}

	token, err := s.GenerateJWT(user.ID, user.Email)
	if err != nil {
		return nil, err
	}
	return &AuthResult{Token: token, User: user}, nil
}

func (s *AuthService) Login(ctx context.Context, email, password string) (*AuthResult, error) {
	user, err := s.userRepo.FindByEmail(ctx, email)
	if errors.Is(err, domain.ErrNotFound) {
		return nil, domain.ErrInvalidCredentials
	}
	if err != nil {
		return nil, err
	}

	if user.PasswordHash == nil {
		return nil, domain.ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(password)); err != nil {
		return nil, domain.ErrInvalidCredentials
	}

	token, err := s.GenerateJWT(user.ID, user.Email)
	if err != nil {
		return nil, err
	}
	return &AuthResult{Token: token, User: user}, nil
}

type googleTokenInfo struct {
	Sub     string `json:"sub"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
	Aud     string `json:"aud"`
}

func (s *AuthService) GoogleAuth(ctx context.Context, idToken string) (*AuthResult, error) {
	info, err := s.verifyGoogleToken(idToken)
	if err != nil {
		return nil, domain.ErrUnauthorized
	}

	user, err := s.userRepo.FindByGoogleID(ctx, info.Sub)
	if err != nil && !errors.Is(err, domain.ErrNotFound) {
		return nil, err
	}

	if errors.Is(err, domain.ErrNotFound) {
		user, err = s.userRepo.FindByEmail(ctx, info.Email)
		if errors.Is(err, domain.ErrNotFound) {
			user, err = s.userRepo.Create(ctx, info.Email, info.Name, "", "google")
			if err != nil {
				return nil, err
			}
		} else if err != nil {
			return nil, err
		}
		if err := s.userRepo.UpdateGoogleID(ctx, user.ID, info.Sub, info.Picture); err != nil {
			return nil, err
		}
	}

	token, err := s.GenerateJWT(user.ID, user.Email)
	if err != nil {
		return nil, err
	}
	return &AuthResult{Token: token, User: user}, nil
}

func (s *AuthService) verifyGoogleToken(idToken string) (*googleTokenInfo, error) {
	resp, err := http.Get("https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("invalid google token")
	}
	var info googleTokenInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return nil, err
	}
	if info.Aud != s.googleClientID {
		return nil, errors.New("token audience mismatch")
	}
	return &info, nil
}

func (s *AuthService) GenerateJWT(userID, email string) (string, error) {
	claims := Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

func (s *AuthService) ValidateJWT(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return s.jwtSecret, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
