package config

import "github.com/kelseyhightower/envconfig"

type Config struct {
	DBUrl          string `envconfig:"DATABASE_URL" required:"true"`
	Port           string `envconfig:"PORT" default:"8080"`
	JWTSecret      string `envconfig:"JWT_SECRET" required:"true"`
	GoogleClientID string `envconfig:"GOOGLE_CLIENT_ID" required:"true"`
}

func Load() Config {
	var cfg Config
	envconfig.MustProcess("", &cfg)
	return cfg
}
