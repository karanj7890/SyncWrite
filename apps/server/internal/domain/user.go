package domain

import "time"

type User struct {
	ID           string
	Email        string
	Name         string
	PasswordHash *string
	GoogleID     *string
	Provider     string // "email" | "google"
	AvatarURL    *string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}
