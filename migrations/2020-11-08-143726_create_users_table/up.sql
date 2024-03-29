-- Your SQL goes here
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    is_validated BOOLEAN NOT NULL DEFAULT false,
    username VARCHAR NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    token_key TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    reset_token TEXT NOT NULL,
    validation_token TEXT NOT NULL,
    cookies_validated BOOLEAN NOT NULL DEFAULT false,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
