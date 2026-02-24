package domain

import "time"

type Document struct {
	ID        string
	Title     string
	Content   string
	Starred   bool
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt *time.Time
}
