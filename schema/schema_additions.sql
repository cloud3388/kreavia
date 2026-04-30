
-- ============================================================
-- NEW TABLES: AI Architecture System
-- ============================================================

-- Prompt Versioning Table
CREATE TABLE IF NOT EXISTS ai_prompts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_type   TEXT NOT NULL,
  template      TEXT NOT NULL,
  version       INTEGER NOT NULL DEFAULT 1,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_type ON ai_prompts(prompt_type);
-- Unique active prompt per type
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_prompts_active ON ai_prompts(prompt_type) WHERE is_active = TRUE;

ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
-- Only service role can manage prompts (not end users)
CREATE POLICY "ai_prompts_service_only" ON ai_prompts FOR ALL USING (FALSE);

-- Brand DNA (add to projects — via ALTER so re-runnable)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS brand_dna JSONB;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS visual_energy TEXT;

-- Brand Palette Cache Table
CREATE TABLE IF NOT EXISTS brand_palette_cache (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key        TEXT NOT NULL,
  generation_type  TEXT NOT NULL,
  result_data      JSONB NOT NULL,
  hit_count        INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_cache_key_type UNIQUE (cache_key, generation_type)
);
CREATE INDEX IF NOT EXISTS idx_palette_cache_key ON brand_palette_cache(cache_key);
ALTER TABLE brand_palette_cache ENABLE ROW LEVEL SECURITY;
-- Read-accessible but not user-writable directly
CREATE POLICY "palette_cache_read" ON brand_palette_cache FOR SELECT USING (TRUE);
