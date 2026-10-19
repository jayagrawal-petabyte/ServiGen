-- Enable pgvector extension and add 384-dimensional embedding column to knowledge_articles

-- Step 1: Enable vector extension in PostgreSQL / Supabase
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Add embedding vector column (384 dimensions matching all-MiniLM-L6-v2)
ALTER TABLE "knowledge_articles" ADD COLUMN IF NOT EXISTS "embedding" vector(384);

-- Step 3: Create HNSW cosine index for sub-millisecond nearest neighbor search
CREATE INDEX IF NOT EXISTS "idx_knowledge_articles_embedding_hnsw"
ON "knowledge_articles" USING hnsw ("embedding" vector_cosine_ops);
