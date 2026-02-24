package domain

import "errors"

var ErrNotFound           = errors.New("not found")
var ErrUnauthorized       = errors.New("unauthorized")
var ErrEmailInUse         = errors.New("email already in use")
var ErrInvalidCredentials = errors.New("invalid credentials")
