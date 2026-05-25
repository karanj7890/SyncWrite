package domain

import "time"

type DocumentShare struct {
	ID                string
	DocumentID        string
	SharedByUserID    string
	SharedWithUserID  *string
	ShareToken        string
	Role              string
	CreatedAt         time.Time
	RevokedAt         *time.Time
}
