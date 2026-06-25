-- umAI PostgreSQL schema
-- Run in psql with:  \i /full/path/to/schema.sql
-- Or: psql -h localhost -U fluminox -d umai -f schema.sql

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

BEGIN;

-- Users table: stores account info
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    username varchar(150) NOT NULL UNIQUE,
    email varchar(255) UNIQUE,
    password_hash varchar(255) NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    last_login timestamptz
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

-- Conversations: a conversation belongs to a user and groups messages
CREATE TABLE IF NOT EXISTS conversations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title text,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations (user_id);

-- Messages: linked to a conversation (and optionally to a user)
CREATE TABLE IF NOT EXISTS messages (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    role varchar(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content text NOT NULL,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON messages (conversation_id, created_at DESC);

COMMIT;

-- Useful queries:
-- List conversations for a user: SELECT * FROM conversations WHERE user_id = '<uuid>' ORDER BY updated_at DESC;
-- Select messages in a conversation: SELECT * FROM messages WHERE conversation_id = '<uuid>' ORDER BY created_at ASC;
