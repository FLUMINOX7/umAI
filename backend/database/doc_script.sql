CREATE IF NOT EXISTS TABLE documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename    VARCHAR(255) NOT NULL,
  file_path   VARCHAR(500),
  status      VARCHAR(20) DEFAULT 'pending',
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE IF NOT EXISTS TABLE doc_chunks (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id    UUID REFERENCES documents(id) ON DELETE CASCADE,
  content        TEXT NOT NULL,
  chunk_index    INT NOT NULL,
  faiss_index_id VARCHAR(100)
);