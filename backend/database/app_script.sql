CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE IF NOT EXISTS TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username      VARCHAR(100),
  created_at    TIMESTAMP DEFAULT NOW(),
  last_login    TIMESTAMP
);

CREATE IF NOT EXISTS TABLE conversations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE IF NOT EXISTS TABLE messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role            VARCHAR(20) CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW()
);